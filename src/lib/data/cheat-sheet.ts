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

export const cheatSheet: CheatSheetCategory[] = [
	{
		label: 'Orientation',
		icon: 'compass',
		commands: [
			{
				command: 'pwd',
				description: 'Print the directory you are standing in',
				detail:
					'The full absolute path from / down to here. Half of all terminal confusion is being in the wrong folder — when anything misbehaves, pwd first.'
			},
			{
				command: 'ls',
				description: 'List the files and folders here',
				detail:
					'Names only by default. Give it a path (ls src) to peek inside a folder without moving into it.'
			},
			{
				command: 'ls -a',
				description: 'List everything, including hidden dotfiles',
				detail:
					'Files whose names start with a dot (.bashrc, .git, .env) are hidden by default — -a reveals them, plus the special . and .. entries.'
			},
			{
				command: 'ls -l',
				description: 'Long listing: permissions, owner, size, date',
				detail:
					'One file per line with the full story. Combine flags freely: ls -la shows the long view including hidden files.'
			},
			{
				command: 'whoami',
				description: 'Print your username',
				detail:
					'A quick identity check — most useful after sudo, over ssh, or when a script behaves as if it belongs to someone else.'
			},
			{
				command: 'clear',
				description: 'Wipe the screen (Ctrl+L does the same)',
				detail:
					'Only clears the view — nothing is undone or lost, and you can still scroll up. On Windows cmd the equivalent is cls, but in WSL and Git Bash clear works as shown.'
			},
			{
				command: 'man <command>',
				description: 'Open the full manual page for a command',
				detail:
					'Scroll with arrows or space, press q to quit the pager. Git Bash on Windows ships without man — use <command> --help there instead.'
			},
			{
				command: '<command> --help',
				description: 'Quick usage summary and flag list',
				detail:
					'Faster than man when you just need a flag reminder. Great habit: run it on any command an AI suggests before running the real thing.'
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
					'Takes a relative path (cd projects) or an absolute one (cd /usr/local). Press TAB while typing — completion prevents the typos that cause most cd failures.'
			},
			{
				command: 'cd ..',
				description: 'Go up one level to the parent directory',
				detail: 'Chain it to climb faster: cd ../.. goes up two levels in one hop.'
			},
			{
				command: 'cd',
				description: 'Jump home from anywhere (same as cd ~)',
				detail:
					'Home is /Users/you on macOS and /home/you on Linux. In WSL your Windows files live under /mnt/c — your Linux home is separate.'
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
					'Everything on the machine lives somewhere beneath /. Look around with ls, but be careful running commands from here.'
			},
			{
				command: 'cd ~/projects',
				description: 'Go to a path spelled from your home folder',
				detail:
					'~ expands to your home directory, so this works no matter where you currently stand — the most reliable way to write personal paths.'
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
				detail: 'Errors if it already exists — harmless, but mkdir -p stays quiet instead.'
			},
			{
				command: 'mkdir -p src/app/utils',
				description: 'Create nested directories in one go',
				detail:
					'-p makes every missing parent along the path and never complains if some already exist — the standard way to build a project skeleton.'
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
					'If <dest> is a folder the copy lands inside it; if it is a filename you get a copy under that name. Overwrites silently — cp -i asks first.'
			},
			{
				command: 'cp -r <dir> <dest>',
				description: 'Copy a folder and everything inside it',
				detail:
					'Plain cp refuses directories; -r (recursive) descends into them. The classic quick backup: cp -r project project-backup.'
			},
			{
				command: 'mv <src> <dest>',
				description: 'Move a file — or rename it (same command)',
				detail:
					'mv old.txt new.txt renames; mv old.txt archive/ moves. It silently overwrites an existing destination — mv -i asks before clobbering.'
			},
			{
				command: 'rm <file>',
				description: 'Delete a file — permanently, no trash can',
				detail:
					'There is no undo and no recycle bin. Before deleting, ls the exact name you are about to remove; after, only backups or your editor’s local history can help.'
			},
			{
				command: 'rm -r <dir>',
				description: 'Delete a folder and everything inside it',
				detail:
					'Recursive and permanent. Slow down when you see -rf: -f silences every warning. Wrong folder + wildcard + rm -rf is the classic terminal disaster.'
			},
			{
				command: 'rmdir <dir>',
				description: 'Delete a directory only if it is empty',
				detail:
					'The cautious cousin of rm -r — it refuses if anything is inside, which makes it a safe way to clean up folder skeletons.'
			},
			{
				command: 'open .',
				description: 'Open the current folder in Finder (macOS)',
				detail:
					'Linux: xdg-open . — WSL: explorer.exe . (note the dot). Handy bridge back to the GUI.'
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
					'Best for short files. cat a huge or binary file and the screen floods — reach for less instead, and reset if the display garbles.'
			},
			{
				command: 'less <file>',
				description: 'Page through a big file comfortably',
				detail:
					'Space or arrows scroll, / searches forward, n repeats the search, q quits. man uses the same pager, so these keys work there too.'
			},
			{
				command: 'head <file>',
				description: 'Show the first 10 lines',
				detail: 'head -n 25 shows 25. Perfect for checking what kind of file you are dealing with.'
			},
			{
				command: 'tail <file>',
				description: 'Show the last 10 lines',
				detail:
					'The end of a log file is usually where the newest — and most interesting — entries are.'
			},
			{
				command: 'tail -f server.log',
				description: 'Follow a file live as new lines arrive',
				detail:
					'The standard way to watch a running server write its log. It never exits on its own — Ctrl+C stops watching.'
			},
			{
				command: 'wc -l <file>',
				description: 'Count the lines in a file',
				detail:
					'wc alone prints lines, words and bytes. Counting is the quickest sanity check that a pipeline or filter did what you expected.'
			},
			{
				command: 'file <file>',
				description: 'Ask what kind of file this is',
				detail:
					'Reads the contents, not the extension — it will tell you a “.txt” is really a PNG. Useful before you cat something questionable.'
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
					'The superpower. Small tools compose into big answers: history | grep ssh finds every ssh command you have ever run.'
			},
			{
				command: '<command> > out.txt',
				description: 'Redirect output into a file — OVERWRITES it',
				detail:
					'> truncates the file to zero before writing. If the file mattered, it is already gone — reach for >> when in doubt.'
			},
			{
				command: '<command> >> out.txt',
				description: 'Append output to the end of a file',
				detail:
					'Adds without destroying — the safe default for collecting results, building logs, or writing a script line by line with echo.'
			},
			{
				command: '<command> 2> errors.txt',
				description: 'Capture error output separately',
				detail:
					'Programs write normal output and errors to two different streams. 2> catches just the errors; 2>&1 merges them into one.'
			},
			{
				command: 'sort <file>',
				description: 'Sort lines alphabetically',
				detail:
					'sort -n sorts numerically (so 9 comes before 10), sort -r reverses. Sorting is also the required warm-up for uniq.'
			},
			{
				command: 'uniq -c',
				description: 'Collapse repeated adjacent lines and count them',
				detail:
					'Only removes duplicates that sit next to each other — which is why the recipe is always sort first, then uniq.'
			},
			{
				command: 'cut -d, -f1',
				description: 'Take one column from delimited text',
				detail:
					'-d sets the delimiter (a comma here), -f picks the field. cut -d: -f1 /etc/passwd lists every username.'
			},
			{
				command: 'sort | uniq -c | sort -rn',
				description: 'The classic frequency pipeline: count and rank',
				detail:
					'Sort to group, count the groups, sort the counts biggest-first. Top IPs in a log, most-used commands in history — same three steps every time.'
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
					'The single most useful text tool. Quote the pattern so spaces and special characters survive the trip to grep.'
			},
			{
				command: 'grep -i "<text>" <file>',
				description: 'Search ignoring upper/lower case',
				detail: 'ERROR, Error and error all match. Add -n to show line numbers with each hit.'
			},
			{
				command: 'grep -rn "<text>" .',
				description: 'Search every file under this folder, recursively',
				detail:
					'-r descends into subdirectories, -n prints file and line numbers — the terminal’s project-wide find-in-files.'
			},
			{
				command: 'grep -v "<text>"',
				description: 'Keep the lines that do NOT match',
				detail:
					'The filter-out flag: cat server.log | grep -v DEBUG hides the noise so the signal stands out.'
			},
			{
				command: 'grep -c "<text>" <file>',
				description: 'Count matching lines instead of printing them',
				detail: 'How many errors today? grep -c ERROR server.log answers with one number.'
			},
			{
				command: 'find . -name "*.md"',
				description: 'Find files by name pattern, anywhere below here',
				detail:
					'find searches file NAMES; grep searches file CONTENTS. Quote the pattern so the shell hands the wildcard to find instead of expanding it early.'
			},
			{
				command: 'find . -type d -name "node_modules"',
				description: 'Find directories by name',
				detail:
					'-type d matches directories only, -type f files only. Combine with -name for precise hunts.'
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
					'Read it as: s(ubstitute) / find this / replace with this / g = every match on the line. Prints the result — the file itself is untouched. Any delimiter works: s|/usr|/opt| saves escaping slashes.'
			},
			{
				command: "sed '/DEBUG/d' FILE",
				description: 'Drop every line matching a pattern',
				detail:
					'Addresses pick lines, d deletes them. Also by position: sed 3d (line 3), sed 2,5d (a range), sed $d (the last line).'
			},
			{
				command: "sed -n '40,55p' FILE",
				description: 'Print only lines 40–55',
				detail:
					'-n silences the default output, p prints the selected lines — the precision way to peek at the middle of a huge log. Regex addresses work too: sed -n /ERROR/p.'
			},
			{
				command: "sed -i.bak 's/old/new/g' FILE",
				description: 'Edit the file in place — keeping a .bak backup',
				detail:
					'The house rule: never bare -i. The suffix saves each original as file.bak first — instant diff, instant undo (mv file.bak file). When an agent proposes bare -i, amend it.'
			},
			{
				command: "awk '{print $2}' FILE",
				description: 'Print the second column of every line',
				detail:
					"Fields split on runs of spaces — perfect for ragged, column-aligned output. $0 is the whole line; commas join fields with a space: awk '{print $1, $3}'."
			},
			{
				command: "awk -F, '{print $2}' FILE",
				description: 'Same, but split on commas (CSV)',
				detail:
					'-F sets the field separator. For clean single-character delimiters cut -d, -f2 does the same job; awk wins when spacing is messy.'
			},
			{
				command: "awk '/error/ {print $1}' FILE",
				description: 'Pull a field from matching lines only',
				detail:
					'A /pattern/ guard filters which lines the action runs on — grep and column-pull in one step.'
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
					'PID is the number you pass to kill, %CPU shows what is working hard, COMMAND says what it is. It is plain text: pipe it through grep and awk to find what you need.'
			},
			{
				command: 'pgrep NAME',
				description: 'Print the PIDs of processes matching a name',
				detail:
					'The short way to do ps aux | grep NAME. Exits 1 with no output when nothing matches.'
			},
			{
				command: 'kill PID',
				description: 'Ask a process to stop (SIGTERM)',
				detail:
					'A polite request: the program can save, clean up and exit. It may also catch the signal and ignore it — then you escalate.'
			},
			{
				command: 'kill -9 PID',
				description: 'Force a process to stop (SIGKILL)',
				detail:
					'Cannot be caught or refused, and skips all cleanup — unsaved work is lost and lock files stay behind. Last resort, not first.'
			},
			{
				command: 'lsof -i :3000',
				description: 'Find what is holding a port',
				detail:
					'The fix for "EADDRINUSE: address already in use": this prints the squatter and its PID, then kill it and start yours. Silence means the port is free.'
			},
			{
				command: 'command &',
				description: 'Run it in the background, keep your prompt',
				detail:
					'The shell answers with [1] and a PID. jobs lists what is backstage, fg %1 brings job 1 forward, kill %1 stops it.'
			},
			{
				command: 'Ctrl+Z  then  bg',
				description: 'Pause the foreground job, resume it in the background',
				detail:
					'The rescue for when you started something long and forgot the &. Ctrl+Z hands your prompt back; bg keeps the job running backstage.'
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
					'The 10-character prefix decodes as type + rwx for user, group, other: -rwxr-xr-- means you can do anything, your group can read/run, others read only.'
			},
			{
				command: 'chmod +x <script>',
				description: 'Make a file executable',
				detail:
					'The fix for “Permission denied” when running your own script. After chmod +x, run it with ./script.sh.'
			},
			{
				command: 'chmod 755 <file>',
				description: 'Recipe: you rwx, everyone else read/run',
				detail:
					'The standard mode for scripts and directories. Each digit is one audience: user, group, other.'
			},
			{
				command: 'chmod 644 <file>',
				description: 'Recipe: you read/write, everyone else read-only',
				detail:
					'The standard mode for ordinary files — nobody can execute it, others cannot change it.'
			},
			{
				command: 'sudo <command>',
				description: 'Run one command as the administrator (root)',
				detail:
					'Respect it: sudo bypasses every safety rail. Never sudo a command you do not understand — especially one an AI wrote. Git Bash has no sudo; WSL does.'
			},
			{
				command: 'sudo !!',
				description: 'Re-run the previous command with sudo',
				detail:
					'!! expands to your last command — the classic move after “Permission denied” on something you meant to run as root.'
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
					'$NAME expands to the variable’s value before echo even runs. Try $USER, $SHELL, $PWD — the shell keeps its state in variables.'
			},
			{
				command: 'echo $PATH',
				description: 'The list of folders searched for commands',
				detail:
					'Colon-separated, checked left to right. “command not found” means the tool is not in any of these folders — or not installed at all.'
			},
			{
				command: 'which <command>',
				description: 'Print the full path of what would actually run',
				detail:
					'Answers “which python am I really running?” If which finds nothing, PATH is why your command is not found.'
			},
			{
				command: 'export VAR=value',
				description: 'Set a variable for this session and its children',
				detail:
					'Lasts until the terminal closes. To make it permanent, add the export line to ~/.bashrc or ~/.zshrc.'
			},
			{
				command: 'env',
				description: 'List every environment variable',
				detail:
					'The full picture of what programs inherit from your shell. Pipe it through grep to find one: env | grep PATH.'
			},
			{
				command: "alias gs='git status'",
				description: 'Create a shortcut command',
				detail:
					'Type gs, get git status. Aliases live only in this session until you add them to your shell config file.'
			},
			{
				command: 'source ~/.bashrc',
				description: 'Reload your shell config without reopening the terminal',
				detail:
					'Run it after editing your config so changes take effect now. zsh users (macOS default): source ~/.zshrc.'
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
					'Tells the system which interpreter runs the file. A script is just saved commands — everything you type interactively works inside one.'
			},
			{
				command: 'chmod +x script.sh',
				description: 'Make the script runnable',
				detail:
					'One-time step per script. Without it you get “Permission denied” even on a file you wrote yourself.'
			},
			{
				command: './script.sh',
				description: 'Run a script from the current directory',
				detail:
					'The ./ is required — the current directory is deliberately NOT on PATH, so you must point at the script explicitly.'
			},
			{
				command: 'bash script.sh',
				description: 'Run a script without the executable bit',
				detail:
					'Hands the file straight to bash, skipping chmod. Handy for quick tests of a script you just wrote.'
			},
			{
				command: 'echo "$1"',
				description: 'Use the first argument passed to your script',
				detail:
					'$1, $2, … hold the arguments; $@ is all of them. Quote them so arguments containing spaces stay whole.'
			},
			{
				command: 'echo $?',
				description: 'Exit code of the last command — 0 means success',
				detail:
					'Every command reports success (0) or failure (anything else) as it finishes. Scripts, && and || all make decisions from this number.'
			},
			{
				command: '<command> && <command>',
				description: 'Run the second only if the first SUCCEEDS',
				detail:
					'npm test && npm run deploy deploys only on green tests. Beware the classic horror: if cd fails, the next command runs in the wrong folder — && stops that.'
			},
			{
				command: '<command> || <command>',
				description: 'Run the second only if the first FAILS',
				detail:
					'The fallback operator: npm test || echo "tests failed" — the right-hand side is the plan B.'
			},
			{
				command: '<command> ; <command>',
				description: 'Run both, one after the other, regardless',
				detail:
					'No safety logic at all — the second runs even if the first exploded. Prefer && when the second step depends on the first.'
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
					'Typed a scary command? Just don’t press Enter — Ctrl+C throws the line away unrun. Nothing you type executes until you press Enter.'
			},
			{
				command: 'q',
				description: 'Quit a full-screen pager (less, man, git log)',
				detail:
					'A “frozen” terminal is very often just a pager waiting politely. If q does nothing, try Ctrl+C first, then q.'
			},
			{
				command: ':q!',
				description: 'Trapped in vim? Press Esc, then type :q! and Enter',
				detail:
					'Quits without saving. Some commands open vim as an editor without warning — this is the universal exit.'
			},
			{
				command: 'Ctrl+D',
				description: 'Close the shell (same as typing exit)',
				detail:
					'Sends “end of input”. If a program is waiting for input you did not intend to give, Ctrl+D on an empty line often releases it.'
			},
			{
				command: 'reset',
				description: 'Fix a garbled, glitchy terminal display',
				detail:
					'After cat-ing a binary file the screen can fill with junk — reset repaints everything. It takes a second; your session survives.'
			},
			{
				command: 'echo rm *.log',
				description: 'Preview what a wildcard will hit — before deleting',
				detail:
					'echo expands the glob harmlessly and shows the exact file list rm would receive. Make this reflex and rm loses most of its teeth.'
			},
			{
				command: 'rm',
				description: 'Deleted a file? There is no undo — but check your editor',
				detail:
					'rm skips the trash entirely. VS Code’s Timeline view keeps local history of files you edited, and if the project uses git, a committed file can be restored.'
			},
			{
				command: 'history',
				description: 'What did I actually run? Read the record',
				detail:
					'Numbered list of your recent commands — the first step of any post-incident investigation, and Ctrl+R searches it interactively.'
			}
		]
	}
];
