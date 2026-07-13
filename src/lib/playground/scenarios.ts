import type { FsSeed, ShellEngine } from './shell-engine';

export interface PlaygroundScenario {
	id: string;
	title: string;
	description: string;
	hint: string;
	suggestedCommands: string[];
	seed?: FsSeed;
	/** One line naming the goal state, shown when the check passes. */
	goal?: string;
	/**
	 * Returns true once the sandbox has reached the scenario's goal state. Run
	 * after every command; keep it cheap and side-effect free.
	 */
	check?: (engine: ShellEngine) => Promise<boolean>;
}

/* ── check helpers ─────────────────────────────────────────────── */

/** Has the learner run this exact command (or this command plus arguments)? */
function ranCommand(engine: ShellEngine, cmd: string): boolean {
	return engine.historyLog.some((line) => {
		const t = line.trim();
		return t === cmd || t.startsWith(cmd + ' ');
	});
}

/** Does any command line the learner ran contain this substring? */
function historyContains(engine: ShellEngine, needle: string): boolean {
	return engine.historyLog.some((line) => line.includes(needle));
}

export const playgroundScenarios: PlaygroundScenario[] = [
	{
		id: 'first-steps',
		title: 'Say hello to the machine',
		description:
			'A fresh terminal, a blinking cursor, and nothing to break — commands only act when you press Enter. Ask the machine who you are, where you are, and what time it is, then make it say something back.',
		hint: 'Type a command and press Enter. `whoami` prints your username, `pwd` prints where you are, `date` prints the time, and `echo` repeats whatever you hand it. Press the up arrow to recall what you typed before.',
		suggestedCommands: ['whoami', 'pwd', 'date', 'echo "hello, terminal"', 'echo $HOME'],
		seed: {
			files: {
				'~/README.txt':
					'Welcome to your sandbox home directory.\nEverything here is virtual — experiment freely.\n'
			}
		},
		goal: 'You ran whoami, pwd, date, and echoed a message of your own',
		check: async (engine) =>
			ranCommand(engine, 'whoami') &&
			ranCommand(engine, 'pwd') &&
			ranCommand(engine, 'date') &&
			ranCommand(engine, 'echo')
	},
	{
		id: 'navigation',
		title: 'Find the lost API key',
		description:
			'Your AI assistant swears it saved the chatbot\'s API key "somewhere under projects/" — then lost the path. Walk down the directory tree, use ls -a to reveal what plain ls hides, and read the key out loud.',
		hint: '`ls` shows what is here, `cd <dir>` steps into a directory, `cd ..` steps back out. Directories starting with a dot are hidden — `ls -a` reveals them. When you find the key file, `cat` it.',
		suggestedCommands: [
			'pwd',
			'ls',
			'cd projects',
			'ls',
			'cd chatbot/config',
			'ls',
			'ls -a',
			'cd .secrets',
			'cat api-key.txt'
		],
		seed: {
			files: {
				'~/README.txt':
					'The agent hid the chatbot API key somewhere under projects/. Go find it.\n',
				'~/projects/chatbot/README.md': '# chatbot\nA weekend chatbot. Config lives in config/.\n',
				'~/projects/chatbot/src/main.py':
					'from config import load_settings\n\nprint("bot online")\n',
				'~/projects/chatbot/config/settings.json':
					'{\n  "model": "small",\n  "temperature": 0.7\n}\n',
				'~/projects/chatbot/config/.secrets/api-key.txt': 'OPENWEAVE_API_KEY=sk-vibe-7f3a91c2\n',
				'~/projects/todo-app/notes.md': '# todo-app\nNothing secret in here. Keep looking.\n',
				'~/downloads/cat-wallpaper.jpg': '<jpeg data>\n'
			}
		},
		goal: 'You navigated into the hidden .secrets directory and read the key',
		check: async (engine) => {
			if (engine.cwd !== engine.resolve('~/projects/chatbot/config/.secrets')) return false;
			return engine.historyLog.some((line) => line.includes('cat') && line.includes('api-key.txt'));
		}
	},
	{
		id: 'workspace-setup',
		title: 'Build your project skeleton',
		description:
			'You are starting zine-bot, a bot that assembles weekend zines. Before writing a line of code (or letting an AI write it), lay out the skeleton: a project folder with src, tests and docs, plus the first empty files.',
		hint: '`mkdir -p` creates a directory and any missing parents in one go. Once inside the project, plain `mkdir` makes the subfolders and `touch` creates empty files. `ls` confirms your work after each step.',
		suggestedCommands: [
			'mkdir -p projects/zine-bot',
			'cd projects/zine-bot',
			'mkdir src tests docs',
			'touch README.md',
			'touch src/main.py',
			'touch tests/test_main.py',
			'ls'
		],
		seed: {
			files: {
				'~/notes.txt':
					'Project idea: zine-bot — a bot that assembles weekend zines from my notes.\n',
				'~/downloads/wallpaper.jpg': '<jpeg data>\n'
			},
			dirs: ['~/projects']
		},
		goal: 'zine-bot has src/, tests/ and docs/ plus its first three files',
		check: async (engine) =>
			engine.isDir('~/projects/zine-bot/src') &&
			engine.isDir('~/projects/zine-bot/tests') &&
			engine.isDir('~/projects/zine-bot/docs') &&
			engine.isFile('~/projects/zine-bot/README.md') &&
			engine.isFile('~/projects/zine-bot/src/main.py') &&
			engine.isFile('~/projects/zine-bot/tests/test_main.py')
	},
	{
		id: 'tidy-up',
		title: 'Clean the downloads mess',
		description:
			'Months of clicking "Save" left your downloads folder a junk drawer: photos, invoices, and a stale installer all in one pile. Sort the keepers into ~/pictures and ~/documents, then delete the junk — remember, rm has no trash can.',
		hint: 'Look before you touch: `ls` first. `mkdir -p` can create both destination folders at once, `mv` accepts several files with the destination last, and `rm` deletes forever — so save it for the installer you truly do not want.',
		suggestedCommands: [
			'cd downloads',
			'ls',
			'mkdir -p ~/pictures ~/documents',
			'mv photo-beach.jpg photo-mountain.jpg ~/pictures',
			'mv invoice-march.pdf invoice-april.pdf ~/documents',
			'ls',
			'rm setup-old.dmg',
			'ls'
		],
		seed: {
			files: {
				'~/downloads/photo-beach.jpg': '<jpeg data: beach sunset>\n',
				'~/downloads/photo-mountain.jpg': '<jpeg data: mountain trail>\n',
				'~/downloads/invoice-march.pdf': '<pdf: hosting invoice, March>\n',
				'~/downloads/invoice-april.pdf': '<pdf: hosting invoice, April>\n',
				'~/downloads/setup-old.dmg': '<disk image: an installer you ran months ago>\n'
			}
		},
		goal: 'Photos in ~/pictures, invoices in ~/documents, installer deleted',
		check: async (engine) =>
			engine.isFile('~/pictures/photo-beach.jpg') &&
			engine.isFile('~/pictures/photo-mountain.jpg') &&
			engine.isFile('~/documents/invoice-march.pdf') &&
			engine.isFile('~/documents/invoice-april.pdf') &&
			!engine.exists('~/downloads/setup-old.dmg')
	},
	{
		id: 'glob-practice',
		title: 'Select exactly the right files',
		description:
			'The staging folder mixes rotated logs, markdown drafts, a finished article and leftover .tmp files. Use wildcards to grab exactly the right group each time — and echo the glob first, so you see what a pattern matches before rm or mv acts on it.',
		hint: '`*` matches any run of characters, `?` matches exactly one. `echo *.tmp` is a free preview of what `rm *.tmp` would delete. `draft?.md` matches `draft1.md` and `draft2.md` but not `final.md`.',
		suggestedCommands: [
			'cd staging',
			'ls',
			'echo *.tmp',
			'rm *.tmp',
			'echo draft?.md',
			'mkdir drafts',
			'mv draft?.md drafts',
			'ls'
		],
		seed: {
			files: {
				'~/staging/app.log': '2026-07-11 INFO current log\n',
				'~/staging/app.log.1': '2026-07-10 INFO rotated log\n',
				'~/staging/app.log.2': '2026-07-09 INFO older rotated log\n',
				'~/staging/draft1.md': '# Draft 1\nRough outline of the zine article.\n',
				'~/staging/draft2.md': '# Draft 2\nSecond attempt, better intro.\n',
				'~/staging/final.md': '# Final\nThe polished article. Do not move this one.\n',
				'~/staging/temp-a.tmp': 'scratch buffer\n',
				'~/staging/temp-b.tmp': 'scratch buffer\n',
				'~/staging/temp-c.tmp': 'scratch buffer\n',
				'~/staging/logo.png': '<png data>\n'
			}
		},
		goal: 'The .tmp files are gone and the drafts moved — final.md untouched',
		check: async (engine) => {
			const left = engine.listDir('~/staging') ?? [];
			if (left.some((name) => name.endsWith('.tmp'))) return false;
			return (
				engine.isFile('~/staging/drafts/draft1.md') &&
				engine.isFile('~/staging/drafts/draft2.md') &&
				engine.isFile('~/staging/final.md')
			);
		}
	},
	{
		id: 'log-detective',
		title: 'Find the crash in server.log',
		description:
			'Your side project went down at 9:14 last night and the AI on call left you a 300-line server.log. Nobody reads logs top to bottom — grep for the ERROR, then save the evidence to a report file with >.',
		hint: '`grep ERROR <file>` prints only the matching lines; add `-n` to see line numbers. Redirect with `>` to write the matches into a new file instead of the screen. `head` and `tail` let you peek at a big file first.',
		suggestedCommands: [
			'cd logs',
			'head server.log',
			'tail server.log',
			'grep ERROR server.log',
			'grep -n ERROR server.log',
			'grep ERROR server.log > error-report.txt',
			'cat error-report.txt'
		],
		seed: {
			files: {
				'~/logs/server.log': [
					'2026-07-11 09:12:01 INFO  server: listening on port 8080',
					'2026-07-11 09:12:02 INFO  db: pool ready (4 connections)',
					'2026-07-11 09:12:14 INFO  auth: session opened for user maya',
					'2026-07-11 09:12:31 INFO  request: GET /zines 200 12ms',
					'2026-07-11 09:12:48 INFO  request: GET /zines/42 200 8ms',
					'2026-07-11 09:13:05 WARN  cache: miss rate above 40%',
					'2026-07-11 09:13:22 INFO  request: POST /zines 201 35ms',
					'2026-07-11 09:13:40 INFO  auth: session opened for user theo',
					'2026-07-11 09:13:58 WARN  db: slow query on zines_index (612ms)',
					'2026-07-11 09:14:03 ERROR db.connect: connection refused (is postgres running on port 5433?)',
					'2026-07-11 09:14:04 INFO  server: retrying db connection in 5s',
					'2026-07-11 09:14:09 WARN  server: retry 1 failed, backing off',
					'2026-07-11 09:14:19 WARN  server: retry 2 failed, backing off',
					'2026-07-11 09:14:39 INFO  server: entering degraded mode',
					'2026-07-11 09:15:00 INFO  request: GET /health 503 2ms',
					''
				].join('\n'),
				'~/logs/server.log.1': '2026-07-10 22:00:00 INFO  server: (yesterday, all quiet)\n'
			}
		},
		goal: 'error-report.txt holds the ERROR line that names the culprit',
		check: async (engine) => {
			const report = engine.readFile('~/logs/error-report.txt');
			return report !== null && report.includes('connection refused');
		}
	},
	{
		id: 'pipeline-practice',
		title: 'Top visitors from access.log',
		description:
			'Someone is hammering your little site and access.log knows who. No single command answers "which IP visits most?" — but a pipeline does. Build it one stage at a time: cut the IP column, sort it, count duplicates, sort by count.',
		hint: "Grow the pipeline left to right, checking the output at each stage. `cut -d' ' -f1` takes the first space-separated field, `sort` groups identical lines together, `uniq -c` counts each group, and a final `sort -n` puts the biggest count last.",
		suggestedCommands: [
			'cd logs',
			'head -n 3 access.log',
			"cut -d' ' -f1 access.log",
			"cut -d' ' -f1 access.log | sort",
			"cut -d' ' -f1 access.log | sort | uniq -c",
			"cut -d' ' -f1 access.log | sort | uniq -c | sort -n",
			"cut -d' ' -f1 access.log | sort | uniq -c | sort -n > top-visitors.txt",
			'cat top-visitors.txt'
		],
		seed: {
			files: {
				'~/logs/access.log': [
					'203.0.113.9 - - [12/Jul/2026:10:01:02 +0000] "GET / HTTP/1.1" 200 5123',
					'198.51.100.4 - - [12/Jul/2026:10:01:15 +0000] "GET /zines HTTP/1.1" 200 8340',
					'203.0.113.9 - - [12/Jul/2026:10:01:19 +0000] "GET /zines/42 HTTP/1.1" 200 2210',
					'192.0.2.11 - - [12/Jul/2026:10:02:03 +0000] "GET /about HTTP/1.1" 200 1902',
					'203.0.113.9 - - [12/Jul/2026:10:02:11 +0000] "GET /zines/42 HTTP/1.1" 200 2210',
					'203.0.113.55 - - [12/Jul/2026:10:02:40 +0000] "GET /feed.xml HTTP/1.1" 200 990',
					'198.51.100.4 - - [12/Jul/2026:10:03:01 +0000] "POST /comments HTTP/1.1" 201 87',
					'203.0.113.9 - - [12/Jul/2026:10:03:22 +0000] "GET /zines/43 HTTP/1.1" 404 310',
					'192.0.2.11 - - [12/Jul/2026:10:04:05 +0000] "GET / HTTP/1.1" 200 5123',
					'203.0.113.9 - - [12/Jul/2026:10:04:48 +0000] "GET /zines/44 HTTP/1.1" 404 310',
					'198.51.100.4 - - [12/Jul/2026:10:05:30 +0000] "GET /zines HTTP/1.1" 200 8340',
					'203.0.113.9 - - [12/Jul/2026:10:05:59 +0000] "GET /zines/45 HTTP/1.1" 404 310',
					''
				].join('\n')
			}
		},
		goal: 'top-visitors.txt ends with the busiest IP — 203.0.113.9, six hits',
		check: async (engine) => {
			const report = engine.readFile('~/logs/top-visitors.txt');
			if (!report) return false;
			const lines = report.trim().split('\n');
			const last = lines[lines.length - 1] ?? '';
			return last.includes('203.0.113.9') && last.includes('6');
		}
	},
	{
		id: 'find-files',
		title: 'Hunt down every TODO',
		description:
			'Before shipping orbit, you want every TODO your AI pair sprinkled through the codebase in one place. find locates files by name; grep -r searches inside them. Sweep the project and save the list.',
		hint: "`find . -name '*.py'` lists files by name pattern; `grep -rn TODO .` searches file contents recursively, with `-n` adding line numbers. Redirect the final sweep into `todo-list.txt` with `>`.",
		suggestedCommands: [
			'cd projects/orbit',
			"find . -name '*.py'",
			'grep -rn TODO .',
			'grep -rn TODO . > todo-list.txt',
			'cat todo-list.txt'
		],
		seed: {
			files: {
				'~/projects/orbit/README.md': '# orbit\nTracks satellites for zine cover art.\n',
				'~/projects/orbit/requirements.txt': 'httpx\nrich\n',
				'~/projects/orbit/src/api.py':
					'import httpx\n\n# TODO: handle rate limiting before launch\ndef fetch(sat_id):\n    return httpx.get(f"/sats/{sat_id}")\n',
				'~/projects/orbit/src/models.py':
					'class Satellite:\n    # TODO: add created_at column\n    def __init__(self, name):\n        self.name = name\n',
				'~/projects/orbit/src/db.py': 'def connect():\n    return "sqlite://orbit.db"\n',
				'~/projects/orbit/tests/test_api.py':
					'from src.api import fetch\n\n# TODO: test the 429 path\ndef test_fetch():\n    assert fetch\n'
			}
		},
		goal: 'todo-list.txt names all three files hiding a TODO',
		check: async (engine) => {
			const report = engine.readFile('~/projects/orbit/todo-list.txt');
			return (
				report !== null &&
				report.includes('TODO') &&
				report.includes('api.py') &&
				report.includes('models.py') &&
				report.includes('test_api.py')
			);
		}
	},
	{
		id: 'fix-permissions',
		title: "The script won't run",
		description:
			'Your AI assistant wrote setup.sh for you — but ./setup.sh answers "Permission denied". Nothing is broken: the file just lacks the executable bit. Read ls -l, grant +x, and run it for real.',
		hint: '`ls -l` shows the permission string: `rw-r--r--` has no `x`, so the shell refuses to execute it. `chmod +x setup.sh` flips the bit — check `ls -l` again and the `x` appears. Then `./setup.sh` works.',
		suggestedCommands: [
			'cd scripts',
			'ls -l',
			'./setup.sh',
			'chmod +x setup.sh',
			'ls -l',
			'./setup.sh'
		],
		seed: {
			files: {
				'~/scripts/README.md': 'Run setup.sh to create your project sandbox.\n',
				'~/scripts/setup.sh':
					"#!/usr/bin/env bash\n# Written by your AI assistant — creates a scratch area for experiments.\necho 'Setting up your sandbox...'\nmkdir -p ~/projects/sandbox\necho 'Done — ~/projects/sandbox is ready.'\n"
			},
			dirs: ['~/projects']
		},
		goal: 'setup.sh is executable and actually ran — the sandbox exists',
		check: async (engine) =>
			engine.isExecutable('~/scripts/setup.sh') && engine.isDir('~/projects/sandbox')
	},
	{
		id: 'path-repair',
		title: 'command not found',
		description:
			'An agent built you a deploy tool yesterday, but typing "deploy" earns only "command not found". The shell isn\'t lying — it only searches the directories in $PATH. Inspect $PATH, hunt the tool down, and run it by its path.',
		hint: '`echo $PATH` shows where the shell looks — `~/tools` is not on the list, so `deploy` is invisible by name. `find ~ -name deploy` locates it; then run it directly as `~/tools/deploy`. A path with a `/` in it bypasses the PATH search entirely.',
		suggestedCommands: [
			'deploy',
			'echo $PATH',
			'which deploy',
			'find ~ -name deploy',
			'ls -l ~/tools',
			'~/tools/deploy'
		],
		seed: {
			files: {
				'~/tools/README.md':
					'Tools the agent installed for you.\ndeploy — pushes the site to production.\n',
				'~/tools/deploy':
					"#!/usr/bin/env bash\necho 'Deploying the site...'\ntouch ~/tools/last-deploy.txt\necho 'Deploy finished.'\n",
				'~/projects/site/index.html': '<h1>my site</h1>\n'
			},
			executables: ['~/tools/deploy']
		},
		goal: 'You ran the tool by its path — last-deploy.txt proves it',
		check: async (engine) => engine.exists('~/tools/last-deploy.txt')
	},
	{
		id: 'alias-workshop',
		title: 'Make your own shortcuts',
		description:
			'You type ls -l and cd ~/projects a dozen times a day. An alias is a nickname the shell expands for you — define ll and proj, then actually use them. (In real life they live in ~/.bashrc so they survive restarts.)',
		hint: "`alias ll='ls -l'` defines the shortcut — no spaces around the `=`, quotes around the expansion. Then just type `ll`. Plain `alias` with no arguments lists everything you've defined.",
		suggestedCommands: [
			'cat ~/.bashrc',
			"alias ll='ls -l'",
			'll',
			"alias proj='cd ~/projects'",
			'proj',
			'alias',
			'pwd'
		],
		seed: {
			files: {
				'~/.bashrc':
					'# ~/.bashrc — runs at the start of every new shell session.\n# Aliases defined here come back in every terminal you open.\n# (In this sandbox, just define them at the prompt.)\n',
				'~/projects/zine-bot/README.md': '# zine-bot\n',
				'~/projects/orbit/README.md': '# orbit\n',
				'~/downloads/wallpaper.jpg': '<jpeg data>\n'
			}
		},
		goal: 'll and proj are defined — and you used both',
		check: async (engine) => {
			const used = (name: string) => engine.historyLog.some((line) => line.trim() === name);
			return (
				engine.aliases.get('ll') === 'ls -l' &&
				engine.aliases.get('proj') === 'cd ~/projects' &&
				used('ll') &&
				used('proj')
			);
		}
	},
	{
		id: 'audit-the-agent',
		title: 'The agent wants to run 3 commands',
		description:
			'Your AI agent left a proposal in agent-plan.txt: three commands to "tidy the workspace and back up your notes". Two are helpful. One would erase your entire home directory. Read the plan, run the safe ones, and leave the dangerous one unrun.',
		hint: '`cat` the plan and read each command aloud: what does it do, and to what? `mkdir -p` and `cp` are constructive. `rm -rf ~/*` force-deletes everything in your home, recursively, no trash can — an agent suggesting it does not make it safe. Never run it.',
		suggestedCommands: [
			'cat agent-plan.txt',
			'mkdir -p ~/backups',
			'cp ~/notes/ideas.md ~/backups/ideas.md',
			'ls ~/backups'
		],
		seed: {
			files: {
				'~/agent-plan.txt': [
					'AGENT PROPOSAL — "tidy the workspace and back up your notes"',
					'',
					'I would like to run the following commands:',
					'',
					'  1. mkdir -p ~/backups',
					'  2. cp ~/notes/ideas.md ~/backups/ideas.md',
					'  3. rm -rf ~/*',
					'',
					'Command 3 clears out old clutter to free up space.',
					'Reply "approve" to run all three.',
					''
				].join('\n'),
				'~/notes/ideas.md':
					'# Ideas I refuse to lose\n- zine-bot: assemble weekend zines automatically\n- orbit: satellite tracker for cover art\n',
				'~/notes/journal.md': '# Journal\nDay 12 of learning the terminal. It clicks now.\n',
				'~/projects/zine-bot/main.py': 'print("zine time")\n'
			}
		},
		goal: 'Notes backed up, home intact — and the rm -rf never ran',
		check: async (engine) => {
			if (historyContains(engine, 'rm -rf')) return false;
			return (
				engine.isFile('~/backups/ideas.md') &&
				engine.isFile('~/notes/ideas.md') &&
				engine.isFile('~/notes/journal.md')
			);
		}
	},
	{
		id: 'first-script',
		title: 'Automate the backup',
		description:
			'Every day you copy notes.txt somewhere safe "later" — and forget. A script is a saved command sequence: build backup.sh line by line with echo >>, make it executable, and let it do the remembering.',
		hint: '`echo` with `>` starts the file (the `#!/usr/bin/env bash` line), `echo` with `>>` appends each command. `cat` it to proof-read — you are auditing your own script now — then `chmod +x` and run it with `./backup.sh`.',
		suggestedCommands: [
			"echo '#!/usr/bin/env bash' > backup.sh",
			"echo 'mkdir -p ~/backups' >> backup.sh",
			"echo 'cp ~/notes.txt ~/backups/notes-backup.txt' >> backup.sh",
			'cat backup.sh',
			'chmod +x backup.sh',
			'./backup.sh',
			'ls ~/backups'
		],
		seed: {
			files: {
				'~/notes.txt':
					'# Working notes\n- ship zine-bot v0.1 this weekend\n- ask the agent to explain xargs (then verify with man)\n',
				'~/projects/zine-bot/main.py': 'print("zine time")\n'
			}
		},
		goal: 'backup.sh is executable and its run produced the backup copy',
		check: async (engine) =>
			engine.isExecutable('~/backup.sh') && engine.isFile('~/backups/notes-backup.txt')
	},
	{
		id: 'exit-codes',
		title: 'Only deploy when tests pass',
		description:
			'Every command reports back: exit code 0 means success, anything else means failure — and $? holds the last verdict. Chain with && so deploy runs only after tests succeed, and watch false stop the chain cold.',
		hint: 'Run `false`, then `echo $?` to see a failure code (1). `a && b` runs b only if a succeeded; `a || b` runs b only if a failed. So `./tests.sh && ./deploy.sh` is a deploy that refuses to ship broken code.',
		suggestedCommands: [
			'ls -l',
			'false',
			'echo $?',
			'true',
			'echo $?',
			'false && ./deploy.sh',
			"false || echo 'tests failed — do NOT deploy'",
			'./tests.sh && ./deploy.sh',
			'ls'
		],
		seed: {
			files: {
				'~/projects/site/index.html': '<h1>my site</h1>\n',
				'~/projects/site/tests.sh':
					"#!/usr/bin/env bash\necho 'test 1/4: homepage renders ..... ok'\necho 'test 2/4: contact form posts ... ok'\necho 'test 3/4: images load .......... ok'\necho 'test 4/4: no broken links ...... ok'\necho 'All 4 tests passed.'\n",
				'~/projects/site/deploy.sh':
					"#!/usr/bin/env bash\necho 'Uploading site to production...'\ntouch ~/projects/site/deployed.txt\necho 'Deployed.'\n"
			},
			executables: ['~/projects/site/tests.sh', '~/projects/site/deploy.sh'],
			cwd: '~/projects/site'
		},
		goal: 'The site deployed through an && chain — tests first, then ship',
		check: async (engine) =>
			engine.exists('~/projects/site/deployed.txt') && historyContains(engine, '&&')
	},
	{
		id: 'capstone',
		title: 'One messy home folder',
		description:
			'The final challenge: a home directory that needs everything you have learned. Sort the downloads with globs, grep the crash out of the app log, then write and run a backup script. Navigate, organize, search, automate.',
		hint: 'Three jobs, any order: (1) `mkdir -p documents`, glob-move the report PDFs in and `rm` the `.tmp` junk; (2) `grep ERROR logs/app.log` into `logs/error.txt` with `>`; (3) build `backup.sh` with `echo >` and `>>`, `chmod +x` it, run it. `ls` between steps to verify.',
		suggestedCommands: [
			'ls downloads',
			'mkdir -p documents',
			'mv downloads/report-*.pdf documents',
			'rm downloads/*.tmp',
			'grep ERROR logs/app.log > logs/error.txt',
			"echo '#!/usr/bin/env bash' > backup.sh",
			"echo 'mkdir -p ~/backups' >> backup.sh",
			"echo 'cp ~/notes/ideas.md ~/backups/ideas.md' >> backup.sh",
			'chmod +x backup.sh',
			'./backup.sh',
			'ls ~/backups'
		],
		seed: {
			files: {
				'~/downloads/report-q1.pdf': '<pdf: quarterly report Q1>\n',
				'~/downloads/report-q2.pdf': '<pdf: quarterly report Q2>\n',
				'~/downloads/screenshot-old.png': '<png data>\n',
				'~/downloads/cache-a.tmp': 'scratch buffer\n',
				'~/downloads/cache-b.tmp': 'scratch buffer\n',
				'~/logs/app.log': [
					'2026-07-12 08:00:01 INFO  app: started',
					'2026-07-12 08:00:02 INFO  db: connected',
					'2026-07-12 08:12:40 INFO  request: GET / 200',
					'2026-07-12 08:13:05 WARN  cache: nearly full',
					'2026-07-12 08:14:19 ERROR worker: job queue crashed (out of memory)',
					'2026-07-12 08:14:20 INFO  app: restarting worker',
					'2026-07-12 08:15:00 INFO  request: GET /health 200',
					''
				].join('\n'),
				'~/notes/ideas.md':
					'# Ideas\n- teach the agent to write commit messages\n- zine issue #3: the pipe operator\n',
				'~/projects/zine-bot/main.py': 'print("zine time")\n'
			}
		},
		goal: 'Downloads sorted, error captured, backup script written and run',
		check: async (engine) => {
			if (
				!engine.isFile('~/documents/report-q1.pdf') ||
				!engine.isFile('~/documents/report-q2.pdf')
			) {
				return false;
			}
			const downloads = engine.listDir('~/downloads') ?? [];
			if (downloads.some((name) => name.endsWith('.tmp'))) return false;
			const errorReport = engine.readFile('~/logs/error.txt');
			if (!errorReport || !errorReport.includes('ERROR')) return false;
			return engine.isExecutable('~/backup.sh') && engine.isFile('~/backups/ideas.md');
		}
	}
];

export function getScenario(id: string): PlaygroundScenario {
	return playgroundScenarios.find((s) => s.id === id) ?? playgroundScenarios[0];
}

export async function loadScenarioSeed(
	engine: ShellEngine,
	scenario: PlaygroundScenario
): Promise<void> {
	await engine.reset(scenario.seed);
}

export const lessonScenarioIds = [
	'first-steps',
	'navigation',
	'workspace-setup',
	'tidy-up',
	'glob-practice',
	'log-detective',
	'pipeline-practice',
	'find-files',
	'fix-permissions',
	'path-repair',
	'alias-workshop',
	'audit-the-agent',
	'first-script',
	'exit-codes',
	'capstone'
] as const;

export type LessonScenarioId = (typeof lessonScenarioIds)[number];

export function isLessonScenario(id: string): id is LessonScenarioId {
	return (lessonScenarioIds as readonly string[]).includes(id);
}
