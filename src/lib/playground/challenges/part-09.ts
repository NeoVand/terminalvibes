/**
 * Part 9 · Talking to the Network — "Prove the release".
 *
 * DESTINATION: src/lib/playground/challenges/part-09.ts
 *
 * Design notes for reviewers:
 *
 *  - Part 9's signature lever (spec §4.2) is `| jq -r` INSTEAD of saving the
 *    JSON and re-reading it. So the goal needs two values pulled out of two
 *    different JSON replies and written into one file. The beginner saves
 *    releases.json and health.json and reads them back; the expert never lets
 *    the JSON touch the disk at all.
 *  - Two facts in ONE file is borrowed from the Part 4 reference challenge on
 *    purpose: it is the smallest shape that keeps `>` vs `>>` load-bearing,
 *    and Part 9 is where a learner first meets it again in anger.
 *  - `chmod 600 .env` is the third requirement and costs everyone the same 2,
 *    so it does not distort the tiers. It is 9.4's whole lesson reduced to the
 *    one command that actually changes the world, and it makes `chmod 600 *`
 *    available as a distractor — which is the sharpest trap in the pool, since
 *    a glob does not match a dotfile and the learner locks down every file
 *    EXCEPT the one holding the key.
 *  - Recon is deliberately free: the endpoint shapes live in api-notes.md
 *    (`cat` is free) and `lsof -i :3000` is free. That matters here more than
 *    anywhere else, because `curl` is NOT in FREE_COMMANDS — it is the work in
 *    this Part, not the looking — so a learner who probes the API by curling it
 *    three times genuinely does pay for it. Putting the docs on disk is what
 *    keeps "look before you touch" affordable.
 */

import type { Challenge } from '../challenges';
import { commandWordOf, splitSegments } from '../challenge-parsing';

/** The real endpoint. `.latest` is the answer; `.items[0]` is the trap. */
const RELEASES_JSON = [
	'{',
	'  "latest": "2.4.0",',
	'  "published_at": "2026-07-14",',
	'  "downloads": 91204,',
	'  "items": [',
	'    { "tag": "2.5.0-rc.1", "prerelease": true },',
	'    { "tag": "2.4.0", "prerelease": false },',
	'    { "tag": "2.3.7", "prerelease": false }',
	'  ]',
	'}'
].join('\n');

/**
 * The neighbouring endpoint, and it answers HTML — so `| jq` on it dies with
 * "parse error", which is exactly the 9.3 Callout. Verified by execution: the
 * error goes to stderr, and the `>` on the same line has already emptied
 * report.txt by then.
 */
const STATUS_HTML = [
	'<!doctype html>',
	'<html>',
	'  <head><title>vibecloud status</title></head>',
	'  <body><h1>All systems operational</h1></body>',
	'</html>'
].join('\n');

const API_NOTES = [
	'# vibecloud API — field notes',
	'',
	'GET api.vibecloud.dev/releases   JSON. The shipped version is the "latest" key.',
	'                                 "items" is the full tag list, newest first —',
	'                                 and the newest tag is usually a release',
	'                                 candidate, not a release.',
	'',
	'GET api.vibecloud.dev/status     the public status PAGE. HTML, not JSON.',
	'',
	'GET localhost:3000/health        our own dev server. JSON, one key: "status".',
	'',
	'The key for authenticated calls is in .env. It is NOT locked down yet.',
	''
].join('\n');

const NOTES_MD = [
	'# handover',
	'',
	'The agent says it shipped 2.5.0 and that the dev server came back clean.',
	'Neither of those is evidence. report.txt is.',
	''
].join('\n');

const ENV_FILE = 'API_KEY=sk-vibe-4d81f0c7\n';

