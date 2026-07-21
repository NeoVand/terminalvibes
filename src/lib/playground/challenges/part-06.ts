/**
 * Part 6 · Scripts & Automation — "Ship all three".
 *
 * DESTINATION: src/lib/playground/challenges/part-06.ts
 *
 * The design, in one paragraph. Three services need the identical two-step
 * release, so the job is deliberately N-shaped: the beginner writes the script,
 * chmods it, and presses Enter once per service; the expert writes the same
 * script, then collapses chmod-and-three-runs into a single `&&` chain. Both of
 * Part 6's levers are therefore load-bearing at once — `$1` is what makes ONE
 * script cover three folders (the check requires the script to take an
 * argument), and `&&` is what turns four Enters into one. Because `&&` only
 * ever saves Enters and never elements (§2.2), a Part 6 challenge whose only
 * lever was chaining could not open the required cost gap; the repetition is
 * what does it.
 *
 * The seed carries a fourth folder, `scratch`, which must NOT ship. That is
 * where the glob distractor lands, and it is why the check asserts what is
 * absent from ~/releases as well as what is present.
 */

import type { Challenge } from '../challenges';

const API_SERVER = "const app = require('express')();\napp.listen(3000);\n";
const API_PKG = '{ "name": "api", "version": "1.4.0" }\n';
const WEB_INDEX = '<!doctype html>\n<h1>vibe shop</h1>\n';
const WEB_STYLE = 'body { margin: 0; font-family: monospace }\n';
const WORKER_QUEUE = "console.log('draining the job queue');\n";
const SCRATCH_NOTES = '- rename worker to jobs someday\n- ask the agent about cron\n';

/** The three services that ship, and one file from each that proves it copied. */
const SERVICES: ReadonlyArray<[string, string, string]> = [
	['api', 'server.js', API_SERVER],
	['web', 'index.html', WEB_INDEX],
	['worker', 'queue.js', WORKER_QUEUE]
];

