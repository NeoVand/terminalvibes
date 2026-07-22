export interface CheatSheetCommand {
	command: string;
	description: string;
	/**
	 * One or two extra sentences — when to reach for it, the classic gotcha,
	 * the related command. Shown where there's room (the expanded modal and
	 * the PDF), not in the narrow side panel.
	 */
	detail?: string;
}

export interface CheatSheetCategory {
	label: string;
	icon: string; // lucide icon name for reference
	commands: CheatSheetCommand[];
}

export interface CheatSheetLegendEntry {
	/** The notation as it appears in the command column */
	notation: string;
	meaning: string;
}

export interface CheatSheetLegend {
	lead: string;
	entries: CheatSheetLegendEntry[];
}

/**
 * Placeholder notation used throughout the commands below. Rendered above the
 * list everywhere the cheat sheet appears — panel, expanded modal, and the
 * printed PDF — because a beginner who types the angle brackets gets an error
 * that points nowhere near the mistake.
 *
 * In `description`/`detail`/`meaning` strings, command mentions sit in
 * `backticks`; every surface renders those segments as syntax-highlighted
 * chips, the same treatment the command column gets.
 */
export const cheatSheetLegend: CheatSheetLegend = {
	lead: 'Some of these commands have a blank to fill in. Two notations mark one:',
	entries: [
		{
			notation: '<file>',
			meaning:
				'Your own word goes here — `cat <file>` means `cat notes.txt`. Never type the brackets; `<` is a real operator in the shell.'
		},
		{
			notation: 'PID · NAME · URL',
			meaning:
				'The same blank in the capitals man pages use. Swap in the actual number, name, or address.'
		}
	]
};

