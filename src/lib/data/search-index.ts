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
	if (
		/^(?:ctrl|alt|esc|shift)[+ ]/.test(first) ||
		first === 'tab' ||
		first === '↑' ||
		first === '↓'
	)
		return 'keyboard-workshop';
	if (['rg', 'fd', 'fdfind', 'fzf', 'z', 'zoxide', 'bat', 'batcat'].includes(first))
		return 'section-10-1';
	if (first === 'tmux') return 'section-12-4';
	if (first === 'shellcheck') return 'section-13-2';
	if (cmd.includes('!!') || first === 'history') return 'section-12-2';
	if (first === 'ctrl+c' || first === 'ctrl+d' || first === 'ctrl+l' || first === 'reset')
		return 'section-1-2';
	if (first === 'q' || first === ':q!') return 'section-1-3';
	if (first === 'ctrl+u') return 'section-12-2';

	// Specific homes that the broad pipe/redirect/first-word rules below would
	// otherwise claim — order is load-bearing here.
	if (cmd.includes('<<')) return 'section-6-1'; // a here-doc, not a redirect
	if (bare.includes('tee')) return 'section-4-1';
	if (bare.includes('pbcopy')) return 'section-12-1';
	if (cmd.includes('jq')) return 'section-9-3';
	if (cmd.includes('.env')) return 'section-9-4'; // before the chmod rule
	if (first === 'curl') return 'section-9-2';
	if (cmd.includes('chown')) return 'section-5-1'; // before the sudo rule
	if (cmd.includes('export path')) return 'section-5-5'; // before the export rule
	if (first === 'mkdir' && cmd.includes('{')) return 'section-3-4'; // braces, not 2.4
	if (first === 'sed' && cmd.includes('-i')) return 'section-7-3';
	if (first === 'sed' && (cmd.includes("d'") || cmd.includes('-n'))) return 'section-7-2';
	if (first === 'sed') return 'section-7-1';
	if (first === 'awk') return 'section-7-4'; // before the $1 rule below

	if (first === 'sudo') return 'section-5-3';
	if (cmd.includes('chmod')) return 'section-5-2';

	if (first === 'find') return 'section-4-5';
	if (cmd.includes('grep')) return 'section-4-3';
	if (first === 'sort' || first === 'uniq' || first === 'wc' || first === 'cut')
		return 'section-4-4';
	if (cmd.includes('&&') || cmd.includes('||') || cmd.includes('$?') || bare.includes(';'))
		return 'section-6-2';
	if (bare.includes('|')) return 'section-4-2';
	if (bare.includes('>') || / < /.test(bare)) return 'section-4-1';
	if (cmd.startsWith('#!') || cmd.startsWith('./') || first === 'bash' || cmd.includes('$1'))
		return 'section-6-1';

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
	if (first === 'nano') return 'edit-notes';

	if (first === 'ps' || first === 'pgrep' || first === 'top' || first === 'htop')
		return 'section-8-1';
	if (first === 'kill') return 'section-8-2';
	if (first === 'lsof') return 'section-8-3';
	if (first === 'nohup' || first === 'ctrl+z' || bare.includes('&')) return 'section-8-4';

	if (first === 'ssh' || first === 'scp' || first === 'rsync') return 'section-9-5';

	if (first === 'brew' || first === 'winget' || cmd.includes('apt install')) return 'section-10-1';
	if (first === 'tar' || first === 'unzip') return 'section-10-2';
	if (first === 'ln') return 'section-10-3';
	if (first === 'du' || first === 'df') return 'section-10-4';

	if (first === 'shasum' || first === 'sha256sum') return 'section-11-1';
	if (first === 'crontab') return 'section-13-2';

	const categoryFallback: Record<string, string> = {
		Orientation: 'section-1-2',
		Navigation: 'section-2-3',
		'Files & Folders': 'section-2-4',
		'Viewing Files': 'section-2-5',
		'Text & Pipes': 'section-4-2',
		Searching: 'section-4-3',
		'Text Surgery': 'section-7-1',
		Permissions: 'section-5-1',
		Environment: 'section-5-4',
		Scripting: 'section-6-1',
		'Processes & Ports': 'section-8-1',
		'Network & Secrets': 'section-9-2',
		'The Toolshed': 'section-10-1',
		'Panic Button': 'section-1-3'
	};

	return categoryFallback[category] ?? 'section-13-2';
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
			const sectionId =
				cmd.kind === 'shortcut'
					? 'keyboard-workshop'
					: (cmd.lessonId ?? resolveSectionId(cmd.command, category.label));
			const baseCommand = cmd.command.split('<')[0].trim();

			entries.push({
				id: cmd.id
					? `reference-${cmd.id}`
					: `${sectionId}-${slugify(cmd.command)}-${slugify(cmd.description)}`,
				sectionId,
				command: cmd.command,
				title: baseCommand || cmd.command,
				part: category.label,
				description: cmd.description,
				keywords: [
					baseCommand,
					cmd.command,
					cmd.description,
					...(cmd.keywords ?? []),
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
	{
		id: 'topic-hero',
		sectionId: 'hero',
		title: 'TerminalVibes — start here',
		part: 'Introduction',
		description: 'Make the terminal print a message, then change it yourself.',
		keywords: [
			'start',
			'home',
			'beginning',
			'intro',
			'top',
			'course',
			'terminalvibes',
			'hello world'
		],
		kind: 'topic'
	},
	{
		id: 'topic-hello-first-command',
		sectionId: 'hello-first-command',
		title: 'Your first command',
		part: 'Start here',
		description: 'Type a greeting, run it, read the reply, and change the message.',
		keywords: ['hello world', 'first command', 'echo', 'start typing', 'try terminal'],
		kind: 'topic'
	},
	{
		id: 'topic-keyboard-workshop',
		sectionId: 'keyboard-workshop',
		title: 'Fix a line. Keep your flow.',
		part: 'Start here',
		description:
			'Practise cursor movement, word replacement, cut and restore, and cancelling a draft.',
		keywords: [
			'keyboard shortcuts',
			'delete whole line',
			'delete entire line',
			'clear line',
			'beginning of line',
			'end of line',
			'jump',
			'replace a word',
			'ctrl a',
			'ctrl e',
			'ctrl u',
			'ctrl w',
			'ctrl k',
			'ctrl y',
			'ctrl c',
			'control key'
		],
		kind: 'topic'
	},
	{
		id: 'topic-edit-notes',
		sectionId: 'edit-notes',
		title: 'Edit and save a note',
		part: 'Start here',
		description: 'Open a file in the practice editor, save it, then read it from the terminal.',
		keywords: ['edit notes', 'edit a file', 'save file', 'text editor', 'nano', 'write notes'],
		kind: 'topic'
	},
	{
		id: 'topic-section-intro-what',
		sectionId: 'section-intro-what',
		title: 'What are the terminal and the shell?',
		part: 'Start here',
		description: 'Connect your first command to the terminal window, shell, and text reply.',
		keywords: ['terminal', 'shell', 'console', 'cli', 'command line', 'what is bash'],
		kind: 'topic'
	},
	{
		id: 'topic-section-intro-anatomy',
		sectionId: 'section-intro-anatomy',
		title: 'What is a prompt? Which text do I type?',
		part: 'Start here',
		description: 'Distinguish the prompt, the command you type, and the text printed in reply.',
		keywords: [
			'prompt',
			'anatomy',
			'which text do I type',
			'dollar sign',
			'user@host',
			'input',
			'output',
			'command vs reply'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-intro-shells',
		sectionId: 'section-intro-shells',
		title: 'Can I use the terminal on my own computer?',
		part: 'Start here',
		description: 'Choose a terminal and shell for macOS, Linux, or Windows.',
		keywords: [
			'macos',
			'linux',
			'windows',
			'wsl',
			'git bash',
			'powershell',
			'terminal app',
			'which shell'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-intro-history',
		sectionId: 'section-intro-history',
		title: 'Why do people still type commands?',
		part: 'Start here',
		description: 'An optional look at the terminal’s roots after your first practice.',
		keywords: ['terminal history', 'unix', 'teleprinter', 'bell labs', 'bash', 'zsh'],
		kind: 'topic'
	},
	{
		id: 'topic-part-1',
		sectionId: 'part-1',
		title: 'First Contact',
		part: 'Part 1',
		description:
			'Open the terminal appropriate to your operating system after trying the browser practice.',
		keywords: ['First Contact', 'part 1', 'chapter 1'],
		kind: 'topic'
	},
	{
		id: 'topic-section-1-1',
		sectionId: 'section-1-1',
		title: '1.1 Opening Your Terminal',
		part: 'Part 1',
		description:
			'Open the terminal appropriate to your operating system after trying the browser practice.',
		keywords: [
			'1.1 Opening Your Terminal',
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
		id: 'topic-section-1-2',
		sectionId: 'section-1-2',
		title: '1.2 Your First Commands',
		part: 'Part 1',
		description: 'Run a small command, read its reply, and recover from an ordinary typo.',
		keywords: [
			'1.2 Your First Commands',
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
		id: 'topic-section-1-3',
		sectionId: 'section-1-3',
		title: '1.3 Getting Help',
		part: 'Part 1',
		description: 'Ask for command help, read a manual, and leave a pager when finished.',
		keywords: [
			'1.3 Getting Help',
			'help',
			'man page',
			'manual',
			'--help',
			'tldr',
			'documentation',
			'what does this command do',
			'pager',
			'q to quit',
			'stuck in man',
			'flag',
			'flags',
			'option',
			'what is a flag',
			'dash',
			'single dash vs double dash',
			'argument',
			'placeholder',
			'angle brackets',
			'usage line',
			'synopsis',
			'man section numbers'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-2',
		sectionId: 'part-2',
		title: 'Moving Around: Find Your Files',
		part: 'Part 2',
		description: 'Use pwd and ls to identify your current folder and inspect its contents.',
		keywords: ['Moving Around: Find Your Files', 'part 2', 'chapter 2'],
		kind: 'topic'
	},
	{
		id: 'topic-section-2-1',
		sectionId: 'section-2-1',
		title: '2.1 Where Am I?',
		part: 'Part 2',
		description: 'Use pwd and ls to identify your current folder and inspect its contents.',
		keywords: [
			'2.1 Where Am I?',
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
		id: 'topic-section-2-2',
		sectionId: 'section-2-2',
		title: '2.2 Paths: Addresses for Files',
		part: 'Part 2',
		description: 'Read absolute and relative paths, home, parent folders, and names with spaces.',
		keywords: [
			'2.2 Paths: Addresses for Files',
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
			'root',
			'quotes',
			'single vs double quotes',
			'quoting',
			'escape a space',
			'backslash',
			'filename with spaces',
			'trailing slash',
			'/usr',
			'/etc',
			'/bin',
			'/tmp'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-2-3',
		sectionId: 'section-2-3',
		title: '2.3 Changing Directories',
		part: 'Part 2',
		description: 'Move between folders, verify your location, and return after a wrong turn.',
		keywords: [
			'2.3 Changing Directories',
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
		id: 'topic-section-2-4',
		sectionId: 'section-2-4',
		title: '2.4 Make a Place for Your Notes',
		part: 'Part 2',
		description: 'Create a practice folder and a file without losing track of where they live.',
		keywords: [
			'2.4 Make a Place for Your Notes',
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
		id: 'topic-section-2-5',
		sectionId: 'section-2-5',
		title: '2.5 Read, Edit, and Save a File',
		part: 'Part 2',
		description: 'Read a saved file, edit it, save changes, and compare the next command’s output.',
		keywords: [
			'2.5 Read, Edit, and Save a File',
			'edit',
			'save',
			'editor',
			'nano',
			'vim',
			'quit vim',
			'exit editor',
			'edit a file',
			'cat',
			'less',
			'head',
			'tail',
			'nano',
			'edit a file',
			'text editor',
			'view file',
			'read file',
			'print file',
			'see contents',
			'watch log',
			'follow log',
			'tail -f',
			'csv',
			'yaml',
			'markdown',
			'.md',
			'.sh',
			'file extension',
			'byte',
			'what is a byte'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-3',
		sectionId: 'part-3',
		title: 'Copy, Move, and Delete with Confidence',
		part: 'Part 3',
		description: 'Copy a file while keeping its original and checking the destination.',
		keywords: ['Copy, Move, and Delete with Confidence', 'part 3', 'chapter 3'],
		kind: 'topic'
	},
	{
		id: 'topic-section-3-1',
		sectionId: 'section-3-1',
		title: '3.1 Copying: Keep the Original',
		part: 'Part 3',
		description: 'Copy a file while keeping its original and checking the destination.',
		keywords: [
			'3.1 Copying: Keep the Original',
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
		id: 'topic-section-3-2',
		sectionId: 'section-3-2',
		title: '3.2 Moving and Renaming',
		part: 'Part 3',
		description: 'Move or rename a file, inspect the result, and watch for existing destinations.',
		keywords: [
			'3.2 Moving and Renaming',
			'mv',
			'move',
			'rename',
			'rename file',
			'move file',
			'overwrite',
			'mv -i'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-3-3',
		sectionId: 'section-3-3',
		title: '3.3 Deleting: Choose the Exact Target',
		part: 'Part 3',
		description:
			'Inspect the exact target before deleting and understand available recovery routes.',
		keywords: [
			'3.3 Deleting: Choose the Exact Target',
			'deleted file',
			'undo delete',
			'recovery',
			'trash',
			'restore',
			'rm',
			'delete',
			'remove',
			'rm -rf',
			'double dash',
			'leading dash',
			'rm --',
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
		id: 'topic-section-3-4',
		sectionId: 'section-3-4',
		title: '3.4 Wildcards: Select a Group of Names',
		part: 'Part 3',
		description: 'Predict which filenames match a wildcard before applying an operation.',
		keywords: [
			'3.4 Wildcards: Select a Group of Names',
			'wildcard',
			'glob',
			'asterisk',
			'star',
			'brace expansion',
			'braces',
			'curly braces',
			'*.txt',
			'question mark',
			'pattern',
			'match files',
			'select files',
			'expansion',
			'glob vs regex',
			'globbing',
			'does a glob cross a slash',
			'wildcard subfolders'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-4',
		sectionId: 'part-4',
		title: 'Text and Pipes: Turn a List into an Answer',
		part: 'Part 4',
		description: 'Send output to a file and distinguish replacement, append, and error output.',
		keywords: ['Text and Pipes: Turn a List into an Answer', 'part 4', 'chapter 4'],
		kind: 'topic'
	},
	{
		id: 'topic-section-4-1',
		sectionId: 'section-4-1',
		title: '4.1 Save a Command’s Output',
		part: 'Part 4',
		description: 'Send output to a file and distinguish replacement, append, and error output.',
		keywords: [
			'4.1 Save a Command’s Output',
			'redirect',
			'redirection',
			'output to file',
			'save output',
			'tee',
			'see and save',
			'append',
			'overwrite file',
			'stderr',
			'stdout',
			'stdin',
			'standard output',
			'standard error',
			'standard input',
			'2>&1',
			'stream',
			'truncate',
			'2>'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-4-2',
		sectionId: 'section-4-2',
		title: '4.2 Pipes: Give the Text to Another Tool',
		part: 'Part 4',
		description: 'Build a pipeline one stage at a time and inspect the text between tools.',
		keywords: [
			'4.2 Pipes: Give the Text to Another Tool',
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
		id: 'topic-section-4-3',
		sectionId: 'section-4-3',
		title: '4.3 Search Inside Files with grep',
		part: 'Part 4',
		description: 'Search file contents with grep and read line numbers and matching text.',
		keywords: [
			'4.3 Search Inside Files with grep',
			'grep',
			'search text',
			'find text',
			'search in files',
			'find in files',
			'filter lines',
			'search logs',
			'case insensitive',
			'recursive search',
			'match',
			'regex',
			'regular expression',
			'regex vs glob',
			'anchor',
			'log file',
			'log levels',
			'debug info warn error'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-4-4',
		sectionId: 'section-4-4',
		title: '4.4 Count, Group, and Rank',
		part: 'Part 4',
		description: 'Count lines and group or sort results to answer a concrete question.',
		keywords: [
			'4.4 Count, Group, and Rank',
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
		id: 'topic-section-4-5',
		sectionId: 'section-4-5',
		title: '4.5 Find Files by Name',
		part: 'Part 4',
		description: 'Search filenames with find and choose a starting folder and name pattern.',
		keywords: [
			'4.5 Find Files by Name',
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
	{
		id: 'topic-part-5',
		sectionId: 'part-5',
		title: 'Permissions and Settings: Understand the Refusal',
		part: 'Part 5',
		description: 'Read owner, group, and permission bits in a file listing.',
		keywords: ['Permissions and Settings: Understand the Refusal', 'part 5', 'chapter 5'],
		kind: 'topic'
	},
	{
		id: 'topic-section-5-1',
		sectionId: 'section-5-1',
		title: '5.1 Read a File’s Permissions',
		part: 'Part 5',
		description: 'Read owner, group, and permission bits in a file listing.',
		keywords: [
			'5.1 Read a File’s Permissions',
			'ls -l',
			'permissions',
			'rwx',
			'file mode',
			'chown',
			'file owner',
			'owner',
			'group',
			'long listing',
			'drwxr-xr-x',
			'read write execute',
			'type character',
			'link count',
			'what is a group',
			'staff group',
			'x on a directory',
			'total 12'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-5-2',
		sectionId: 'section-5-2',
		title: '5.2 Change Only the Permission You Need',
		part: 'Part 5',
		description: 'Choose a limited permission change and verify it instead of granting everything.',
		keywords: [
			'5.2 Change Only the Permission You Need',
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
		id: 'topic-section-5-3',
		sectionId: 'section-5-3',
		title: '5.3 sudo: Run One Command with More Authority',
		part: 'Part 5',
		description: 'Understand why a command may need additional authority before using sudo.',
		keywords: [
			'5.3 sudo: Run One Command with More Authority',
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
		id: 'topic-section-5-4',
		sectionId: 'section-5-4',
		title: '5.4 Variables and the Places Commands Are Found',
		part: 'Part 5',
		description: 'Inspect variables and command lookup to diagnose missing commands.',
		keywords: [
			'5.4 Variables and the Places Commands Are Found',
			'command not found',
			'not recognized',
			'path',
			'command -v',
			'missing command',
			'which shell',
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
		id: 'topic-section-5-5',
		sectionId: 'section-5-5',
		title: '5.5 Keep a Useful Setting',
		part: 'Part 5',
		description: 'Save a useful shell setting and test configuration changes carefully.',
		keywords: [
			'5.5 Keep a Useful Setting',
			'bashrc',
			'zshrc',
			'shell config',
			'alias',
			'add to path',
			'path append',
			'source',
			'dotfile',
			'dotfiles',
			'startup file',
			'profile',
			'customize shell',
			'child shell',
			'subshell',
			'source vs ./script.sh',
			'why does cd in a script do nothing',
			'zprofile',
			'bash_profile'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-6',
		sectionId: 'part-6',
		title: 'Scripts: Save a Routine You Understand',
		part: 'Part 6',
		description: 'Write a script in the file editor, save it, inspect it, and run it.',
		keywords: ['Scripts: Save a Routine You Understand', 'part 6', 'chapter 6'],
		kind: 'topic'
	},
	{
		id: 'topic-section-6-1',
		sectionId: 'section-6-1',
		title: '6.1 Your First Script',
		part: 'Part 6',
		description: 'Write a script in the file editor, save it, inspect it, and run it.',
		keywords: [
			'6.1 Your First Script',
			'script',
			'bash script',
			'shell script',
			'heredoc',
			'here-doc',
			'here document',
			'eof',
			'shebang',
			'#!/bin/bash',
			'#!/usr/bin/env bash',
			'./script.sh',
			'.sh file',
			'automate',
			'arguments',
			'$1',
			'env',
			'usr bin env',
			'what does shebang mean',
			'script arguments'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-6-2',
		sectionId: 'section-6-2',
		title: '6.2 Know Whether the Work Succeeded',
		part: 'Part 6',
		description: 'Use exit status and command chaining to decide what should happen next.',
		keywords: [
			'6.2 Know Whether the Work Succeeded',
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
	{
		id: 'topic-part-7',
		sectionId: 'part-7',
		title: 'Text Surgery: Change a Word, Keep the Original',
		part: 'Part 7',
		description: 'Preview a text replacement with sed while preserving the input.',
		keywords: ['Text Surgery: Change a Word, Keep the Original', 'part 7', 'chapter 7'],
		kind: 'topic'
	},
	{
		id: 'topic-section-7-1',
		sectionId: 'section-7-1',
		title: '7.1 Find and Replace with sed',
		part: 'Part 7',
		description: 'Preview a text replacement with sed while preserving the input.',
		keywords: [
			'7.1 Find and Replace with sed',
			'sed',
			'find and replace',
			'replace text',
			'substitute',
			's/old/new/',
			'g flag',
			'rename in file',
			'stream editor',
			'change text',
			'swap word'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-7-2',
		sectionId: 'section-7-2',
		title: '7.2 Choose Which Lines to Keep',
		part: 'Part 7',
		description: 'Select, print, or omit lines using a pattern or line range.',
		keywords: [
			'7.2 Choose Which Lines to Keep',
			'sed d',
			'delete lines',
			'remove lines',
			'sed -n',
			'print lines',
			'show lines 40 to 55',
			'line range',
			'address',
			'drop debug lines',
			'extract lines from log'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-7-3',
		sectionId: 'section-7-3',
		title: '7.3 Save an Edit and Check the Difference',
		part: 'Part 7',
		description:
			'Review a text transformation and preserve a recovery path before replacing a file.',
		keywords: [
			'7.3 Save an Edit and Check the Difference',
			'sed -i',
			'in place',
			'edit file directly',
			'-i.bak',
			'backup before edit',
			'undo sed',
			'mass edit',
			'agent proposed sed',
			'rewrite file',
			'in-place edit safety'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-7-4',
		sectionId: 'section-7-4',
		title: '7.4 Choose Fields with awk',
		part: 'Part 7',
		description: 'Extract fields from simple text and distinguish columns from real CSV parsing.',
		keywords: [
			'7.4 Choose Fields with awk',
			'awk',
			'print column',
			'second column',
			'fields',
			'$1',
			'-F',
			'csv column',
			'extract column',
			'cut vs awk',
			'table text'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-8',
		sectionId: 'part-8',
		title: 'Processes & ports: get your prompt back',
		part: 'Part 8',
		description: 'Identify a running program by owner, command, and process ID.',
		keywords: ['Processes & ports: get your prompt back', 'part 8', 'chapter 8'],
		kind: 'topic'
	},
	{
		id: 'topic-section-8-1',
		sectionId: 'section-8-1',
		title: '8.1 Meet a running program',
		part: 'Part 8',
		description: 'Identify a running program by owner, command, and process ID.',
		keywords: [
			'8.1 Meet a running program',
			'ps',
			'ps aux',
			'process',
			'pid',
			'top',
			'htop',
			'live view',
			'cpu monitor',
			'pgrep',
			'what is running',
			'cpu usage',
			'high cpu',
			'fans loud',
			'list processes',
			'aux',
			'what does aux mean',
			'process id',
			'%cpu',
			'%mem',
			'cpu core',
			'340% cpu',
			'ps vs ps aux'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-8-2',
		sectionId: 'section-8-2',
		title: '8.2 Get your prompt back',
		part: 'Part 8',
		description: 'Interrupt a foreground job or request termination of a verified process.',
		keywords: [
			'8.2 Get your prompt back',
			'stuck',
			'cancel',
			'interrupt',
			'stop running command',
			'ctrl c',
			'kill',
			'sigterm',
			'kill',
			'kill -9',
			'sigterm',
			'sigkill',
			'stop a process',
			'force quit',
			'not responding',
			'wont stop',
			'terminate',
			'ctrl+c signal',
			'signal',
			'signals',
			'what is a signal',
			'sigint',
			'sighup',
			'signal number',
			'kill -15',
			'kernel',
			'what is the kernel',
			'lock file',
			'foreground'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-8-3',
		sectionId: 'section-8-3',
		title: '8.3 Find who is using a port',
		part: 'Part 8',
		description: 'Find the listener on a port and resolve a conflict without guessing a PID.',
		keywords: [
			'8.3 Find who is using a port',
			'port',
			'port 3000',
			'eaddrinuse',
			'EADDRINUSE',
			'address already in use',
			'lsof',
			'lsof -i',
			'port already in use',
			'dev server wont start',
			'localhost 3000',
			'free the port'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-8-4',
		sectionId: 'section-8-4',
		title: '8.4 Give each job a place',
		part: 'Part 8',
		description: 'Understand foreground, background, suspended jobs, and which shell tracks them.',
		keywords: [
			'8.4 Give each job a place',
			'background',
			'&',
			'jobs',
			'nohup',
			'keep running after close',
			'fg',
			'bg',
			'ctrl+z',
			'job control',
			'run in background',
			'get my prompt back',
			'suspend'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-9',
		sectionId: 'part-9',
		title: 'Network conversations: ask, inspect, verify',
		part: 'Part 9',
		description: 'Read a URL and distinguish a localhost link from the server’s listening address.',
		keywords: ['Network conversations: ask, inspect, verify', 'part 9', 'chapter 9'],
		kind: 'topic'
	},
	{
		id: 'topic-section-9-1',
		sectionId: 'section-9-1',
		title: '9.1 Know where a request goes',
		part: 'Part 9',
		description: 'Read a URL and distinguish a localhost link from the server’s listening address.',
		keywords: [
			'9.1 Know where a request goes',
			'localhost',
			'loopback',
			'0.0.0.0',
			'bind address',
			'exposed server',
			'localhost',
			'127.0.0.1',
			'url',
			'what is a port',
			'localhost:3000',
			'5173',
			'8080',
			'dev server url',
			'http',
			'https',
			'what does https mean',
			'ip address',
			'url path vs file path',
			'404',
			'route'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-9-2',
		sectionId: 'section-9-2',
		title: '9.2 Ask, then inspect the answer',
		part: 'Part 9',
		description:
			'Send a request with curl and distinguish transfer, HTTP, and application failures.',
		keywords: [
			'9.2 Ask, then inspect the answer',
			'curl',
			'connection refused',
			'http error',
			'404',
			'500',
			'health check',
			'request failed',
			'curl',
			'http request',
			'check if server is running',
			'connection refused',
			'curl -o',
			'curl -I',
			'curl -H',
			'api request',
			'curl | bash',
			'health check',
			'api',
			'what is an api',
			'http header',
			'header',
			'authorization',
			'bearer token',
			'x-api-key'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-9-3',
		sectionId: 'section-9-3',
		title: '9.3 Find one value inside JSON',
		part: 'Part 9',
		description: 'Inspect JSON, quote a jq filter, and extract the value your task needs.',
		keywords: [
			'9.3 Find one value inside JSON',
			'jq',
			'json',
			'parse json',
			'extract value',
			'jq -r',
			'api response',
			'nested json',
			'pretty print json',
			'parse error',
			'jq parse error',
			'html',
			'got html instead of json',
			'what is json'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-9-4',
		sectionId: 'section-9-4',
		title: '9.4 Keep credentials out of commands',
		part: 'Part 9',
		description: 'Practise with fake credentials and configure real credentials through an editor.',
		keywords: [
			'9.4 Keep credentials out of commands',
			'api key',
			'secret',
			'credential',
			'dotenv',
			'source env',
			'source executes code',
			'api key',
			'secret',
			'.env',
			'env file',
			'chmod 600',
			'gitignore',
			'committed a key',
			'leaked key',
			'token',
			'credentials',
			'bash_history'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-9-5',
		sectionId: 'section-9-5',
		title: '9.5 Work on another machine without losing your bearings',
		part: 'Part 9',
		description: 'Use SSH with a verified host identity and keep local and remote files distinct.',
		keywords: [
			'9.5 Work on another machine without losing your bearings',
			'ssh',
			'scp',
			'rsync',
			'host key',
			'fingerprint',
			'remote',
			'local',
			'ssh',
			'scp',
			'rsync',
			'copy file to server',
			'upload to server',
			'deploy files',
			'remote server',
			'log into server',
			'ssh key',
			'ssh-keygen',
			'public key',
			'private key',
			'another machine',
			'vps'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-10',
		sectionId: 'part-10',
		title: 'The toolshed: useful tools for everyday work',
		part: 'Part 10',
		description: 'Install a needed tool and try rg, fd, fzf, zoxide, or bat on familiar files.',
		keywords: ['The toolshed: useful tools for everyday work', 'part 10', 'chapter 10'],
		kind: 'topic'
	},
	{
		id: 'topic-section-10-1',
		sectionId: 'section-10-1',
		title: '10.1 Add a tool, then use it for one small job',
		part: 'Part 10',
		description: 'Install a needed tool and try rg, fd, fzf, zoxide, or bat on familiar files.',
		keywords: [
			'10.1 Add a tool, then use it for one small job',
			'ripgrep',
			'rg',
			'fd',
			'fzf',
			'zoxide',
			'bat',
			'fuzzy finder',
			'modern tools',
			'install',
			'install',
			'brew',
			'homebrew',
			'apt',
			'apt install',
			'npm install -g',
			'package manager',
			'command not found after install',
			'how to install a tool',
			'winget',
			'brew not found',
			'install homebrew',
			'typosquatting',
			'package.json',
			'npm run',
			'-g global install',
			'install jq'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-10-2',
		sectionId: 'section-10-2',
		title: '10.2 Inspect an archive before unpacking it',
		part: 'Part 10',
		description: 'List archive contents, choose a fresh destination, and inspect extracted files.',
		keywords: [
			'10.2 Inspect an archive before unpacking it',
			'tar',
			'tar -xzf',
			'tar flags',
			'extract',
			'unzip',
			'zip',
			'archive',
			'tar.gz',
			'unpack',
			'compress',
			'how to open tar.gz'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-10-3',
		sectionId: 'section-10-3',
		title: '10.3 Make a signpost, not another copy',
		part: 'Part 10',
		description: 'Create a symbolic link and understand how its target path is resolved.',
		keywords: [
			'10.3 Make a signpost, not another copy',
			'symlink',
			'symbolic link',
			'ln -s',
			'arrow in ls -l',
			'broken link',
			'node_modules/.bin',
			'wrong version',
			'where is it really installed',
			'version manager',
			'nvm',
			'pyenv',
			'relative vs absolute target',
			'lrwxr-xr-x'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-10-4',
		sectionId: 'section-10-4',
		title: '10.4 Measure disk usage before deleting anything',
		part: 'Part 10',
		description: 'Measure a folder and filesystem before deciding what is safe to remove.',
		keywords: [
			'10.4 Measure disk usage before deleting anything',
			'du',
			'df',
			'disk full',
			'disk space',
			'du -sh',
			'what is using space',
			'node_modules size',
			'free up space',
			'storage'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-11',
		sectionId: 'part-11',
		title: 'Work with an agent: understand the next step',
		part: 'Part 11',
		description: 'Review an assistant’s proposed action, exact targets, permissions, and evidence.',
		keywords: ['Work with an agent: understand the next step', 'part 11', 'chapter 11'],
		kind: 'topic'
	},
	{
		id: 'topic-section-11-1',
		sectionId: 'section-11-1',
		title: '11.1 Turn a proposal into something you can check',
		part: 'Part 11',
		description: 'Review an assistant’s proposed action, exact targets, permissions, and evidence.',
		keywords: ['11.1 Turn a proposal into something you can check'],
		kind: 'topic'
	},
	{
		id: 'topic-part-12',
		sectionId: 'part-12',
		title: 'Your cockpit: readable, familiar, easy to revisit',
		part: 'Part 12',
		description: 'Choose readable text and a useful prompt; try the optional Starship designer.',
		keywords: ['Your cockpit: readable, familiar, easy to revisit', 'part 12', 'chapter 12'],
		kind: 'topic'
	},
	{
		id: 'topic-section-12-1',
		sectionId: 'section-12-1',
		title: '12.1 Make the window easy to read',
		part: 'Part 12',
		description: 'Choose readable text and a useful prompt; try the optional Starship designer.',
		keywords: ['12.1 Make the window easy to read'],
		kind: 'topic'
	},
	{
		id: 'topic-section-12-2',
		sectionId: 'section-12-2',
		title: '12.2 Recall, inspect, and edit',
		part: 'Part 12',
		description:
			'Recall and inspect an earlier command, restore a draft, and practise history search.',
		keywords: [
			'12.2 Recall, inspect, and edit',
			'history',
			'ctrl r',
			'reverse search',
			'unfinished draft',
			'recall',
			'up arrow',
			'history',
			'up arrow',
			'ctrl+r',
			'reverse search',
			'line editing',
			'ctrl+a',
			'ctrl+e',
			'ctrl+w',
			'ctrl+u',
			'!!',
			'sudo !!',
			'previous command',
			'repeat command',
			'last command',
			'rerun',
			'scrollback',
			'history vs scrollback',
			'zsh_history',
			'bash_history'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-12-3',
		sectionId: 'section-12-3',
		title: '12.3 Keep the editor and terminal connected',
		part: 'Part 12',
		description: 'Save a file in an editor and run a command that reads that saved file.',
		keywords: ['12.3 Keep the editor and terminal connected'],
		kind: 'topic'
	},
	{
		id: 'topic-section-12-4',
		sectionId: 'section-12-4',
		title: '12.4 Give parallel work a clear home',
		part: 'Part 12',
		description: 'Organize work into tabs and learn native tmux detach, attach, and panes.',
		keywords: [
			'12.4 Give parallel work a clear home',
			'tmux',
			'multiplexer',
			'detach',
			'attach',
			'panes',
			'split terminal',
			'tabs'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-13',
		sectionId: 'part-13',
		title: 'Useful machinery, dependable scripts',
		part: 'Part 13',
		description: 'Understand the terminal, shell, PTY, signals, and display control sequences.',
		keywords: ['Useful machinery, dependable scripts', 'part 13', 'chapter 13'],
		kind: 'topic'
	},
	{
		id: 'topic-section-13-1',
		sectionId: 'section-13-1',
		title: '13.1 A small map of the machinery',
		part: 'Part 13',
		description: 'Understand the terminal, shell, PTY, signals, and display control sequences.',
		keywords: [
			'13.1 A small map of the machinery',
			'pty',
			'canonical',
			'raw mode',
			'ansi',
			'escape sequences',
			'osc',
			'terminal integration'
		],
		kind: 'topic'
	},
	{
		id: 'topic-section-13-2',
		sectionId: 'section-13-2',
		title: '13.2 Write scripts that make decisions',
		part: 'Part 13',
		description: 'Build Bash decisions and loops; check errors, use ShellCheck, and test cleanup.',
		keywords: [
			'13.2 Write scripts that make decisions',
			'if',
			'else',
			'for loop',
			'loop',
			'shellcheck',
			'strict mode',
			'set -euo pipefail',
			'trap',
			'cleanup',
			'error handling',
			'mktemp'
		],
		kind: 'topic'
	},
	{
		id: 'topic-part-14',
		sectionId: 'part-14',
		title: 'Make it yours: independent practice and a field guide',
		part: 'Part 14',
		description: 'Orient, inspect, act, and verify while solving a practical task.',
		keywords: ['Make it yours: independent practice and a field guide', 'part 14', 'chapter 14'],
		kind: 'topic'
	},
	{
		id: 'topic-section-14-1',
		sectionId: 'section-14-1',
		title: '14.1 A method you can carry into another task',
		part: 'Part 14',
		description: 'Orient, inspect, act, and verify while solving a practical task.',
		keywords: [
			'14.1 A method you can carry into another task',
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
		id: 'topic-section-14-2',
		sectionId: 'section-14-2',
		title: '14.2 Use a reference at the moment you need it',
		part: 'Part 14',
		description: 'Find the same maintained reference entries used by the global cheatsheet.',
		keywords: [
			'14.2 Use a reference at the moment you need it',
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
		id: 'topic-section-14-3',
		sectionId: 'section-14-3',
		title: '14.3 Put the skills together',
		part: 'Part 14',
		description:
			'Complete independent missions with references allowed and reflect on your skills.',
		keywords: [
			'14.3 Put the skills together',
			'capstone',
			'independent practice',
			'checklist',
			'assessment',
			'look up',
			'mission',
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
		id: 'topic-section-14-4',
		sectionId: 'section-14-4',
		title: '14.4 Take one useful task into your own terminal',
		part: 'Part 14',
		description: 'Choose a useful native task and decide which skill to practise next.',
		keywords: [
			'14.4 Take one useful task into your own terminal',
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
	{
		id: 'topic-extra-design-your-prompt-with-starship',
		sectionId: 'prompt-designer',
		title: 'Design your prompt with Starship',
		part: 'Field guide',
		description:
			'Build and inspect a prompt configuration without installing anything automatically.',
		keywords: ['starship', 'prompt designer', 'prompt theme', 'starship.toml'],
		kind: 'topic'
	},
	{
		id: 'topic-extra-keep-instructions-and-evidence-separate',
		sectionId: 'section-11-1',
		title: 'Keep instructions and evidence separate',
		part: 'Field guide',
		description:
			'Review proposed commands and treat instructions inside files as untrusted task data.',
		keywords: [
			'prompt injection',
			'malicious file',
			'ai permissions',
			'agent approval',
			'is this safe',
			'scary command'
		],
		kind: 'topic'
	},
	{
		id: 'topic-extra-get-unstuck-in-a-pager-or-editor',
		sectionId: 'section-1-3',
		title: 'Get unstuck in a pager or editor',
		part: 'Field guide',
		description: 'Identify the active program, then use its exit or cancellation command.',
		keywords: [
			'frozen terminal',
			'stuck',
			'hanging',
			'cant type',
			'cannot type',
			'exit vim',
			'quit vim',
			'how do i quit'
		],
		kind: 'topic'
	},
	{
		id: 'topic-extra-understand-permission-denied',
		sectionId: 'section-5-2',
		title: 'Understand permission denied',
		part: 'Field guide',
		description: 'Inspect ownership, operation, and permissions before choosing a change.',
		keywords: [
			'permission denied',
			'operation not permitted',
			'access denied',
			'not executable',
			'eacces'
		],
		kind: 'topic'
	},
	{
		id: 'topic-extra-recover-after-an-unwanted-file-change',
		sectionId: 'section-3-3',
		title: 'Recover after an unwanted file change',
		part: 'Field guide',
		description:
			'Stop making unrelated changes and check the copies or history that can restore the file.',
		keywords: ['deleted file', 'i deleted a file', 'recover file', 'undo delete', 'lost file'],
		kind: 'topic'
	},
	{
		id: 'topic-extra-modern-tools-for-familiar-jobs',
		sectionId: 'section-10-1',
		title: 'Modern tools for familiar jobs',
		part: 'Field guide',
		description: 'Try rg, fd, fzf, zoxide, and bat with standard-command alternatives.',
		keywords: [
			'modern terminal tools',
			'ripgrep',
			'fuzzy search',
			'fzf',
			'fd',
			'zoxide',
			'bat',
			'fdfind',
			'batcat'
		],
		kind: 'topic'
	},
	{
		id: 'topic-extra-test-a-script-before-scheduling-it',
		sectionId: 'section-13-2',
		title: 'Test a script before scheduling it',
		part: 'Field guide',
		description: 'Check missing input, existing output, filenames with spaces, and failure paths.',
		keywords: [
			'script tests',
			'automation',
			'shellcheck',
			'for loop',
			'if statement',
			'trap cleanup'
		],
		kind: 'topic'
	},
	{
		id: 'topic-pg-first-steps',
		sectionId: 'first-steps',
		title: 'Practice: Say hello to the machine',
		part: 'Practice',
		description:
			'A fresh terminal, a blinking cursor, and nothing to break — commands only act when you press Enter. Ask the machine who you are, where you are, and what time it is, then make it say something back.',
		keywords: ['Say hello to the machine', 'first steps', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-navigation',
		sectionId: 'navigation',
		title: 'Practice: Find the hidden garden note',
		part: 'Practice',
		description:
			'A planting note is tucked inside the garden folder. Look around, reveal the hidden folder, and read the note.',
		keywords: ['Find the hidden garden note', 'navigation', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-workspace-setup',
		sectionId: 'workspace-setup',
		title: 'Practice: Make a garden notebook',
		part: 'Practice',
		description:
			'Give your garden notes a home: make garden-notebook with notes, recipes, and photos folders, then create the first three empty notes.',
		keywords: ['Make a garden notebook', 'workspace setup', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-edit-notes',
		sectionId: 'edit-notes',
		title: 'Practice: Edit, save, and read your note',
		part: 'Practice',
		description:
			'Open Edit a file, load notes/seeds.txt, and add thyme on a new line after mint. Save and close the editor. Then read the file in the terminal to check your change.',
		keywords: ['Edit, save, and read your note', 'edit notes', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-tidy-up',
		sectionId: 'tidy-up',
		title: 'Practice: Clean the downloads mess',
		part: 'Practice',
		description:
			'Months of clicking "Save" left your downloads folder a junk drawer: photos, invoices, and a stale installer all in one pile. Sort the keepers into ~/pictures and ~/documents, then delete the junk — remember, rm has no trash can.',
		keywords: ['Clean the downloads mess', 'tidy up', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-glob-practice',
		sectionId: 'glob-practice',
		title: 'Practice: Select exactly the right files',
		part: 'Practice',
		description:
			'The staging folder mixes rotated logs, markdown drafts, a finished article and leftover .tmp files. Use wildcards to grab exactly the right group each time — and echo the glob first, so you see what a pattern matches before rm or mv acts on it.',
		keywords: ['Select exactly the right files', 'glob practice', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-log-detective',
		sectionId: 'log-detective',
		title: 'Practice: Find the crash in server.log',
		part: 'Practice',
		description:
			'Your side project went down at 9:14 last night and the AI on call left you a 300-line server.log. Nobody reads logs top to bottom — grep for the ERROR, then save the evidence to a report file with >.',
		keywords: ['Find the crash in server.log', 'log detective', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-pipeline-practice',
		sectionId: 'pipeline-practice',
		title: 'Practice: Top visitors from access.log',
		part: 'Practice',
		description:
			'Someone is hammering your little site and access.log knows who. No single command answers "which IP visits most?" — but a pipeline does. Build it one stage at a time: cut the IP column, sort it, count duplicates, sort by count.',
		keywords: ['Top visitors from access.log', 'pipeline practice', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-find-files',
		sectionId: 'find-files',
		title: 'Practice: Hunt down every TODO',
		part: 'Practice',
		description:
			'Before shipping orbit, you want every TODO your AI pair sprinkled through the codebase in one place. find locates files by name; grep -r searches inside them. Sweep the project and save the list.',
		keywords: ['Hunt down every TODO', 'find files', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-fix-permissions',
		sectionId: 'fix-permissions',
		title: "Practice: The script won't run",
		part: 'Practice',
		description:
			'Your AI assistant wrote setup.sh for you — but ./setup.sh answers "Permission denied". Nothing is broken: the file just lacks the executable bit. Read ls -l, grant +x, and run it for real.',
		keywords: ["The script won't run", 'fix permissions', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-path-repair',
		sectionId: 'path-repair',
		title: 'Practice: command not found',
		part: 'Practice',
		description:
			'An agent built you a deploy tool yesterday, but typing "deploy" earns only "command not found". The shell isn\'t lying — it only searches the directories in $PATH. Inspect $PATH, hunt the tool down, and run it by its path.',
		keywords: ['command not found', 'path repair', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-alias-workshop',
		sectionId: 'alias-workshop',
		title: 'Practice: Make your own shortcuts',
		part: 'Practice',
		description:
			'You type ls -l and cd ~/projects a dozen times a day. An alias is a nickname the shell expands for you — define ll and proj and use them, then make one permanent the way real aliases live: appended to ~/.bashrc, the file every new shell reads on startup.',
		keywords: ['Make your own shortcuts', 'alias workshop', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-audit-the-agent',
		sectionId: 'audit-the-agent',
		title: 'Practice: The agent wants to run 3 commands',
		part: 'Practice',
		description:
			'Your AI agent left a proposal in agent-plan.txt: three commands to "tidy the workspace and back up your notes". Two are helpful. One would erase your entire home directory. Read the plan, run the safe ones, and leave the dangerous one unrun.',
		keywords: ['The agent wants to run 3 commands', 'audit the agent', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-first-script',
		sectionId: 'first-script',
		title: 'Practice: Automate the backup',
		part: 'Practice',
		description:
			'Every day you copy notes.txt somewhere safe "later" — and forget. A script is a saved command sequence: use Edit a file to save the lesson’s three lines as backup.sh, make it executable, and run it.',
		keywords: ['Automate the backup', 'first script', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-exit-codes',
		sectionId: 'exit-codes',
		title: 'Practice: Only deploy when tests pass',
		part: 'Practice',
		description:
			'Every command reports back: exit code 0 means success, anything else means failure — and $? holds the last verdict. Chain with && so deploy runs only after tests succeed, and watch false stop the chain cold.',
		keywords: ['Only deploy when tests pass', 'exit codes', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-capstone',
		sectionId: 'capstone',
		title: 'Practice: One messy home folder',
		part: 'Practice',
		description:
			'The final challenge: a home directory that needs everything you have learned. Sort the downloads with globs, grep the crash out of the app log, then write and run a backup script. Navigate, organize, search, automate.',
		keywords: ['One messy home folder', 'capstone', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-quoting',
		sectionId: 'quoting',
		title: 'Practice: Mind the gap: spaces in names',
		part: 'Practice',
		description:
			'Two folders here have spaces in their names — the classic trap. Type one without quotes and the shell hears two separate words. Quote it, and the space is just a space. Get inside "My Projects" and leave a shipped.txt behind.',
		keywords: ['Mind the gap: spaces in names', 'quoting', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-capture-errors',
		sectionId: 'capture-errors',
		title: 'Practice: Catch the red text',
		part: 'Practice',
		description:
			'A command can produce two streams at once: normal output (stdout) and errors (stderr). List one real file and one missing one, then split the streams — the useful listing into found.txt, the scary error into errors.txt — with > and 2>.',
		keywords: ['Catch the red text', 'capture errors', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-script-args',
		sectionId: 'script-args',
		title: 'Practice: One script, any folder',
		part: 'Practice',
		description:
			'A script with a hard-coded path only ever backs up one thing. Swap the path for $1 — "the first word after the script\'s name" — and the same backup.sh works on any folder you hand it. Build it, then back up notes/ by running ./backup.sh notes.',
		keywords: ['One script, any folder', 'script args', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-help-lookup',
		sectionId: 'help-lookup',
		title: 'Practice: Find one answer in the manual',
		part: 'Practice',
		description:
			'The head command shows the beginning of a file. Read its short practice manual, then display just the first three lines of garden-notes.txt.',
		keywords: ['Find one answer in the manual', 'help lookup', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-count-lines',
		sectionId: 'count-lines',
		title: 'Practice: Count before you fix',
		part: 'Practice',
		description:
			"Before digging into a noisy log, quantify the problem: how many ERROR lines are in it? `wc -l` counts lines, and a pipe feeds grep's matches straight into it — so you count the errors instead of reading them. Save the total to error-count.txt.",
		keywords: ['Count before you fix', 'count lines', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-history-recall',
		sectionId: 'history-recall',
		title: 'Practice: Retrace your steps',
		part: 'Practice',
		description:
			'Every command you run this session is remembered. Instead of retyping a long one, ask your history for it. Run a couple of commands, then pipe `history` into `grep` to dig one back out — and save the line you found to recall.txt.',
		keywords: ['Retrace your steps', 'history recall', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-sed-rename',
		sectionId: 'sed-rename',
		title: 'Practice: Rebrand the menu',
		part: 'Practice',
		description:
			"Marketing renamed the mango everything — it's kiwi now. Rewrite menu.txt with sed's s/old/new/g and put the result in kiwi-menu.txt. The original file must survive untouched: sed rewrites the stream, and > catches it.",
		keywords: ['Rebrand the menu', 'sed rename', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-log-surgery',
		sectionId: 'log-surgery',
		title: 'Practice: Silence the debug noise',
		part: 'Practice',
		description:
			"app.log is drowning in DEBUG chatter and you need the story without it. Drop every DEBUG line with sed's d command and save what remains as clean.log — the original log stays intact for the postmortem.",
		keywords: ['Silence the debug noise', 'log surgery', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-in-place-audit',
		sectionId: 'in-place-audit',
		title: "Practice: The agent's mass edit",
		part: 'Practice',
		description:
			'Your agent proposes a mass find-and-replace: sed -i over every config file, switching http: to https:. Good idea — but its command has no backup, and -i rewrites the real files. Amend it to -i.bak, run it, and keep the undo button.',
		keywords: ["The agent's mass edit", 'in place audit', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-column-pull',
		sectionId: 'column-pull',
		title: 'Practice: Pull the column',
		part: 'Practice',
		description:
			'signups.csv has three columns and you only need one: the email addresses, for the launch announcement. Pull column 2 out of the commas — awk -F, or cut -d, both speak CSV — and save it as emails.txt.',
		keywords: ['Pull the column', 'column pull', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-free-the-port',
		sectionId: 'free-the-port',
		title: 'Practice: Free port 3000',
		part: 'Practice',
		description:
			"You start your dev server and the terminal says EADDRINUSE — address already in use. Yesterday's server never died and it is still holding port 3000. Find out who has the port, stop it, and get your own server listening.",
		keywords: ['Free port 3000', 'free the port', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-runaway-process',
		sectionId: 'runaway-process',
		title: 'Practice: Stop the runaway',
		part: 'Practice',
		description:
			'Your laptop fans are screaming. A stray script is burning 97% of a CPU core and it is not listening to reason — a polite kill bounces right off it. Find it, ask nicely first, then escalate.',
		keywords: ['Stop the runaway', 'runaway process', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-backstage-jobs',
		sectionId: 'backstage-jobs',
		title: 'Practice: Two things at once',
		part: 'Practice',
		description:
			'A slow build is about to hog your only terminal. Send it backstage with & so you get your prompt back, check what is running with jobs, then bring it into the spotlight with fg when you are ready to watch it finish.',
		keywords: ['Two things at once', 'backstage jobs', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-health-check',
		sectionId: 'health-check',
		title: 'Practice: Is it alive?',
		part: 'Practice',
		description:
			'Your agent says "the server is running." Maybe. A promise is not evidence — ask the server yourself with curl, and save the answer so you can show it to someone.',
		keywords: ['Is it alive?', 'health check', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-api-detective',
		sectionId: 'api-detective',
		title: 'Practice: Question the API',
		part: 'Practice',
		description:
			'You need the latest released version number, and the API answers in JSON — a nested pile of braces. Ask it with curl, pull out just the version with jq, and leave the answer in version.txt.',
		keywords: ['Question the API', 'api detective', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-secret-keeper',
		sectionId: 'secret-keeper',
		title: 'Practice: Practise a private settings file',
		part: 'Practice',
		description:
			'This lab uses a fake practice value. Copy the supplied example to .env, restrict its permissions, and inspect the script that reads the API_KEY variable. Never paste a real key into this terminal.',
		keywords: ['Practise a private settings file', 'secret keeper', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-open-the-crate',
		sectionId: 'open-the-crate',
		title: 'Practice: Peek, then unpack',
		part: 'Practice',
		description:
			'A release archive landed in your downloads. Before you scatter its contents across your folder, look inside — tar -t lists an archive without unpacking it. Then extract it for real.',
		keywords: ['Peek, then unpack', 'open the crate', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-summon-a-tool',
		sectionId: 'summon-a-tool',
		title: 'Practice: Install a tool',
		part: 'Practice',
		description:
			'A command your machine has never heard of is not a mystery — it is a file that is not there yet. Watch cowsay fail, install it, and watch the same command start working. Installing really is just "put a file where $PATH looks".',
		keywords: ['Install a tool', 'summon a tool', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-space-hog',
		sectionId: 'space-hog',
		title: 'Practice: Find the space hog',
		part: 'Practice',
		description:
			'Your disk is nearly full and you are about to delete things. Measure first: du -sh */ sizes every folder here, so you delete the one that actually matters instead of guessing.',
		keywords: ['Find the space hog', 'space hog', 'playground', 'practice'],
		kind: 'topic'
	},
	{
		id: 'topic-pg-midnight-deploy',
		sectionId: 'midnight-deploy',
		title: 'Practice: The midnight deploy',
		part: 'Practice',
		description:
			"It's late, the release is due, and nothing works. A stale server squats on port 3000, config.yml still points at insecure http, and you refuse to ship without proof. Free the port, fix the config safely, start the server, and verify with your own eyes.",
		keywords: ['The midnight deploy', 'midnight deploy', 'playground', 'practice'],
		kind: 'topic'
	}
];

export const searchIndex: SearchEntry[] = [...buildCommandEntries(), ...topicEntries];

export function scoreSearchEntry(entry: SearchEntry, rawQuery: string): number {
	const query = rawQuery.toLowerCase().trim();
	if (!query) return 0;

	const tokens = query.split(/\s+/).filter(Boolean);
	const command = entry.command?.toLowerCase() ?? '';
	// Titles and descriptions carry `backticks` around command mentions for
	// display; strip them so "command not found" still matches exactly.
	const title = entry.title.toLowerCase().replaceAll('`', '');
	const description = entry.description.toLowerCase().replaceAll('`', '');
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
