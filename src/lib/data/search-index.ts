import { cheatSheet } from './cheat-sheet';

export interface SearchEntry {
	/** Unique key for list rendering */
	id: string;
	/** DOM id to scroll to when selected */
	sectionId: string;
	/** Primary shell command, when this entry is command-focused */
	command?: string;
	title: string;
	part: string;
	description: string;
	keywords: string[];
	kind: 'command' | 'topic';
}

function resolveSectionId(command: string, category: string): string {
	const cmd = command.toLowerCase();
	// Strip <placeholders> and quoted strings so their characters (<, >, *, |)
	// never masquerade as redirections, globs, or pipes.
	const bare = cmd
		.replace(/<[^>]+>/g, ' ')
		.replace(/"[^"]*"/g, ' ')
		.replace(/'[^']*'/g, ' ');
	const first = bare.trim().split(/\s+/)[0] ?? '';

	// Panic-row keys and history tricks first — they contain words that would
	// otherwise match broader rules below.
	if (cmd.includes('!!') || first === 'history') return 'section-7-2';
	if (first === 'ctrl+c' || first === 'ctrl+d' || first === 'ctrl+l' || first === 'reset')
		return 'section-1-2';
	if (first === 'q' || first === ':q!') return 'section-1-3';

	if (first === 'sudo') return 'section-5-3';
	if (cmd.includes('chmod')) return 'section-5-2';

	if (first === 'find') return 'section-4-5';
	if (cmd.includes('grep')) return 'section-4-3';
	if (first === 'sort' || first === 'uniq' || first === 'wc' || first === 'cut')
		return 'section-4-4';
	if (cmd.includes('&&') || cmd.includes('||') || cmd.includes('$?') || bare.includes(';'))
		return 'section-6-3';
	if (bare.includes('|')) return 'section-4-2';
	if (bare.includes('>') || / < /.test(bare)) return 'section-4-1';
	if (cmd.startsWith('#!') || cmd.startsWith('./') || first === 'bash' || cmd.includes('$1'))
		return 'section-6-2';

	if (
		cmd.includes('alias') ||
		first === 'source' ||
		cmd.includes('.bashrc') ||
		cmd.includes('.zshrc')
	)
		return 'section-5-5';
	if (
		first === 'export' ||
		first === 'which' ||
		first === 'env' ||
		cmd.includes('$path') ||
		cmd.includes('$home')
	)
		return 'section-5-4';
	if (cmd === 'ls -l') return 'section-5-1';

	if (first === 'cd') return 'section-2-3';
	if (first === 'pwd' || first === 'ls') return 'section-2-1';
	if (first === 'mkdir' || first === 'touch') return 'section-2-4';
	if (
		first === 'cat' ||
		first === 'less' ||
		first === 'more' ||
		first === 'head' ||
		first === 'tail' ||
		first === 'file'
	)
		return 'section-2-5';

	if (first === 'cp') return 'section-3-1';
	if (first === 'mv') return 'section-3-2';
	if (first === 'rm' || first === 'rmdir') return 'section-3-3';
	if (bare.includes('*') || bare.includes('?')) return 'section-3-4';

	if (first === 'man' || cmd.includes('--help') || cmd.includes('tldr')) return 'section-1-3';
	if (first === 'whoami' || first === 'echo' || first === 'date' || first === 'clear')
		return 'section-1-2';
	if (first === 'open' || cmd.includes('xdg-open') || cmd.includes('explorer.exe'))
		return 'section-2-4';

	const categoryFallback: Record<string, string> = {
		Orientation: 'section-1-2',
		Navigation: 'section-2-3',
		'Files & Folders': 'section-2-4',
		'Viewing Files': 'section-2-5',
		'Text & Pipes': 'section-4-2',
		Searching: 'section-4-3',
		Permissions: 'section-5-1',
		Environment: 'section-5-4',
		Scripting: 'section-6-2',
		'Panic Button': 'section-1-3'
	};

	return categoryFallback[category] ?? 'section-9-2';
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function buildCommandEntries(): SearchEntry[] {
	const entries: SearchEntry[] = [];

	for (const category of cheatSheet) {
		for (const cmd of category.commands) {
			const sectionId = resolveSectionId(cmd.command, category.label);
			const baseCommand = cmd.command.split('<')[0].trim();

			entries.push({
				id: `${sectionId}-${slugify(cmd.command)}-${slugify(cmd.description)}`,
				sectionId,
				command: cmd.command,
				title: baseCommand || cmd.command,
				part: category.label,
				description: cmd.description,
				keywords: [
					baseCommand,
					cmd.command,
					cmd.description,
					category.label.toLowerCase(),
					...baseCommand.replace(/"/g, '').split(/\s+/)
				],
				kind: 'command'
			});
		}
	}

	return entries;
}

/** Concept / section / playground searches that are not a single cheat-sheet row */
const topicEntries: SearchEntry[] = [
	// ───── Introduction ─────
	{
		id: 'topic-hero',
		sectionId: 'hero',
		title: 'TerminalVibes — start here',
		part: 'Introduction',
		description: 'The Terminal for Vibe Coders — start the course from the top.',
		keywords: ['start', 'home', 'beginning', 'intro', 'top', 'course', 'terminalvibes'],
		kind: 'topic'
	},
	{
		id: 'topic-what-is-terminal',
		sectionId: 'section-intro-what',
		title: 'What Is the Terminal?',
		part: 'Introduction',
		description: 'Terminal vs shell vs console — and why AI coding makes it more relevant.',
		keywords: [
			'terminal',
			'shell',
			'console',
			'command line',
			'cli',
			'what is bash',
			'what is the terminal',
			'terminal vs shell',
			'why terminal',
			'text interface',
			'terminal-bench',
			'tbench',
			'ai agent benchmark'
		],
		kind: 'topic'
	},
	{
		id: 'topic-history',
		sectionId: 'section-intro-history',
		title: 'A Brief History of the Terminal',
		part: 'Introduction',
		description: 'Unix 1969, Thompson & Ritchie, the Bourne shell, bash, and zsh.',
		keywords: [
			'history',
			'unix',
			'1969',
			'ken thompson',
			'dennis ritchie',
			'bell labs',
			'bourne shell',
			'bash history',
			'zsh',
			'who created unix'
		],
		kind: 'topic'
	},
	{
		id: 'topic-your-machine',
		sectionId: 'section-intro-shells',
		title: "Your Machine's Terminal",
		part: 'Introduction',
		description: 'macOS Terminal & zsh, Linux distros, and Windows via WSL or Git Bash.',
		keywords: [
			'macos',
			'terminal.app',
			'iterm',
			'iterm2',
			'linux',
			'ubuntu',
			'windows',
			'wsl',
			'git bash',
			'windows terminal',
			'powershell',
			'cmd',
			'which shell am i using',
			'zsh vs bash'
		],
		kind: 'topic'
	},
	{
		id: 'topic-prompt-anatomy',
		sectionId: 'section-intro-anatomy',
		title: 'Anatomy of a Prompt',
		part: 'Introduction',
		description: 'user@host:~/projects$ decoded — the cursor, Enter, and the up arrow.',
		keywords: [
			'prompt',
			'dollar sign',
			'$',
			'user@host',
			'tilde',
			'cursor',
			'where do i type',
			'blinking',
			'anatomy'
		],
		kind: 'topic'
	},
	// ───── Part 1: First Contact ─────
	{
		id: 'topic-opening-terminal',
		sectionId: 'section-1-1',
		title: 'Opening Your Terminal',
		part: 'First Contact',
		description: 'Launch the terminal on macOS, Linux, or Windows — it is just an app.',
		keywords: [
			'open terminal',
			'launch terminal',
			'start terminal',
			'spotlight',
			'ctrl+alt+t',
			'how do i open',
			'find terminal',
			'terminal app'
		],
		kind: 'topic'
	},
	{
		id: 'topic-first-commands',
		sectionId: 'section-1-2',
		title: 'Your First Commands',
		part: 'First Contact',
		description: 'whoami, echo, date, clear — nothing here can break anything.',
		keywords: [
			'first command',
			'whoami',
			'echo',
			'date',
			'clear',
			'hello world',
			'safe commands',
			'getting started',
			'is it safe'
		],
		kind: 'topic'
	},
	{
		id: 'topic-getting-help',
		sectionId: 'section-1-3',
		title: 'Getting Help',
		part: 'First Contact',
		description: '--help, man pages, tldr — and q to escape the pager.',
		keywords: [
			'help',
			'man page',
			'manual',
			'--help',
			'tldr',
			'documentation',
			'what does this command do',
			'pager',
			'q to quit',
			'stuck in man'
		],
		kind: 'topic'
	},
	// ───── Part 2: Moving Around ─────
	{
		id: 'topic-where-am-i',
		sectionId: 'section-2-1',
		title: 'Where Am I?',
		part: 'Moving Around',
		description: 'pwd and ls — your position and your surroundings, always on tap.',
		keywords: [
			'where am i',
			'pwd',
			'current directory',
			'list files',
			'ls',
			'hidden files',
			'dotfiles',
			'show hidden',
			'working directory'
		],
		kind: 'topic'
	},
	{
		id: 'topic-paths',
		sectionId: 'section-2-2',
		title: 'Paths',
		part: 'Moving Around',
		description: 'Absolute vs relative, /, ~, . and .. — plus TAB completion.',
		keywords: [
			'path',
			'absolute path',
			'relative path',
			'tilde',
			'home directory',
			'dot dot',
			'..',
			'tab completion',
			'autocomplete',
			'slash',
			'root'
		],
		kind: 'topic'
	},
	{
		id: 'topic-changing-directories',
		sectionId: 'section-2-3',
		title: 'Changing Directories',
		part: 'Moving Around',
		description: 'cd, cd .., cd ~, and cd - — moving through the filesystem.',
		keywords: [
			'cd',
			'change directory',
			'go back',
			'go up',
			'previous directory',
			'navigate',
			'move around',
			'go home'
		],
		kind: 'topic'
	},
	{
		id: 'topic-making-things',
		sectionId: 'section-2-4',
		title: 'Making Things',
		part: 'Moving Around',
		description: 'mkdir, mkdir -p, and touch — creating folders and files.',
		keywords: [
			'mkdir',
			'touch',
			'create folder',
			'create file',
			'new directory',
			'new file',
			'make directory',
			'nested folders',
			'project skeleton'
		],
		kind: 'topic'
	},
	{
		id: 'topic-looking-inside',
		sectionId: 'section-2-5',
		title: 'Looking Inside Files',
		part: 'Moving Around',
		description: 'cat, less, head, tail — reading files without opening an editor.',
		keywords: [
			'cat',
			'less',
			'head',
			'tail',
			'view file',
			'read file',
			'print file',
			'see contents',
			'watch log',
			'follow log',
			'tail -f'
		],
		kind: 'topic'
	},
	// ───── Part 3: Copy, Move, Delete ─────
	{
		id: 'topic-copying',
		sectionId: 'section-3-1',
		title: 'Copying',
		part: 'Copy, Move, Delete',
		description: 'cp and cp -r — duplicating files and whole folders.',
		keywords: [
			'cp',
			'copy',
			'copy file',
			'copy folder',
			'duplicate',
			'backup a file',
			'recursive copy'
		],
		kind: 'topic'
	},
	{
		id: 'topic-moving-renaming',
		sectionId: 'section-3-2',
		title: 'Moving & Renaming',
		part: 'Copy, Move, Delete',
		description: 'mv does both — and silently overwrites unless you ask it not to.',
		keywords: ['mv', 'move', 'rename', 'rename file', 'move file', 'overwrite', 'mv -i'],
		kind: 'topic'
	},
	{
		id: 'topic-deleting',
		sectionId: 'section-3-3',
		title: 'Deleting (Carefully)',
		part: 'Copy, Move, Delete',
		description: 'rm has NO trash can — the safety lesson, including rm -rf.',
		keywords: [
			'rm',
			'delete',
			'remove',
			'rm -rf',
			'what does rm -rf do',
			'no trash',
			'recycle bin',
			'permanently deleted',
			'rmdir',
			'delete folder',
			'dangerous'
		],
		kind: 'topic'
	},
	{
		id: 'topic-wildcards',
		sectionId: 'section-3-4',
		title: 'Wildcards',
		part: 'Copy, Move, Delete',
		description: '*, ? and [abc] globs — and the "echo the glob first" habit.',
		keywords: [
			'wildcard',
			'glob',
			'asterisk',
			'star',
			'*.txt',
			'question mark',
			'pattern',
			'match files',
			'select files',
			'expansion'
		],
		kind: 'topic'
	},
	// ───── Part 4: Text & Pipes ─────
	{
		id: 'topic-redirection',
		sectionId: 'section-4-1',
		title: 'Redirection',
		part: 'Text & Pipes',
		description: '>, >>, 2> and < — sending output to files (and > truncates!).',
		keywords: [
			'redirect',
			'redirection',
			'output to file',
			'save output',
			'append',
			'overwrite file',
			'stderr',
			'stdout',
			'truncate',
			'2>'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pipes',
		sectionId: 'section-4-2',
		title: 'Pipes',
		part: 'Text & Pipes',
		description: 'The | operator — small tools composed into big answers.',
		keywords: [
			'pipe',
			'pipes',
			'|',
			'chain commands',
			'combine commands',
			'unix philosophy',
			'compose',
			'pipeline'
		],
		kind: 'topic'
	},
	{
		id: 'topic-grep',
		sectionId: 'section-4-3',
		title: 'Searching Text with grep',
		part: 'Text & Pipes',
		description: 'grep -i -n -r -v -c — find lines in logs and code.',
		keywords: [
			'grep',
			'search text',
			'find text',
			'search in files',
			'find in files',
			'filter lines',
			'search logs',
			'case insensitive',
			'recursive search',
			'match'
		],
		kind: 'topic'
	},
	{
		id: 'topic-counting-shaping',
		sectionId: 'section-4-4',
		title: 'Counting & Shaping',
		part: 'Text & Pipes',
		description: 'wc, sort, uniq, cut — and the sort | uniq -c | sort -rn recipe.',
		keywords: [
			'wc',
			'sort',
			'uniq',
			'cut',
			'count lines',
			'count words',
			'duplicates',
			'frequency',
			'columns',
			'csv',
			'top values'
		],
		kind: 'topic'
	},
	{
		id: 'topic-finding-files',
		sectionId: 'section-4-5',
		title: 'Finding Files',
		part: 'Text & Pipes',
		description: 'find . -name -type — search file names; grep searches contents.',
		keywords: [
			'find',
			'find files',
			'locate file',
			'search by name',
			'find by extension',
			'find directory',
			'find vs grep',
			'where is my file'
		],
		kind: 'topic'
	},
	// ───── Part 5: Permissions & Environment ─────
	{
		id: 'topic-ls-l',
		sectionId: 'section-5-1',
		title: 'Reading ls -l',
		part: 'Permissions & Environment',
		description: 'The 10-character permission string decoded: rwx for user, group, other.',
		keywords: [
			'ls -l',
			'permissions',
			'rwx',
			'file mode',
			'owner',
			'group',
			'long listing',
			'drwxr-xr-x',
			'read write execute'
		],
		kind: 'topic'
	},
	{
		id: 'topic-chmod',
		sectionId: 'section-5-2',
		title: 'chmod',
		part: 'Permissions & Environment',
		description: 'chmod +x to run a script; 755 and 644 as recipes.',
		keywords: [
			'chmod',
			'permission denied',
			'make executable',
			'executable',
			'+x',
			'755',
			'644',
			'cannot execute',
			'change permissions',
			'octal'
		],
		kind: 'topic'
	},
	{
		id: 'topic-sudo',
		sectionId: 'section-5-3',
		title: 'sudo',
		part: 'Permissions & Environment',
		description: 'Run as administrator — with respect, and never blindly.',
		keywords: [
			'sudo',
			'root',
			'admin',
			'administrator',
			'superuser',
			'operation not permitted',
			'run as root',
			'password prompt',
			'privileges',
			'windows sudo',
			'sudo on windows',
			'enable sudo'
		],
		kind: 'topic'
	},
	{
		id: 'topic-env-vars',
		sectionId: 'section-5-4',
		title: 'Environment Variables',
		part: 'Permissions & Environment',
		description: '$HOME, export, PATH — and "command not found" demystified.',
		keywords: [
			'environment variable',
			'env var',
			'$home',
			'$path',
			'path',
			'export',
			'which',
			'command not found',
			'not recognized',
			'variable',
			'shell variable'
		],
		kind: 'topic'
	},
	{
		id: 'topic-shell-config',
		sectionId: 'section-5-5',
		title: 'Your Shell Config',
		part: 'Permissions & Environment',
		description: '.bashrc / .zshrc, alias, and source — make the shell your own.',
		keywords: [
			'bashrc',
			'zshrc',
			'shell config',
			'alias',
			'source',
			'dotfile',
			'dotfiles',
			'startup file',
			'profile',
			'customize shell'
		],
		kind: 'topic'
	},
	// ───── Part 6: Terminal for the AI Era ─────
	{
		id: 'topic-read-before-run',
		sectionId: 'section-6-1',
		title: 'Read Before You Run',
		part: 'Terminal for the AI Era',
		description: 'Audit AI-suggested commands: identify the command, flags, and targets first.',
		keywords: [
			'ai command',
			'audit',
			'is this command safe',
			'scary command',
			'dangerous command',
			'dry run',
			'--dry-run',
			'explainshell',
			'verify command',
			'copilot suggested',
			'agent wants to run',
			'curl | bash'
		],
		kind: 'topic'
	},
	{
		id: 'topic-prompt-injection',
		sectionId: 'section-6-1',
		title: 'Prompt injection',
		part: 'Terminal for the AI Era',
		description:
			'Text an agent reads can steer the commands it proposes — audit even commands you never asked for.',
		keywords: [
			'prompt injection',
			'indirect prompt injection',
			'injection',
			'tricked agent',
			'malicious readme',
			'poisoned instructions',
			'agent was tricked',
			'commands the agent was tricked into'
		],
		kind: 'topic'
	},
	{
		id: 'topic-permission-prompt',
		sectionId: 'section-6-1',
		title: 'The agent permission prompt',
		part: 'Terminal for the AI Era',
		description:
			'"Allow this command?" is the modern read-before-you-run — what to do in the seconds it is on screen.',
		keywords: [
			'permission prompt',
			'allow this command',
			'approve command',
			'should i approve',
			'should i allow',
			'agent asks permission',
			'yolo approve',
			'auto approve',
			'sandboxing',
			'sandbox'
		],
		kind: 'topic'
	},
	{
		id: 'topic-coding-agents-cli',
		sectionId: 'section-6-1',
		title: 'Terminal coding agents (Claude Code, Codex CLI)',
		part: 'Terminal for the AI Era',
		description:
			'Claude Code, Codex CLI and friends live in the terminal — install them, then audit what they propose.',
		keywords: [
			'claude code',
			'codex cli',
			'codex',
			'install claude code',
			'coding agent',
			'terminal agent',
			'cli agent',
			'goose',
			'amp',
			'agent cli'
		],
		kind: 'topic'
	},
	{
		id: 'topic-curl-bash',
		sectionId: 'section-6-1',
		title: 'curl | bash — run code straight off the internet',
		part: 'Terminal for the AI Era',
		description:
			'Now an official install method for trusted vendors — the rule is about the source, and the two-step version always exists.',
		keywords: [
			'curl | bash',
			'curl bash',
			'curl pipe bash',
			'pipe to shell',
			'install script',
			'install.sh',
			'one-line install',
			'is curl bash safe'
		],
		kind: 'topic'
	},
	{
		id: 'topic-first-script',
		sectionId: 'section-6-2',
		title: 'Your First Script',
		part: 'Terminal for the AI Era',
		description: 'Shebang, chmod +x, ./ — scripts are saved commands.',
		keywords: [
			'script',
			'bash script',
			'shell script',
			'shebang',
			'#!/bin/bash',
			'#!/usr/bin/env bash',
			'./script.sh',
			'.sh file',
			'automate',
			'arguments',
			'$1'
		],
		kind: 'topic'
	},
	{
		id: 'topic-exit-codes',
		sectionId: 'section-6-3',
		title: 'Exit Codes & Chaining',
		part: 'Terminal for the AI Era',
		description: '$?, && and || — 0 means success, and chains make decisions.',
		keywords: [
			'exit code',
			'$?',
			'&&',
			'||',
			'chaining',
			'and or',
			'run if succeeds',
			'return code',
			'status code',
			'semicolon'
		],
		kind: 'topic'
	},
	// ───── Part 7: Your Cockpit ─────
	{
		id: 'tool-prompt-designer',
		sectionId: 'prompt-designer',
		title: 'Design Your Prompt (Starship)',
		part: 'Your Cockpit',
		description:
			'Interactive prompt designer: pick a theme, customize modules, and download a real starship.toml for your shell.',
		keywords: [
			'starship',
			'prompt',
			'designer',
			'design your prompt',
			'theme',
			'powerline',
			'tokyo night',
			'gruvbox',
			'catppuccin',
			'nerd font',
			'customize prompt',
			'starship.toml',
			'ps1'
		],
		kind: 'topic'
	},
	{
		id: 'topic-make-it-yours',
		sectionId: 'section-7-1',
		title: 'Make It Yours',
		part: 'Your Cockpit',
		description: 'Themes, fonts, and prompt customization — PS1 and starship.',
		keywords: [
			'theme',
			'colors',
			'font',
			'customize',
			'appearance',
			'prompt customization',
			'ps1',
			'starship',
			'profiles',
			'pretty terminal'
		],
		kind: 'topic'
	},
	{
		id: 'topic-terminal-apps',
		sectionId: 'section-7-1',
		title: 'Terminal apps: Ghostty, iTerm2, Warp, Windows Terminal',
		part: 'Your Cockpit',
		description:
			'The refreshed stock Terminal.app, iTerm2, the fast minimal Ghostty, the AI-first Warp — same shell inside every window.',
		keywords: [
			'ghostty',
			'iterm',
			'iterm2',
			'warp',
			'windows terminal',
			'terminal.app',
			'tahoe',
			'terminal emulator',
			'which terminal app',
			'best terminal',
			'starship prompt'
		],
		kind: 'topic'
	},
	{
		id: 'topic-history-superpowers',
		sectionId: 'section-7-2',
		title: 'History Superpowers',
		part: 'Your Cockpit',
		description: 'Up arrow, history, !!, sudo !!, and Ctrl+R reverse search.',
		keywords: [
			'history',
			'up arrow',
			'ctrl+r',
			'reverse search',
			'!!',
			'sudo !!',
			'previous command',
			'repeat command',
			'last command',
			'rerun'
		],
		kind: 'topic'
	},
	{
		id: 'topic-vscode-terminal',
		sectionId: 'section-7-3',
		title: 'Terminal in VS Code',
		part: 'Your Cockpit',
		description: 'The integrated terminal — where vibe coders live.',
		keywords: [
			'vscode',
			'vs code',
			'integrated terminal',
			'editor terminal',
			'ctrl+`',
			'backtick',
			'panel',
			'ide terminal',
			'cursor editor'
		],
		kind: 'topic'
	},
	{
		id: 'topic-agent-allowlist',
		sectionId: 'section-7-3',
		title: 'VS Code agent allowlist & denylist',
		part: 'Your Cockpit',
		description:
			'Copilot agent mode runs commands with per-command approval — allowlist the safe ones, always stop the risky ones.',
		keywords: [
			'allowlist',
			'allow list',
			'denylist',
			'deny list',
			'agent mode',
			'copilot agent',
			'auto approve commands',
			'per-command approval',
			'vscode agent',
			'claude code extension'
		],
		kind: 'topic'
	},
	{
		id: 'topic-many-terminals',
		sectionId: 'section-7-4',
		title: 'Many Terminals at Once',
		part: 'Your Cockpit',
		description: 'Tabs, splits, and a one-line introduction to tmux.',
		keywords: [
			'tabs',
			'splits',
			'split terminal',
			'panes',
			'multiple terminals',
			'tmux',
			'sessions',
			'two terminals'
		],
		kind: 'topic'
	},
	{
		id: 'topic-parallel-agents',
		sectionId: 'section-7-4',
		title: 'Parallel AI agents in split panes',
		part: 'Your Cockpit',
		description:
			'One agent per pane, each on its own git worktree — an agent-fleet dashboard, with tmux or Zellij keeping sessions alive.',
		keywords: [
			'parallel agents',
			'multiple agents',
			'agent fleet',
			'worktree',
			'worktrees',
			'one agent per pane',
			'tmux',
			'zellij',
			'multiplexer',
			'session survives'
		],
		kind: 'topic'
	},
	// ───── Part 8: Under the Hood ─────
	{
		id: 'topic-under-the-hood',
		sectionId: 'section-8-1',
		title: 'How the Terminal Works',
		part: 'Under the Hood',
		description: 'TTYs, the PTY pair, and the line discipline — how the terminal actually works.',
		keywords: [
			'under the hood',
			'how does the terminal work',
			'how terminal works',
			'tty',
			'teletype',
			'pty',
			'pseudo-terminal',
			'pseudoterminal',
			'terminal emulator',
			'line discipline',
			'raw mode',
			'cooked mode',
			'canonical mode',
			'stty',
			'internals'
		],
		kind: 'topic'
	},
	{
		id: 'topic-escape-sequences',
		sectionId: 'section-8-1',
		title: 'Escape sequences & ANSI colors',
		part: 'Under the Hood',
		description: 'Colors and cursor movement are in-band bytes — \\e[32m turns the text green.',
		keywords: [
			'escape sequence',
			'escape sequences',
			'ansi',
			'ansi colors',
			'terminal colors',
			'colored output',
			'\\e[32m',
			'esc',
			'^[[a',
			'arrow keys print characters',
			'weird characters',
			'cursor movement',
			'vt100',
			'garbled terminal'
		],
		kind: 'topic'
	},
	{
		id: 'topic-ctrl-c-sigint',
		sectionId: 'section-8-1',
		title: 'What Ctrl+C really does',
		part: 'Under the Hood',
		description: 'The tty driver turns Ctrl+C into SIGINT — a kernel signal, not input.',
		keywords: [
			'ctrl+c',
			'ctrl c',
			'sigint',
			'signal',
			'signals',
			'interrupt',
			'what does ctrl+c do',
			'how does ctrl+c work',
			'stop a running command',
			'kill a program'
		],
		kind: 'topic'
	},
	{
		id: 'topic-shell-integration',
		sectionId: 'section-8-2',
		title: 'Shell integration: OSC 133 & OSC 633',
		part: 'Under the Hood',
		description:
			'Invisible markers in the byte stream tell terminals — and agents — where commands start, end, and how they exited.',
		keywords: [
			'osc 133',
			'osc 633',
			'shell integration',
			'finalterm',
			'command markers',
			'prompt markers',
			'success dot',
			'failure dot',
			'command navigation',
			'sticky scroll',
			'exit code marker'
		],
		kind: 'topic'
	},
	{
		id: 'topic-agent-terminals',
		sectionId: 'section-8-2',
		title: 'Agent-aware terminals: Warp, cmux, libghostty',
		part: 'Under the Hood',
		description:
			'The 2026 landscape — classic emulators compete on speed while a new generation is built around AI agents.',
		keywords: [
			'agent terminal',
			'agentic terminal',
			'warp',
			'agentic development environment',
			'cmux',
			'libghostty',
			'ghostty',
			'unix socket',
			'agent fleet',
			'terminal evolving',
			'future of the terminal'
		],
		kind: 'topic'
	},
	{
		id: 'topic-agent-pipelines',
		sectionId: 'section-8-2',
		title: 'The agent as a shell command (claude -p)',
		part: 'Under the Hood',
		description:
			'Headless agent CLIs read stdin, write stdout, and set exit codes — pipe intelligence like any Unix tool.',
		keywords: [
			'claude -p',
			'print mode',
			'headless agent',
			'pipe to claude',
			'agent in a pipeline',
			'output-format json',
			'jq',
			'ai pipeline',
			'compose ai',
			'agent cli pipeline'
		],
		kind: 'topic'
	},
	{
		id: 'topic-robust-scripts',
		sectionId: 'section-8-2',
		title: 'Robust bash scripts: set -euo pipefail & trap',
		part: 'Under the Hood',
		description:
			'The grown-up script preamble — strict mode, cleanup traps, and mktemp scratch dirs.',
		keywords: [
			'set -euo pipefail',
			'set -e',
			'pipefail',
			'strict mode',
			'trap',
			'trap exit',
			'cleanup trap',
			'mktemp',
			'temp directory',
			'robust script',
			'while read loop',
			'production bash'
		],
		kind: 'topic'
	},
	// ───── Part 9: Conclusion ─────
	{
		id: 'topic-mindset',
		sectionId: 'section-9-1',
		title: 'The Command-Line Mindset',
		part: 'Conclusion',
		description: 'Compose small tools, read before running — the AI-native interface.',
		keywords: [
			'mindset',
			'philosophy',
			'small tools',
			'compose',
			'unix way',
			'ai native',
			'summary',
			'principles'
		],
		kind: 'topic'
	},
	{
		id: 'topic-quick-reference',
		sectionId: 'section-9-2',
		title: 'Quick Reference',
		part: 'Conclusion',
		description: 'The dense every-command table — the whole course at a glance.',
		keywords: [
			'quick reference',
			'reference',
			'cheat sheet',
			'all commands',
			'command list',
			'table',
			'summary card'
		],
		kind: 'topic'
	},
	{
		id: 'topic-final-challenge',
		sectionId: 'section-9-3',
		title: 'The Final Challenge',
		part: 'Conclusion',
		description: 'One messy home folder — the capstone that proves you can do it.',
		keywords: [
			'final challenge',
			'capstone',
			'exam',
			'test yourself',
			'quiz',
			'challenge',
			'final exercise'
		],
		kind: 'topic'
	},
	{
		id: 'topic-keep-learning',
		sectionId: 'section-9-4',
		title: 'Keep Learning',
		part: 'Conclusion',
		description: 'The Linux Command Line, OverTheWire Bandit, explainshell, tldr.',
		keywords: [
			'keep learning',
			'resources',
			'books',
			'linux command line book',
			'overthewire',
			'bandit',
			'explainshell',
			'tldr pages',
			'next steps',
			'more practice'
		],
		kind: 'topic'
	},
	// ───── Playground exercises ─────
	{
		id: 'topic-pg-first-steps',
		sectionId: 'first-steps',
		title: 'Playground: Say Hello to the Machine',
		part: 'First Contact',
		description: 'Try echo, whoami, pwd, and date in the sandbox terminal.',
		keywords: [
			'playground',
			'practice',
			'sandbox',
			'first steps',
			'try it',
			'hello',
			'interactive'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-navigation',
		sectionId: 'navigation',
		title: 'Playground: Find the Lost API Key',
		part: 'Moving Around',
		description: 'A treasure hunt through nested directories with cd and ls.',
		keywords: [
			'playground',
			'practice',
			'navigation',
			'treasure hunt',
			'api key',
			'cd practice',
			'explore'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-workspace-setup',
		sectionId: 'workspace-setup',
		title: 'Playground: Build Your Workspace',
		part: 'Moving Around',
		description: 'Build a project skeleton with mkdir -p and touch.',
		keywords: [
			'playground',
			'practice',
			'workspace',
			'skeleton',
			'mkdir practice',
			'setup project'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-tidy-up',
		sectionId: 'tidy-up',
		title: 'Playground: Clean the Downloads Mess',
		part: 'Copy, Move, Delete',
		description: 'Inspect, sort into folders with mv, and delete the junk.',
		keywords: [
			'playground',
			'practice',
			'tidy',
			'clean up',
			'downloads',
			'organize files',
			'mv practice'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-glob-practice',
		sectionId: 'glob-practice',
		title: 'Playground: Select the Right Files',
		part: 'Copy, Move, Delete',
		description: 'Target exactly the right files with * ? and [abc] globs.',
		keywords: ['playground', 'practice', 'glob', 'wildcard practice', 'select files', 'patterns'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-log-detective',
		sectionId: 'log-detective',
		title: 'Playground: Find the Crash',
		part: 'Text & Pipes',
		description: 'Hunt through server.log with grep and pipes.',
		keywords: [
			'playground',
			'practice',
			'log detective',
			'crash',
			'server.log',
			'grep practice',
			'debug log'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-pipeline-practice',
		sectionId: 'pipeline-practice',
		title: 'Playground: Build a Pipeline',
		part: 'Text & Pipes',
		description: 'Rank the top visitors in access.log with sort, uniq, and cut.',
		keywords: [
			'playground',
			'practice',
			'pipeline',
			'access.log',
			'top visitors',
			'sort uniq practice'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-find-files',
		sectionId: 'find-files',
		title: 'Playground: Hunt Down Every TODO',
		part: 'Text & Pipes',
		description: 'Combine find and grep to sweep a whole project.',
		keywords: ['playground', 'practice', 'find files', 'todo', 'find and grep', 'sweep project'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-fix-permissions',
		sectionId: 'fix-permissions',
		title: "Playground: The Script Won't Run",
		part: 'Permissions & Environment',
		description: 'Diagnose "Permission denied" and fix it with chmod +x.',
		keywords: [
			'playground',
			'practice',
			'permission denied exercise',
			'chmod practice',
			'script wont run'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-path-repair',
		sectionId: 'path-repair',
		title: 'Playground: command not found',
		part: 'Permissions & Environment',
		description: 'Inspect PATH, find the missing tool, and run it anyway.',
		keywords: [
			'playground',
			'practice',
			'path repair',
			'command not found exercise',
			'path practice'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-alias-workshop',
		sectionId: 'alias-workshop',
		title: 'Playground: Make Your Shortcuts',
		part: 'Permissions & Environment',
		description: 'Create your own aliases and use them.',
		keywords: ['playground', 'practice', 'alias workshop', 'shortcuts', 'alias practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-audit-the-agent',
		sectionId: 'audit-the-agent',
		title: 'Playground: Audit the Agent',
		part: 'Terminal for the AI Era',
		description: 'Three AI-proposed commands — defuse the dangerous one, run the rest.',
		keywords: ['playground', 'practice', 'audit', 'agent commands', 'ai safety exercise', 'defuse'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-first-script',
		sectionId: 'first-script',
		title: 'Playground: Automate the Backup',
		part: 'Terminal for the AI Era',
		description: 'Build a backup script with echo >>, chmod +x, and run it.',
		keywords: ['playground', 'practice', 'first script', 'backup script', 'automation exercise'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-exit-codes',
		sectionId: 'exit-codes',
		title: 'Playground: Deploy Only on Green',
		part: 'Terminal for the AI Era',
		description: 'Wire up && and || so deploys only happen when tests pass.',
		keywords: [
			'playground',
			'practice',
			'exit codes exercise',
			'deploy',
			'green tests',
			'and or practice'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-capstone',
		sectionId: 'capstone',
		title: 'Playground: One Messy Home Folder',
		part: 'Conclusion',
		description: 'Navigate, organize, grep, and script — everything combined.',
		keywords: [
			'playground',
			'practice',
			'capstone',
			'messy home folder',
			'final exercise',
			'everything'
		],
		kind: 'topic'
	},
	// ───── Panic queries ─────
	{
		id: 'topic-panic-deleted',
		sectionId: 'section-3-3',
		title: 'I deleted a file!',
		part: 'Panic',
		description: 'rm has no trash can — but your editor history or git may save you.',
		keywords: [
			'deleted a file',
			'accidentally deleted',
			'undo delete',
			'undelete',
			'recover file',
			'restore file',
			'undo',
			'oops',
			'i messed up',
			'trash',
			'get file back'
		],
		kind: 'topic'
	},
	{
		id: 'topic-panic-frozen',
		sectionId: 'section-1-3',
		title: 'My terminal is frozen',
		part: 'Panic',
		description: 'Usually a pager or a waiting program — q, Ctrl+C, or Esc :q! for vim.',
		keywords: [
			'frozen terminal',
			'terminal frozen',
			'stuck',
			'hanging',
			'not responding',
			'cant type',
			'quit vim',
			'exit vim',
			'trapped in vim',
			'how do i quit',
			'escape'
		],
		kind: 'topic'
	},
	{
		id: 'topic-panic-not-found',
		sectionId: 'section-5-4',
		title: 'command not found',
		part: 'Panic',
		description: 'The tool is not on your PATH — or not installed. Here is how to tell.',
		keywords: [
			'command not found',
			'not recognized',
			'no such file or directory',
			'npm not found',
			'node not found',
			'python not found',
			'brew not found',
			'is not recognized as an internal or external command'
		],
		kind: 'topic'
	},
	{
		id: 'topic-panic-permission',
		sectionId: 'section-5-2',
		title: 'Permission denied',
		part: 'Panic',
		description: 'Missing execute bit or wrong owner — chmod +x fixes the common case.',
		keywords: [
			'permission denied',
			'cannot execute',
			'operation not permitted',
			'access denied',
			'not executable',
			'eacces'
		],
		kind: 'topic'
	},
	{
		id: 'topic-panic-scary-command',
		sectionId: 'section-6-1',
		title: 'Is this command safe to run?',
		part: 'Panic',
		description: 'Read before you run: decode any AI-suggested command before Enter.',
		keywords: [
			'is this safe',
			'what does this command do',
			'what does rm -rf do',
			'scary command',
			'should i run this',
			'ai gave me a command',
			'decode command',
			'typed a scary command'
		],
		kind: 'topic'
	}
];

export const searchIndex: SearchEntry[] = [...buildCommandEntries(), ...topicEntries];

export function scoreSearchEntry(entry: SearchEntry, rawQuery: string): number {
	const query = rawQuery.toLowerCase().trim();
	if (!query) return 0;

	const tokens = query.split(/\s+/).filter(Boolean);
	const command = entry.command?.toLowerCase() ?? '';
	const title = entry.title.toLowerCase();
	const description = entry.description.toLowerCase();
	const keywordBlob = entry.keywords.join(' ').toLowerCase();

	if (entry.kind === 'command' && command) {
		if (command === query) return 1000;
		if (command.startsWith(query)) return 900;
		if (command.includes(query)) return 750;

		const commandPrefix = tokens.join(' ');
		if (command.startsWith(commandPrefix)) return 850;
		if (tokens.length > 1 && tokens.every((token) => command.includes(token))) {
			return 700 + tokens.length * 20;
		}
	}

	for (const keyword of entry.keywords) {
		const lower = keyword.toLowerCase();
		if (lower === query) return entry.kind === 'command' ? 650 : 500;
		if (lower.startsWith(query)) return entry.kind === 'command' ? 600 : 450;
	}

	if (title === query) return entry.kind === 'command' ? 550 : 300;
	if (title.startsWith(query)) return entry.kind === 'command' ? 500 : 250;
	if (description.includes(query)) return entry.kind === 'command' ? 400 : 200;

	if (tokens.every((token) => keywordBlob.includes(token) || title.includes(token))) {
		return entry.kind === 'command' ? 350 + tokens.length * 15 : 120;
	}

	if (title.includes(query)) return entry.kind === 'command' ? 180 : 80;

	return 0;
}

export function searchEntries(rawQuery: string, limit = 8): SearchEntry[] {
	const query = rawQuery.trim();
	if (!query) return [];

	return searchIndex
		.map((entry) => ({ entry, score: scoreSearchEntry(entry, query) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
		.slice(0, limit)
		.map(({ entry }) => entry);
}