export const cheatSheet: CheatSheetCategory[] = [
	{
		label: 'Orientation',
		icon: 'compass',
		commands: [
			{
				command: 'pwd',
				description: 'Print the directory you are standing in',
				detail:
					'The full absolute path from `/` down to here. Half of all terminal confusion is being in the wrong folder — when anything misbehaves, `pwd` first.'
			},
			{
				command: 'ls',
				description: 'List the files and folders here',
				detail:
					'Names only by default. Give it a path (`ls src`) to peek inside a folder without moving into it.'
			},
			{
				command: 'ls -a',
				description: 'List everything, including hidden dotfiles',
				detail:
					'Files whose names start with a dot (`.bashrc`, `.git`, `.env`) are hidden by default — `-a` reveals them, plus the special `.` and `..` entries.'
			},
			{
				command: 'ls -l',
				description: 'Long listing: permissions, link count, owner, group, size, date',
				detail:
					'One file per line with the full story. The two names in the middle are the owner and its group — `vibe staff` means owner `vibe`, group `staff`. Single-letter flags cluster: `ls -la` is `ls -l -a`.'
			},
			{
				command: 'whoami',
				description: 'Print your username',
				detail:
					'A quick identity check — most useful after `sudo`, over `ssh`, or when a script behaves as if it belongs to someone else.'
			},
			{
				command: 'clear',
				description: 'Wipe the screen (`Ctrl+L` does the same)',
				detail:
					'Only clears the view — nothing is undone or lost, and you can still scroll up. On Windows cmd the equivalent is `cls`, but in WSL and Git Bash `clear` works as shown.'
			},
			{
				command: 'man <command>',
				description: 'Open the full manual page for a command',
				detail:
					'Angle brackets mean "put your own word here" — you type `man ls`, never the brackets. Scroll with arrows or space, `/` searches (press Enter to run the search), `q` quits. A command can have pages in several numbered sections: `man 5 crontab` asks for the file-format one. Git Bash on Windows ships without `man` — use `<command> --help` there.'
			},
			{
				command: '<command> --help',
				description: 'Quick usage summary and flag list',
				detail:
					'In a usage line, [square brackets] mean optional, ALL-CAPS words are placeholders, and `...` means "as many as you like". A comma joins two spellings of one flag: `-a, --all`. A flag letter belongs to its command, not to the terminal — `-r` is recursive to `cp` and reverse to `sort` — so look it up rather than guessing. Great habit: run it on any command an AI suggests.'
			}
		]
	},
	{
		label: 'Navigation',
		icon: 'route',
		commands: [
			{
				command: 'cd <dir>',
				description: 'Move into a directory',
				detail:
					'Takes a relative path (`cd projects`) or an absolute one (`cd /usr/local`). Press TAB while typing — completion prevents the typos that cause most `cd` failures.'
			},
			{
				command: 'cd ..',
				description: 'Go up one level to the parent directory',
				detail: 'Chain it to climb faster: `cd ../..` goes up two levels in one hop.'
			},
			{
				command: 'cd',
				description: 'Jump home from anywhere (same as `cd ~`)',
				detail:
					'Home is `/Users/you` on macOS and `/home/you` on Linux. In WSL your Windows files live under `/mnt/c` — your Linux home is separate.'
			},
			{
				command: 'cd -',
				description: 'Bounce back to the previous directory',
				detail:
					'Toggles between your last two locations — perfect for hopping between a project and a log folder.'
			},
			{
				command: 'cd /',
				description: 'Go to the root of the filesystem',
				detail:
					'Everything on the machine lives somewhere beneath `/`. Look around with `ls`, but be careful running commands from here.'
			},
			{
				command: 'cd ~/projects',
				description: 'Go to a path spelled from your home folder',
				detail:
					'`~` expands to your home directory, so this works no matter where you currently stand — the most reliable way to write personal paths.'
			}
		]
	},
	{
		label: 'Files & Folders',
		icon: 'folder-plus',
		commands: [
			{
				command: 'mkdir <name>',
				description: 'Create a new directory',
				detail: 'Errors if it already exists — harmless, but `mkdir -p` stays quiet instead.'
			},
			{
				command: 'mkdir -p src/app/utils',
				description: 'Create nested directories in one go',
				detail:
					'`-p` is for parents: it makes every missing folder along the path and never complains if some already exist — the standard way to build a project skeleton.'
			},
			{
				command: 'mkdir -p src/{components,lib}',
				description: 'Brace expansion: several names from one line',
				detail:
					'Braces are not globs — the shell expands `{components,lib}` into both names before `mkdir` runs, so nothing needs to exist first. Agents scaffold projects with this shape constantly.'
			},
			{
				command: 'touch <file>',
				description: 'Create an empty file (or update its timestamp)',
				detail:
					'If the file exists, only its modified time changes — the contents are untouched. Safe to run on anything.'
			},
			{
				command: 'cp <src> <dest>',
				description: 'Copy a file',
				detail:
					'If `<dest>` is a folder the copy lands inside it; if it is a filename you get a copy under that name. Overwrites silently — `cp -i` asks first.'
			},
			{
				command: 'cp -r <dir> <dest>',
				description: 'Copy a folder and everything inside it',
				detail:
					'Plain `cp` refuses directories; `-r` (recursive) descends into them. The classic quick backup: `cp -r project project-backup`.'
			},
			{
				command: 'mv <src> <dest>',
				description: 'Move a file — or rename it (same command)',
				detail:
					'`mv old.txt new.txt` renames; `mv old.txt archive/` moves. It silently overwrites an existing destination — `mv -i` asks before clobbering.'
			},
			{
				command: 'rm <file>',
				description: 'Delete a file — permanently, no trash can',
				detail:
					'There is no undo and no recycle bin. Before deleting, `ls` the exact name you are about to remove; after, only backups or your editor’s local history can help.'
			},
			{
				command: 'rm -r <dir>',
				description: 'Delete a folder and everything inside it',
				detail:
					'Recursive and permanent. Slow down when you see `-rf`: `-f` silences every warning. Wrong folder + wildcard + `rm -rf` is the classic terminal disaster.'
			},
			{
				command: 'rmdir <dir>',
				description: 'Delete a directory only if it is empty',
				detail:
					'The cautious cousin of `rm -r` — it refuses if anything is inside, which makes it a safe way to clean up folder skeletons.'
			},
			{
				command: 'open .',
				description: 'Open the current folder in Finder (macOS)',
				detail:
					'Linux: `xdg-open .` — WSL: `explorer.exe .` (note the dot). Handy bridge back to the GUI.'
			}
		]
	},
	{
		label: 'Viewing Files',
		icon: 'eye',
		commands: [
			{
				command: 'cat <file>',
				description: 'Print a whole file to the screen',
				detail:
					'Best for short files. `cat` a huge or binary file and the screen floods — reach for `less` instead, and `reset` if the display garbles.'
			},
			{
				command: 'less <file>',
				description: 'Page through a big file comfortably',
				detail:
					'Space or arrows scroll, `/` searches forward, `n` repeats the search, `q` quits. `man` uses the same pager, so these keys work there too.'
			},
			{
				command: 'nano <file>',
				description: 'Edit a file right in the terminal',
				detail:
					'The friendly editor: type normally, `Ctrl+O` then Enter saves ("write out"), `Ctrl+X` leaves — both printed at the bottom of its screen the whole time. On a server with no GUI, this is the tool.'
			},
			{
				command: 'head <file>',
				description: 'Show the first 10 lines',
				detail:
					'`head -n 25` shows 25. Perfect for checking what kind of file you are dealing with.'
			},
			{
				command: 'tail <file>',
				description: 'Show the last 10 lines',
				detail:
					'The end of a log file is usually where the newest — and most interesting — entries are. `tail -5` is shorthand for `tail -n 5`: a bare number here is a count, unlike the `9` in `kill -9`, which is a signal number.'
			},
			{
				command: 'tail -f server.log',
				description: 'Follow a file live as new lines arrive',
				detail:
					'The standard way to watch a running server write its log. It never exits on its own — `Ctrl+C` stops watching.'
			},
			{
				command: 'wc -l <file>',
				description: 'Count the lines in a file',
				detail:
					'`wc` alone prints lines, words and bytes. Counting is the quickest sanity check that a pipeline or filter did what you expected.'
			},
			{
				command: 'file <file>',
				description: 'Ask what kind of file this is',
				detail:
					'Reads the contents, not the extension — it will tell you a “.txt” is really a PNG. Useful before you `cat` something questionable.'
			}
		]
	},
	{
		label: 'Text & Pipes',
		icon: 'workflow',
		commands: [
			{
				command: '<command> | <command>',
				description: 'Pipe: feed one command’s output into the next',
				detail:
					'The superpower. Small tools compose into big answers: `history | grep ssh` finds every `ssh` command you have ever run.'
			},
			{
				command: '<command> > out.txt',
				description: 'Redirect output into a file — OVERWRITES it',
				detail:
					'`>` truncates the file to zero before writing. If the file mattered, it is already gone — reach for `>>` when in doubt.'
			},
			{
				command: '<command> >> out.txt',
				description: 'Append output to the end of a file',
				detail:
					'Adds without destroying — the safe default for collecting results, building logs, or writing a script line by line with `echo`.'
			},
			{
				command: '<command> 2> errors.txt',
				description: 'Capture error output separately',
				detail:
					'Every command has three channels: stdin (0), stdout (1) and stderr (2). `2>` catches just the errors; `2>&1` sends stream 2 wherever stream 1 currently points — the `&1` makes it a reference to a stream rather than a file named `1`.'
			},
			{
				command: '<command> | tee out.log',
				description: 'See the output AND save it',
				detail:
					'`tee` passes text through unchanged while writing a copy to the file — the receipt habit for builds and agent runs. `tee -a` appends, like `>>`.'
			},
			{
				command: '<command> | pbcopy',
				description: 'Send output to the clipboard (macOS)',
				detail:
					'Straight to the clipboard, ready to paste into a chat; `pbpaste` brings it back into a pipe. Linux: `xclip -selection clipboard` or `wl-copy`. WSL: `clip.exe`.'
			},
			{
				command: 'sort <file>',
				description: 'Sort lines alphabetically',
				detail:
					'`sort -n` sorts numerically (so 9 comes before 10), `sort -r` reverses. Sorting is also the required warm-up for `uniq`.'
			},
			{
				command: 'uniq -c',
				description: 'Collapse repeated adjacent lines and count them',
				detail:
					'`-c` prefixes each surviving line with how many it stood for — not `grep`’s `-c`, which prints one total. Only removes duplicates that sit next to each other, which is why the recipe is always `sort` first, then `uniq`.'
			},
			{
				command: 'cut -d, -f1',
				description: 'Take one column from delimited text',
				detail:
					'`-d` sets the delimiter (a comma here), `-f` picks the field. Both are flags that take a value, and `cut` lets you jam it on: `-f2` is `-f 2`. `cut -d: -f1 /etc/passwd` lists every username.'
			},
			{
				command: 'sort | uniq -c | sort -rn',
				description: 'The classic frequency pipeline: count and rank',
				detail:
					'Sort to group, count the groups, sort the counts biggest-first. Top IPs in a log, most-used commands in `history` — same three steps every time.'
			}
		]
	},
	{
		label: 'Searching',
		icon: 'search',
		commands: [
			{
				command: 'grep "<text>" <file>',
				description: 'Print the lines that contain the text',
				detail:
					'Quote the pattern so spaces and special characters survive the trip to `grep`. Its patterns are regular expressions, not globs: here `*` means "zero or more of the thing before it", `.` matches any single character, and `^` and `$` anchor to the start and end of a line. So `ERR*` matches ER followed by any number of Rs — not "starts with ERR".'
			},
			{
				command: 'grep -i "<text>" <file>',
				description: 'Search ignoring upper/lower case',
				detail:
					'`ERROR`, `Error` and `error` all match. Add `-n` to show line numbers with each hit.'
			},
			{
				command: 'grep -rn "<text>" .',
				description: 'Search every file under this folder, recursively',
				detail:
					'`-r` descends into subdirectories, `-n` prints file and line numbers — the terminal’s project-wide find-in-files.'
			},
			{
				command: 'grep -v "<text>"',
				description: 'Keep the lines that do NOT match',
				detail:
					'The filter-out flag: `cat server.log | grep -v DEBUG` hides the noise so the signal stands out.'
			},
			{
				command: 'grep -c "<text>" <file>',
				description: 'Count matching lines instead of printing them',
				detail: 'How many errors today? `grep -c ERROR server.log` answers with one number.'
			},
			{
				command: 'find . -name "*.md"',
				description: 'Find files by name pattern, anywhere below here',
				detail:
					'`find` searches file NAMES; `grep` searches file CONTENTS. Quote the pattern so the shell hands the wildcard to `find` instead of expanding it early. This is also the answer when a glob is not enough: a glob never crosses a `/`, so `*.tmp` only matches this folder — `find . -name "*.tmp"` reaches the whole tree.'
			},
			{
				command: 'find . -type d -name "node_modules"',
				description: 'Find directories by name',
				detail:
					'`-type d` matches directories only, `-type f` files only. Combine with `-name` for precise hunts.'
			}
		]
	},
	{
		label: 'Text Surgery',
		icon: 'scissors',
		commands: [
			{
				command: "sed 's/old/new/g' FILE",
				description: 'Replace old with new on every line',
				detail:
					'Read it as: s(ubstitute) / find this / replace with this / `g` = every match on the line. Prints the result — the file itself is untouched. Any delimiter works: `s|/usr|/opt|` saves escaping slashes.'
			},
			{
				command: "sed '/DEBUG/d' FILE",
				description: 'Drop every line matching a pattern',
				detail:
					'Addresses pick lines, `d` deletes them. Also by position: `sed 3d` (line 3), `sed 2,5d` (a range), `sed $d` (the last line).'
			},
			{
				command: "sed -n '40,55p' FILE",
				description: 'Print only lines 40–55',
				detail:
					'`-n` silences the default output, `p` prints the selected lines — the precision way to peek at the middle of a huge log. Regex addresses work too: `sed -n /ERROR/p`.'
			},
			{
				command: "sed -i.bak 's/old/new/g' FILE",
				description: 'Edit the file in place — keeping a `.bak` backup',
				detail:
					'The house rule: never bare `-i`. The suffix saves each original as `file.bak` first — instant diff, instant undo (`mv file.bak file`). It is also the portable spelling: on macOS bare `-i` swallows the next argument as the backup suffix and fails with an error pointing nowhere near the real problem. When an agent proposes bare `-i`, amend it.'
			},
			{
				command: "awk '{print $2}' FILE",
				description: 'Print the second column of every line',
				detail:
					"Fields split on runs of spaces — perfect for ragged, column-aligned output. `$0` is the whole line; commas join fields with a space: `awk '{print $1, $3}'`. The single quotes are load-bearing: `$2` here is `awk`'s own language, not a shell variable, and unquoted the shell would swallow it and the braces first."
			},
			{
				command: "awk -F, '{print $2}' FILE",
				description: 'Same, but split on commas (CSV — comma-separated values)',
				detail:
					'`-F` sets the field separator. For clean single-character delimiters `cut -d, -f2` does the same job; `awk` wins when spacing is messy.'
			},
			{
				command: "awk '/error/ {print $1}' FILE",
				description: 'Pull a field from matching lines only',
				detail:
					'A `/pattern/` guard filters which lines the action runs on — `grep` and column-pull in one step.'
			}
		]
	},
	{
		label: 'Processes & Ports',
		icon: 'cpu',
		commands: [
			{
				command: 'ps aux',
				description: 'List every running process',
				detail:
					'Bare `ps` shows only this terminal’s handful; `aux` widens it to the whole machine — `a` all users, `u` the readable columns, `x` including processes with no terminal, which is where servers hide. They take no dash: `ps` uses an older option style. `PID` is the number you pass to `kill`, `%CPU` is measured against one core (so 340% is three cores, not an error), `COMMAND` is the interpreter’s name — a JavaScript server shows as `node`. Your real output has more columns than the course shows.'
			},
			{
				command: 'top',
				description: 'Live view of what is running — `q` quits',
				detail:
					'The moving picture to `ps`’s photograph: the same table, repainted live, worst offenders first. `htop` is the nicer third-party cousin.'
			},
			{
				command: 'pgrep NAME',
				description: 'Print the PIDs of processes matching a name',
				detail:
					'The short way to do `ps aux | grep NAME`. Exits 1 with no output when nothing matches.'
			},
			{
				command: 'kill PID',
				description: 'Ask a process to stop (`SIGTERM`)',
				detail:
					'A signal is a short fixed message the kernel delivers to a running process. They all start with `SIG`: `SIGTERM` is "terminate", and bare `kill` is `kill -15`, its number. A polite request — the program can save, clean up and exit, or catch the signal and ignore it, and then you escalate.'
			},
			{
				command: 'kill -9 PID',
				description: 'Force a process to stop (`SIGKILL`)',
				detail:
					'The `9` is a signal number, not a count — signal 9 is `SIGKILL`. Cannot be caught or refused, and skips all cleanup: unsaved work is lost and the lock file it was holding stays behind, so the next copy finds it and refuses to start. Last resort, not first.'
			},
			{
				command: 'lsof -i :3000',
				description: 'Find what is holding a port',
				detail:
					'`lsof` is "list open files"; `-i` narrows it to network connections. A port is a numbered door and only one program can hold one at a time — which is the whole of "address already in use". The only column you need is `PID`; `(LISTEN)` confirms that process is sitting at the door. Silence means the port is free.'
			},
			{
				command: 'command &',
				description: 'Run it in the background, keep your prompt',
				detail:
					'The shell answers with `[1]` and a PID. `jobs` lists what is backstage, `fg %1` brings job 1 forward, `kill %1` stops it. The job is tied to this shell: close the window and it goes too, so do not background a long build and walk away. Not to be confused with `&&` (run on success) or `2>&1` (a stream reference).'
			},
			{
				command: 'nohup <command> &',
				description: 'Keep a job alive after the window closes',
				detail:
					'"No hangup": the job survives the terminal, output lands in `nohup.out`. The patch version of persistence — `tmux` is the comfortable one.'
			},
			{
				command: 'Ctrl+Z  then  bg',
				description: 'Suspend the foreground job, resume it in the background',
				detail:
					'The rescue for when you started something long and forgot the `&`. `Ctrl+Z` hands your prompt back but stops the job dead — `jobs` shows it as `Stopped`, and no work happens until `bg` restarts it backstage (or `fg` brings it back).'
			}
		]
	},
	{
		label: 'Network & Secrets',
		icon: 'globe',
		commands: [
			{
				command: 'curl localhost:3000/health',
				description: 'Ask a server directly and print its reply',
				detail:
					'The one-line way to check "is it actually running?" instead of trusting a claim. `Connection refused` means nothing is listening — check with `lsof -i :3000`.'
			},
			{
				command: 'curl -s -o out.json URL',
				description: 'Save the reply to a file, quietly',
				detail:
					'`-o` writes the body to a file instead of the screen; `-s` hides the progress meter, which you always want inside scripts and pipelines. `-I` asks for just the headers.'
			},
			{
				command: 'curl -s URL | jq -r .field',
				description: 'Fetch JSON and pull one value out of it',
				detail:
					'A `jq` filter is a path: `.` is everything, `.latest` is a key, `.server.port` goes deeper, `.items[0]` indexes a list. `-r` drops the quotes so the value can feed the next command.'
			},
			{
				command: "echo 'KEY=value' > .env  &&  chmod 600 .env",
				description: 'Put a secret in a file only you can read',
				detail:
					'A `.env` file is plain text: `NAME=value` lines, one per key ("env" is short for environment). Never type a key directly into a command — your shell history keeps it. Load it with `source .env` and use `"$KEY"`, and add `.env` to `.gitignore`. Note `.gitignore` only stops `git` starting to track a file: if the key is already committed, revoke and reissue it in the provider’s website.'
			},
			{
				command: 'ssh user@host',
				description: 'Open a shell on another machine',
				detail:
					'Every command in this course works there too. The prompt changes to show the other machine — check it before running anything destructive. `exit` comes home.'
			},
			{
				command: 'scp <file> user@host:~/',
				description: 'Copy a file to (or from) another machine',
				detail:
					'Reads like `cp` — source first, destination second — with a colon marking the remote side. Forget the trailing `:` and you make a strange local file instead of crossing the network. `-r` for folders.'
			},
			{
				command: 'rsync -avz <dir>/ user@host:<dir>/',
				description: 'Sync a folder: send only what changed',
				detail:
					'Resumable, narrated, and skips what is already there. Trailing slash on the source means "the contents of". `--dry-run` rehearses the whole transfer without moving a byte.'
			}
		]
	},
	{
		label: 'The Toolshed',
		icon: 'package',
		commands: [
			{
				command: 'brew install NAME',
				description: 'Install a tool (macOS)',
				detail:
					'A package manager installs other programs: it fetches the right build and drops it where `$PATH` already looks — which is all "installed" means. Check with `which NAME`. Linux: `sudo apt install NAME` (`apt` writes to folders that belong to the machine, so it needs `sudo`; `brew` does not). Windows: `winget install NAME`. `npm i -g NAME` is a different kind of thing — a per-language manager that can only install JavaScript tools. Homebrew is not on a stock Mac: install it once from the instructions at brew.sh.'
			},
			{
				command: 'tar -tzf archive.tar.gz',
				description: 'List what is inside an archive without unpacking',
				detail:
					'Peek first: an archive decides where its own files land, and a badly built one scatters them across your folder. `unzip -l` does the same for `.zip`.'
			},
			{
				command: 'tar -xzf archive.tar.gz',
				description: 'Extract a `.tar.gz` archive',
				detail:
					'`x` extract, `z` un-gzip, `f` this file. Swap `x` for `c` to create (`tar -czf backup.tar.gz notes/`) or `t` to list. The letters are separate instructions, not one magic word.'
			},
			{
				command: 'shasum -a 256 <file>',
				description: 'Verify a download against its published fingerprint',
				detail:
					'Vendors publish a SHA-256 next to installers; this prints the fingerprint of the file you actually got. If the two differ, the file is not what they shipped — stop. Linux spelling: `sha256sum`.'
			},
			{
				command: 'ln -s target linkname',
				description: 'Create a symlink — a signpost, not a copy',
				detail:
					'`-s` is symbolic: a tiny file whose whole content is a path to somewhere else. That `->` arrow (and the leading `l`) in `ls -l` is a symlink. A relative target is worked out from the link’s own folder, so moving the link breaks it. Deleting the link leaves the original; deleting the original leaves a broken link.'
			},
			{
				command: 'du -sh *',
				description: 'Size of every folder here, biggest hog obvious',
				detail:
					'`-s` summarises: one total per item instead of a line per file. `-h` makes the numbers human — K, M, G, each rung about a thousand of the one below. Measure before you delete, the same discipline as `ls` before `rm`. `df -h` shows how full the whole disk is.'
			}
		]
	},
	{
		label: 'Permissions',
		icon: 'lock',
		commands: [
			{
				command: 'ls -l',
				description: 'Read the permission string on every file',
				detail:
					'The 10-character prefix decodes as type + rwx for user, group, other: `-rwxr-xr--` means you can do anything, your group can read/run, others read only. The type character is `-` for a file, `d` for a directory, `l` for a symlink.'
			},
			{
				command: 'chmod +x <script>',
				description: 'Make a file executable',
				detail:
					'`chmod` takes a small grammar: `+` adds a permission, `-` removes it, and `u`/`g`/`o`/`a` pick the audience. A bare `+x` means `a+x` — all three audiences at once. The fix for `Permission denied` on your own script; after it, run the script with `./script.sh`.'
			},
			{
				command: 'chmod 755 <file>',
				description: 'Recipe: you rwx, everyone else read/run',
				detail:
					'The standard mode for scripts and directories. Each digit is one audience: user, group, other. On a directory `x` does not mean "run" — it means you may go inside and reach what is in there.'
			},
			{
				command: 'chmod 644 <file>',
				description: 'Recipe: you read/write, everyone else read-only',
				detail:
					'The standard mode for ordinary files — nobody can execute it, others cannot change it.'
			},
			{
				command: 'sudo chown NAME <file>',
				description: 'Change who owns a file',
				detail:
					'Owners decide whose rules apply (`ls -l` shows them). Reassigning takes root, and you will mostly meet it on servers and around Docker, where container-made files come out owned by somebody else. Recognize it more than you type it.'
			},
			{
				command: 'sudo <command>',
				description: 'Run one command as the administrator (root)',
				detail:
					'Respect it: `sudo` bypasses every safety rail. Never `sudo` a command you do not understand — especially one an AI wrote. Git Bash has no `sudo`; WSL does.'
			},
			{
				command: 'sudo !!',
				description: 'Re-run the previous command with `sudo`',
				detail:
					'`!!` expands to your last command — the classic move after `Permission denied` on something you meant to run as root.'
			}
		]
	},
	{
		label: 'Environment',
		icon: 'at-sign',
		commands: [
			{
				command: 'echo $HOME',
				description: 'Print the value of a variable',
				detail:
					'`$NAME` expands to the variable’s value before `echo` even runs. Try `$USER`, `$SHELL`, `$PWD` — the shell keeps its state in variables.'
			},
			{
				command: 'echo $PATH',
				description: 'The list of folders searched for commands',
				detail:
					'Colon-separated, checked left to right. `command not found` means the tool is not in any of these folders — or not installed at all.'
			},
			{
				command: 'which <command>',
				description: 'Print the full path of what would actually run',
				detail:
					'Answers “which `python` am I really running?” If `which` finds nothing, `PATH` is why your command is not found.'
			},
			{
				command: 'export VAR=value',
				description: 'Set a variable for this session and its children',
				detail:
					'Lasts until the terminal closes. To make it permanent, add the `export` line to `~/.bashrc` or `~/.zshrc`.'
			},
			{
				command: 'export PATH="$PATH:<dir>"',
				description: 'Add a folder to your `PATH` — in your shell config',
				detail:
					'The `$PATH` on the right keeps the old list, so you are appending, not replacing — drop it and everything goes `command not found` until that terminal closes. The line every installer means by "add it to your PATH".'
			},
			{
				command: 'env',
				description: 'List every environment variable',
				detail:
					'The full picture of what programs inherit from your shell. Pipe it through `grep` to find one: `env | grep PATH`.'
			},
			{
				command: "alias gs='git status'",
				description: 'Create a shortcut command',
				detail:
					'Type `gs`, get `git status`. Aliases live only in this session until you add them to your shell config file.'
			},
			{
				command: 'source ~/.bashrc',
				description: 'Reload your shell config without reopening the terminal',
				detail:
					'Running a file the ordinary way starts a child shell that exits and takes its changes with it; `source` runs the lines in the shell you are sitting in, so they stick. That is why you `source` a config instead of running it — and why a script full of `cd` never seems to move you. zsh users (macOS default): `source ~/.zshrc`.'
			}
		]
	},
	{
		label: 'Scripting',
		icon: 'file-code',
		commands: [
			{
				command: '#!/usr/bin/env bash',
				description: 'Shebang: the required first line of a bash script',
				detail:
					'Tells the system which program runs the file. `env` is itself a program: handed a name, it looks that name up on `PATH`, which is how the line finds `bash` wherever this machine keeps it. A script is just saved commands — everything you type interactively works inside one.'
			},
			{
				command: 'chmod +x script.sh',
				description: 'Make the script runnable',
				detail:
					'One-time step per script. Without it you get `Permission denied` even on a file you wrote yourself.'
			},
			{
				command: './script.sh',
				description: 'Run a script from the current directory',
				detail:
					'The `./` is required — the current directory is deliberately NOT on `PATH`, so you must point at the script explicitly.'
			},
			{
				command: 'bash script.sh',
				description: 'Run a script without the executable bit',
				detail:
					'Hands the file straight to `bash`, skipping `chmod`. Handy for quick tests of a script you just wrote.'
			},
			{
				command: 'echo "$1"',
				description: 'Use the first argument passed to your script',
				detail:
					'`$1`, `$2`, … hold the arguments; `$@` is all of them. Quote them so arguments containing spaces stay whole.'
			},
			{
				command: "cat <<'EOF' > file.txt",
				description: 'Write a whole file in one command (here-doc)',
				detail:
					'Feeds every following line in as input, until a line that is exactly `EOF`. Quoted delimiter: `$` travels literally — right for scripts. Unquoted: expands now. The lines between the markers ARE the file — audit them like one.'
			},
			{
				command: 'crontab -e',
				description: 'Edit your scheduled jobs (cron)',
				detail:
					'Each line: five time fields, then a command — `0 9 * * 1-5 ~/backup.sh` is 9:00 on weekday mornings. `man 5 crontab` decodes the fields. How a script becomes a script that runs itself.'
			},
			{
				command: 'echo $?',
				description: 'Exit code of the last command — 0 means success',
				detail:
					'Every command reports success (0) or failure (anything else) as it finishes. Which non-zero number it picks is that command’s own business and means nothing outside it — only "zero or not zero" is portable. Scripts, `&&` and `||` all decide from this number.'
			},
			{
				command: '<command> && <command>',
				description: 'Run the second only if the first SUCCEEDS',
				detail:
					'`npm test && npm run deploy` deploys only on green tests. Beware the classic horror: if `cd` fails, the next command runs in the wrong folder — `&&` stops that.'
			},
			{
				command: '<command> || <command>',
				description: 'Run the second only if the first FAILS',
				detail:
					'The fallback operator: `npm test || echo "tests failed"` — the right-hand side is the plan B. Careful chaining all three: `a && b || c` runs left to right with neither operator outranking the other, so if `b` fails the `||` branch fires even though `a` succeeded. It is not the one-branch-or-the-other shape it looks like.'
			},
			{
				command: '<command> ; <command>',
				description: 'Run both, one after the other, regardless',
				detail:
					'No safety logic at all — the second runs even if the first exploded. Prefer `&&` when the second step depends on the first.'
			}
		]
	},
	{
		label: 'Panic Button',
		icon: 'life-buoy',
		commands: [
			{
				command: 'Ctrl+C',
				description: 'Cancel the running command — or discard a typed line',
				detail:
					'Typed a scary command? Just don’t press Enter — `Ctrl+C` throws the line away unrun. Nothing you type executes until you press Enter.'
			},
			{
				command: 'q',
				description: 'Quit a full-screen pager (`less`, `man`, `git log`)',
				detail:
					'A “frozen” terminal is very often just a pager waiting politely. If `q` does nothing, try `Ctrl+C` first, then `q`.'
			},
			{
				command: 'lsof -i :3000',
				description: '"Address already in use" — find and stop the squatter',
				detail:
					'Prints the process holding the port, with its PID. `kill` that PID, then start your server again. Silence from `lsof` means the port is actually free.'
			},
			{
				command: ':q!',
				description: 'Trapped in vim? Press Esc, then type `:q!` and Enter',
				detail:
					'Quits without saving (`:wq` saves instead). Git and other tools open `vim` as an editor without warning — this is the universal exit. The `nano` equivalent is `Ctrl+X`.'
			},
			{
				command: 'Ctrl+D',
				description: 'Close the shell (same as typing `exit`)',
				detail:
					'Sends “end of input”. If a program is waiting for input you did not intend to give, `Ctrl+D` on an empty line often releases it.'
			},
			{
				command: 'reset',
				description: 'Fix a garbled, glitchy terminal display',
				detail:
					'After `cat`-ing a binary file the screen can fill with junk — `reset` repaints everything. It takes a second; your session survives.'
			},
			{
				command: 'echo rm *.log',
				description: 'Preview what a wildcard will hit — before deleting',
				detail:
					'`echo` expands the glob harmlessly and shows the exact file list `rm` would receive. Make this reflex and `rm` loses most of its teeth.'
			},
			{
				command: 'rm',
				description: 'Deleted a file? There is no undo — but check your editor',
				detail:
					'`rm` skips the trash entirely. VS Code’s Timeline view keeps local history of files you edited, and if the project uses `git`, a committed file can be restored.'
			},
			{
				command: 'history',
				description: 'What did I actually run? Read the record',
				detail:
					'Numbered list of your recent commands — the first step of any post-incident investigation, and `Ctrl+R` searches it interactively.'
			},
			{
				command: 'Ctrl+U',
				description: 'Wipe the line you are typing',
				detail:
					'The kernel’s own line-wipe (`kill = ^U` in `stty -a`) — for when something scary is sitting at the prompt half-typed. Its friends: `Ctrl+A`/`Ctrl+E` jump to line start/end, `Ctrl+W` eats the word behind the cursor.'
			}
		]
	}
];
