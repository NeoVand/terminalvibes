export type ShellTokenType =
	| 'git' // kept for CSS compatibility with the shared .tok-* styles
	| 'subcommand'
	| 'command'
	| 'flag'
	| 'string'
	| 'placeholder'
	| 'hash' // operators (| > >> < && || ;) and glob wildcards
	| 'arg'
	| 'comment'
	| 'conflict'
	| 'text'
	| 'space';

export interface ShellToken {
	text: string;
	type: ShellTokenType;
}

// Soft-landing aliases for code written against the old git tokenizer.
export type GitTokenType = ShellTokenType;
export type GitToken = ShellToken;

/** Executable name, e.g. `grep`, `xdg-open`, `explorer.exe` */
const COMMAND_WORD = /^[a-z][a-z0-9._-]*$/i;

/** A path used as a command, e.g. `./script.sh`, `~/bin/tool`, `/usr/bin/env` */
const PATH_COMMAND = /^(\.{1,2}\/|~\/|\/)[\w~./-]*$/;

/** Plain lowercase word that can be a subcommand, e.g. `install`, `cherry-pick` */
const SUBCOMMAND_WORD = /^[a-z][a-z-]*$/;

/** `<file>`, `$HOME`, `${VAR}`, `$?`, `$1`, `$@` */
const PLACEHOLDER = /<[^>]+>|\$\{?[A-Za-z_][A-Za-z0-9_]*\}?|\$[?!#$@*0-9-]/;

/** Glob patterns: `*.log`, `file?.txt`, `[abc].md` */
const GLOB = /[*?]|\[[^\]]+\]/;

/** Merge/diff conflict markers: `<<<<<<< HEAD`, `=======`, `>>>>>>> theirs` */
const CONFLICT_MARKER = /^(<{7}|={7}|>{7})(\s|$)/;

/** Commands whose following bare word is a subcommand (`git status`, `npm install`). */
const SUBCOMMAND_PARENTS = new Set([
	'git',
	'npm',
	'npx',
	'apt',
	'apt-get',
	'brew',
	'docker',
	'pip',
	'pip3',
	'cargo',
	'gh',
	'systemctl'
]);

/** Commands that run another command, so the next word is a command again. */
const COMMAND_PREFIXES = new Set(['sudo', 'env', 'xargs', 'time', 'watch', 'nohup']);

function classifyValue(value: string): ShellTokenType {
	if (value.startsWith('"') || value.startsWith("'")) return 'string';
	if (PLACEHOLDER.test(value)) return 'placeholder';
	if (GLOB.test(value)) return 'hash';
	return 'arg';
}

/**
 * Split a command into words and whitespace runs. Quoted segments stay
 * attached to their word, so `"two words"` and `--msg="A B"` are single
 * parts even though they contain spaces.
 */
function splitParts(command: string): string[] {
	const parts: string[] = [];
	let i = 0;
	while (i < command.length) {
		let j = i;
		if (/\s/.test(command[i])) {
			while (j < command.length && /\s/.test(command[j])) j++;
		} else {
			let quote: string | null = null;
			while (j < command.length && (quote !== null || !/\s/.test(command[j]))) {
				const ch = command[j];
				if (quote !== null) {
					if (ch === quote) quote = null;
				} else if (ch === '"' || ch === "'") {
					quote = ch;
				}
				j++;
			}
		}
		parts.push(command.slice(i, j));
		i = j;
	}
	return parts;
}

interface Segment {
	text: string;
	isOperator: boolean;
}

/**
 * Split an unquoted word into shell operators and the text between them, so
 * `demo&&cd` and `2>err.log` highlight correctly. `<placeholders>` are
 * skipped over — their angle brackets are not redirections.
 */
function splitOperators(part: string): Segment[] {
	const segments: Segment[] = [];
	let start = 0;
	let i = 0;
	while (i < part.length) {
		const rest = part.slice(i);
		const placeholder = /^<[^<>\s]+>/.exec(rest);
		if (placeholder) {
			i += placeholder[0].length;
			continue;
		}
		const op = /^(\|\||&&|\d?>>|\d?>|<|;|\||&)/.exec(rest);
		// A digit only belongs to a redirection (`2>`) at a word boundary —
		// in `file2>out` the 2 stays with `file2`.
		if (op && !(/^\d/.test(op[0]) && i > start)) {
			if (i > start) segments.push({ text: part.slice(start, i), isOperator: false });
			segments.push({ text: op[0], isOperator: true });
			i += op[0].length;
			start = i;
		} else {
			i++;
		}
	}
	if (start < part.length) segments.push({ text: part.slice(start), isOperator: false });
	return segments;
}