export const challengePart6: Challenge = {
	id: 'ch-6-ship-all-three',
	partId: 'part-6',
	part: 6,
	title: 'Ship all three',

	description:
		'Release night. Three services live in ~/ship — api, web and worker — and every one of them gets the same two-step treatment: the whole folder copied into ~/releases, and a file named RELEASED left inside the copy. Doing it by hand three times is how mistakes happen, so build release.sh in ~/ship instead. It must start with a proper shebang line, it must take the folder name as its argument rather than hard-coding one, it must be runnable, and it must be the thing that actually does the releasing. When you are done ~/releases holds api, web and worker and nothing else — scratch is a scratchpad, it does not ship — and everything in ~/ship is still there.',

	goal: 'One argument-taking release.sh shipped all three services into ~/releases',

	seed: {
		cwd: '~/ship',
		dirs: ['~/releases'],
		files: {
			'~/ship/api/server.js': API_SERVER,
			'~/ship/api/package.json': API_PKG,
			'~/ship/web/index.html': WEB_INDEX,
			'~/ship/web/style.css': WEB_STYLE,
			'~/ship/worker/queue.js': WORKER_QUEUE,
			'~/ship/scratch/notes.md': SCRATCH_NOTES
		}
	},

	/**
	 * Eighteen entries for a job that needs three Enters. Every line of the
	 * ACCEPTABLE path is here and clickable — write the three script lines,
	 * chmod, then run it once per service — but no chained line is, because
	 * composing the chain is the whole of the expert's work in Part 6.
	 */
	pool: [
		{ command: 'ls', role: 'solution' },
		{ command: "echo '#!/usr/bin/env bash' > release.sh", role: 'solution' },
		{
			command: 'echo \'cp -r "$1" ~/releases/\' > release.sh',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-4-1',
			trap: '> replaces, >> appends. The line itself is right, but written this way it truncated release.sh first — the shebang you just wrote is gone, and the file is now a one-line script with no interpreter named at the top.'
		},
		{ command: 'echo \'cp -r "$1" ~/releases/\' >> release.sh', role: 'solution' },
		{
			command: 'cp -r * ~/releases/',
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-4',
			trap: '* means everything in this folder, and this folder holds four directories — plus release.sh, once you have written it. You just shipped scratch, a notes folder nobody asked for, and there is not one RELEASED marker anywhere in ~/releases.'
		},
		{ command: 'echo \'touch ~/releases/"$1"/RELEASED\' >> release.sh', role: 'solution' },
		{
			command: "echo 'touch ~/releases/RELEASED' >> release.sh",
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-6-1',
			trap: 'A hard-coded path only ever points at one place. Every run stamps the same file at the top of ~/releases instead of one inside each copy, exits 0, and prints nothing — the script looks like it works and no release is ever marked.'
		},
		{ command: 'cat release.sh', role: 'solution' },
		{
			command: 'chmod +X release.sh',
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-5-2',
			trap: 'One held shift key. Capital X is a real chmod letter, but it grants execute only to directories and to files that already have it — on a plain script real bash does nothing at all, and this playground rejects the mode outright. Either way the execute bit never got set, and ./release.sh answers Permission denied. Lowercase x is the one that makes a script runnable.'
		},
		{ command: 'chmod +x release.sh', role: 'solution' },
		{
			command: 'release.sh api',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-6-1',
			trap: 'A bare name sends the shell hunting through PATH, and the folder you are standing in is deliberately not on it. The script is right here; ./ is how you say so.'
		},
		{ command: './release.sh api', role: 'solution' },
		{
			command: './release.sh scratch',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-6-1',
			trap: 'The script did exactly what you told it to. scratch is a notes folder, not a service — it is now sitting in ~/releases stamped RELEASED, and a release folder that contains things nobody shipped is worse than no release folder at all.'
		},
		{ command: './release.sh web', role: 'solution' },
		{
			command: 'cd ~/releases ; rm -rf *',
			role: 'distractor',
			kind: 'destructive',
			teaches: 'section-6-2',
			trap: 'The semicolon is the whole story: it runs the rm no matter how the cd went. Here the cd worked and you emptied everything you had just released. Had it failed, rm -rf * would have run in whatever folder you were standing in.'
		},
		{ command: './release.sh worker', role: 'solution' },
		{
			command: "sed -i.bak 's/api/web/' release.sh",
			role: 'distractor',
			kind: 'forward-reference',
			teaches: 'section-7-2',
			trap: 'This is sed, and sed is Part 7 — editing a script in place to point it at the next folder. It works, and it is the wrong instinct: a script you have to rewrite between runs is a script that should have taken an argument.'
		},
		{ command: 'ls ~/releases', role: 'solution' }
	],

	/**
	 * Deterministic and cheap. Three things are asserted, in the order they
	 * matter: the script is a real, runnable, argument-taking script (the
	 * lesson); each service arrived intact and stamped (the goal); and neither
	 * scratch nor the originals were disturbed (the traps). Content is compared
	 * exactly — cp copies bytes, so there is no cosmetic wobble to tolerate here.
	 */
	check: async (engine) => {
		const script = engine.readFile('~/ship/release.sh');
		if (!script) return false;
		if (!engine.isExecutable('~/ship/release.sh')) return false;

		// A proper script: shebang on the first line, and parameterised.
		const first = script.split('\n')[0].trim();
		if (!first.startsWith('#!') || !first.includes('bash')) return false;
		if (!script.includes('$1')) return false;
		// It has to be the thing that ships, not a decoy beside hand-copying.
		if (!/\bcp\b/.test(script) || !script.includes('RELEASED')) return false;
		if (!engine.historyLog.some((l) => l.includes('./release.sh'))) return false;

		// Each service arrived whole and stamped.
		for (const [name, proof, body] of SERVICES) {
			if (!engine.isDir(`~/releases/${name}`)) return false;
			if (engine.readFile(`~/releases/${name}/${proof}`) !== body) return false;
			if (!engine.isFile(`~/releases/${name}/RELEASED`)) return false;
		}

		// Nothing else shipped, and nothing at the source was lost.
		const shipped = engine.listDir('~/releases') ?? [];
		if (shipped.length !== 3) return false;
		return (
			engine.isDir('~/ship/api') &&
			engine.isDir('~/ship/web') &&
			engine.isDir('~/ship/worker') &&
			engine.isDir('~/ship/scratch') &&
			engine.readFile('~/ship/api/server.js') === API_SERVER
		);
	},

	scoring: {
		great: {
			lines: [
				"echo '#!/usr/bin/env bash' > release.sh",
				'echo \'cp -r "$1" ~/releases/ && touch ~/releases/"$1"/RELEASED\' >> release.sh',
				'chmod +x release.sh && ./release.sh api && ./release.sh web && ./release.sh worker'
			],
			note: 'Both halves of Part 6 in three Enters: $1 makes one script cover three folders, and && collapses "make it runnable, then run it three times" into a single line that stops the moment anything fails. The && inside the quoted script line costs nothing — it is one echo — while the one outside is what saves the Enters.',
			expect: { enters: 3, elements: 6, cost: 9 }
		},
		greatAlternates: [
			{
				lines: [
					"echo '#!/usr/bin/env bash' > release.sh",
					'echo \'cp -r "$1" ~/releases/ && touch ~/releases/"$1"/RELEASED\' >> release.sh',
					'chmod +x release.sh',
					'./release.sh api && ./release.sh web && ./release.sh worker'
				],
				note: 'Chmod on its own line, then one chain for the three releases. One Enter more than the canonical route, and no worse an answer — separating the one-off setup from the repeated work is a defensible reading.',
				expect: { enters: 4, elements: 6, cost: 10 }
			},
			{
				lines: [
					"echo '#!/usr/bin/env bash' > release.sh",
					'echo \'cp -r "$1" ~/releases/\' >> release.sh',
					'echo \'touch ~/releases/"$1"/RELEASED\' >> release.sh',
					'chmod +x release.sh && ./release.sh api && ./release.sh web && ./release.sh worker'
				],
				note: 'The two-line script body instead of a chained one. It costs one element more and reads better, which is exactly why it is listed here rather than punished.',
				expect: { enters: 4, elements: 7, cost: 11 }
			}
		],
		acceptable: {
			lines: [
				"echo '#!/usr/bin/env bash' > release.sh",
				'echo \'cp -r "$1" ~/releases/\' >> release.sh',
				'echo \'touch ~/releases/"$1"/RELEASED\' >> release.sh',
				'chmod +x release.sh',
				'./release.sh api',
				'./release.sh web',
				'./release.sh worker'
			],
			note: 'The honest beginner path, and the one you get by clicking every solution chip top to bottom: the right script, built a line at a time, then one Enter per service. Nothing here is wrong — it is paying seven Enters for something three could do, because the chain that Part 6.2 spends a whole section on never got used.',
			expect: { enters: 7, elements: 7, cost: 14 }
		}
	}
};
