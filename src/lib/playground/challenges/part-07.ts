/**
 * Part 7 · Text Surgery — "Promote the stack".
 *
 * DESTINATION: src/lib/playground/challenges/part-07.ts
 *
 * Design notes for the other authors:
 *
 *  - Part 7's signature lever (§4.2) is "one sed over several files at once;
 *    -i.bak over a glob; awk -F / awk instead of a cut dance". So the goal is
 *    deliberately shaped as THREE sibling config files plus ONE column pull:
 *    the beginner names each file and stages the column through a scratch
 *    file, the expert says *.yml once and lets awk's /pattern/ guard do the
 *    filtering that grep would otherwise do in a separate process.
 *  - The .bak requirement is the whole of 7.3 made load-bearing. A learner who
 *    runs the bare `sed -i` the agents actually propose gets three correct
 *    files and still fails, because the undo is the deliverable too.
 *  - fleet.txt sits in the same directory holding the word "staging" in one
 *    row. That single word is what turns `*.yml` into a real decision: the
 *    lazy `*` corrupts the inventory, and the check notices.
 *  - The table is ragged on purpose (7.4: "cut would see every space as its
 *    own empty field and hand you garbage"), which makes the cut distractor a
 *    genuine trap rather than a straw man.
 */

import type { Challenge } from '../challenges';

const API_YML = [
	'service: api',
	'env: staging',
	'url: http://staging.vibecafe.example.com/api',
	'dsn: postgres://staging-db.internal/staging_api',
	''
].join('\n');

const WEB_YML = [
	'service: web',
	'env: staging',
	'url: http://staging.vibecafe.example.com',
	''
].join('\n');

const WORKER_YML = [
	'service: worker',
	'env: staging',
	'queue: staging-jobs',
	'concurrency: 4',
	''
].join('\n');

/**
 * Column-aligned, not comma-separated, and the columns do NOT line up on a
 * single space — that is precisely the shape 7.4 says awk is for. The canary
 * row is the one machine still on staging: it is what makes the /prod/ guard
 * (or a grep) necessary rather than decorative.
 */
const FLEET = [
	'NAME        HOST                             REGION      STATUS',
	'api-01      api-01.vibecafe.example.com      us-east-1   prod',
	'web-01      web-01.vibecafe.example.com      us-east-1   prod',
	'web-02      web-02.vibecafe.example.com      eu-west-1   prod',
	'canary-01   canary-01.vibecafe.example.com   eu-west-1   staging',
	'db-01       db-01.vibecafe.example.com       us-east-1   prod',
	''
].join('\n');

const NOTES = [
	'HANDOVER — go-live',
	'',
	'The staging bake finished clean. Promote the three service configs,',
	'keep an undo for each, and send ops the list of prod hosts.',
	'fleet.txt is the inventory. Do not edit it.',
	''
].join('\n');

const CONFIGS: [string, string][] = [
	['api.yml', API_YML],
	['web.yml', WEB_YML],
	['worker.yml', WORKER_YML]
];

/** What each config must look like once every "staging" has become "production". */
const promoted = (original: string) => original.split('staging').join('production');

const PROD_HOSTS = [
	'api-01.vibecafe.example.com',
	'web-01.vibecafe.example.com',
	'web-02.vibecafe.example.com',
	'db-01.vibecafe.example.com'
];