/** Operators after which a fresh command begins (as opposed to a redirection target). */
const COMMAND_SEPARATORS = new Set(['|', '||', '&&', ';', '&']);

/** Index of the first unquoted `#` that starts a comment, or -1. */
function findCommentStart(line: string): number {
	// A shebang is technically a comment, but never a trailing one.
	if (line.startsWith('#!')) return -1;
	let quote: string | null = null;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (quote !== null) {
			if (ch === quote) quote = null;
		} else if (ch === '"' || ch === "'") {
			quote = ch;
		} else if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) {
			return i;
		}
	}
	return -1;
}

/**
 * Split a single shell command into typed tokens for syntax highlighting.
 * Concatenating every token's text reproduces the original string exactly,
 * so wrapping tokens in elements never changes the rendered text.
 */
export function tokenizeShellCommand(command: string): ShellToken[] {
	// A line that IS a comment (including a shebang) stays one muted token.
	if (/^\s*#/.test(command)) {
		return command ? [{ text: command, type: 'comment' }] : [];
	}

	const tokens: ShellToken[] = [];
	let expectCommand = true; // next word is the executable (operators re-arm this)
	let afterRedirect = false; // next word is a redirection target (a file)
	let subcommandParent: string | null = null; // `git`/`npm`/… awaiting a subcommand

	for (const part of splitParts(command)) {
		if (!part) continue;

		if (/^\s+$/.test(part)) {
			tokens.push({ text: part, type: 'space' });
			continue;
		}

		// Quoted parts are never split on the operators inside them.
		const segments =
			part.startsWith('"') || part.startsWith("'")
				? [{ text: part, isOperator: false }]
				: splitOperators(part);

		for (const segment of segments) {
			if (segment.isOperator) {
				tokens.push({ text: segment.text, type: 'hash' });
				if (COMMAND_SEPARATORS.has(segment.text)) {
					expectCommand = true;
					afterRedirect = false;
				} else {
					afterRedirect = true;
				}
				subcommandParent = null;
				continue;
			}

			const word = segment.text;

			if (afterRedirect) {
				afterRedirect = false;
				tokens.push({ text: word, type: classifyValue(word) });
				continue;
			}

			if (expectCommand && (COMMAND_WORD.test(word) || PATH_COMMAND.test(word))) {
				tokens.push({ text: word, type: 'command' });
				expectCommand = COMMAND_PREFIXES.has(word);
				subcommandParent = SUBCOMMAND_PARENTS.has(word) ? word : null;
				continue;
			}
			expectCommand = false;

			if (word.startsWith('-') || word.startsWith('+')) {
				subcommandParent = null;
				const eq = word.indexOf('=');
				if (eq !== -1 && eq < word.length - 1) {
					// `--author="<name>"` → flag + value
					tokens.push({ text: word.slice(0, eq + 1), type: 'flag' });
					tokens.push({ text: word.slice(eq + 1), type: classifyValue(word.slice(eq + 1)) });
				} else {
					tokens.push({ text: word, type: 'flag' });
				}
				continue;
			}

			if (subcommandParent !== null && SUBCOMMAND_WORD.test(word)) {
				tokens.push({ text: word, type: 'subcommand' });
				subcommandParent = null;
				continue;
			}

			subcommandParent = null;
			tokens.push({ text: word, type: classifyValue(word) });
		}
	}

	return tokens;
}

// Soft-landing alias for code written against the old git tokenizer.
export const tokenizeGitCommand = tokenizeShellCommand;

/**
 * Tokenize one line of a pattern/config file (.gitignore-style ignore lists,
 * simple dotfiles). Unlike shell, `#` only starts a comment at the beginning
 * of the line, lines are patterns rather than commands, and a leading `!`
 * negates.
 */