export const challengePart9: Challenge = {
	id: 'ch-9-prove-the-release',
	partId: 'part-9',
	part: 9,
	title: 'Prove the release',

	description:
		'Your agent says it shipped 2.5.0 and that the dev server is healthy again. You are signing off on that, so check both yourself. In ~/deploy, produce report.txt holding exactly two lines: the version the release API calls the latest one, and then the status word our own dev server reports — bare values, no quotes, no braces. api-notes.md says where to ask. And .env is sitting there readable by everyone on the box, which is not a state you leave a key in: it must end up readable and writable by you and by nobody else, with the key itself untouched.',

	goal: 'report.txt holds the released version then the server status, and .env is locked to you alone',

	seed: {
		cwd: '~/deploy',
		files: {
			'~/deploy/api-notes.md': API_NOTES,
			'~/deploy/notes.md': NOTES_MD,
			'~/deploy/.env': ENV_FILE
		},
		processes: [{ command: 'node server.js', cpu: 0.7, mem: 2.1, start: '08:52', port: 3000 }],
		network: {
			'api.vibecloud.dev/releases': RELEASES_JSON,
			'api.vibecloud.dev/status': STATUS_HTML
		}
	},

	/**
	 * 17 entries for a job that needs 3. Every step of the ACCEPTABLE path is
	 * clickable; the GREAT path's two pipelines are present as ingredients but
	 * nothing is pre-chained, so composing the economical run is the learner's
	 * own work.
	 */
	pool: [
		{ command: 'cat api-notes.md', role: 'solution' },
		{
			command: 'curl -s api.vibecloud.dev/status | jq -r .latest > report.txt',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-9-3',
			trap: '/status is the public status PAGE — it answers HTML, so jq died with "parse error" instead of giving you a version. And the > had already emptied report.txt before curl even dialled, so you are now worse off than when you started.'
		},
		{ command: 'curl -s api.vibecloud.dev/releases', role: 'solution' },
		{
			command: 'curl -s -0 releases.json api.vibecloud.dev/releases',
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-9-2',
			trap: 'That is a zero, not the letter o. curl rejected the flag and saved nothing at all — so the jq you run next reads a releases.json that was never created.'
		},
		{ command: 'curl -s -o releases.json api.vibecloud.dev/releases', role: 'solution' },
		{
			command: 'curl -s api.vibecloud.dev/releases | jq .latest > report.txt',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-9-3',
			trap: 'Without -r, jq prints a JSON string — quotes and all. report.txt now holds "2.4.0" instead of 2.4.0, which exits 0, looks right at a glance, and breaks whatever reads it next.'
		},
		{ command: 'cat releases.json | jq -r .latest > report.txt', role: 'solution' },
		{
			command: 'curl -s api.vibecloud.dev/releases | jq -r .items[0].tag > report.txt',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-9-3',
			trap: 'items[0] is the newest tag, not the released one: you just filed 2.5.0-rc.1, a release candidate. The filter worked perfectly. It was the wrong question.'
		},
		{
			command: 'curl -s api.vibecloud.dev/releases | jq -r .latest > report.txt',
			role: 'solution'
		},
		{
			command: 'curl -H "Authorization: Bearer sk-vibe-4d81f0c7" api.vibecloud.dev/releases',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-9-4',
			trap: 'The key is in .env precisely so it never has to be typed. You just wrote it into your shell history in plain text, where it will sit long after you have forgotten this command — run `history` and read it back if you want to see the damage.'
		},
		{ command: 'curl -s -o health.json localhost:3000/health', role: 'solution' },
		{
			command: 'chmod 600 *',
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-4',
			trap: 'A glob does not match a dotfile. You just locked down api-notes.md, notes.md and everything else you had built — and left .env, the only file that actually holds a secret, exactly as open as it was.'
		},
		{ command: 'curl -s localhost:3000/health | jq -r .status >> report.txt', role: 'solution' },
		{
			command: 'curl -s localhost:3000/health | jq -r .status > report.txt',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-4-1',
			trap: 'Right value, wrong arrow. > replaces and >> appends: the version line you had just proved is gone, and report.txt holds nothing but the word ok.'
		},
		{ command: 'cat health.json | jq -r .status >> report.txt', role: 'solution' },
		{ command: 'chmod 600 .env', role: 'solution' },
		// -a, not just -l: a dotfile is exactly the thing `ls -l` does not show
		// you, and .env is the file this challenge is really about.
		{ command: 'ls -la', role: 'solution' }
	],

	/**
	 * Strict about the three things Part 9 teaches — the values were ASKED FOR,
	 * they are bare rather than JSON strings, and the key file is one nobody
	 * else can read — and tolerant of everything else. jq -r prints exactly the
	 * value with no padding, and lines are trimmed anyway, so no cosmetic
	 * difference between routes can decide the grade.
	 *
	 * On consulting historyLog: the brief of this challenge is "neither of those
	 * is evidence, report.txt is", and without this guard the cheapest passing
	 * run in the whole challenge was
	 *
	 *     echo 2.4.0 > report.txt / echo ok >> report.txt / chmod 600 .env
	 *
	 * — cost 6 against a greatCost of 8, i.e. a learner scored GREAT for
	 * FABRICATING the evidence, using no Part 9 skill at all. That is not a
	 * scoring bug, it is this challenge's own lesson inverted. Asserting that
	 * each fact was actually fetched is the same move §4.3 blesses for Part 11
	 * (the goal state includes something that must have — or must not have —
	 * happened), and it is deliberately generous: any curl at either endpoint
	 * counts, in any flag order, via localhost or 127.0.0.1. It rules out
	 * transcription, not any honest route.
	 */
	check: async (engine) => {
		const asked = (endpoint: RegExp) =>
			engine.historyLog.some((line) =>
				splitSegments(line).some((seg) => commandWordOf(seg) === 'curl' && endpoint.test(seg))
			);
		if (!asked(/api\.vibecloud\.dev\/releases/)) return false;
		if (!asked(/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):3000/)) return false;

		const report = engine.readFile('~/deploy/report.txt');
		if (!report) return false;

		const lines = report.split('\n').filter((l) => l.trim() !== '');
		if (lines.length !== 2) return false;
		if (lines[0].trim() !== '2.4.0') return false;
		if (lines[1].trim() !== 'ok') return false;

		// The key file is locked to its owner, and still holds the key: a
		// learner who "fixed" the permissions by rewriting the file has not
		// solved this.
		if (engine.modeOf('~/deploy/.env') !== 'rw-------') return false;
		const env = engine.readFile('~/deploy/.env');
		return !!env && env.includes('API_KEY=sk-vibe-4d81f0c7');
	},

	scoring: {
		great: {
			lines: [
				'curl -s api.vibecloud.dev/releases | jq -r .latest > report.txt',
				'curl -s localhost:3000/health | jq -r .status >> report.txt',
				'chmod 600 .env'
			],
			note: 'Neither reply is ever stored: curl hands the JSON straight to jq, jq hands the bare value straight to the file. Two questions, two answers, no intermediate files to forget about.',
			expect: { enters: 3, elements: 5, cost: 8 }
		},
		greatAlternates: [
			{
				lines: [
					'curl -s api.vibecloud.dev/releases | jq -r .latest > report.txt && curl -s localhost:3000/health | jq -r .status >> report.txt',
					'chmod 600 .env'
				],
				note: 'The same two pipelines chained with && — Part 6 syntax doing Part 9 work. It saves an Enter, not any work, which is the honest truth about &&.',
				expect: { enters: 2, elements: 5, cost: 7 }
			},
			{
				lines: [
					'chmod 600 .env && curl -s api.vibecloud.dev/releases | jq -r .latest > report.txt',
					'curl -s localhost:3000/health | jq -r .status >> report.txt'
				],
				note: 'Locking the key first, because the file was already exposed while you read the notes. Same cost as chaining the other pair; the order the two facts land in report.txt is the only order that is actually fixed.',
				expect: { enters: 2, elements: 5, cost: 7 }
			}
		],
		acceptable: {
			lines: [
				'curl -s -o releases.json api.vibecloud.dev/releases',
				'cat releases.json | jq -r .latest > report.txt',
				'curl -s -o health.json localhost:3000/health',
				'cat health.json | jq -r .status >> report.txt',
				'chmod 600 .env'
			],
			note: 'Fetch it, look at it, then read it back — one thought per line. Nothing here is wrong, and every value is correct. It just pays five Enters and leaves two copies of JSON on disk to do what three Enters and no files could.',
			expect: { enters: 5, elements: 7, cost: 12 }
		}
	}
};