export const challengePart7: Challenge = {
	id: 'ch-7-promote-the-stack',
	partId: 'part-7',
	part: 7,
	title: 'Promote the stack',

	description:
		'The staging bake is over and vibecafe goes live this afternoon. In ~/deploy the three service configs — api.yml, web.yml and worker.yml — still say staging everywhere; every occurrence in all three must read production instead, and it is those files that have to change, not new copies of them. Leave yourself an undo: each config keeps its original beside it as a .bak. Then hand ops the list they asked for — hosts.txt, holding only the host name of each fleet row already marked prod, one per line, nothing else on the line, in the order the rows appear in fleet.txt. fleet.txt is the inventory, not a config: it must come through untouched.',

	goal: 'all three configs say production with a .bak beside each, and hosts.txt lists the four prod hosts',

	seed: {
		cwd: '~/deploy',
		files: {
			'~/deploy/api.yml': API_YML,
			'~/deploy/web.yml': WEB_YML,
			'~/deploy/worker.yml': WORKER_YML,
			'~/deploy/fleet.txt': FLEET,
			'~/deploy/notes.md': NOTES
		}
	},

	/**
	 * 21 entries (9 of them salted) for a two-line job. Both halves of every good route are here,
	 * un-chained: a learner who only clicks lands on ACCEPTABLE (five lines,
	 * one scratch file), and GREAT means noticing that *.yml collapses three
	 * chips into one and that awk can filter without help.
	 */
	pool: [
		{ command: 'cat notes.md', role: 'solution' },
		{
			command: "sed -i 's/staging/production/g' *.yml",
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-7-3',
			trap: 'The edit is right and the undo is gone. Bare -i rewrites all three files in place and keeps no copy — the one flag 7.3 calls a red-flag pattern. You can walk it back with a reversing substitution and then do it properly, but the original files no longer exist to be backed up.'
		},
		{ command: 'cat api.yml', role: 'solution' },
		{ command: "sed 's/staging/production/g' api.yml", role: 'solution' },
		{
			command: "sed -i .bak 's/staging/production/g' *.yml",
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-7-3',
			trap: "One space too many. The suffix rides directly on the flag — -i.bak — so with a space sed took '.bak' as its script and complained about a command it has never heard of. Nothing was edited, which is the only mercy here."
		},
		{ command: "sed -i.bak 's/staging/production/g' api.yml", role: 'solution' },
		{ command: "sed -i.bak 's/staging/production/g' web.yml", role: 'solution' },
		{
			command: "sed -i.bak 's/staging/production/' *.yml",
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-7-1',
			trap: 'No g, so sed replaced only the FIRST match on each line. api.yml still carries staging_api on its dsn line — three files edited, backups made, exit code 0, and the job half done where nobody looks.'
		},
		{ command: "sed -i.bak 's/staging/production/g' worker.yml", role: 'solution' },
		{
			command: "sed -i.bak 's/staging.*/production/g' *.yml",
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-7-1',
			trap: 'The find half is a regular expression, so .* ate the rest of every line it touched. env: production is right by luck; url: http://production and dsn: postgres://production are the wreckage — hostname, path and database name all gone. No staging survives and the exit code is 0, which is exactly why this one is hard to catch by eye. Rerunning the right command cannot save you — there is no staging left to match. The .bak files can: mv api.yml.bak api.yml, and again for the other two.'
		},
		{
			command: "sed -i.bak 's/staging/production/g' *",
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-4',
			trap: '* is not *.yml. That swept in fleet.txt and notes.md as well, and the canary machine — the one box still genuinely on staging — is now recorded as production. Your inventory is lying to you. (fleet.txt.bak is your way back.)'
		},
		{ command: "sed -i.bak 's/staging/production/g' *.yml", role: 'solution' },
		{
			command: "sed -i.bak 's/staging/production/g' fleet.txt",
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-7-3',
			trap: 'Right command, wrong file. fleet.txt records what the machines ARE, not what you want them to be — you just relabelled the canary box by editing a document instead of moving a server.'
		},
		{ command: 'cat api.yml.bak', role: 'solution' },
		{ command: 'cat fleet.txt', role: 'solution' },
		{
			command: "cut -d' ' -f2 fleet.txt > hosts.txt",
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-7-4',
			trap: 'cut wants one character per field. These columns are padded with runs of spaces, so field 2 of every row is the empty string between two of them — you filed a stack of blank lines. Ragged columns are what awk is for.'
		},
		{ command: 'grep prod fleet.txt > prod-rows.txt', role: 'solution' },
		{
			command: "awk '{print $2}' fleet.txt > hosts.txt",
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-7-4',
			trap: 'The right column, off every line there is — including the HOST header and canary-01, which is still on staging. awk without a /pattern/ guard runs its action on everything, and the result looks exactly like a correct answer.'
		},
		{ command: "awk '{print $2}' prod-rows.txt > hosts.txt", role: 'solution' },
		{
			command: 'awk "/prod/ {print $2}" fleet.txt > hosts.txt',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-7-4',
			trap: 'Double quotes let the shell in first: it expanded $2 to nothing, so awk received {print } — which it reads as "print the whole line" and obeys without a word of complaint. Every awk program wears single quotes for exactly this reason.'
		},
		{ command: "awk '/prod/ {print $2}' fleet.txt > hosts.txt", role: 'solution' }
	],

	/**
	 * Strict where Part 7 lives, tolerant elsewhere.
	 *
	 * Each config is compared BYTE FOR BYTE against its fully-substituted self.
	 * An earlier draft asked only "contains production, contains no staging",
	 * and that let two bad answers through with the top grade: the greedy
	 * `s/staging.*` closed with `/production/g`, which eats the rest of every
	 * matching line and leaves `url: http://production`, and a plain
	 * `echo production > api.yml`.
	 * Substitution means changing a word, not flattening the file, so the check
	 * has to say which file it wanted. Every legitimate route — the glob, three
	 * named files, a `|` delimiter, cp-then-bare-`-i` — lands on exactly this
	 * text, so nothing honest is rejected by the tightening.
	 *
	 * The .bak is deliberately NOT compared to the original. It must exist and
	 * still be recognisably that config (its `service:` line survives), which is
	 * enough to reject `touch api.yml.bak` and `echo x > api.yml.bak` without
	 * creating a deadlock: a learner who trips the no-`g` distractor and then
	 * reruns the correct command has their .bak overwritten with the half-edited
	 * intermediate, and demanding the pristine original would lock them out with
	 * no route back short of the reset button.
	 *
	 * hosts.txt is compared line by line after trimming, so the pipe route and
	 * the guard route agree. fleet.txt is compared byte for byte: not editing it
	 * is half the lesson.
	 */
	check: async (engine) => {
		for (const [name, original] of CONFIGS) {
			const current = engine.readFile(`~/deploy/${name}`);
			if (current !== promoted(original)) return false;
			const backup = engine.readFile(`~/deploy/${name}.bak`);
			if (!backup) return false;
			if (!backup.includes(original.split('\n')[0])) return false;
		}

		if (engine.readFile('~/deploy/fleet.txt') !== FLEET) return false;

		const hosts = engine.readFile('~/deploy/hosts.txt');
		if (!hosts) return false;
		const lines = hosts
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l !== '');
		if (lines.length !== PROD_HOSTS.length) return false;
		return lines.every((line, i) => line === PROD_HOSTS[i]);
	},

	scoring: {
		great: {
			lines: [
				"sed -i.bak 's/staging/production/g' *.yml",
				"awk '/prod/ {print $2}' fleet.txt > hosts.txt"
			],
			note: "One sed over the glob does three files and three backups in a single Enter; awk's /pattern/ guard filters and extracts in the same pass, so no grep and no scratch file.",
			expect: { enters: 2, elements: 2, cost: 4 }
		},
		greatAlternates: [
			{
				lines: [
					"sed -i.bak 's/staging/production/g' *.yml && awk '/prod/ {print $2}' fleet.txt > hosts.txt"
				],
				note: 'The same two moves chained with && (Part 6): one Enter, and the extraction only runs if the edit succeeded.',
				expect: { enters: 1, elements: 2, cost: 3 }
			},
			{
				lines: [
					"sed -i.bak 's/staging/production/g' *.yml",
					"grep prod fleet.txt | awk '{print $2}' > hosts.txt"
				],
				note: 'Filtering with grep and extracting with awk. It costs exactly one element more than the /pattern/ guard, which is the honest price of using two tools where one would do — not a worse answer.',
				expect: { enters: 2, elements: 3, cost: 5 }
			}
		],
		acceptable: {
			lines: [
				"sed -i.bak 's/staging/production/g' api.yml",
				"sed -i.bak 's/staging/production/g' web.yml",
				"sed -i.bak 's/staging/production/g' worker.yml",
				'grep prod fleet.txt > prod-rows.txt',
				"awk '{print $2}' prod-rows.txt > hosts.txt"
			],
			note: 'One file per line, one thought per line, and the filtered rows parked in a scratch file before the column is pulled. Everything here is correct — it is just paying five Enters and an extra file for what two Enters and no files would have done.',
			expect: { enters: 5, elements: 5, cost: 10 }
		}
	}
};