function tokenizeConfigLine(line: string): ShellToken[] {
	if (!line) return [];
	const trimmed = line.trimStart();
	if (trimmed.startsWith('#')) {
		return [{ text: line, type: 'comment' }];
	}

	const tokens: ShellToken[] = [];
	const leading = line.length - trimmed.length;
	if (leading > 0) tokens.push({ text: line.slice(0, leading), type: 'space' });

	let pattern = trimmed;
	if (pattern.startsWith('!')) {
		tokens.push({ text: '!', type: 'flag' });
		pattern = pattern.slice(1);
	}
	// Wildcards and character classes stand out; literal path text stays plain.
	for (const segment of pattern.split(/(\*+|\?|\[[^\]]*\])/)) {
		if (!segment) continue;
		const isWildcard = /^(\*+|\?|\[[^\]]*\])$/.test(segment);
		tokens.push({ text: segment, type: isWildcard ? 'hash' : 'text' });
	}
	return tokens;
}

/** Highlight one line of TOML: `# comments`, `[section]` headers, and
 *  `key = value` (keys, the `=` operator, and quoted/scalar values each get a
 *  color). Multi-line string bodies (inside `"""…"""`) stay plain, which is
 *  fine for the prompt configs this renders. */
function tokenizeTomlLine(line: string): ShellToken[] {
	if (!line) return [];
	const trimmed = line.trimStart();
	const leading = line.length - trimmed.length;
	const out: ShellToken[] = [];
	if (leading > 0) out.push({ text: line.slice(0, leading), type: 'space' });

	if (trimmed.startsWith('#')) {
		out.push({ text: trimmed, type: 'comment' });
		return out;
	}
	// [table] or [[array-of-tables]]
	if (/^\[\[?.+?\]?\]$/.test(trimmed)) {
		out.push({ text: trimmed, type: 'command' });
		return out;
	}
	const eq = trimmed.indexOf('=');
	if (eq > 0) {
		const rawKey = trimmed.slice(0, eq);
		const key = rawKey.trimEnd();
		out.push({ text: key, type: 'flag' });
		const keyPad = rawKey.slice(key.length);
		if (keyPad) out.push({ text: keyPad, type: 'space' });
		out.push({ text: '=', type: 'hash' });

		const rawVal = trimmed.slice(eq + 1);
		const val = rawVal.trimStart();
		const valPad = rawVal.slice(0, rawVal.length - val.length);
		if (valPad) out.push({ text: valPad, type: 'space' });
		if (val) {
			const type =
				val[0] === '"' || val[0] === "'"
					? 'string'
					: /^(true|false|[-+]?\d)/.test(val)
						? 'arg'
						: 'text';
			out.push({ text: val, type });
		}
		return out;
	}
	out.push({ text: trimmed, type: 'text' });
	return out;
}

// 'gitignore' is a legacy alias for 'config' so existing call sites keep working.
export type CodeBlockMode = 'shell' | 'plain' | 'config' | 'gitignore' | 'toml';

/**
 * Tokenize one line of a code block. In `shell` mode the code portion is
 * highlighted as a command; in `config` mode lines are ignore/config
 * patterns; in `plain` mode only conflict markers and `#` comments are
 * highlighted and the rest is left as-is.
 */
function tokenizeLine(line: string, mode: CodeBlockMode): ShellToken[] {
	if (mode === 'config' || mode === 'gitignore') {
		return tokenizeConfigLine(line);
	}

	if (mode === 'toml') {
		return tokenizeTomlLine(line);
	}

	if (CONFLICT_MARKER.test(line)) {
		return [{ text: line, type: 'conflict' }];
	}

	const commentStart = findCommentStart(line);
	const code = commentStart === -1 ? line : line.slice(0, commentStart);
	const tokens: ShellToken[] = [];

	if (code) {
		if (mode === 'shell') {
			tokens.push(...tokenizeShellCommand(code));
		} else {
			tokens.push({ text: code, type: 'text' });
		}
	}
	if (commentStart !== -1) {
		tokens.push({ text: line.slice(commentStart), type: 'comment' });
	}
	return tokens;
}

/**
 * Tokenize a multi-line code block into one token list per line (lines do
 * not include their trailing `\n`). Joining each line's concatenated token
 * text with `\n` reproduces the original block exactly.
 */
export function tokenizeCodeBlock(code: string, mode: CodeBlockMode = 'shell'): ShellToken[][] {
	return code.split('\n').map((line) => tokenizeLine(line, mode));
}
