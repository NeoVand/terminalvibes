/**
 * runShellCommand — the bash interpreter behind the TerminalVibes playground.
 *
 * The parser supports exactly the subset the course teaches: quoting, $VAR /
 * ${VAR} / $? expansion, ~ expansion, globs, pipes, redirection, && || ;
 * chaining and comments. Everything bigger (command substitution, loops,
 * background jobs) gets a friendly "not in this playground" message instead
 * of a confusing half-implementation.
 *
 * Colored output is HTML with pre-escaped content styled via the terminal
 * CSS variables — same contract as GitVibes' colorizers.
 */

import {
	BIN_COMMANDS,
	GROUP,
	HOME,
	USER,
	globToRegExp,
	isGlob,
	ShellEngine,
	type VfsNode
} from './shell-engine';

export interface CommandResult {
	output: string;
	error?: boolean;
	colored?: boolean;
}

/* ── errors ───────────────────────────────────────────────────────── */

/** Parse-level failure (bash reports these with exit code 2). */
class ParseError extends Error {}

/** Command-level failure carrying its exit code. */
class CmdError extends Error {
	code: number;
	constructor(message: string, code = 1) {
		super(message);
		this.code = code;
	}
}

/* ── colorizing helpers ───────────────────────────────────────────── */

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const OUT_STYLE = 'color:var(--color-terminal-output)';
const ERR_STYLE = 'color:var(--color-diff-del)';
const DIR_STYLE = 'color:var(--color-terminal-prompt);font-weight:700';
const EXEC_STYLE = 'color:var(--color-diff-hash);font-weight:600';
const HEADING_STYLE = 'color:var(--color-terminal-prompt);font-weight:700';
const MATCH_STYLE = 'color:var(--color-diff-del);font-weight:700';
const META_STYLE = 'color:var(--color-diff-meta)';

function span(text: string, style: string): string {
	return `<span style="${style}">${esc(text)}</span>`;
}

/** The SGR colours Part 13.2 demonstrates: \e[32m is "switch the pen to green". */
const SGR_COLORS: Record<string, string> = {
	'30': '#5c6370',
	'31': '#e06c75',
	'32': '#67b177',
	'33': '#d19a66',
	'34': '#61afef',
	'35': '#c678dd',
	'36': '#56b6c2',
	'37': '#dcdfe4'
};

/** ESC (byte 27) followed by [ … m — the colour half of the VT100 vocabulary. */
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[([0-9;]*)m/;

/**
 * Turn a byte stream carrying escape sequences into the markup the terminal
 * pane draws — the in-band formatting of 13.2, actually obeyed rather than
 * printed. Anything that isn't a colour sequence is simply dropped, the same
 * way an emulator swallows an instruction it has no pen for.
 */
function ansiToHtml(text: string): string {
	let out = '';
	let rest = text;
	let style = '';
	const open = () => (style ? `<span style="${style}">` : '');
	const close = () => (style ? '</span>' : '');
	let match = ANSI_RE.exec(rest);
	while (match) {
		out += open() + esc(rest.slice(0, match.index)) + close();
		const codes = (match[1] || '0').split(';');
		for (const code of codes) {
			if (code === '' || code === '0') style = '';
			else if (code === '1') style = (style + ';font-weight:700').replace(/^;/, '');
			else if (SGR_COLORS[code]) style = `color:${SGR_COLORS[code]}`;
		}
		rest = rest.slice(match.index + match[0].length);
		match = ANSI_RE.exec(rest);
	}
	return out + open() + esc(rest) + close();
}

/* ── execution context ────────────────────────────────────────────── */

interface Ctx {
	engine: ShellEngine;
	/** Positional parameters $1..$9 (set for script execution). */
	params: string[];
	/**
	 * Variable store for plain NAME=value assignments. Interactively this is
	 * engine.shellVars, so they persist across commands but stay unexported;
	 * a script run with `bash file.sh` gets its own, thrown away on exit.
	 */
	vars: Record<string, string> | null;
	/** Nested-script guard. */
	depth: number;
	/** Exit code of the previous command — what $? expands to. */
	exit: number;
	/** Set by `exit` inside a script to stop the remaining lines. */
	exited: boolean;
}

interface ExecResult {
	/** stdout — newline-terminated when non-empty, so redirection is faithful. */
	out: string;
	/** stderr — kept separate so 2> can capture it. */
	err: string;
	code: number;
	/** Colored HTML alternative for `out` (display only, never piped). */
	html?: string;
}

const ok = (out = ''): ExecResult => ({ out, err: '', code: 0 });
const fail = (err: string, code = 1): ExecResult => ({
	out: '',
	err: err.endsWith('\n') ? err : err + '\n',
	code
});

interface DisplayPart {
	text: string;
	html?: string;
	isErr?: boolean;
}

interface LineResult {
	out: string;
	err: string;
	code: number;
	display: DisplayPart[];
}

/* ── tokenizer ────────────────────────────────────────────────────── */

type Quote = 'none' | 'single' | 'double';

interface WordPart {
	text: string;
	q: Quote;
}

type Token = { kind: 'word'; parts: WordPart[] } | { kind: 'op'; op: string };

const SUBST_MSG =
	'bash: command substitution ($(...) and backticks) is not supported in this playground.\nRun the inner command on its own first, then use its output by hand.';
const BG_MSG =
	'bash: & sends a command to the background, and this playground only supports it at the very end of a line.\nDid you mean && (run the next command only if this one succeeds)?';
const HEREDOC_MSG =
	"bash: here-documents (<<) are not supported here.\nTo put text in a file, try: echo 'some text' > file.txt";

function tokenize(line: string): Token[] {
	const tokens: Token[] = [];
	let parts: WordPart[] = [];

	const push = (text: string, q: Quote) => {
		const last = parts[parts.length - 1];
		if (last && last.q === q) last.text += text;
		else parts.push({ text, q });
	};
	const flush = () => {
		if (parts.length) {
			tokens.push({ kind: 'word', parts });
			parts = [];
		}
	};

	let i = 0;
	while (i < line.length) {
		const ch = line[i];
		if (ch === ' ' || ch === '\t') {
			flush();
			i++;
			continue;
		}
		// A comment only starts at the beginning of a word (bash rule).
		if (ch === '#' && parts.length === 0) break;
		if (ch === "'") {
			const close = line.indexOf("'", i + 1);
			if (close === -1) {
				throw new ParseError(
					"bash: unterminated single quote — close it with a second ' and run again"
				);
			}
			push(line.slice(i + 1, close), 'single');
			i = close + 1;
			continue;
		}
		if (ch === '"') {
			i++;
			let s = '';
			let closed = false;
			while (i < line.length) {
				const c = line[i];
				if (c === '"') {
					closed = true;
					i++;
					break;
				}
				if (c === '\\' && i + 1 < line.length && '"\\$`'.includes(line[i + 1])) {
					s += line[i + 1];
					i += 2;
					continue;
				}
				if (c === '`' || (c === '$' && line[i + 1] === '(')) throw new ParseError(SUBST_MSG);
				s += c;
				i++;
			}
			if (!closed) {
				throw new ParseError(
					'bash: unterminated double quote — close it with a second " and run again'
				);
			}
			push(s, 'double');
			continue;
		}
		if (ch === '\\') {
			if (i + 1 < line.length) push(line[i + 1], 'single');
			else push('\\', 'single');
			i += 2;
			continue;
		}
		if (ch === '`' || (ch === '$' && line[i + 1] === '(')) throw new ParseError(SUBST_MSG);
		if (ch === '&') {
			if (line[i + 1] === '&') {
				flush();
				tokens.push({ kind: 'op', op: '&&' });
				i += 2;
				continue;
			}
			flush();
			tokens.push({ kind: 'op', op: '&' });
			i += 1;
			continue;
		}
		if (ch === '|') {
			flush();
			if (line[i + 1] === '|') {
				tokens.push({ kind: 'op', op: '||' });
				i += 2;
			} else {
				tokens.push({ kind: 'op', op: '|' });
				i++;
			}
			continue;
		}
		if (ch === ';') {
			flush();
			tokens.push({ kind: 'op', op: ';' });
			i++;
			continue;
		}
		if (ch === '<') {
			if (line[i + 1] === '<') throw new ParseError(HEREDOC_MSG);
			flush();
			tokens.push({ kind: 'op', op: '<' });
			i++;
			continue;
		}
		if (ch === '>') {
			// `2>` is a stderr redirect only when the `2` is its own bare token
			// directly attached to the `>` — exactly bash's fd-number rule.
			let fd2 = false;
			if (parts.length === 1 && parts[0].q === 'none' && parts[0].text === '2') {
				fd2 = true;
				parts = [];
			} else {
				flush();
			}
			if (line[i + 1] === '>') {
				tokens.push({ kind: 'op', op: fd2 ? '2>>' : '>>' });
				i += 2;
			} else if (fd2 && line[i + 1] === '&' && line[i + 2] === '1') {
				tokens.push({ kind: 'op', op: '2>&1' });
				i += 3;
			} else {
				tokens.push({ kind: 'op', op: fd2 ? '2>' : '>' });
				i++;
			}
			continue;
		}
		push(ch, 'none');
		i++;
	}
	flush();
	return tokens;
}

/* ── expansion ────────────────────────────────────────────────────── */

/**
 * Quoted glob characters are swapped for control-char sentinels so the glob
 * expander only sees unquoted ones — `find . -name '*.txt'` must stay
 * literal while `rm *.txt` must expand. Sentinels are restored afterwards.
 */
const SENTINEL: Record<string, string> = {
	'*': '\u0001',
	'?': '\u0002',
	'[': '\u0003',
	']': '\u0004'
};
const UNSENTINEL: Record<string, string> = {
	'\u0001': '*',
	'\u0002': '?',
	'\u0003': '[',
	'\u0004': ']'
};

function protect(s: string): string {
	return s.replace(/[*?[\]]/g, (c) => SENTINEL[c]);
}

function restore(s: string): string {
	// eslint-disable-next-line no-control-regex -- the sentinels ARE control chars
	return s.replace(/[\u0001-\u0004]/g, (c) => UNSENTINEL[c]);
}

const VAR_RE = /\$(\?|#|@|\*|\d|\{[A-Za-z_][A-Za-z0-9_]*\}|[A-Za-z_][A-Za-z0-9_]*)/g;

function lookupVar(ctx: Ctx, name: string): string {
	if (name === '?') return String(ctx.exit);
	if (name === '#') return String(ctx.params.length);
	if (name === '@' || name === '*') return ctx.params.join(' ');
	if (/^\d$/.test(name)) {
		const n = Number(name);
		return n === 0 ? 'bash' : (ctx.params[n - 1] ?? '');
	}
	return ctx.vars?.[name] ?? ctx.engine.env[name] ?? '';
}

function expandVars(ctx: Ctx, text: string): string {
	return text.replace(VAR_RE, (_, name: string) =>
		lookupVar(ctx, name.startsWith('{') ? name.slice(1, -1) : name)
	);
}

/** Expand one word: $VAR, ~, then globs. May yield several words (globs) or none. */
function expandWord(ctx: Ctx, parts: WordPart[]): string[] {
	let joined = '';
	for (const part of parts) {
		let t = part.text;
		if (part.q !== 'single') t = expandVars(ctx, t);
		if (part.q !== 'none') t = protect(t);
		joined += t;
	}
	if (parts[0]?.q === 'none' && parts[0].text.startsWith('~')) {
		if (joined === '~' || joined.startsWith('~/')) {
			joined = (ctx.engine.env.HOME ?? HOME) + joined.slice(1);
		}
	}
	// An unquoted expansion that came out empty vanishes, like in bash.
	if (joined === '' && parts.every((p) => p.q === 'none')) return [];
	if (isGlob(joined)) {
		const matches = expandGlobWord(ctx.engine, joined);
		if (matches.length) return matches;
	}
	return [restore(joined)];
}

/** Per-segment glob expansion; unmatched patterns fall back to the literal word. */
function expandGlobWord(engine: ShellEngine, word: string): string[] {
	const isAbs = word.startsWith('/');
	const segs = word.split('/').filter((s) => s !== '');
	const join = (base: string, seg: string) =>
		base === '' ? seg : base === '/' ? '/' + seg : base + '/' + seg;
	let bases = [isAbs ? '/' : ''];
	let globSeen = false;
	for (const seg of segs) {
		const next: string[] = [];
		if (isGlob(seg)) {
			globSeen = true;
			const re = globToRegExp(seg);
			for (const base of bases) {
				const names = engine.listDir(base === '' ? engine.cwd : engine.resolve(base));
				if (!names) continue;
				for (const name of names) {
					if (name.startsWith('.') && !seg.startsWith('.')) continue;
					if (re.test(name)) next.push(join(base, name));
				}
			}
		} else {
			for (const base of bases) {
				const path = join(base, seg);
				if (!globSeen || engine.exists(path)) next.push(path);
			}
		}
		bases = next;
		if (!bases.length) return [];
	}
	return bases.sort((a, b) => a.localeCompare(b));
}

/* ── line splitting ───────────────────────────────────────────────── */

interface ChainSegment {
	joiner: '&&' | '||' | ';' | null;
	tokens: Token[];
}

function splitChain(tokens: Token[]): ChainSegment[] {
	const segs: ChainSegment[] = [];
	let cur: Token[] = [];
	let joiner: ChainSegment['joiner'] = null;
	for (const t of tokens) {
		if (t.kind === 'op' && (t.op === '&&' || t.op === '||' || t.op === ';')) {
			if (!cur.length) throw new ParseError(`bash: syntax error near unexpected token '${t.op}'`);
			segs.push({ joiner, tokens: cur });
			cur = [];
			joiner = t.op as ChainSegment['joiner'];
		} else {
			cur.push(t);
		}
	}
	if (cur.length) segs.push({ joiner, tokens: cur });
	else if (joiner === '&&' || joiner === '||') {
		throw new ParseError(
			`bash: the line ends with ${joiner} — add the command that should run next`
		);
	}
	return segs;
}

function splitPipes(tokens: Token[]): Token[][] {
	const stages: Token[][] = [];
	let cur: Token[] = [];
	for (const t of tokens) {
		if (t.kind === 'op' && t.op === '|') {
			if (!cur.length) throw new ParseError("bash: syntax error near unexpected token '|'");
			stages.push(cur);
			cur = [];
		} else {
			cur.push(t);
		}
	}
	if (!cur.length)
		throw new ParseError(
			'bash: the pipeline ends with | — add the command that should receive the output'
		);
	stages.push(cur);
	return stages;
}

/* ── stage parsing (alias + redirects + expansion) ────────────────── */

interface Redirect {
	op: '>' | '>>' | '<' | '2>' | '2>>' | '2>&1';
	target?: string;
}

function expandStage(ctx: Ctx, tokens: Token[]): { argv: string[]; redirs: Redirect[] } {
	let toks = tokens;
	// Alias expansion: first word only, once, and only if fully unquoted.
	const first = toks[0];
	if (first?.kind === 'word' && first.parts.every((p) => p.q === 'none')) {
		const name = first.parts.map((p) => p.text).join('');
		const value = ctx.engine.aliases.get(name);
		if (value !== undefined) {
			const aliasToks = tokenize(value);
			if (aliasToks.some((t) => t.kind === 'op' && ['|', '&&', '||', ';'].includes(t.op))) {
				throw new CmdError(
					`bash: the alias '${name}' contains pipes or chaining — real bash allows that, but this playground only expands simple aliases. Put it in a script instead.`
				);
			}
			toks = [...aliasToks, ...toks.slice(1)];
		}
	}
	const argv: string[] = [];
	const redirs: Redirect[] = [];
	for (let i = 0; i < toks.length; i++) {
		const t = toks[i];
		if (t.kind === 'op') {
			if (t.op === '2>&1') {
				redirs.push({ op: '2>&1' });
				continue;
			}
			const target = toks[++i];
			if (!target || target.kind !== 'word') {
				throw new CmdError(`bash: syntax error: ${t.op} needs a file name right after it`);
			}
			const expanded = expandWord(ctx, target.parts);
			if (expanded.length !== 1) {
				throw new CmdError(`bash: ${expanded.join(' ') || t.op}: ambiguous redirect`);
			}
			redirs.push({ op: t.op as Redirect['op'], target: expanded[0] });
		} else {
			argv.push(...expandWord(ctx, t.parts));
		}
	}
	return { argv, redirs };
}

function writeRedirect(
	engine: ShellEngine,
	target: string,
	content: string,
	append: boolean
): void {
	const abs = engine.resolve(target);
	if (engine.isDir(abs)) throw new CmdError(`bash: ${target}: Is a directory`);
	const slash = abs.lastIndexOf('/');
	const parent = abs.slice(0, slash) || '/';
	if (!engine.isDir(parent)) {
		throw new CmdError(
			`bash: ${target}: No such file or directory\n(the folder for that file doesn't exist yet — create it first with mkdir -p)`
		);
	}
	const prev = append ? (engine.readFile(abs) ?? '') : '';
	engine.writeFile(abs, prev + content);
}

/* ── pipeline & chain execution ───────────────────────────────────── */

interface PipeResult {
	out: string;
	err: string;
	code: number;
	html?: string;
}

async function runPipeline(ctx: Ctx, tokens: Token[]): Promise<PipeResult> {
	const stages = splitPipes(tokens);
	let stdin: string | null = null;
	let errAcc = '';
	let res: ExecResult = ok();
	for (const stage of stages) {
		const { argv, redirs } = expandStage(ctx, stage);
		let input = stdin;
		let inputErr: string | null = null;
		for (const r of redirs) {
			if (r.op === '<') {
				const content = ctx.engine.readFile(ctx.engine.resolve(r.target!));
				if (content === null) inputErr = `bash: ${r.target}: No such file or directory`;
				else input = content;
			}
		}
		if (inputErr) res = fail(inputErr);
		else if (!argv.length) res = ok();
		else res = await execSimple(ctx, argv, input);
		try {
			if (redirs.some((r) => r.op === '2>&1')) {
				res.out += res.err;
				res.err = '';
				res.html = undefined;
			}
			for (const r of redirs) {
				if (r.op === '2>' || r.op === '2>>') {
					writeRedirect(ctx.engine, r.target!, res.err, r.op === '2>>');
					res.err = '';
				} else if (r.op === '>' || r.op === '>>') {
					writeRedirect(ctx.engine, r.target!, res.out, r.op === '>>');
					res.out = '';
					res.html = undefined;
				}
			}
		} catch (e) {
			res = fail(e instanceof Error ? e.message : String(e));
		}
		errAcc += res.err;
		stdin = res.out;
		if (ctx.exited) break;
	}
	return { out: res.out, err: errAcc, code: res.code, html: res.html };
}

const trimNl = (s: string) => s.replace(/\n$/, '');

async function runLine(ctx: Ctx, line: string): Promise<LineResult> {
	let tokens: Token[];
	try {
		tokens = tokenize(line);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { out: '', err: msg + '\n', code: 2, display: [{ text: msg, isErr: true }] };
	}
	if (!tokens.length) return { out: '', err: '', code: ctx.exit, display: [] };

	// A trailing & sends the line backstage. The sandbox has no real
	// concurrency, so a background job is a process-table row holding the
	// command line; `fg` is what finally runs it.
	const bgAt = tokens.findIndex((t) => t.kind === 'op' && t.op === '&');
	if (bgAt !== -1) {
		if (bgAt !== tokens.length - 1) {
			return { out: '', err: BG_MSG + '\n', code: 2, display: [{ text: BG_MSG, isErr: true }] };
		}
		tokens = tokens.slice(0, -1);
		if (!tokens.length) {
			const msg = "bash: syntax error near unexpected token '&'";
			return { out: '', err: msg + '\n', code: 2, display: [{ text: msg, isErr: true }] };
		}
		const command = line.replace(/\s*&\s*$/, '').trim();
		const job = ctx.engine.allocateJob();
		const proc = ctx.engine.spawnProcess({
			command,
			cpu: 0.5,
			mem: 0.8,
			job,
			pending: command
		});
		const text = `[${job}] ${proc.pid}`;
		return { out: text + '\n', err: '', code: 0, display: [{ text, isErr: false }] };
	}

	let chain: ChainSegment[];
	try {
		chain = splitChain(tokens);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { out: '', err: msg + '\n', code: 2, display: [{ text: msg, isErr: true }] };
	}

	let code = ctx.exit;
	let out = '';
	let errAll = '';
	const display: DisplayPart[] = [];
	for (const seg of chain) {
		if (seg.joiner === '&&' && code !== 0) continue;
		if (seg.joiner === '||' && code === 0) continue;
		let res: PipeResult;
		try {
			res = await runPipeline(ctx, seg.tokens);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			res = { out: '', err: msg + '\n', code: e instanceof CmdError ? e.code : 2 };
		}
		if (res.err) display.push({ text: trimNl(res.err), isErr: true });
		if (res.out) display.push({ text: trimNl(res.out), html: res.html });
		out += res.out;
		errAll += res.err;
		code = res.code;
		ctx.exit = code;
		if (ctx.exited) break;
	}
	return { out, err: errAll, code, display };
}

/* ── command dispatch ─────────────────────────────────────────────── */

const KEYWORDS = new Set([
	'for',
	'while',
	'until',
	'if',
	'then',
	'else',
	'elif',
	'fi',
	'case',
	'esac',
	'do',
	'done',
	'select',
	'function'
]);

const STUBS = new Set(['nano', 'vim', 'vi', 'sudo', 'wget', 'ssh', 'open', 'xdg-open', 'top']);

const ASSIGN_RE = /^[A-Za-z_][A-Za-z0-9_]*=/;

async function execSimple(ctx: Ctx, argvIn: string[], stdin: string | null): Promise<ExecResult> {
	let argv = argvIn;
	// Leading NAME=value assignments. Simplification vs bash: they persist
	// (bash scopes `X=1 cmd` to that one command) — fine for teaching.
	let n = 0;
	while (n < argv.length && ASSIGN_RE.test(argv[n])) n++;
	if (n > 0) {
		const store = ctx.vars ?? ctx.engine.env;
		for (let j = 0; j < n; j++) {
			const eq = argv[j].indexOf('=');
			store[argv[j].slice(0, eq)] = argv[j].slice(eq + 1);
		}
		argv = argv.slice(n);
		if (!argv.length) return ok();
	}
	const cmd = argv[0];
	const args = argv.slice(1);
	try {
		return await dispatch(ctx, cmd, args, stdin);
	} catch (e) {
		if (e instanceof CmdError) return fail(e.message, e.code);
		if (e instanceof ParseError) return fail(e.message, 2);
		if (e instanceof Error) return fail(e.message);
		throw e;
	}
}

async function dispatch(
	ctx: Ctx,
	cmd: string,
	args: string[],
	stdin: string | null
): Promise<ExecResult> {
	const engine = ctx.engine;
	if (KEYWORDS.has(cmd)) {
		return fail(
			`bash: \`${cmd}\` starts a loop or conditional — real bash, but this playground keeps interactive input to single commands.\nChain commands with && or ; instead, or save loops for a script on your real machine.`,
			2
		);
	}
	if (cmd.includes('/')) return runScriptFile(ctx, cmd, args);

	// `<command> --help` is the lookup habit Part 1.3 teaches, so it has to
	// answer for every command that has a page. echo/printf print it instead,
	// exactly as the real builtins do.
	if (args.includes('--help') && cmd !== 'echo' && cmd !== 'printf') {
		const help = usageFor(cmd);
		if (help) return help;
	}

	switch (cmd) {
		case 'agent':
			// Interactive `agent` is intercepted by the playground terminal
			// BEFORE it reaches this interpreter; landing here means a pipe,
			// a script line, or another agent's sandbox tried to start it.
			return fail(
				'agent: starts an interactive session, so it only works typed directly at a playground prompt —\nnot inside pipes, scripts, or another agent\'s terminal. Try: agent "<task>"',
				2
			);
		case 'pwd':
			return ok(engine.cwd + '\n');
		case 'cd':
			return cmdCd(engine, args);
		case 'ls':
			return cmdLs(engine, args);
		case 'mkdir':
			return cmdMkdir(engine, args);
		case 'touch':
			return cmdTouch(engine, args);
		case 'cat':
			return cmdCat(engine, args, stdin);
		case 'less':
		case 'more':
			return cmdPager(engine, cmd, args, stdin);
		case 'head':
		case 'tail':
			return cmdHeadTail(engine, cmd, args, stdin);
		case 'wc':
			return cmdWc(engine, args, stdin);
		case 'grep':
			return cmdGrep(engine, args, stdin);
		case 'sort':
			return cmdSort(engine, args, stdin);
		case 'uniq':
			return cmdUniq(engine, args, stdin);
		case 'cut':
			return cmdCut(engine, args, stdin);
		case 'tr':
			return cmdTr(args, stdin);
		case 'sed':
			return cmdSed(engine, args, stdin);
		case 'awk':
			return cmdAwk(engine, args, stdin);
		case 'ps':
			return cmdPs(engine, args);
		case 'pgrep':
			return cmdPgrep(engine, args);
		case 'kill':
			return cmdKill(engine, args);
		case 'lsof':
			return cmdLsof(engine, args);
		case 'jobs':
			return cmdJobs(engine);
		case 'fg':
			return await cmdFg(ctx, args);
		case 'bg':
			return cmdBg(engine, args);
		case 'serve':
			return cmdServe(engine, args);
		case 'echo':
			return cmdEcho(args);
		case 'printf':
			return cmdPrintf(args);
		case 'cp':
			return cmdCp(engine, args);
		case 'mv':
			return cmdMv(engine, args);
		case 'rm':
			return cmdRm(engine, args);
		case 'rmdir':
			return cmdRmdir(engine, args);
		case 'find':
			return cmdFind(engine, args);
		case 'which':
			return cmdWhich(engine, args);
		case 'type':
			return cmdType(engine, args);
		case 'whoami':
			return ok(USER + '\n');
		case 'id':
			return cmdId(args);
		case 'date':
			return cmdDate();
		case 'cal':
			return cmdCal();
		case 'clear':
			return ok('__CLEAR__\n');
		case 'help':
			return cmdHelp();
		case 'man':
			return cmdMan(args);
		case 'history':
			return ok(
				engine.historyLog.map((c, i) => `${String(i + 1).padStart(5)}  ${c}`).join('\n') + '\n'
			);
		case 'env':
			return ok(
				Object.entries(engine.env)
					.map(([k, v]) => `${k}=${v}`)
					.join('\n') + '\n'
			);
		case 'export':
			return cmdExport(ctx, args);
		case 'unset':
			for (const name of args) {
				delete engine.env[name];
				if (ctx.vars) delete ctx.vars[name];
			}
			return ok();
		case 'alias':
			return cmdAlias(engine, args);
		case 'unalias':
			return cmdUnalias(engine, args);
		case 'chmod':
			return cmdChmod(engine, args);
		case 'df':
			return cmdDf(args);
		case 'du':
			return cmdDu(engine, args);
		case 'diff':
			return cmdDiff(engine, args);
		case 'file':
			return cmdFile(engine, args);
		case 'stat':
			return cmdStat(engine, args);
		case 'basename':
			return cmdBasename(args);
		case 'dirname':
			return cmdDirname(args);
		case 'seq':
			return cmdSeq(args);
		case 'tee':
			return cmdTee(engine, args, stdin);
		case 'xargs':
			return cmdXargs(ctx, args, stdin);
		case 'sleep':
			return cmdSleep(args);
		case 'true':
			return ok();
		case 'false':
			return { out: '', err: '', code: 1 };
		case 'exit':
			return cmdExit(ctx, args);
		case 'source':
		case '.':
			return cmdSource(ctx, args);
		case 'bash':
		case 'sh':
			return cmdBash(ctx, cmd, args);
		case 'nano':
		case 'vim':
		case 'vi':
			return cmdEditorStub(cmd, args);
		case 'sudo':
			return cmdSudo(args);
		case 'tar':
			return cmdTar(engine, args);
		case 'zip':
			return cmdZip(engine, args);
		case 'unzip':
			return cmdUnzip(engine, args);
		case 'brew':
		case 'apt':
		case 'apt-get':
		case 'npm':
			return cmdPackageManager(engine, cmd, args);
		case 'cowsay':
		case 'tldr':
			// Installable tools only answer once they exist on disk — that is the
			// whole point of 10.1, so the sandbox refuses them until then.
			if (!engine.isFile(`/usr/local/bin/${cmd}`)) {
				return fail(
					`bash: ${cmd}: command not found\n(nothing on your $PATH has that name yet — install it first: brew install ${cmd})`,
					127
				);
			}
			return cmd === 'cowsay' ? cmdCowsay(args) : cmdTldr(args);
		case 'curl':
			return cmdCurl(engine, args);
		case 'jq':
			return cmdJq(engine, args, stdin);
		case 'wget':
			return cmdWget(engine, args);
		case 'ssh':
			return ok(
				`ssh: (simulated) on a real machine this would open a secure shell on another computer${args[0] ? ` (${args[0]})` : ''} —\nyour terminal would then be running commands THERE, not here. The sandbox has no network, so nothing was connected.\n`
			);
		case 'open':
		case 'xdg-open':
			return ok(
				`${cmd}: (simulated) on a real machine this would open ${args[0] ? `'${args[0]}'` : 'the current folder'} in its default app —\nFinder/Explorer for folders, your browser for URLs. The sandbox has no GUI to open.\n`
			);
		case 'top':
			return ok(
				`top - snapshot (simulated)\nTasks: ${engine.processes.length + 1} total\n${psTable(engine, true)}(real top redraws live and quits with q — the sandbox shows one frozen frame; ps is the snapshot you can pipe)\n`
			);
	}

	// PATH lookup: an executable file sitting in a PATH-listed directory runs
	// as a script — this is how the "command not found" lesson resolves.
	let foundNonExec: string | null = null;
	for (const dir of (engine.env.PATH ?? '').split(':')) {
		if (!dir) continue;
		const candidate = `${dir}/${cmd}`;
		const abs = engine.resolve(candidate);
		if (engine.isExecutable(abs)) return runScript(ctx, abs, args);
		if (engine.isFile(abs)) foundNonExec = candidate;
	}
	if (foundNonExec) {
		return fail(
			`bash: ${cmd}: Permission denied\n(${foundNonExec} exists but isn't executable — try: chmod +x ${foundNonExec})`,
			126
		);
	}
	return fail(
		`bash: ${cmd}: command not found\n(try \`help\` for the supported list — or check for a typo)`,
		127
	);
}

/* ── scripts ──────────────────────────────────────────────────────── */

async function runScriptFile(ctx: Ctx, path: string, args: string[]): Promise<ExecResult> {
	const engine = ctx.engine;
	const abs = engine.resolve(path);
	if (!engine.exists(abs)) return fail(`bash: ${path}: No such file or directory`, 127);
	if (engine.isDir(abs)) return fail(`bash: ${path}: Is a directory`, 126);
	if (!engine.isExecutable(abs)) {
		const name = path.split('/').pop();
		return fail(
			`bash: ${path}: Permission denied\n(the file exists but isn't executable — try: chmod +x ${name})`,
			126
		);
	}
	return runScript(ctx, abs, args);
}

async function runScript(ctx: Ctx, absPath: string, params: string[]): Promise<ExecResult> {
	const content = ctx.engine.readFile(absPath) ?? '';
	return runScriptContent(ctx, content, params, false);
}

/**
 * The script subset: comments, blank lines, NAME=value variables, $1-$9,
 * and every interactive command. `source` shares the caller's variable
 * store; `bash script.sh` gets its own (reads still fall back to env).
 */
async function runScriptContent(
	ctx: Ctx,
	content: string,
	params: string[],
	sourceMode: boolean
): Promise<ExecResult> {
	if (ctx.depth >= 8) {
		return fail('bash: scripts nested too deep — the sandbox stops at 8 levels');
	}
	const sub: Ctx = {
		engine: ctx.engine,
		params,
		vars: sourceMode ? ctx.vars : {},
		depth: ctx.depth + 1,
		exit: 0,
		exited: false
	};
	let out = '';
	let err = '';
	let code = 0;
	for (const raw of content.split('\n')) {
		const line = raw.trim();
		if (!line || line.startsWith('#')) continue;
		const res = await runLine(sub, line);
		out += res.out;
		err += res.err;
		code = res.code;
		if (sub.exited) break;
	}
	return { out, err, code };
}

/* ── flag helper ──────────────────────────────────────────────────── */

/**
 * Split argv into clustered single-letter flags and positional args.
 * `--` ends flag parsing; an unknown letter is a teaching moment.
 */
function flagSplit(
	args: string[],
	allowed: string,
	cmd: string
): { flags: Set<string>; rest: string[] } {
	const flags = new Set<string>();
	const rest: string[] = [];
	let noMore = false;
	for (const a of args) {
		if (!noMore && a === '--') {
			noMore = true;
			continue;
		}
		if (!noMore && a.startsWith('-') && a.length > 1 && !/^-\d/.test(a)) {
			for (const ch of a.slice(1)) {
				if (!allowed.includes(ch)) {
					throw new CmdError(
						`${cmd}: invalid option -- '${ch}'\n(this playground supports: ${[...allowed]
							.map((f) => '-' + f)
							.join(' ')})`
					);
				}
				flags.add(ch);
			}
		} else {
			rest.push(a);
		}
	}
	return { flags, rest };
}

/* ── file & directory commands ────────────────────────────────────── */

function cmdCd(engine: ShellEngine, args: string[]): ExecResult {
	let target: string;
	let echoTarget = false;
	if (!args.length) {
		target = engine.env.HOME ?? HOME;
	} else if (args[0] === '-') {
		const prev = engine.env.OLDPWD;
		if (!prev)
			return fail(
				"bash: cd: OLDPWD not set\n(cd - jumps back to the previous directory — but you haven't changed directory yet)"
			);
		target = prev;
		echoTarget = true;
	} else {
		target = args[0];
	}
	const abs = engine.resolve(target);
	if (!engine.exists(abs)) {
		return fail(
			`bash: cd: ${args[0] ?? target}: No such file or directory\n(check the spelling — \`ls\` shows what's actually here)`
		);
	}
	if (!engine.isDir(abs)) {
		return fail(
			`bash: cd: ${args[0]}: Not a directory\n(that's a file — cd only enters directories)`
		);
	}
	engine.env.OLDPWD = engine.cwd;
	engine.cwd = abs;
	engine.env.PWD = abs;
	return ok(echoTarget ? abs + '\n' : '');
}

function modeString(node: VfsNode): string {
	const type = node.kind === 'dir' ? 'd' : '-';
	if (node.mode) return type + node.mode;
	if (node.kind === 'dir') return 'drwxr-xr-x';
	return node.executable ? '-rwxr-xr-x' : '-rw-r--r--';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtMtime(ms: number): string {
	const d = new Date(ms);
	const p = (x: number) => String(x).padStart(2, '0');
	return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function lsName(node: VfsNode, name: string, classify: boolean): { text: string; html: string } {
	let suffix = '';
	if (classify && node.kind === 'dir') suffix = '/';
	else if (classify && node.kind === 'file' && node.executable) suffix = '*';
	let style =
		node.kind === 'dir'
			? DIR_STYLE
			: node.kind === 'file' && node.executable
				? EXEC_STYLE
				: OUT_STYLE;
	if (name.startsWith('.') && name !== '.' && name !== '..') style += ';opacity:0.7';
	return { text: name + suffix, html: span(name + suffix, style) };
}

/**
 * Disk blocks a node occupies, in the 1K units `ls -l` and `du` report.
 * Storage is handed out in 4K chunks, so even a 12-byte file costs 4 — which
 * is why a real `total` is never the number of entries (Part 2.3).
 */
function blocksOf(node: VfsNode): number {
	if (node.kind === 'dir') return 4;
	return Math.ceil(node.content.length / 4096) * 4;
}

/**
 * The link count column. A file has one name; a directory is pointed at by
 * its own `.`, its parent's entry for it, and one `..` per subdirectory.
 */
function linkCount(node: VfsNode): number {
	if (node.kind !== 'dir') return 1;
	let subdirs = 0;
	for (const child of node.children.values()) if (child.kind === 'dir') subdirs++;
	return 2 + subdirs;
}

function lsLongLine(
	node: VfsNode,
	name: string,
	classify: boolean,
	human = false
): { text: string; html: string } {
	const mode = modeString(node);
	const links = linkCount(node);
	const bytes = node.kind === 'dir' ? 4096 : node.content.length;
	const size = human ? humanSize(bytes) : String(bytes);
	const meta = ` ${links} ${USER} ${GROUP} ${size.padStart(6)} ${fmtMtime(node.mtime)} `;
	const nm = lsName(node, name, classify);
	return {
		text: mode + meta + nm.text,
		html: span(mode, META_STYLE) + span(meta, OUT_STYLE) + nm.html
	};
}

function cmdLs(engine: ShellEngine, args: string[]): ExecResult {
	const { flags, rest } = flagSplit(args, 'laFRht', 'ls');
	const long = flags.has('l');
	const all = flags.has('a');
	const classify = flags.has('F');
	const recursive = flags.has('R');
	const human = flags.has('h');
	const byTime = flags.has('t');
	const paths = rest.length ? rest : ['.'];

	const errs: string[] = [];
	const filePaths: string[] = [];
	const dirPaths: string[] = [];
	for (const p of paths) {
		const node = engine.getNode(engine.resolve(p));
		if (!node) errs.push(`ls: cannot access '${p}': No such file or directory`);
		else if (node.kind === 'dir') dirPaths.push(p);
		else filePaths.push(p);
	}

	// Groups of lines; groups are joined by a blank line, like real ls.
	const groups: { text: string[]; html: string[] }[] = [];
	const group = () => {
		const g = { text: [] as string[], html: [] as string[] };
		groups.push(g);
		return g;
	};

	if (filePaths.length) {
		const g = group();
		if (long) {
			for (const f of filePaths) {
				const node = engine.getNode(engine.resolve(f))!;
				const line = lsLongLine(node, f, classify, human);
				g.text.push(line.text);
				g.html.push(line.html);
			}
		} else {
			const names = filePaths.map((f) => lsName(engine.getNode(engine.resolve(f))!, f, classify));
			g.text.push(names.map((n) => n.text).join('  '));
			g.html.push(names.map((n) => n.html).join('  '));
		}
	}

	const listDir = (label: string, abs: string, header: boolean) => {
		const g = group();
		if (header) {
			g.text.push(`${label}:`);
			g.html.push(span(`${label}:`, 'font-weight:600;color:var(--color-terminal-command)'));
		}
		let names = engine.listDir(abs)!;
		if (!all) names = names.filter((n) => !n.startsWith('.'));
		const entries = names.map((n) => ({
			name: n,
			node: engine.getNode(abs === '/' ? '/' + n : abs + '/' + n)!
		}));
		if (all) {
			entries.unshift(
				{ name: '.', node: engine.getNode(abs)! },
				{ name: '..', node: engine.getNode(engine.resolve(abs + '/..'))! }
			);
		}
		// -t sorts newest first; without it ls stays alphabetical.
		if (byTime) entries.sort((a, b) => b.node.mtime - a.node.mtime);
		if (long) {
			// `total` counts disk blocks, not files (Part 2.3 says so explicitly).
			const total = entries.reduce((sum, e) => sum + blocksOf(e.node), 0);
			g.text.push(`total ${total}`);
			g.html.push(span(`total ${total}`, OUT_STYLE));
			for (const e of entries) {
				const line = lsLongLine(e.node, e.name, classify, human);
				g.text.push(line.text);
				g.html.push(line.html);
			}
		} else if (entries.length) {
			const names2 = entries.map((e) => lsName(e.node, e.name, classify));
			g.text.push(names2.map((n) => n.text).join('  '));
			g.html.push(names2.map((n) => n.html).join('  '));
		}
	};

	if (recursive) {
		for (const p of dirPaths) {
			const collect: { label: string; abs: string }[] = [];
			const visit = (label: string, abs: string) => {
				collect.push({ label, abs });
				let names = engine.listDir(abs)!;
				if (!all) names = names.filter((n) => !n.startsWith('.'));
				for (const n of names) {
					const childAbs = abs === '/' ? '/' + n : abs + '/' + n;
					if (engine.isDir(childAbs)) visit(`${label}/${n}`, childAbs);
				}
			};
			visit(p, engine.resolve(p));
			for (const { label, abs } of collect) listDir(label, abs, true);
		}
	} else {
		const headers = paths.length > 1;
		for (const p of dirPaths) listDir(p, engine.resolve(p), headers);
	}

	const out = groups
		.map((g) => g.text.join('\n'))
		.filter(Boolean)
		.join('\n\n');
	const html = groups
		.map((g) => g.html.join('\n'))
		.filter(Boolean)
		.join('\n\n');
	return {
		out: out ? out + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 2 : 0,
		html: out ? html : undefined
	};
}

function cmdMkdir(engine: ShellEngine, args: string[]): ExecResult {
	const { flags, rest } = flagSplit(args, 'p', 'mkdir');
	if (!rest.length) {
		return fail('mkdir: missing operand\n(tell it what to create: mkdir my-folder)');
	}
	const errs: string[] = [];
	for (const p of rest) {
		const abs = engine.resolve(p);
		if (flags.has('p')) {
			try {
				engine.mkdirp(abs);
			} catch {
				errs.push(
					`mkdir: cannot create directory '${p}': Not a directory\n(part of that path is an existing file, not a folder)`
				);
			}
			continue;
		}
		if (engine.exists(abs)) {
			errs.push(`mkdir: cannot create directory '${p}': File exists`);
			continue;
		}
		const parent = abs.slice(0, abs.lastIndexOf('/')) || '/';
		if (!engine.isDir(parent)) {
			errs.push(
				`mkdir: cannot create directory '${p}': No such file or directory\n(the parent folder doesn't exist — mkdir -p creates the whole chain at once)`
			);
			continue;
		}
		engine.mkdirp(abs);
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

function cmdTouch(engine: ShellEngine, args: string[]): ExecResult {
	if (!args.length) return fail('touch: missing file operand\n(give it a name: touch notes.txt)');
	const errs: string[] = [];
	for (const p of args) {
		const abs = engine.resolve(p);
		const node = engine.getNode(abs);
		if (node) {
			node.mtime = Date.now();
			continue;
		}
		const parent = abs.slice(0, abs.lastIndexOf('/')) || '/';
		if (!engine.isDir(parent)) {
			errs.push(
				`touch: cannot touch '${p}': No such file or directory\n(create the folder first: mkdir -p ${parent})`
			);
			continue;
		}
		engine.writeFile(abs, '');
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

function readSources(
	engine: ShellEngine,
	files: string[],
	stdin: string | null,
	cmd: string
): { content: string; errs: string[] } {
	if (!files.length) {
		if (stdin === null) {
			throw new CmdError(
				`${cmd}: no input — give it a file (${cmd} notes.txt) or pipe text in (cat notes.txt | ${cmd})`
			);
		}
		return { content: stdin, errs: [] };
	}
	let content = '';
	const errs: string[] = [];
	for (const f of files) {
		const abs = engine.resolve(f);
		if (engine.isDir(abs)) errs.push(`${cmd}: ${f}: Is a directory`);
		else {
			const c = engine.readFile(abs);
			if (c === null) errs.push(`${cmd}: ${f}: No such file or directory`);
			else content += c;
		}
	}
	return { content, errs };
}

function toLines(content: string): string[] {
	const lines = content.split('\n');
	if (lines[lines.length - 1] === '') lines.pop();
	return lines;
}

function cmdCat(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	const { flags, rest } = flagSplit(args, 'n', 'cat');
	const { content, errs } = readSources(engine, rest, stdin, 'cat');
	// cat on an archive would spray its manifest across the screen; say what it
	// is instead, the way a real terminal warns you about binary files.
	const archive = readArchive(content);
	if (archive) {
		return ok(
			`(this is a packed archive, not text — ${Object.keys(archive.entries).length} files inside)\n` +
				`(peek without unpacking: tar -tzf ${rest[0] ?? 'ARCHIVE'})\n`
		);
	}
	let out = content;
	if (flags.has('n') && out) {
		out =
			toLines(out)
				.map((l, i) => `${String(i + 1).padStart(6)}\t${l}`)
				.join('\n') + '\n';
	}
	return { out, err: errs.length ? errs.join('\n') + '\n' : '', code: errs.length ? 1 : 0 };
}

function cmdPager(
	engine: ShellEngine,
	cmd: string,
	args: string[],
	stdin: string | null
): ExecResult {
	const { content, errs } = readSources(engine, args, stdin, cmd);
	if (errs.length) return fail(errs.join('\n'));
	const note = `\n(${cmd} is a pager: in a real terminal you'd scroll with space/↑↓ and press q to quit — here the whole text is printed at once)\n`;
	return ok((content.endsWith('\n') || !content ? content : content + '\n') + note);
}

function cmdHeadTail(
	engine: ShellEngine,
	cmd: string,
	args: string[],
	stdin: string | null
): ExecResult {
	let n = 10;
	const files: string[] = [];
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		let value: string | null = null;
		if (a === '-n') value = args[++i] ?? '';
		else if (/^-n\d+$/.test(a)) value = a.slice(2);
		else if (/^-\d+$/.test(a)) value = a.slice(1);
		else if (a.startsWith('-'))
			throw new CmdError(
				`${cmd}: invalid option '${a}'\n(this playground supports -n N, e.g. ${cmd} -n 5 file.txt)`
			);
		else {
			files.push(a);
			continue;
		}
		const parsed = parseInt(value, 10);
		if (Number.isNaN(parsed) || parsed < 0) {
			throw new CmdError(`${cmd}: invalid number of lines: '${value}'`);
		}
		n = parsed;
	}
	const pieces: string[] = [];
	const errs: string[] = [];
	const sources: { label: string | null; content: string }[] = [];
	if (!files.length) {
		if (stdin === null) {
			throw new CmdError(`${cmd}: no input — give it a file (${cmd} -n 5 log.txt) or pipe text in`);
		}
		sources.push({ label: null, content: stdin });
	} else {
		for (const f of files) {
			const abs = engine.resolve(f);
			if (engine.isDir(abs)) errs.push(`${cmd}: error reading '${f}': Is a directory`);
			else {
				const c = engine.readFile(abs);
				if (c === null)
					errs.push(`${cmd}: cannot open '${f}' for reading: No such file or directory`);
				else sources.push({ label: files.length > 1 ? f : null, content: c });
			}
		}
	}
	for (const s of sources) {
		const lines = toLines(s.content);
		const take = cmd === 'head' ? lines.slice(0, n) : lines.slice(Math.max(0, lines.length - n));
		if (s.label !== null) pieces.push(`==> ${s.label} <==`);
		if (take.length) pieces.push(take.join('\n'));
	}
	return {
		out: pieces.length ? pieces.join('\n') + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 1 : 0
	};
}

function cmdWc(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	const { flags, rest } = flagSplit(args, 'lwc', 'wc');
	const showAll = flags.size === 0;
	const counts = (content: string): number[] => {
		const l = (content.match(/\n/g) ?? []).length;
		const w = content.split(/\s+/).filter(Boolean).length;
		const c = content.length;
		const sel: number[] = [];
		if (showAll || flags.has('l')) sel.push(l);
		if (showAll || flags.has('w')) sel.push(w);
		if (showAll || flags.has('c')) sel.push(c);
		return sel;
	};
	const fmt = (nums: number[], label: string | null) =>
		nums.map((x) => String(x).padStart(7)).join('') + (label ? ` ${label}` : '');

	if (!rest.length) {
		if (stdin === null) {
			throw new CmdError(
				'wc: no input — give it files (wc -l notes.txt) or pipe text in (ls | wc -l)'
			);
		}
		return ok(fmt(counts(stdin), null) + '\n');
	}
	const lines: string[] = [];
	const errs: string[] = [];
	const totals: number[] = [];
	let nFiles = 0;
	for (const f of rest) {
		const abs = engine.resolve(f);
		if (engine.isDir(abs)) {
			errs.push(`wc: ${f}: Is a directory`);
			continue;
		}
		const c = engine.readFile(abs);
		if (c === null) {
			errs.push(`wc: ${f}: No such file or directory`);
			continue;
		}
		const nums = counts(c);
		nums.forEach((x, i) => (totals[i] = (totals[i] ?? 0) + x));
		lines.push(fmt(nums, f));
		nFiles++;
	}
	if (nFiles > 1) lines.push(fmt(totals, 'total'));
	return {
		out: lines.length ? lines.join('\n') + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 1 : 0
	};
}

/* ── text tools ───────────────────────────────────────────────────── */

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatches(line: string, re: RegExp): string {
	const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
	let last = 0;
	let out = '';
	let m: RegExpExecArray | null;
	while ((m = g.exec(line))) {
		out += esc(line.slice(last, m.index));
		out += span(m[0], MATCH_STYLE);
		last = m.index + m[0].length;
		if (m[0] === '') g.lastIndex++;
	}
	out += esc(line.slice(last));
	return out;
}

/** Path label used by find/grep -r: keeps the user's own prefix (./, dir/…). */
function relLabel(root: string, rootAbs: string, abs: string): string {
	if (abs === rootAbs) return root;
	const cleanRoot = root === '/' ? '' : root.replace(/\/+$/, '');
	return cleanRoot + abs.slice(rootAbs === '/' ? 0 : rootAbs.length);
}

function cmdGrep(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	const { flags, rest } = flagSplit(args, 'invcr', 'grep');
	if (!rest.length) {
		throw new CmdError(
			'Usage: grep [-i -n -v -c -r] PATTERN [FILE...]\n(example: grep -in error server.log — or pipe into it: cat log | grep error)'
		);
	}
	const pattern = rest[0];
	const files = rest.slice(1);
	const reFlags = flags.has('i') ? 'i' : '';
	let re: RegExp;
	try {
		re = new RegExp(pattern, reFlags);
	} catch {
		re = new RegExp(escapeRegExp(pattern), reFlags);
	}

	const sources: { label: string | null; content: string }[] = [];
	const errs: string[] = [];
	if (flags.has('r')) {
		const roots = files.length ? files : ['.'];
		for (const root of roots) {
			const abs = engine.resolve(root);
			const node = engine.getNode(abs);
			if (!node) {
				errs.push(`grep: ${root}: No such file or directory`);
				continue;
			}
			if (node.kind === 'file') {
				sources.push({ label: root, content: node.content });
				continue;
			}
			engine.walk(abs, (p, n) => {
				if (n.kind === 'file') sources.push({ label: relLabel(root, abs, p), content: n.content });
			});
		}
	} else if (files.length) {
		for (const f of files) {
			const abs = engine.resolve(f);
			if (engine.isDir(abs)) {
				errs.push(`grep: ${f}: Is a directory\n(add -r to search inside directories)`);
				continue;
			}
			const c = engine.readFile(abs);
			if (c === null) errs.push(`grep: ${f}: No such file or directory`);
			else sources.push({ label: files.length > 1 ? f : null, content: c });
		}
	} else if (stdin !== null) {
		sources.push({ label: null, content: stdin });
	} else {
		throw new CmdError(
			'grep: no input — give it files (grep TODO notes.txt) or pipe text in (cat notes.txt | grep TODO)'
		);
	}

	const invert = flags.has('v');
	let matched = 0;
	const textLines: string[] = [];
	const htmlLines: string[] = [];
	for (const src of sources) {
		const lines = toLines(src.content);
		if (flags.has('c')) {
			const count = lines.filter((l) => re.test(l) !== invert).length;
			matched += count;
			const prefix = src.label !== null ? `${src.label}:` : '';
			textLines.push(prefix + count);
			htmlLines.push(
				(src.label !== null ? span(src.label, META_STYLE) + span(':', OUT_STYLE) : '') +
					span(String(count), OUT_STYLE)
			);
			continue;
		}
		lines.forEach((l, idx) => {
			if (re.test(l) !== invert) {
				matched++;
				let prefix = '';
				let prefixHtml = '';
				if (src.label !== null) {
					prefix += `${src.label}:`;
					prefixHtml += span(src.label, META_STYLE) + span(':', OUT_STYLE);
				}
				if (flags.has('n')) {
					prefix += `${idx + 1}:`;
					prefixHtml +=
						span(String(idx + 1), 'color:var(--color-terminal-prompt)') + span(':', OUT_STYLE);
				}
				textLines.push(prefix + l);
				htmlLines.push(prefixHtml + (invert ? esc(l) : highlightMatches(l, re)));
			}
		});
	}
	const out = textLines.length ? textLines.join('\n') + '\n' : '';
	return {
		out,
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 2 : matched > 0 ? 0 : 1,
		html: out ? htmlLines.join('\n') : undefined
	};
}

function cmdSort(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	const { flags, rest } = flagSplit(args, 'rnu', 'sort');
	const { content, errs } = readSources(engine, rest, stdin, 'sort');
	if (errs.length) return fail(errs.join('\n'), 2);
	let lines = toLines(content);
	if (flags.has('n')) {
		lines.sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
	} else {
		lines.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
	}
	if (flags.has('r')) lines.reverse();
	if (flags.has('u')) lines = lines.filter((l, i) => i === 0 || l !== lines[i - 1]);
	return ok(lines.length ? lines.join('\n') + '\n' : '');
}

function cmdUniq(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	const { flags, rest } = flagSplit(args, 'c', 'uniq');
	const { content, errs } = readSources(engine, rest, stdin, 'uniq');
	if (errs.length) return fail(errs.join('\n'));
	const lines = toLines(content);
	const out: string[] = [];
	let i = 0;
	while (i < lines.length) {
		let j = i;
		while (j < lines.length && lines[j] === lines[i]) j++;
		out.push(flags.has('c') ? `${String(j - i).padStart(7)} ${lines[i]}` : lines[i]);
		i = j;
	}
	return ok(out.length ? out.join('\n') + '\n' : '');
}

function parseFieldSpec(spec: string): (fieldIndex: number) => boolean {
	const ranges: { from: number; to: number }[] = [];
	for (const part of spec.split(',')) {
		const m = part.match(/^(\d+)?(-)?(\d+)?$/);
		if (!m || (!m[1] && !m[3])) {
			throw new CmdError(`cut: invalid field list: '${spec}'\n(examples: -f1  -f1,3  -f2-4)`);
		}
		const from = m[1] ? parseInt(m[1], 10) : 1;
		const to = m[2] ? (m[3] ? parseInt(m[3], 10) : Infinity) : from;
		ranges.push({ from, to });
	}
	return (i) => ranges.some((r) => i >= r.from && i <= r.to);
}

function cmdCut(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	let delim = '\t';
	let fieldSpec: string | null = null;
	const files: string[] = [];
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a === '-d') delim = args[++i] ?? '\t';
		else if (a.startsWith('-d')) delim = a.slice(2);
		else if (a === '-f') fieldSpec = args[++i] ?? null;
		else if (a.startsWith('-f')) fieldSpec = a.slice(2);
		else if (a.startsWith('-')) {
			throw new CmdError(
				`cut: invalid option '${a}'\n(this playground supports -d DELIM and -f FIELDS)`
			);
		} else files.push(a);
	}
	if (!fieldSpec) {
		throw new CmdError(
			"cut: you must specify a list of fields with -f\n(example: cut -d',' -f1 data.csv)"
		);
	}
	if (delim.length !== 1) {
		throw new CmdError('cut: the delimiter must be a single character');
	}
	const wanted = parseFieldSpec(fieldSpec);
	const { content, errs } = readSources(engine, files, stdin, 'cut');
	if (errs.length) return fail(errs.join('\n'));
	const out = toLines(content).map((line) => {
		if (!line.includes(delim)) return line;
		return line
			.split(delim)
			.filter((_, i) => wanted(i + 1))
			.join(delim);
	});
	return ok(out.length ? out.join('\n') + '\n' : '');
}

function expandTrSet(s: string): string[] {
	const chars: string[] = [];
	let i = 0;
	while (i < s.length) {
		let c = s[i];
		if (c === '\\' && i + 1 < s.length) {
			const n = s[i + 1];
			c = n === 'n' ? '\n' : n === 't' ? '\t' : n;
			i += 2;
		} else {
			i++;
		}
		if (s[i] === '-' && i + 1 < s.length) {
			const from = c.charCodeAt(0);
			const to = s[i + 1].charCodeAt(0);
			if (to >= from) {
				for (let k = from; k <= to; k++) chars.push(String.fromCharCode(k));
				i += 2;
				continue;
			}
		}
		chars.push(c);
	}
	return chars;
}

function cmdTr(args: string[], stdin: string | null): ExecResult {
	const { flags, rest } = flagSplit(args, 'd', 'tr');
	if (stdin === null) {
		throw new CmdError(
			'tr: reads from standard input — pipe something in: cat file.txt | tr a-z A-Z'
		);
	}
	if (flags.has('d')) {
		if (rest.length !== 1)
			throw new CmdError('tr: -d needs exactly one set of characters (tr -d SET)');
		const del = new Set(expandTrSet(rest[0]));
		return ok([...stdin].filter((c) => !del.has(c)).join(''));
	}
	if (rest.length !== 2) {
		throw new CmdError('tr: needs two sets (tr SET1 SET2) — example: tr a-z A-Z');
	}
	const set1 = expandTrSet(rest[0]);
	const set2 = expandTrSet(rest[1]);
	if (!set2.length) throw new CmdError('tr: SET2 is empty — nothing to translate to');
	const map = new Map<string, string>();
	set1.forEach((c, i) => map.set(c, set2[Math.min(i, set2.length - 1)]));
	return ok([...stdin].map((c) => map.get(c) ?? c).join(''));
}

/* ── sed — the stream editor ──────────────────────────────────────── */

/** One sed address: a line number, $ (the last line), or /regex/. */
type SedAddr = { kind: 'line'; n: number } | { kind: 'last' } | { kind: 're'; re: RegExp };

/** One parsed sed script: an optional address (or range) plus s, d or p. */
interface SedCommand {
	addr: SedAddr | null;
	addr2: SedAddr | null;
	kind: 's' | 'd' | 'p';
	re?: RegExp;
	repl?: string;
}

/** Index of the ] that closes a [...] class, or -1 (classes copy verbatim). */
function charClassEnd(pat: string, start: number): number {
	let j = start + 1;
	if (pat[j] === '^') j++;
	if (pat[j] === ']') j++; // a ] right after [ (or [^) is a literal ]
	for (; j < pat.length; j++) {
		if (pat[j] === '\\') j++;
		else if (pat[j] === ']') return j;
	}
	return -1;
}

/**
 * sed's regex dialect → JS RegExp source. Without -E (classic BRE):
 * . * ^ $ [ ] are special; + ? | ( ) { } are literal unless escaped —
 * \+ IS special, the reverse of what modern regex users expect. With -E
 * all of them are special directly. `delim` is the enclosing delimiter,
 * so an escaped delimiter always means the literal character.
 */
function sedRegexSource(pat: string, extended: boolean, delim: string): string {
	let src = '';
	for (let i = 0; i < pat.length; i++) {
		const c = pat[i];
		if (c === '\\') {
			const n = pat[i + 1];
			if (n === undefined) {
				src += '\\\\';
				break;
			}
			i++;
			if (n === delim) src += escapeRegExp(n);
			else if ('+?|(){}'.includes(n)) src += extended ? escapeRegExp(n) : n;
			else if ('.*^$[]'.includes(n) || n === '\\') src += '\\' + n;
			else if (/[nrtwWsSbBdD1-9]/.test(n)) src += '\\' + n;
			else src += escapeRegExp(n);
			continue;
		}
		if (c === '[') {
			const end = charClassEnd(pat, i);
			if (end === -1) src += '\\[';
			else {
				src += pat.slice(i, end + 1);
				i = end;
			}
			continue;
		}
		if ('.*^$'.includes(c)) src += c;
		else if ('+?|(){}'.includes(c)) src += extended ? c : escapeRegExp(c);
		else src += escapeRegExp(c);
	}
	return src;
}

/** User patterns never reach `new RegExp` untranslated; failures stay friendly. */
function buildSedRegex(pat: string, extended: boolean, flags: string, delim: string): RegExp {
	try {
		return new RegExp(sedRegexSource(pat, extended, delim), flags);
	} catch {
		throw new CmdError(
			`sed: can't make sense of the pattern '${pat}' — check for unbalanced ( ) or [ ]`
		);
	}
}

/** Scan from `pos` to the next unescaped delimiter; \x pairs stay intact. */
function sedCut(script: string, pos: number, delim: string): { piece: string; end: number } {
	let piece = '';
	while (pos < script.length && script[pos] !== delim) {
		if (script[pos] === '\\' && pos + 1 < script.length) {
			piece += script[pos] + script[pos + 1];
			pos += 2;
		} else {
			piece += script[pos++];
		}
	}
	return { piece, end: pos };
}

/** Fill in a replacement: & is the whole match; \& \\ and \<delim> are literals. */
function sedReplacement(template: string, match: string): string {
	let out = '';
	for (let i = 0; i < template.length; i++) {
		const c = template[i];
		if (c === '\\' && i + 1 < template.length) out += template[++i];
		else if (c === '&') out += match;
		else out += c;
	}
	return out;
}

/**
 * Parse one sed script: [address[,address]] then s///, d or p. The rest of
 * real sed (hold space, branching, y///, a/i/c) gets a named, friendly
 * refusal instead of a silent mystery.
 */
function parseSedScript(script: string, extended: boolean): SedCommand {
	let pos = 0;
	const skipBlanks = () => {
		while (script[pos] === ' ' || script[pos] === '\t') pos++;
	};

	const parseAddr = (): SedAddr | null => {
		const c = script[pos];
		if (c === '$') {
			pos++;
			return { kind: 'last' };
		}
		if (/\d/.test(c ?? '')) {
			let digits = '';
			while (pos < script.length && /\d/.test(script[pos])) digits += script[pos++];
			const n = parseInt(digits, 10);
			if (n === 0) throw new CmdError('sed: line numbers start at 1 — there is no line 0');
			return { kind: 'line', n };
		}
		if (c === '/') {
			const { piece, end } = sedCut(script, pos + 1, '/');
			if (script[end] !== '/') {
				throw new CmdError('sed: unterminated address — close the /regex/ with a second /');
			}
			pos = end + 1;
			if (!piece) {
				throw new CmdError(
					'sed: empty address // — put a pattern between the slashes, like /error/d'
				);
			}
			return { kind: 're', re: buildSedRegex(piece, extended, '', '/') };
		}
		return null;
	};

	skipBlanks();
	const addr = parseAddr();
	let addr2: SedAddr | null = null;
	if (addr && script[pos] === ',') {
		pos++;
		skipBlanks();
		addr2 = parseAddr();
		if (!addr2) {
			throw new CmdError(
				'sed: an address range needs a second address after the comma — like 5,9 or /start/,/stop/'
			);
		}
	}
	skipBlanks();

	const c = script[pos];
	if (c === undefined) {
		throw new CmdError(
			addr
				? 'sed: the address needs a command after it — d deletes those lines, p prints them, s/old/new/ substitutes'
				: "sed: the script is empty — tell sed what to do, like 's/old/new/' (man sed has the map)"
		);
	}

	if (c === 's') {
		const delim = script[pos + 1];
		if (delim === undefined) {
			throw new CmdError(
				"sed: unterminated 's' command — the full shape is s/old/new/ (three delimiters)"
			);
		}
		if (delim === '\\') {
			throw new CmdError(
				"sed: a backslash can't be the s delimiter — try s/old/new/ or s|old|new|"
			);
		}
		const oldPart = sedCut(script, pos + 2, delim);
		const newPart = script[oldPart.end] === delim ? sedCut(script, oldPart.end + 1, delim) : null;
		if (!newPart || script[newPart.end] !== delim) {
			throw new CmdError(
				`sed: unterminated 's' command — it needs three '${delim}' delimiters: s${delim}old${delim}new${delim}`
			);
		}
		pos = newPart.end + 1;
		if (!oldPart.piece) {
			throw new CmdError(
				'sed: nothing to search for — the part between the first two delimiters is empty'
			);
		}
		let global = false;
		let ignoreCase = false;
		while (pos < script.length) {
			const f = script[pos++];
			if (f === 'g') global = true;
			else if (f === 'I' || f === 'i') ignoreCase = true;
			else if (f === 'w') {
				throw new CmdError(
					"sed: the w flag writes matches to a file — real sed, but beyond this playground.\n(redirection does the same job: sed -n '/error/p' log.txt > matches.txt)"
				);
			} else if (f === ' ' || f === '\t') skipBlanks();
			else {
				throw new CmdError(
					`sed: unknown flag '${f}' after the s command — this playground supports g (every match) and I (ignore case)`
				);
			}
		}
		const reFlags = (global ? 'g' : '') + (ignoreCase ? 'i' : '');
		return {
			addr,
			addr2,
			kind: 's',
			re: buildSedRegex(oldPart.piece, extended, reFlags, delim),
			repl: newPart.piece
		};
	}

	if (c === 'd' || c === 'p') {
		pos++;
		skipBlanks();
		if (pos < script.length) {
			throw new CmdError(
				`sed: extra text after '${c}': '${script.slice(pos)}' — this playground runs one command per script`
			);
		}
		return { addr, addr2, kind: c };
	}

	if (c === 'y') {
		throw new CmdError(
			"sed: 'y///' transliterates characters one-for-one — real sed, but beyond this playground.\n(tr does exactly that job: cat file.txt | tr a-z A-Z)"
		);
	}
	if ('hHgGx'.includes(c)) {
		throw new CmdError(
			`sed: '${c}' uses the hold space, sed's hidden second buffer — real sed, but beyond this playground.\n(everything this course needs works one line at a time, no hidden buffer required)`
		);
	}
	if ('btT:'.includes(c)) {
		throw new CmdError(
			`sed: '${c}' is for labels and branching — little loops inside sed scripts. Real sed, but beyond this playground.\n(a script that needs loops is usually a job for a real editor or a few piped commands)`
		);
	}
	if ('aic'.includes(c)) {
		const verb = c === 'a' ? 'appends' : c === 'i' ? 'inserts' : 'changes';
		throw new CmdError(
			`sed: '${c}' ${verb} whole lines of text — real sed, but beyond this playground.\n(echo with >> appends lines: echo 'new line' >> file.txt)`
		);
	}
	if (c === 'w') {
		throw new CmdError(
			"sed: 'w' writes lines to a file — real sed, but beyond this playground.\n(redirection does the same job: sed -n '/error/p' log.txt > matches.txt)"
		);
	}
	throw new CmdError(
		`sed: unknown command: '${c}'\n(this playground supports s/old/new/, d and p — see man sed)`
	);
}

const matchSedAddr = (a: SedAddr, idx: number, line: string, total: number): boolean =>
	a.kind === 'line' ? idx === a.n : a.kind === 'last' ? idx === total : a.re.test(line);

/** Run one compiled command over content — the film strip: every line passes through. */
function applySed(cmd: SedCommand, content: string, suppress: boolean): string {
	const lines = toLines(content);
	const total = lines.length;
	const out: string[] = [];
	let inRange = false;
	lines.forEach((line, i) => {
		const idx = i + 1;
		let selected: boolean;
		if (!cmd.addr) selected = true;
		else if (!cmd.addr2) selected = matchSedAddr(cmd.addr, idx, line, total);
		else if (inRange) {
			selected = true;
			// Numeric ends close at their line; regex and $ ends close when they match.
			if (
				cmd.addr2.kind === 'line' ? idx >= cmd.addr2.n : matchSedAddr(cmd.addr2, idx, line, total)
			) {
				inRange = false;
			}
		} else {
			selected = matchSedAddr(cmd.addr, idx, line, total);
			// A freshly opened range stays open unless its numeric end is already
			// behind us; regex ends are only tested from the NEXT line (real sed's rule).
			if (selected) inRange = !(cmd.addr2.kind === 'line' && cmd.addr2.n <= idx);
		}
		if (cmd.kind === 'd') {
			if (!selected && !suppress) out.push(line);
		} else if (cmd.kind === 'p') {
			if (!suppress) out.push(line);
			if (selected) out.push(line);
		} else {
			const res = selected ? line.replace(cmd.re!, (m) => sedReplacement(cmd.repl!, m)) : line;
			if (!suppress) out.push(res);
		}
	});
	return out.length ? out.join('\n') + '\n' : '';
}

function cmdSed(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	let script: string | null = null;
	let suppress = false;
	let extended = false;
	let inPlace = false;
	let suffix = '';
	const files: string[] = [];
	let noMore = false;
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (!noMore && a === '--') {
			noMore = true;
			continue;
		}
		if (!noMore && a.startsWith('-') && a.length > 1) {
			const letters = a.slice(1);
			for (let k = 0; k < letters.length; k++) {
				const ch = letters[k];
				if (ch === 'n') suppress = true;
				else if (ch === 'E') extended = true;
				else if (ch === 'i') {
					// -i.bak: the backup suffix rides directly on the flag, GNU style.
					inPlace = true;
					suffix = letters.slice(k + 1);
					break;
				} else if (ch === 'e') {
					throw new CmdError(
						"sed: -e isn't needed here — just put the script right after the flags: sed 's/old/new/' file.txt"
					);
				} else {
					throw new CmdError(
						`sed: invalid option -- '${ch}'\n(this playground supports: -n (quiet), -E (extended regex) and -i[.bak] (edit in place))`
					);
				}
			}
			continue;
		}
		if (script === null) script = a;
		else files.push(a);
	}
	if (script === null) {
		throw new CmdError(
			"sed: missing script — tell sed what to do, like: sed 's/old/new/' file.txt (man sed has the map)"
		);
	}
	const cmd = parseSedScript(script, extended);

	if (inPlace) {
		if (!files.length) {
			throw new CmdError(
				"sed: -i edits files in place, so it needs at least one file name\n(example: sed -i.bak 's/old/new/' notes.txt — the .bak keeps a backup)"
			);
		}
		const errs: string[] = [];
		for (const f of files) {
			const abs = engine.resolve(f);
			if (engine.isDir(abs)) {
				errs.push(`sed: couldn't edit ${f}: Is a directory`);
				continue;
			}
			const original = engine.readFile(abs);
			if (original === null) {
				errs.push(`sed: can't read ${f}: No such file or directory`);
				continue;
			}
			// With a suffix, the untouched original is saved FIRST — instant undo.
			if (suffix) engine.writeFile(engine.resolve(f + suffix), original);
			engine.writeFile(abs, applySed(cmd, original, suppress));
		}
		return errs.length ? fail(errs.join('\n'), 2) : ok();
	}

	let content = '';
	const errs: string[] = [];
	if (files.length) {
		for (const f of files) {
			const abs = engine.resolve(f);
			if (engine.isDir(abs)) {
				errs.push(`sed: read error on ${f}: Is a directory`);
				continue;
			}
			const c = engine.readFile(abs);
			if (c === null) errs.push(`sed: can't read ${f}: No such file or directory`);
			else content += c;
		}
	} else if (stdin !== null) {
		content = stdin;
	} else {
		throw new CmdError(
			"sed: no input — give it a file (sed 's/old/new/' notes.txt) or pipe text in (cat notes.txt | sed 's/old/new/')"
		);
	}
	return {
		out: applySed(cmd, content, suppress),
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 2 : 0
	};
}

/* ── awk (teaching subset: field printing with an optional /pattern/) ── */

interface AwkProgram {
	/** Line guard — null runs the action on every line. */
	pattern: RegExp | null;
	/** 1-based field numbers to print ($0 → 0); empty prints the whole line. */
	fields: number[];
}

function parseAwkProgram(script: string): AwkProgram {
	let src = script.trim();
	let pattern: RegExp | null = null;
	const guard = src.match(/^\/((?:[^/\\]|\\.)*)\/\s*/);
	if (guard) {
		try {
			pattern = new RegExp(sedRegexSource(guard[1], true, '/'));
		} catch {
			throw new CmdError(
				`awk: can't make sense of the pattern /${guard[1]}/ — check for unbalanced ( ) or [ ]`
			);
		}
		src = src.slice(guard[0].length);
	}
	if (!src) {
		if (!pattern) {
			throw new CmdError("awk: the program is empty — tell awk what to do, like '{print $1}'");
		}
		return { pattern, fields: [] };
	}
	// The rest of the awk language gets a friendly refusal, not a half-answer.
	if (/\bBEGIN\b|\bEND\b/.test(src)) {
		throw new CmdError(
			'awk: BEGIN and END blocks are real awk, but beyond this playground — piping into sort, uniq or wc covers the same ground here'
		);
	}
	if (/\bprintf\b/.test(src)) {
		throw new CmdError(
			'awk: printf formatting is beyond this playground — plain print joins fields with spaces, which is all this course needs'
		);
	}
	if (/\b(if|while|for)\b/.test(src)) {
		throw new CmdError(
			"awk: conditions and loops are a whole programming language — beyond this playground. To filter lines, put a /pattern/ in front: awk '/error/ {print $1}'"
		);
	}
	const action = src.match(/^\{\s*print\b([^}]*)\}$/);
	if (!action) {
		throw new CmdError(
			"awk: this playground understands programs shaped like '/pattern/ {print $1, $2}' — see man awk"
		);
	}
	const list = action[1].trim();
	if (!list) return { pattern, fields: [] };
	const fields: number[] = [];
	for (const tok of list.split(',').map((t) => t.trim())) {
		const f = tok.match(/^\$(\d+)$/);
		if (!f) {
			if (tok === 'NF' || tok === '$NF') {
				throw new CmdError(
					'awk: NF (the last field) is real awk, but beyond this playground — count the columns and use their number instead'
				);
			}
			throw new CmdError(
				`awk: can't print '${tok}' — this playground prints fields, comma-separated: $0 is the whole line, $1 the first column (awk '{print $1, $3}')`
			);
		}
		fields.push(Number(f[1]));
	}
	return { pattern, fields };
}

function cmdAwk(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	let fieldSep: string | null = null;
	let script: string | null = null;
	const files: string[] = [];
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a === '-F') fieldSep = args[++i] ?? null;
		else if (a.startsWith('-F')) fieldSep = a.slice(2);
		else if (a === '-v') {
			throw new CmdError(
				"awk: -v variables are real awk, but beyond this playground — a fixed program like '{print $2}' covers this course"
			);
		} else if (a.startsWith('-') && a !== '-') {
			throw new CmdError(
				`awk: invalid option '${a}'\n(this playground supports -F for the field separator)`
			);
		} else if (script === null) script = a;
		else files.push(a);
	}
	if (script === null) {
		throw new CmdError(
			"awk: usage: awk [-F,] 'PROGRAM' [file ...] — example: awk '{print $2}' table.txt"
		);
	}
	const prog = parseAwkProgram(script);
	const { content, errs } = readSources(engine, files, stdin, 'awk');
	if (errs.length) return fail(errs.join('\n'));
	const out: string[] = [];
	for (const line of toLines(content)) {
		if (prog.pattern && !prog.pattern.test(line)) continue;
		if (!prog.fields.length) {
			out.push(line);
			continue;
		}
		const parts = fieldSep === null ? line.trim().split(/\s+/) : line.split(fieldSep);
		out.push(prog.fields.map((n) => (n === 0 ? line : (parts[n - 1] ?? ''))).join(' '));
	}
	return ok(out.length ? out.join('\n') + '\n' : '');
}

/* ── processes, ports and jobs ────────────────────────────────────── */

/** Right-align a column value the way ps does. */
function padStart(value: string | number, width: number): string {
	return String(value).padStart(width);
}

/**
 * The ps/top table. `ps` prints the shell itself too — learners should see
 * that bash is just another row.
 */
function psTable(engine: ShellEngine, wide: boolean): string {
	// Plain `ps` shows only what's attached to this terminal — the shell and
	// anything it started. Servers seeded elsewhere need `ps aux` (Part 8.1).
	const mine = wide ? engine.processes : engine.processes.filter((p) => p.job !== undefined);
	const rows = [{ pid: 1024, cpu: 0.0, mem: 0.1, start: '09:10', command: 'bash' }, ...mine].sort(
		(a, b) => a.pid - b.pid
	);
	const header = 'USER       PID %CPU %MEM START   COMMAND\n';
	const body = rows
		.map(
			(p) =>
				`${USER.padEnd(8)} ${padStart(p.pid, 5)} ${padStart(p.cpu.toFixed(1), 4)} ` +
				`${padStart(p.mem.toFixed(1), 4)} ${p.start.padEnd(7)} ${p.command}`
		)
		.join('\n');
	return header + body + '\n';
}

function cmdPs(engine: ShellEngine, args: string[]): ExecResult {
	for (const a of args) {
		// ps is famously flag-soup: aux (BSD) and -ef (System V) are the two
		// spellings everyone actually types, and both mean "show everything".
		if (!/^(aux|-ef|-e|-f|a|u|x|-A)$/.test(a)) {
			throw new CmdError(
				`ps: unsupported option '${a}'\n(this playground understands plain ps — this terminal only — plus ps aux and ps -ef, which list everything)`
			);
		}
	}
	const everything = args.length > 0;
	const table = psTable(engine, everything);
	if (everything) return ok(table);
	// The lesson of 8.1: the thing you're hunting usually isn't in this list.
	const hidden = engine.processes.some((p) => p.job === undefined);
	return ok(
		table +
			(hidden
				? '(plain ps lists only this terminal — other processes are running; try ps aux)\n'
				: '')
	);
}

function cmdPgrep(engine: ShellEngine, args: string[]): ExecResult {
	const pattern = args.find((a) => !a.startsWith('-'));
	if (!pattern) {
		throw new CmdError('pgrep: usage: pgrep NAME — example: pgrep node');
	}
	const matches = engine.processes.filter((p) => p.command.includes(pattern));
	// pgrep is a filter: no matches is exit 1, not an error message.
	if (!matches.length) return { out: '', err: '', code: 1 };
	return ok(matches.map((p) => String(p.pid)).join('\n') + '\n');
}

/** Signal names learners will meet, mapped to what the sandbox does. */
const SIGNALS: Record<string, number> = {
	'9': 9,
	KILL: 9,
	SIGKILL: 9,
	'15': 15,
	TERM: 15,
	SIGTERM: 15,
	'2': 2,
	INT: 2,
	SIGINT: 2,
	'1': 1,
	HUP: 1,
	SIGHUP: 1
};

/** Number → name, so the sandbox reports back the signal it was actually sent. */
const SIGNAL_NAMES: Record<number, string> = {
	1: 'SIGHUP',
	2: 'SIGINT',
	9: 'SIGKILL',
	15: 'SIGTERM'
};

function cmdKill(engine: ShellEngine, args: string[]): ExecResult {
	let signal = 15;
	const targets: string[] = [];
	for (const a of args) {
		if (a.startsWith('-') && a.length > 1) {
			const name = a.slice(1).toUpperCase();
			const resolved = SIGNALS[name];
			if (resolved === undefined) {
				throw new CmdError(
					`kill: unknown signal '${a}'\n(this playground knows -15/-TERM — ask politely — -9/-KILL — the last resort — plus -2/-INT and -1/-HUP)`
				);
			}
			signal = resolved;
		} else targets.push(a);
	}
	if (!targets.length) {
		throw new CmdError(
			'kill: usage: kill PID (ask politely) or kill -9 PID (last resort)\n(find the PID first with ps or lsof -i :PORT)'
		);
	}
	const out: string[] = [];
	const errs: string[] = [];
	for (const target of targets) {
		// kill %1 addresses a background job by its [n] number.
		const job = target.startsWith('%') ? Number(target.slice(1)) : NaN;
		const proc = Number.isFinite(job) ? engine.findJob(job) : engine.findProcess(Number(target));
		if (!proc) {
			errs.push(
				`kill: (${target}) - No such process\n(nothing with that ${target.startsWith('%') ? 'job number' : 'PID'} is running — check ps)`
			);
			continue;
		}
		const name = SIGNAL_NAMES[signal];
		if (signal !== 9 && proc.ignoresTerm) {
			// The lesson: a polite request can be declined.
			out.push(
				`(no response — ${proc.command} is still running; a program can catch ${name} and ignore it. Escalate: kill -9 ${proc.pid})`
			);
			continue;
		}
		engine.removeProcess(proc.pid);
		out.push(
			signal === 9
				? `[killed] ${proc.command} (PID ${proc.pid}) — SIGKILL, no cleanup`
				: `[terminated] ${proc.command} (PID ${proc.pid}) — ${name}, it shut down cleanly`
		);
	}
	if (errs.length) {
		return { out: out.length ? out.join('\n') + '\n' : '', err: errs.join('\n') + '\n', code: 1 };
	}
	return ok(out.join('\n') + '\n');
}

function cmdLsof(engine: ShellEngine, args: string[]): ExecResult {
	const net = args.find((a) => a === '-i' || a.startsWith('-i'));
	if (!net) {
		throw new CmdError(
			"lsof: this playground speaks the port question: lsof -i :3000 (who holds that port?)\n(real lsof lists every open file — 'ls of open files' — which is a much bigger tool)"
		);
	}
	// Accept `lsof -i :3000` and `lsof -i:3000`.
	const inline = args.find((a) => a.startsWith('-i') && a.length > 2)?.slice(2);
	const separate = args[args.indexOf('-i') + 1];
	const spec = inline ?? (separate && !separate.startsWith('-') ? separate : '');
	const listening = engine.processes.filter((p) => p.port !== undefined);
	const wanted = spec.replace(/^:/, '');
	const rows = wanted ? listening.filter((p) => String(p.port) === wanted) : listening;
	// lsof prints nothing and exits 1 when nothing matches — silence means free.
	if (!rows.length) return { out: '', err: '', code: 1 };
	const header = 'COMMAND    PID  USER   TYPE NODE NAME\n';
	const body = rows
		.map((p) => {
			const name = p.command.split(/\s+/)[0].slice(0, 9);
			return `${name.padEnd(9)} ${padStart(p.pid, 5)} ${USER.padEnd(5)} IPv4 TCP  *:${p.port} (LISTEN)`;
		})
		.join('\n');
	return ok(header + body + '\n');
}

function cmdJobs(engine: ShellEngine): ExecResult {
	const jobs = engine.processes
		.filter((p) => p.job !== undefined)
		.sort((a, b) => (a.job ?? 0) - (b.job ?? 0));
	if (!jobs.length) return ok('');
	return ok(
		jobs.map((p) => `[${p.job}]  ${p.stopped ? 'Stopped' : 'Running'}    ${p.command}`).join('\n') +
			'\n'
	);
}

async function cmdFg(ctx: Ctx, args: string[]): Promise<ExecResult> {
	const { engine } = ctx;
	const jobs = engine.processes.filter((p) => p.job !== undefined);
	if (!jobs.length) {
		throw new CmdError('fg: no current jobs\n(send something backstage first: ./slowbuild.sh &)');
	}
	const spec = args[0]?.replace(/^%/, '');
	const proc = spec
		? engine.findJob(Number(spec))
		: jobs.sort((a, b) => (b.job ?? 0) - (a.job ?? 0))[0];
	if (!proc) {
		throw new CmdError(`fg: %${spec}: no such job\n(run jobs to see what's backstage)`);
	}
	engine.removeProcess(proc.pid);
	// Bringing a job forward finally runs it — the sandbox has no real
	// concurrency, so "backstage" means queued and fg means "play it now".
	const pending = proc.pending;
	const banner = `${proc.command}\n`;
	if (!pending) return ok(banner);
	const result = await runLine(ctx, pending);
	return { out: banner + result.out, err: result.err, code: result.code };
}

function cmdBg(engine: ShellEngine, args: string[]): ExecResult {
	const spec = args[0]?.replace(/^%/, '');
	const stopped = engine.processes.filter((p) => p.job !== undefined && p.stopped);
	const proc = spec ? engine.findJob(Number(spec)) : stopped[stopped.length - 1];
	if (!proc) {
		throw new CmdError(
			'bg: no stopped jobs\n(Ctrl+Z pauses a foreground job; bg resumes it backstage)'
		);
	}
	proc.stopped = false;
	return ok(`[${proc.job}]  ${proc.command} &\n`);
}

function cmdServe(engine: ShellEngine, args: string[]): ExecResult {
	const portArg = args.find((a) => /^\d+$/.test(a)) ?? args.find((a) => /^--port=\d+$/.test(a));
	const port = portArg ? Number(portArg.replace('--port=', '')) : 3000;
	const holder = engine.findByPort(port);
	if (holder) {
		// The error every web developer meets, with its real name.
		return fail(
			`Error: listen EADDRINUSE: address already in use :::${port}\n` +
				`(something is already listening on port ${port} — find it with: lsof -i :${port})`,
			1
		);
	}
	const proc = engine.spawnProcess({
		command: `serve --port ${port}`,
		cpu: 0.6,
		mem: 1.2,
		port
	});
	return ok(
		`serve: listening on http://localhost:${port} (PID ${proc.pid})\n` +
			`(it keeps running in the background here — stop it with: kill ${proc.pid})\n`
	);
}

function cmdEcho(args: string[]): ExecResult {
	let noNewline = false;
	let interpret = false;
	let i = 0;
	while (i < args.length && /^-[neE]+$/.test(args[i])) {
		for (const ch of args[i].slice(1)) {
			if (ch === 'n') noNewline = true;
			else if (ch === 'e') interpret = true;
			else if (ch === 'E') interpret = false;
		}
		i++;
	}
	let s = args.slice(i).join(' ');
	if (interpret) {
		s = s.replace(/\\(.)/g, (m, c: string) =>
			c === 'n' ? '\n' : c === 't' ? '\t' : c === '\\' ? '\\' : c === 'e' ? '\x1b' : m
		);
	}
	return ok(s + (noNewline ? '' : '\n'));
}

function cmdPrintf(args: string[]): ExecResult {
	if (!args.length) {
		throw new CmdError(
			"printf: usage: printf FORMAT [ARGUMENTS...]\n(example: printf '%s is %d\\n' vibe 1)"
		);
	}
	const fmt = args[0];
	const rest = args.slice(1);
	let ai = 0;
	const take = () => rest[ai++] ?? '';
	const once = (): string => {
		let res = '';
		for (let i = 0; i < fmt.length; i++) {
			const ch = fmt[i];
			if (ch === '\\' && i + 1 < fmt.length) {
				const n = fmt[++i];
				// \e is the escape byte colour sequences start with (13.1).
				res +=
					n === 'n'
						? '\n'
						: n === 't'
							? '\t'
							: n === '\\'
								? '\\'
								: n === 'e' || n === 'E'
									? '\x1b'
									: '\\' + n;
			} else if (ch === '%' && i + 1 < fmt.length) {
				const n = fmt[++i];
				if (n === '%') res += '%';
				else if (n === 's') res += take();
				else if (n === 'd') {
					const v = parseInt(take(), 10);
					res += String(Number.isNaN(v) ? 0 : v);
				} else res += '%' + n;
			} else res += ch;
		}
		return res;
	};
	let out = '';
	do {
		const before = ai;
		out += once();
		if (ai === before) break;
	} while (ai < rest.length);
	return ok(out);
}

/* ── copy / move / delete ─────────────────────────────────────────── */

const baseOf = (p: string) => p.replace(/\/+$/, '').split('/').pop() ?? p;

/**
 * cp and mv write a name into a folder that has to be there already — neither
 * creates one on the way (Part 3.2). Returns the error line, or null if fine.
 */
function missingParent(engine: ShellEngine, targetAbs: string, shown: string, cmd: string) {
	const parent = targetAbs.slice(0, targetAbs.lastIndexOf('/')) || '/';
	if (engine.isDir(parent)) return null;
	return (
		`${cmd}: cannot create '${shown}': No such file or directory\n` +
		`(the folder for that name doesn't exist yet, and ${cmd} won't make one — mkdir it first)`
	);
}

function cmdCp(engine: ShellEngine, args: string[]): ExecResult {
	const { flags, rest } = flagSplit(args, 'rRi', 'cp');
	const recursive = flags.has('r') || flags.has('R');
	if (rest.length < 2) {
		return fail(
			'cp: missing file operand\n(usage: cp SOURCE DEST — or cp -r FOLDER DEST for directories)'
		);
	}
	const dest = rest[rest.length - 1];
	const srcs = rest.slice(0, -1);
	const destAbs = engine.resolve(dest);
	const destIsDir = engine.isDir(destAbs);
	if (srcs.length > 1 && !destIsDir) {
		return fail(
			`cp: target '${dest}' is not a directory\n(copying several things at once needs an existing folder as the last argument)`
		);
	}
	const errs: string[] = [];
	for (const src of srcs) {
		const srcAbs = engine.resolve(src);
		const node = engine.getNode(srcAbs);
		if (!node) {
			errs.push(`cp: cannot stat '${src}': No such file or directory`);
			continue;
		}
		if (node.kind === 'dir' && !recursive) {
			errs.push(
				`cp: -r not specified; omitting directory '${src}'\n(directories need cp -r to copy everything inside)`
			);
			continue;
		}
		const targetAbs = destIsDir ? engine.resolve(`${destAbs}/${baseOf(src)}`) : destAbs;
		if (targetAbs === srcAbs) {
			errs.push(`cp: '${src}' and '${dest}' are the same file`);
			continue;
		}
		if (targetAbs.startsWith(srcAbs + '/')) {
			errs.push(`cp: cannot copy a directory, '${src}', into itself`);
			continue;
		}
		if (node.kind === 'file' && engine.isDir(targetAbs)) {
			errs.push(`cp: cannot overwrite directory '${dest}' with non-directory`);
			continue;
		}
		const noParent = missingParent(engine, targetAbs, dest, 'cp');
		if (noParent) {
			errs.push(noParent);
			continue;
		}
		if (flags.has('i') && engine.exists(targetAbs)) {
			errs.push(
				`cp: not overwriting '${engine.pretty(targetAbs)}' — in a real terminal -i would ask you y/n first.\n(remove the target or drop -i if you mean to replace it)`
			);
			continue;
		}
		engine.attachNode(targetAbs, engine.cloneNode(node, baseOf(targetAbs)));
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

function cmdMv(engine: ShellEngine, args: string[]): ExecResult {
	const { flags, rest } = flagSplit(args, 'i', 'mv');
	if (rest.length < 2) {
		return fail(
			'mv: missing file operand\n(usage: mv OLD NEW to rename, or mv FILE FOLDER/ to move)'
		);
	}
	const dest = rest[rest.length - 1];
	const srcs = rest.slice(0, -1);
	const destAbs = engine.resolve(dest);
	const destIsDir = engine.isDir(destAbs);
	if (srcs.length > 1 && !destIsDir) {
		return fail(`mv: target '${dest}' is not a directory`);
	}
	const errs: string[] = [];
	for (const src of srcs) {
		const srcAbs = engine.resolve(src);
		const node = engine.getNode(srcAbs);
		if (!node) {
			errs.push(`mv: cannot stat '${src}': No such file or directory`);
			continue;
		}
		const targetAbs = destIsDir ? engine.resolve(`${destAbs}/${baseOf(src)}`) : destAbs;
		if (targetAbs === srcAbs) continue;
		if (targetAbs.startsWith(srcAbs + '/')) {
			errs.push(`mv: cannot move '${src}' to a subdirectory of itself, '${dest}'`);
			continue;
		}
		if (flags.has('i') && engine.exists(targetAbs)) {
			errs.push(
				`mv: not overwriting '${engine.pretty(targetAbs)}' — in a real terminal -i would ask you y/n first.\n(remove the target or drop -i if you mean to replace it)`
			);
			continue;
		}
		if (node.kind === 'file' && engine.isDir(targetAbs)) {
			errs.push(`mv: cannot overwrite directory '${dest}' with non-directory`);
			continue;
		}
		const noParent = missingParent(engine, targetAbs, dest, 'mv');
		if (noParent) {
			errs.push(noParent);
			continue;
		}
		engine.removeNode(srcAbs);
		engine.attachNode(targetAbs, node);
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

function cmdRm(engine: ShellEngine, args: string[]): ExecResult {
	const { flags, rest } = flagSplit(args, 'rRfi', 'rm');
	const recursive = flags.has('r') || flags.has('R');
	const force = flags.has('f');
	if (!rest.length) {
		return force
			? ok()
			: fail(
					'rm: missing operand\n(tell it what to remove — and remember rm is forever: there is NO trash can)'
				);
	}
	const errs: string[] = [];
	for (const p of rest) {
		const abs = engine.resolve(p);
		if (abs === '/' || abs === (engine.env.HOME ?? HOME)) {
			errs.push(
				`rm: refusing to remove '${p}' — that would wipe ${abs === '/' ? 'the entire filesystem' : 'your whole home directory'}.\n(this is exactly the disaster the "read before you run" lesson is about; even the sandbox says no)`
			);
			continue;
		}
		const node = engine.getNode(abs);
		if (!node) {
			if (!force) errs.push(`rm: cannot remove '${p}': No such file or directory`);
			continue;
		}
		if (node.kind === 'dir' && !recursive) {
			errs.push(
				`rm: cannot remove '${p}': Is a directory\n(directories need rm -r — and rm has NO undo, so ls first and be sure)`
			);
			continue;
		}
		if (engine.cwd === abs || engine.cwd.startsWith(abs + '/')) {
			errs.push(
				`rm: cannot remove '${p}': it contains your current directory\n(cd out of it first)`
			);
			continue;
		}
		if (flags.has('i')) {
			errs.push(
				`rm: -i asks "remove ${p}?" before deleting in a real terminal; the sandbox can't prompt, so nothing was removed.\n(drop -i when you're sure — after checking with ls)`
			);
			continue;
		}
		engine.removeNode(abs);
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

function cmdRmdir(engine: ShellEngine, args: string[]): ExecResult {
	if (!args.length) return fail('rmdir: missing operand\n(usage: rmdir EMPTY_FOLDER)');
	const errs: string[] = [];
	for (const p of args) {
		const abs = engine.resolve(p);
		const node = engine.getNode(abs);
		if (!node) {
			errs.push(`rmdir: failed to remove '${p}': No such file or directory`);
			continue;
		}
		if (node.kind !== 'dir') {
			errs.push(`rmdir: failed to remove '${p}': Not a directory`);
			continue;
		}
		if (node.children.size > 0) {
			errs.push(
				`rmdir: failed to remove '${p}': Directory not empty\n(rmdir only removes empty folders — rm -r removes a folder AND everything inside, so double-check first)`
			);
			continue;
		}
		if (engine.cwd === abs || engine.cwd.startsWith(abs + '/')) {
			errs.push(`rmdir: failed to remove '${p}': it is your current directory (cd out first)`);
			continue;
		}
		engine.removeNode(abs);
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

/* ── finding things ───────────────────────────────────────────────── */

function cmdFind(engine: ShellEngine, args: string[]): ExecResult {
	const paths: string[] = [];
	let i = 0;
	while (i < args.length && !args[i].startsWith('-')) paths.push(args[i++]);
	if (!paths.length) paths.push('.');
	let namePat: RegExp | null = null;
	let type: 'f' | 'd' | null = null;
	let maxDepth = Infinity;
	while (i < args.length) {
		const a = args[i++];
		if (a === '-name') {
			const p = args[i++];
			if (p === undefined) throw new CmdError(`find: missing argument to '-name'`);
			namePat = globToRegExp(p);
		} else if (a === '-type') {
			const t = args[i++];
			if (t !== 'f' && t !== 'd') {
				throw new CmdError(`find: invalid argument to -type: use f (files) or d (directories)`);
			}
			type = t;
		} else if (a === '-maxdepth') {
			const d = parseInt(args[i++] ?? '', 10);
			if (Number.isNaN(d) || d < 0)
				throw new CmdError('find: -maxdepth needs a non-negative number');
			maxDepth = d;
		} else {
			throw new CmdError(
				`find: unknown option '${a}'\n(this playground supports: find PATH -name 'PATTERN' -type f|d -maxdepth N)`
			);
		}
	}
	const lines: string[] = [];
	const errs: string[] = [];
	for (const root of paths) {
		const abs = engine.resolve(root);
		if (!engine.exists(abs)) {
			errs.push(`find: '${root}': No such file or directory`);
			continue;
		}
		engine.walk(abs, (p, node) => {
			const depth = p === abs ? 0 : p.slice(abs.length).split('/').length - 1;
			if (depth > maxDepth) return;
			if (type && (type === 'f') !== (node.kind === 'file')) return;
			if (namePat && !namePat.test(p === abs ? baseOf(root) || node.name : node.name)) return;
			lines.push(relLabel(root, abs, p));
		});
	}
	return {
		out: lines.length ? lines.join('\n') + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 1 : 0
	};
}

const SHELL_BUILTINS = new Set([
	'cd',
	'pwd',
	'echo',
	'alias',
	'unalias',
	'export',
	'unset',
	'source',
	'.',
	'history',
	'exit',
	'type',
	'help',
	'true',
	'false'
]);

function findOnPath(engine: ShellEngine, cmd: string): string | null {
	for (const dir of (engine.env.PATH ?? '').split(':')) {
		if (!dir) continue;
		const candidate = `${dir}/${cmd}`;
		if (engine.isExecutable(engine.resolve(candidate))) return candidate;
		if (
			(dir === '/usr/bin' || dir === '/bin' || dir === '/usr/local/bin') &&
			BIN_COMMANDS.includes(cmd)
		) {
			return `/usr/bin/${cmd}`;
		}
	}
	return null;
}

function cmdWhich(engine: ShellEngine, args: string[]): ExecResult {
	if (!args.length) return fail('which: usage: which COMMAND\n(example: which ls)');
	const lines: string[] = [];
	const errs: string[] = [];
	for (const cmd of args) {
		const p = findOnPath(engine, cmd);
		if (p) lines.push(p);
		else {
			errs.push(
				`which: no ${cmd} in (${engine.env.PATH ?? ''})\n(nothing named '${cmd}' is on your PATH — this is what "command not found" means)`
			);
		}
	}
	return {
		out: lines.length ? lines.join('\n') + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 1 : 0
	};
}

function cmdType(engine: ShellEngine, args: string[]): ExecResult {
	if (!args.length) return fail('type: usage: type COMMAND\n(example: type ls)');
	const lines: string[] = [];
	const errs: string[] = [];
	for (const cmd of args) {
		const alias = engine.aliases.get(cmd);
		if (alias !== undefined) {
			lines.push(`${cmd} is aliased to \`${alias}'`);
			continue;
		}
		if (SHELL_BUILTINS.has(cmd)) {
			lines.push(`${cmd} is a shell builtin`);
			continue;
		}
		const p = findOnPath(engine, cmd);
		if (p) {
			lines.push(`${cmd} is ${p}`);
			continue;
		}
		if (cmd.includes('/') && engine.isExecutable(engine.resolve(cmd))) {
			lines.push(`${cmd} is ${cmd}`);
			continue;
		}
		errs.push(`bash: type: ${cmd}: not found`);
	}
	return {
		out: lines.length ? lines.join('\n') + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 1 : 0
	};
}

/* ── environment / aliases / permissions ──────────────────────────── */

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function cmdExport(ctx: Ctx, args: string[]): ExecResult {
	const engine = ctx.engine;
	if (!args.length) {
		return ok(
			Object.entries(engine.env)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([k, v]) => `declare -x ${k}="${v}"`)
				.join('\n') + '\n'
		);
	}
	const errs: string[] = [];
	for (const a of args) {
		const eq = a.indexOf('=');
		const name = eq === -1 ? a : a.slice(0, eq);
		if (!NAME_RE.test(name)) {
			errs.push(
				`bash: export: '${a}': not a valid identifier\n(variable names use letters, digits and _, and can't start with a digit)`
			);
			continue;
		}
		if (eq !== -1) engine.env[name] = a.slice(eq + 1);
		else if (ctx.vars && name in ctx.vars) engine.env[name] = ctx.vars[name];
		// Promoting a shell variable moves it: env is now the only copy.
		if (ctx.vars) delete ctx.vars[name];
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

function cmdAlias(engine: ShellEngine, args: string[]): ExecResult {
	if (!args.length) {
		const list = [...engine.aliases.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `alias ${k}='${v}'`);
		return ok(list.length ? list.join('\n') + '\n' : '');
	}
	const lines: string[] = [];
	const errs: string[] = [];
	for (const a of args) {
		const eq = a.indexOf('=');
		if (eq === -1) {
			const v = engine.aliases.get(a);
			if (v !== undefined) lines.push(`alias ${a}='${v}'`);
			else errs.push(`bash: alias: ${a}: not found`);
			continue;
		}
		const name = a.slice(0, eq);
		if (!NAME_RE.test(name)) {
			errs.push(`bash: alias: '${name}': invalid alias name`);
			continue;
		}
		engine.aliases.set(name, a.slice(eq + 1));
	}
	return {
		out: lines.length ? lines.join('\n') + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 1 : 0
	};
}

function cmdUnalias(engine: ShellEngine, args: string[]): ExecResult {
	if (!args.length) return fail('unalias: usage: unalias NAME [or unalias -a to remove all]');
	if (args[0] === '-a') {
		engine.aliases.clear();
		return ok();
	}
	const errs: string[] = [];
	for (const a of args) {
		if (!engine.aliases.delete(a)) errs.push(`bash: unalias: ${a}: not found`);
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

function octalTriple(digit: number): string {
	return (digit & 4 ? 'r' : '-') + (digit & 2 ? 'w' : '-') + (digit & 1 ? 'x' : '-');
}

function cmdChmod(engine: ShellEngine, args: string[]): ExecResult {
	if (args.length < 2) {
		return fail(
			'chmod: missing operand\n(usage: chmod +x script.sh — or chmod 755 script.sh with octal digits)'
		);
	}
	const mode = args[0];
	const symbolic = mode.match(/^([ugoa]*)([+-])([rwx]+)$/);
	const octal = mode.match(/^[0-7]{3}$/);
	if (!symbolic && !octal) {
		return fail(
			`chmod: invalid mode: '${mode}'\n(this playground supports symbolic modes like +x, u+x, go-w and 3-digit octal like 755 or 644)`
		);
	}
	const errs: string[] = [];
	for (const p of args.slice(1)) {
		const abs = engine.resolve(p);
		const node = engine.getNode(abs);
		if (!node) {
			errs.push(`chmod: cannot access '${p}': No such file or directory`);
			continue;
		}
		if (symbolic) {
			// Start from whatever the file shows now, then edit only the
			// audience the learner named — a bare +x means a+x (Part 5.2).
			const current = engine.modeOf(p) || (node.kind === 'dir' ? 'rwxr-xr-x' : 'rw-r--r--');
			const bits = current.split('');
			const who = symbolic[1] || 'a';
			const adding = symbolic[2] === '+';
			const offsets: number[] = [];
			if (who.includes('u') || who.includes('a')) offsets.push(0);
			if (who.includes('g') || who.includes('a')) offsets.push(3);
			if (who.includes('o') || who.includes('a')) offsets.push(6);
			for (const perm of symbolic[3]) {
				const slot = perm === 'r' ? 0 : perm === 'w' ? 1 : 2;
				for (const off of offsets) bits[off + slot] = adding ? perm : '-';
			}
			node.mode = bits.join('');
			// The owner's x bit is the one that decides whether ./file runs.
			if (node.kind === 'file') node.executable = bits[2] === 'x';
		} else {
			const digits = mode.split('').map(Number);
			// Only the owner-execute bit changes real behavior in the sandbox;
			// the full string is remembered so ls -l tells the truth about it.
			if (node.kind === 'file') node.executable = (digits[0] & 1) === 1;
			node.mode = digits.map(octalTriple).join('');
		}
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

/* ── info & misc ──────────────────────────────────────────────────── */

/** Matches the Uid/Gid that `stat` reports, so the two never disagree. */
const UID = 1000;
const GID = 20;

/**
 * `id` — who the shell thinks you are. Part 5.1 sends the learner here for
 * `id -gn` to name the group in the second column of `ls -l`, so the -u/-g
 * (number) and -n (name) combinations all have to answer.
 */
function cmdId(args: string[]): ExecResult {
	const flags = new Set<string>();
	for (const a of args) {
		if (a.startsWith('-') && a.length > 1) for (const c of a.slice(1)) flags.add(c);
		else if (a !== '') return fail(`id: ${a}: no such user\n(this sandbox only knows ${USER})`);
	}
	const wantName = flags.has('n');
	const wantUser = flags.has('u');
	const wantGroup = flags.has('g');
	if (wantName && !wantUser && !wantGroup) {
		return fail('id: cannot print only names or real IDs in default format');
	}
	if (wantUser && wantGroup) {
		return fail('id: cannot print "only" of more than one choice');
	}
	if (wantUser) return ok(`${wantName ? USER : UID}\n`);
	if (wantGroup) return ok(`${wantName ? GROUP : GID}\n`);
	return ok(`uid=${UID}(${USER}) gid=${GID}(${GROUP}) groups=${GID}(${GROUP})\n`);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function cmdDate(): ExecResult {
	const d = new Date();
	const p = (x: number) => String(x).padStart(2, '0');
	return ok(
		`${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ${d.getFullYear()}\n`
	);
}

function cmdCal(): ExecResult {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	const header = `${monthNames[month]} ${year}`;
	const lines = [
		' '.repeat(Math.max(0, Math.floor((20 - header.length) / 2))) + header,
		'Su Mo Tu We Th Fr Sa'
	];
	const first = new Date(year, month, 1).getDay();
	const daysIn = new Date(year, month + 1, 0).getDate();
	const cells: string[] = Array(first).fill('  ');
	for (let d = 1; d <= daysIn; d++) cells.push(String(d).padStart(2));
	for (let i = 0; i < cells.length; i += 7) lines.push(cells.slice(i, i + 7).join(' '));
	return ok(lines.join('\n') + '\n');
}

function humanSize(n: number): string {
	// One decimal only while it still means something, the way ls -lh and
	// du -h round: 4.0K, 16K, 1.9M.
	const scale = (v: number, unit: string) => (v < 10 ? v.toFixed(1) : String(Math.round(v))) + unit;
	if (n < 1024) return String(n);
	if (n < 1024 * 1024) return scale(n / 1024, 'K');
	if (n < 1024 * 1024 * 1024) return scale(n / (1024 * 1024), 'M');
	return scale(n / (1024 * 1024 * 1024), 'G');
}

function cmdDf(args: string[]): ExecResult {
	const { flags } = flagSplit(args, 'h', 'df');
	const table = flags.has('h')
		? [
				'Filesystem      Size  Used Avail Use% Mounted on',
				'/dev/vda1        40G   12G   28G  30% /',
				'tmpfs           2.0G     0  2.0G   0% /dev/shm'
			]
		: [
				'Filesystem     1K-blocks     Used Available Use% Mounted on',
				'/dev/vda1       41943040 12582912  29360128  30% /',
				'tmpfs            2097152        0   2097152   0% /dev/shm'
			];
	return ok(table.join('\n') + '\n(numbers are simulated — the sandbox has no real disks)\n');
}

function cmdDu(engine: ShellEngine, args: string[]): ExecResult {
	const { flags, rest } = flagSplit(args, 'hs', 'du');
	const human = flags.has('h');
	// du counts allocated blocks, not bytes: its bare numbers are 1K blocks,
	// and -h turns those into the K/M/G that Part 10.4 describes.
	const fmt = (n: number) => (human ? humanSize(n * 1024) : String(n));
	const paths = rest.length ? rest : ['.'];
	const lines: string[] = [];
	const errs: string[] = [];
	for (const root of paths) {
		const abs = engine.resolve(root);
		const node = engine.getNode(abs);
		if (!node) {
			errs.push(`du: cannot access '${root}': No such file or directory`);
			continue;
		}
		const rec = (label: string, cur: VfsNode): number => {
			if (cur.kind === 'file') return blocksOf(cur);
			let sum = blocksOf(cur);
			for (const [name, child] of cur.children) {
				sum += child.kind === 'dir' ? rec(`${label}/${name}`, child) : blocksOf(child);
			}
			if (!flags.has('s')) lines.push(`${fmt(sum)}\t${label}`);
			return sum;
		};
		const total = rec(root, node);
		if (flags.has('s') || node.kind === 'file') lines.push(`${fmt(total)}\t${root}`);
	}
	return {
		out: lines.length ? lines.join('\n') + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 1 : 0
	};
}

/**
 * diff, in the plain line-by-line form Part 7.3 uses to check a sed -i.bak
 * edit: `<` is the first file's line, `>` is the second's. Real diff groups
 * changes into hunks with counts; this reports each differing line.
 */
function cmdDiff(engine: ShellEngine, args: string[]): ExecResult {
	const rest = args.filter((a) => !a.startsWith('-'));
	if (rest.length < 2) {
		return fail(
			'diff: missing operand\n(usage: diff OLD NEW — it prints only the lines that differ)'
		);
	}
	const [aPath, bPath] = rest;
	const errs: string[] = [];
	for (const p of [aPath, bPath]) {
		const node = engine.getNode(engine.resolve(p));
		if (!node) errs.push(`diff: ${p}: No such file or directory`);
		else if (node.kind === 'dir') errs.push(`diff: ${p}: Is a directory`);
	}
	if (errs.length) return fail(errs.join('\n'), 2);
	const a = (engine.readFile(engine.resolve(aPath)) ?? '').split('\n');
	const b = (engine.readFile(engine.resolve(bPath)) ?? '').split('\n');
	if (a[a.length - 1] === '') a.pop();
	if (b[b.length - 1] === '') b.pop();
	const lines: string[] = [];
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		if (a[i] === b[i]) continue;
		lines.push(`${i + 1}c${i + 1}`);
		if (a[i] !== undefined) lines.push(`< ${a[i]}`);
		if (a[i] !== undefined && b[i] !== undefined) lines.push('---');
		if (b[i] !== undefined) lines.push(`> ${b[i]}`);
	}
	// Silence means identical — and diff says so with exit 0 vs exit 1.
	if (!lines.length) return ok();
	return { out: lines.join('\n') + '\n', err: '', code: 1 };
}

function cmdFile(engine: ShellEngine, args: string[]): ExecResult {
	if (!args.length)
		return fail(
			'file: missing operand\n(usage: file NAME — it guesses what kind of thing NAME is)'
		);
	const lines: string[] = [];
	const errs: string[] = [];
	for (const p of args) {
		const abs = engine.resolve(p);
		const node = engine.getNode(abs);
		if (!node) {
			errs.push(`file: cannot open '${p}' (No such file or directory)`);
			continue;
		}
		if (node.kind === 'dir') lines.push(`${p}: directory`);
		else if (node.content === '') lines.push(`${p}: empty`);
		else if (readArchive(node.content)) {
			const manifest = readArchive(node.content)!;
			const count = Object.keys(manifest.entries).length;
			lines.push(
				`${p}: ${manifest.format === 'zip' ? 'Zip archive data' : manifest.format === 'tar.gz' ? 'gzip compressed data, tar archive' : 'tar archive'} (${count} entries)`
			);
		} else if (node.content.startsWith('#!')) {
			const interp = node.content.split('\n')[0].slice(2).trim().split('/').pop() ?? 'shell';
			lines.push(`${p}: ${interp} script, ASCII text executable`);
		} else lines.push(`${p}: ASCII text`);
	}
	return {
		out: lines.length ? lines.join('\n') + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 1 : 0
	};
}

function modeToOctal(mode: string): string {
	let out = '';
	for (let i = 1; i < 10; i += 3) {
		out += String(
			(mode[i] === 'r' ? 4 : 0) + (mode[i + 1] === 'w' ? 2 : 0) + (mode[i + 2] === 'x' ? 1 : 0)
		);
	}
	return '0' + out;
}

function cmdStat(engine: ShellEngine, args: string[]): ExecResult {
	if (!args.length) return fail('stat: missing operand\n(usage: stat FILE)');
	const lines: string[] = [];
	const errs: string[] = [];
	for (const p of args) {
		const abs = engine.resolve(p);
		const node = engine.getNode(abs);
		if (!node) {
			errs.push(`stat: cannot statx '${p}': No such file or directory`);
			continue;
		}
		const mode = modeString(node);
		const size = node.kind === 'dir' ? 4096 : node.content.length;
		const kind = node.kind === 'dir' ? 'directory' : 'regular file';
		const d = new Date(node.mtime);
		const pad = (x: number) => String(x).padStart(2, '0');
		lines.push(
			`  File: ${p}`,
			`  Size: ${String(size).padEnd(10)} Blocks: ${Math.max(1, Math.ceil(size / 512))}          IO Block: 4096   ${kind}`,
			`Access: (${modeToOctal(mode)}/${mode})  Uid: (1000/${USER})   Gid: ( 20/${GROUP})`,
			`Modify: ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
		);
	}
	return {
		out: lines.length ? lines.join('\n') + '\n' : '',
		err: errs.length ? errs.join('\n') + '\n' : '',
		code: errs.length ? 1 : 0
	};
}

function cmdBasename(args: string[]): ExecResult {
	if (!args.length)
		return fail('basename: missing operand\n(usage: basename /path/to/file.txt → file.txt)');
	let name = baseOf(args[0]);
	const suffix = args[1];
	if (suffix && name !== suffix && name.endsWith(suffix)) name = name.slice(0, -suffix.length);
	return ok(name + '\n');
}

function cmdDirname(args: string[]): ExecResult {
	if (!args.length)
		return fail('dirname: missing operand\n(usage: dirname /path/to/file.txt → /path/to)');
	const p = args[0].replace(/\/+$/, '') || '/';
	const idx = p.lastIndexOf('/');
	return ok((idx === -1 ? '.' : idx === 0 ? '/' : p.slice(0, idx)) + '\n');
}

function cmdSeq(args: string[]): ExecResult {
	const nums = args.map((a) => parseFloat(a));
	if (!args.length || nums.some((x) => Number.isNaN(x))) {
		return fail(
			`seq: invalid argument${args.length ? `: '${args[nums.findIndex(Number.isNaN)] ?? args[0]}'` : 's'}\n(usage: seq LAST, seq FIRST LAST, or seq FIRST STEP LAST)`
		);
	}
	let first = 1;
	let step = 1;
	let last: number;
	if (nums.length === 1) last = nums[0];
	else if (nums.length === 2) [first, last] = nums;
	else [first, step, last] = nums;
	if (step === 0) return fail('seq: a step of 0 would loop forever — pick a non-zero step');
	const out: string[] = [];
	if (step > 0) for (let x = first; x <= last; x += step) out.push(String(x));
	else for (let x = first; x >= last; x += step) out.push(String(x));
	return ok(out.length ? out.join('\n') + '\n' : '');
}

function cmdTee(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	const { flags, rest } = flagSplit(args, 'a', 'tee');
	if (stdin === null) {
		throw new CmdError('tee: reads from a pipe here — try: echo hello | tee file.txt');
	}
	for (const f of rest) writeRedirect(engine, f, stdin, flags.has('a'));
	return ok(stdin);
}

async function cmdXargs(ctx: Ctx, args: string[], stdin: string | null): Promise<ExecResult> {
	if (stdin === null) {
		throw new CmdError('xargs: reads from a pipe — try: ls | xargs echo found:');
	}
	const words = stdin.split(/\s+/).filter(Boolean);
	const argv = (args.length ? args : ['echo']).concat(words);
	return execSimple(ctx, argv, null);
}

function cmdSleep(args: string[]): ExecResult {
	if (!args.length)
		return fail(
			'sleep: missing operand\n(usage: sleep SECONDS — pauses that long before the prompt returns)'
		);
	const n = parseFloat(args[0]);
	if (Number.isNaN(n) || n < 0) return fail(`sleep: invalid time interval '${args[0]}'`);
	return ok(
		`(pretending ${args[0]} second${n === 1 ? '' : 's'} just passed — the sandbox skips the actual wait)\n`
	);
}

function cmdExit(ctx: Ctx, args: string[]): ExecResult {
	const raw = args[0];
	const parsed = raw === undefined ? 0 : parseInt(raw, 10);
	const code = Number.isNaN(parsed) ? 2 : ((parsed % 256) + 256) % 256;
	if (ctx.depth > 0) {
		ctx.exited = true;
		return { out: '', err: '', code };
	}
	return {
		out: `exit\n(a real terminal would close now — the sandbox tab stays open, but the exit code ${code} is remembered: check it with \`echo $?\`)\n`,
		err: '',
		code
	};
}

async function cmdSource(ctx: Ctx, args: string[]): Promise<ExecResult> {
	if (!args.length) {
		return fail(
			'source: usage: source FILE\n(runs each line of FILE in the current shell — how ~/.bashrc gets loaded)'
		);
	}
	const abs = ctx.engine.resolve(args[0]);
	const content = ctx.engine.readFile(abs);
	if (content === null) return fail(`bash: source: ${args[0]}: No such file or directory`);
	return runScriptContent(ctx, content, args.slice(1), true);
}

async function cmdBash(ctx: Ctx, cmd: string, args: string[]): Promise<ExecResult> {
	if (!args.length) {
		return ok(
			`You're already in a ${cmd} sandbox — no need to start another shell. Try \`help\` to see what it can do.\n`
		);
	}
	if (args[0] === '-c') {
		return fail(`${cmd}: -c isn't needed here — just type the command directly at the prompt.`);
	}
	const abs = ctx.engine.resolve(args[0]);
	if (!ctx.engine.exists(abs)) return fail(`${cmd}: ${args[0]}: No such file or directory`, 127);
	if (ctx.engine.isDir(abs)) return fail(`${cmd}: ${args[0]}: Is a directory`, 126);
	// `bash script.sh` runs any readable file — no execute bit required.
	const content = ctx.engine.readFile(abs) ?? '';
	return runScriptContent(ctx, content, args.slice(1), false);
}

/* ── teaching stubs ───────────────────────────────────────────────── */

function cmdEditorStub(cmd: string, args: string[]): ExecResult {
	const target = args.find((a) => !a.startsWith('-')) ?? 'file.txt';
	return ok(
		`${cmd}: on a real machine this opens a full-screen text editor — the playground can't take over your screen.\nTo create or change files here, use redirection instead:\n  echo 'first line' > ${target}      (create / overwrite)\n  echo 'another line' >> ${target}   (append)\n  cat ${target}                      (check your work)\n`
	);
}

function cmdSudo(args: string[]): ExecResult {
	if (!args.length) {
		return fail(
			'sudo: runs a command as the administrator ("root") after asking for your password.\nThe sandbox runs everything as the user vibe and has no root — there is no system here to break.\n(on a real machine: respect sudo, and never sudo a command you don\'t understand — especially one an AI wrote)'
		);
	}
	const wrapped = args.join(' ');
	const known = BIN_COMMANDS.includes(args[0]) || STUBS.has(args[0]);
	return fail(
		`sudo: you asked to run '${wrapped}' as the administrator (root).\nThis sandbox has no root and doesn't need one — nothing here requires elevated powers.${known ? `\n(it looks safe — just run it without sudo:  ${wrapped})` : ''}`
	);
}

const CANNED_JSON = '{\n  "message": "hello from the sandbox",\n  "status": "ok"\n}';
const CANNED_HTML =
	'<!doctype html>\n<html>\n  <head><title>Example</title></head>\n  <body><h1>It works!</h1></body>\n</html>';

function cannedBody(url: string): string {
	return url.includes('json') || url.includes('/api') ? CANNED_JSON : CANNED_HTML;
}

/** A URL split into the pieces 9.1 teaches learners to read. */
interface ParsedUrl {
	host: string;
	port?: number;
	path: string;
	isLocal: boolean;
}

function parseUrl(raw: string): ParsedUrl {
	const withoutScheme = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
	const slash = withoutScheme.indexOf('/');
	const authority = slash === -1 ? withoutScheme : withoutScheme.slice(0, slash);
	const path = slash === -1 ? '/' : withoutScheme.slice(slash);
	const colon = authority.lastIndexOf(':');
	const host = colon === -1 ? authority : authority.slice(0, colon);
	const port = colon === -1 ? undefined : Number(authority.slice(colon + 1));
	return {
		host,
		port,
		path,
		isLocal: host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
	};
}

/**
 * What a request gets back. localhost is answered by the process holding the
 * port — so `kill`ing a server really does break `curl`, which is the Part
 * 8 → Part 9 payoff. Remote hosts come from the scenario's canned network.
 */
function respond(engine: ShellEngine, url: ParsedUrl): { body: string; error?: string } {
	if (url.isLocal) {
		const port = url.port ?? 80;
		const server = engine.findByPort(port);
		if (!server) {
			return {
				body: '',
				error:
					`curl: (7) Failed to connect to ${url.host} port ${port}: Connection refused\n` +
					`(nothing is listening on port ${port} — start a server, or check with: lsof -i :${port})`
			};
		}
		// A tiny router: every seeded server answers /health and echoes back
		// anything else as a small JSON object naming the path.
		if (/^\/(health|healthz|api\/health)\/?$/.test(url.path)) {
			return { body: '{"status":"ok"}' };
		}
		if (url.path === '/' || url.path === '') {
			return { body: `<!doctype html>\n<h1>It works</h1>\n<p>served by ${server.command}</p>` };
		}
		return { body: `{"path":"${url.path}","served_by":"${server.command}"}` };
	}
	const key = `${url.host}${url.path}`.replace(/\/$/, '');
	const canned = engine.network[key] ?? engine.network[`${url.host}${url.path}`];
	if (canned !== undefined) return { body: canned };
	if (Object.keys(engine.network).length) {
		return {
			body: '',
			error:
				`curl: (6) Could not resolve host: ${url.host}\n` +
				`(this scenario's sandbox network knows: ${Object.keys(engine.network).join(', ')})`
		};
	}
	// No scenario network configured — fall back to the generic teaching body.
	return { body: cannedBody(`${url.host}${url.path}`) };
}

function cmdCurl(engine: ShellEngine, args: string[]): ExecResult {
	let output: string | null = null;
	let silent = false;
	let headersOnly = false;
	const headers: string[] = [];
	const positional: string[] = [];
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a === '-o' || a === '--output') output = args[++i] ?? null;
		else if (a === '-s' || a === '--silent') silent = true;
		else if (a === '-I' || a === '--head') headersOnly = true;
		else if (a === '-H' || a === '--header') headers.push(args[++i] ?? '');
		else if (a === '-L' || a === '--location')
			continue; // follow redirects: no-op here
		else if (a === '-fsSL' || /^-[a-zA-Z]{2,}$/.test(a)) {
			// Bundled short flags (curl -fsSL …) — accept the common ones.
			for (const ch of a.slice(1)) {
				if (ch === 's') silent = true;
				else if (ch === 'I') headersOnly = true;
			}
		} else if (a.startsWith('-')) {
			throw new CmdError(
				`curl: option '${a}' is beyond this playground\n(it supports -o FILE, -s, -I and -H "Name: value")`
			);
		} else positional.push(a);
	}
	const raw = positional[0];
	if (!raw) {
		throw new CmdError(
			'curl: no URL specified\n(usage: curl localhost:3000/health — or curl -o page.html https://example.com)'
		);
	}
	const url = parseUrl(raw);
	const { body, error } = respond(engine, url);
	if (error) return fail(error, 7);

	if (headersOnly) {
		const head =
			`HTTP/1.1 200 OK\n` +
			`content-type: ${body.trimStart().startsWith('{') ? 'application/json' : 'text/html'}\n` +
			`content-length: ${body.length}\n`;
		return ok(head);
	}
	if (output) {
		engine.writeFile(engine.resolve(output), body + '\n');
		// Real curl prints a progress meter to stderr; -s silences it.
		return silent
			? ok()
			: {
					out: '',
					err: `  % Total    Received\n100  ${body.length}  ${body.length}  (saved to ${output})\n`,
					code: 0
				};
	}
	return ok(body + '\n');
}

function cmdWget(engine: ShellEngine, args: string[]): ExecResult {
	const url = args.find((a) => !a.startsWith('-'));
	if (!url)
		return fail(
			'wget: missing URL\n(usage: wget https://example.com/file — the download is simulated here)'
		);
	const name = baseOf(url.replace(/^[a-z]+:\/\//, '').replace(/\/$/, '')) || 'index.html';
	const target = name.includes('.') ? name : 'index.html';
	engine.writeFile(engine.resolve(target), cannedBody(url) + '\n');
	return ok(
		`Saving to: '${target}'\n'${target}' saved\n(simulated download — the playground has no real network access)\n`
	);
}

/**
 * jq, reduced to the part this course teaches: walk into a JSON value with a
 * dot path and print what you find. Real jq is a query language; the filters
 * below are the ones that read like "give me this field".
 */
function applyJqFilter(value: unknown, filter: string): unknown {
	const path = filter.trim();
	if (path === '.' || path === '') return value;
	if (!path.startsWith('.')) {
		throw new CmdError(
			`jq: a filter starts with a dot — try '.${path}' (or '.' for the whole document)`
		);
	}
	let current: unknown = value;
	for (const rawKey of path.slice(1).split('.')) {
		if (!rawKey) continue;
		// .items[0] — index straight after a key.
		const match = rawKey.match(/^([A-Za-z0-9_-]*)(\[(\d+)\])?$/);
		if (!match) {
			throw new CmdError(
				`jq: '${rawKey}' is beyond this playground — it walks object keys and array indexes, like .latest or .items[0]`
			);
		}
		const [, key, , index] = match;
		if (key) {
			if (current === null || typeof current !== 'object' || Array.isArray(current)) return null;
			current = (current as Record<string, unknown>)[key];
			if (current === undefined) return null;
		}
		if (index !== undefined) {
			if (!Array.isArray(current)) return null;
			current = current[Number(index)];
			if (current === undefined) return null;
		}
	}
	return current;
}

function cmdJq(engine: ShellEngine, args: string[], stdin: string | null): ExecResult {
	let raw = false;
	const rest: string[] = [];
	for (const a of args) {
		if (a === '-r' || a === '--raw-output') raw = true;
		else if (a.startsWith('-') && a !== '.') {
			throw new CmdError(
				`jq: option '${a}' is beyond this playground\n(it supports -r, which prints a string without its quotes)`
			);
		} else rest.push(a);
	}
	const filter = rest[0] ?? '.';
	const files = rest.slice(1);
	const { content, errs } = readSources(engine, files, stdin, 'jq');
	if (errs.length) return fail(errs.join('\n'));
	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		return fail(
			'jq: parse error — that input is not valid JSON\n(pipe it through `cat` first to see what actually arrived; an error page is HTML, not JSON)',
			2
		);
	}
	const result = applyJqFilter(parsed, filter);
	if (raw && typeof result === 'string') return ok(result + '\n');
	return ok(JSON.stringify(result, null, 2) + '\n');
}

/* ── archives: tar and zip ────────────────────────────────────────── */

/**
 * Archives are real files in the VFS whose content is a manifest. A sentinel
 * first line lets `cat` and `file` recognize one and say "this is packed"
 * instead of vomiting JSON — the same courtesy a real terminal does when you
 * cat a binary.
 */
const ARCHIVE_SENTINEL = '#!tv-archive';

interface ArchiveManifest {
	format: 'tar' | 'tar.gz' | 'zip';
	entries: Record<string, string>;
}

export function readArchive(content: string): ArchiveManifest | null {
	if (!content.startsWith(ARCHIVE_SENTINEL)) return null;
	try {
		return JSON.parse(content.slice(content.indexOf('\n') + 1)) as ArchiveManifest;
	} catch {
		return null;
	}
}

function writeArchive(manifest: ArchiveManifest): string {
	return `${ARCHIVE_SENTINEL}\n${JSON.stringify(manifest)}\n`;
}

/** Every file at or under `path`, keyed by a path relative to the cwd. */
function collectForArchive(engine: ShellEngine, path: string): Record<string, string> {
	const entries: Record<string, string> = {};
	const abs = engine.resolve(path);
	const base = engine.cwd.endsWith('/') ? engine.cwd : engine.cwd + '/';
	const node = engine.getNode(abs);
	if (!node) throw new CmdError(`tar: ${path}: Cannot stat: No such file or directory`);
	const walk = (nodePath: string) => {
		const current = engine.getNode(nodePath);
		if (!current) return;
		const rel = nodePath.startsWith(base) ? nodePath.slice(base.length) : nodePath.slice(1);
		if (current.kind === 'file') {
			entries[rel] = current.content;
			return;
		}
		const names = [...current.children.keys()].sort((a, b) => a.localeCompare(b));
		if (!names.length) entries[rel + '/'] = '';
		for (const name of names) walk(`${nodePath}/${name}`);
	};
	walk(abs);
	return entries;
}

function cmdTar(engine: ShellEngine, args: string[]): ExecResult {
	let mode: 'c' | 'x' | 't' | null = null;
	let gzip = false;
	let verbose = false;
	let archiveNext = false;
	let archive: string | null = null;
	const targets: string[] = [];
	for (const a of args) {
		if (archiveNext) {
			archive = a;
			archiveNext = false;
			continue;
		}
		if (a.startsWith('-') || (!targets.length && !archive && /^[cxtzvf]+$/.test(a))) {
			// tar accepts both -xzf and the old bare xzf spelling.
			for (const ch of a.replace(/^-/, '')) {
				if (ch === 'c' || ch === 'x' || ch === 't') mode = ch;
				else if (ch === 'z') gzip = true;
				else if (ch === 'v') verbose = true;
				else if (ch === 'f') archiveNext = true;
				else {
					throw new CmdError(
						`tar: flag '${ch}' is beyond this playground\n(it speaks c create, x extract, t list, z gzip, v verbose and f file)`
					);
				}
			}
			continue;
		}
		targets.push(a);
	}
	if (!mode) {
		throw new CmdError(
			'tar: you must pick a mode\n(-c create, -x extract, -t list — always with -f and the archive name, as in: tar -xzf release.tar.gz)'
		);
	}
	if (!archive) {
		throw new CmdError('tar: no archive named — add -f and the filename (tar -xzf release.tar.gz)');
	}
	const archiveAbs = engine.resolve(archive);

	if (mode === 'c') {
		if (!targets.length) {
			throw new CmdError('tar: nothing to pack — name the files or folders to include');
		}
		const entries: Record<string, string> = {};
		for (const t of targets) Object.assign(entries, collectForArchive(engine, t));
		engine.writeFile(archiveAbs, writeArchive({ format: gzip ? 'tar.gz' : 'tar', entries }));
		const names = Object.keys(entries);
		return ok(verbose ? names.join('\n') + '\n' : '');
	}

	const content = engine.readFile(archiveAbs);
	if (content === null) {
		return fail(
			`tar: ${archive}: Cannot open: No such file or directory\n(check the name with ls — archive names are long and easy to mistype)`
		);
	}
	const manifest = readArchive(content);
	if (!manifest) {
		return fail(
			`tar: ${archive}: This does not look like an archive\n(it is a plain file — cat it to see what it actually is)`,
			2
		);
	}
	const names = Object.keys(manifest.entries);
	if (mode === 't') return ok(names.join('\n') + '\n');

	for (const [rel, body] of Object.entries(manifest.entries)) {
		const dest = engine.resolve(rel);
		if (rel.endsWith('/')) engine.mkdirp(dest);
		else engine.writeFile(dest, body);
	}
	return ok(verbose ? names.join('\n') + '\n' : '');
}

function cmdZip(engine: ShellEngine, args: string[]): ExecResult {
	const rest = args.filter((a) => !a.startsWith('-'));
	const archive = rest[0];
	const targets = rest.slice(1);
	if (!archive || !targets.length) {
		throw new CmdError('zip: usage: zip -r archive.zip folder/   (the archive name comes first)');
	}
	const entries: Record<string, string> = {};
	for (const t of targets) Object.assign(entries, collectForArchive(engine, t));
	const name = archive.endsWith('.zip') ? archive : archive + '.zip';
	engine.writeFile(engine.resolve(name), writeArchive({ format: 'zip', entries }));
	return ok(
		Object.keys(entries)
			.map((f) => `  adding: ${f}`)
			.join('\n') + '\n'
	);
}

function cmdUnzip(engine: ShellEngine, args: string[]): ExecResult {
	const listOnly = args.includes('-l');
	const archive = args.find((a) => !a.startsWith('-'));
	if (!archive) throw new CmdError('unzip: usage: unzip archive.zip  (or unzip -l to peek inside)');
	const content = engine.readFile(engine.resolve(archive));
	if (content === null) {
		return fail(`unzip: cannot find or open ${archive}\n(check the name with ls)`);
	}
	const manifest = readArchive(content);
	if (!manifest) {
		return fail(`unzip: ${archive} is not a zip archive\n(cat it to see what it really is)`, 2);
	}
	const names = Object.keys(manifest.entries);
	if (listOnly) return ok(`Archive:  ${archive}\n` + names.map((n) => `  ${n}`).join('\n') + '\n');
	for (const [rel, body] of Object.entries(manifest.entries)) {
		const dest = engine.resolve(rel);
		if (rel.endsWith('/')) engine.mkdirp(dest);
		else engine.writeFile(dest, body);
	}
	return ok(`Archive:  ${archive}\n` + names.map((n) => `  inflating: ${n}`).join('\n') + '\n');
}

/* ── package managers ─────────────────────────────────────────────── */

/**
 * A tiny curated registry. Installing writes a real executable into
 * /usr/local/bin, which is why the PATH lesson from Part 5 pays off here:
 * "installed" literally means "a file somewhere $PATH looks".
 */
const PACKAGES: Record<string, { summary: string; script: string }> = {
	cowsay: {
		summary: 'a cow that says things',
		script: '#!/usr/bin/env bash\n# cowsay — a configurable speaking cow\n'
	},
	tldr: {
		summary: 'community cheat sheets for commands',
		script: '#!/usr/bin/env bash\n# tldr — practical examples instead of full man pages\n'
	}
};

function installPackage(engine: ShellEngine, name: string, manager: string): ExecResult {
	const pkg = PACKAGES[name];
	if (!pkg) {
		return fail(
			`${manager}: no formula named '${name}' in this playground\n(it stocks: ${Object.keys(PACKAGES).join(', ')})`
		);
	}
	const path = `/usr/local/bin/${name}`;
	if (engine.isFile(path)) {
		return ok(`${manager}: ${name} is already installed (${path})\n`);
	}
	engine.writeFile(path, pkg.script);
	const node = engine.getNode(path);
	if (node?.kind === 'file') node.executable = true;
	return ok(
		`==> Fetching ${name}\n==> Installing ${name} (${pkg.summary})\n` +
			`==> Installed to ${path}\n` +
			`(that directory is on your $PATH, which is the whole reason you can now just type "${name}")\n`
	);
}

function cmdPackageManager(engine: ShellEngine, manager: string, args: string[]): ExecResult {
	const action = args.find((a) => !a.startsWith('-')) ?? '';
	const names = args.filter((a) => !a.startsWith('-') && a !== action);
	// npm spells global installs with -g; brew and apt just take a name.
	const isInstall = /^(install|i|add|-S)$/.test(action);
	if (!isInstall) {
		if (action === 'list' || action === 'ls') {
			const installed = Object.keys(PACKAGES).filter((p) => engine.isFile(`/usr/local/bin/${p}`));
			return ok(installed.length ? installed.join('\n') + '\n' : '(nothing installed yet)\n');
		}
		return fail(
			`${manager}: '${action || '(nothing)'}' is beyond this playground\n(it understands: ${manager} install NAME, and ${manager} list)`
		);
	}
	if (!names.length) {
		return fail(`${manager}: what should it install?\n(example: ${manager} install cowsay)`);
	}
	const results = names.map((n) => installPackage(engine, n, manager));
	return {
		out: results.map((r) => r.out).join(''),
		err: results.map((r) => r.err).join(''),
		code: results.some((r) => r.code !== 0) ? 1 : 0
	};
}

/** cowsay is pure delight, and delight is a legitimate reason to install something. */
function cmdCowsay(args: string[]): ExecResult {
	const text = args.join(' ') || 'moo';
	const top = ' ' + '_'.repeat(text.length + 2);
	const bottom = ' ' + '-'.repeat(text.length + 2);
	return ok(
		`${top}\n< ${text} >\n${bottom}\n` +
			'        \\   ^__^\n' +
			'         \\  (oo)\\_______\n' +
			'            (__)\\       )\\/\\\n' +
			'                ||----w |\n' +
			'                ||     ||\n'
	);
}

/** tldr: the practical-examples answer to man's completeness. */
function cmdTldr(args: string[]): ExecResult {
	const name = args.find((a) => !a.startsWith('-'));
	if (!name) throw new CmdError('tldr: which command?  (example: tldr tar)');
	const page = MAN_PAGES[MAN_ALIASES[name] ?? name];
	if (!page) {
		return fail(`tldr: no page for '${name}' in this playground\n(try: man ${name})`);
	}
	return ok(
		`  ${name}\n\n  ${page.name}\n\n` +
			page.examples.map((e) => `  - ${e}\n`).join('') +
			`\n(tldr shows examples; man ${name} has the full story)\n`
	);
}

/* ── help & man ───────────────────────────────────────────────────── */

const HELP_LINES: [string, string][] = [
	['Orientation', 'pwd  ls  cd  clear  whoami  id  date  cal  history  help  man'],
	['Files & dirs', 'mkdir  touch  cp  mv  rm  rmdir  cat  less  head  tail  file  stat  diff'],
	['Text tools', 'grep  sed  sort  uniq  cut  tr  wc  echo  printf  seq  tee  xargs'],
	['Finding', 'find  which  type'],
	['Permissions', 'chmod  (read them with ls -l)'],
	['Environment', 'env  export  unset  alias  unalias  source'],
	['Scripts', 'bash script.sh   ./script.sh (needs chmod +x)   exit'],
	['Paths & names', 'basename  dirname'],
	['Disk (fake)', 'df  du'],
	['Simulated', 'sudo  curl  wget  ssh  open  ps  top  kill  sleep  nano  vim'],
	['AI agent', 'agent "<task>"  — a real AI agent in this terminal (try: agent)']
];

function cmdHelp(): ExecResult {
	const intro = 'TerminalVibes sandbox — supported commands';
	const glue =
		'Glue that works: pipes (|), redirection (> >> 2> <), chaining (&& || ;),\nquotes, $VARIABLES, ~ and globs (*.txt).\n\nDeep dive: man <command>   (e.g. man grep)';
	const text = [intro, '', ...HELP_LINES.map(([h, c]) => `${h.padEnd(15)}${c}`), '', glue].join(
		'\n'
	);
	const html = [
		span(intro, HEADING_STYLE),
		'',
		...HELP_LINES.map(([h, c]) => span(h.padEnd(15), META_STYLE) + span(c, OUT_STYLE)),
		'',
		span(glue, OUT_STYLE)
	].join('\n');
	return { out: text + '\n', err: '', code: 0, html };
}

interface ManPage {
	name: string;
	synopsis: string;
	description: string;
	examples: string[];
	vibe: string;
	simulated?: boolean;
}

const MAN_ALIASES: Record<string, string> = {
	vi: 'vim',
	'xdg-open': 'open',
	'.': 'source',
	more: 'less',
	sh: 'bash'
};

const MAN_PAGES: Record<string, ManPage> = {
	agent: {
		name: 'run an AI agent in this terminal',
		synopsis: 'agent "<task>"',
		description:
			'Starts an interactive session with a real language model running entirely in your browser (download it once from the Agent panel). The agent works toward your task by proposing bash commands one at a time; each proposal waits for your verdict — allow [y], edit [e], or deny [n] — and Ctrl+C interrupts the whole session. Approved commands run in THIS terminal and change the files you see.',
		examples: ['agent', 'agent "create a notes folder with three dated files"'],
		vibe: 'Read the command, then decide — the approval prompt is the lesson.'
	},
	pwd: {
		name: 'print working directory',
		synopsis: 'pwd',
		description:
			'Prints the absolute path of the directory you are standing in. When you feel lost, pwd is the "you are here" dot on the map.',
		examples: ['pwd'],
		vibe: 'Lost? pwd. Always pwd.'
	},
	ls: {
		name: 'list directory contents',
		synopsis: 'ls [-l] [-a] [-h] [-t] [-F] [-R] [path ...]',
		description:
			'Lists what a directory contains. -l shows the long view (permissions, link count, owner, group, size, date), -a includes hidden dotfiles, -h prints sizes as K/M/G instead of bytes, -t sorts newest first, -F marks directories with / and executables with *, -R descends into subdirectories. The "total" line -l prints is disk blocks used, not a count of the files.',
		examples: ['ls', 'ls -la', 'ls -lat', 'ls -lh projects/'],
		vibe: 'Look before you leap — ls before you rm.'
	},
	cd: {
		name: 'change directory',
		synopsis: 'cd [dir]   cd ..   cd ~   cd -',
		description:
			'Moves your shell to another directory. With no argument it goes home (~). `cd ..` goes up one level, and `cd -` jumps back to wherever you just were.',
		examples: ['cd projects', 'cd ..', 'cd -'],
		vibe: 'The terminal is a place; cd is how you walk.'
	},
	mkdir: {
		name: 'make directories',
		synopsis: 'mkdir [-p] dir ...',
		description:
			'Creates directories. Plain mkdir needs the parent to exist already; mkdir -p creates the whole chain in one go and never complains about existing folders.',
		examples: ['mkdir docs', 'mkdir -p src/components/ui'],
		vibe: 'mkdir -p: scaffolding a project in one line.'
	},
	touch: {
		name: 'create an empty file (or update its timestamp)',
		synopsis: 'touch file ...',
		description:
			'If the file does not exist, touch creates it empty. If it does, touch just bumps its modification time. Handy for quickly sketching a project skeleton.',
		examples: ['touch README.md', 'touch src/app.py src/util.py'],
		vibe: 'The gentlest way to make a file exist.'
	},
	cat: {
		name: 'concatenate files and print them',
		synopsis: 'cat [-n] [file ...]',
		description:
			'Prints file contents to the terminal, one after another. -n numbers the lines. For long files a pager like less is kinder to your scrollback.',
		examples: ['cat notes.txt', 'cat -n script.sh', 'cat part1.txt part2.txt > whole.txt'],
		vibe: 'The fastest way to look inside a file.'
	},
	less: {
		name: 'page through text one screen at a time',
		synopsis: 'less file',
		description:
			'A pager: shows a long file one screenful at a time. On a real machine you scroll with space/arrows and quit with q — remember q, everyone gets stuck in a pager once. This playground prints the whole file with a note instead.',
		examples: ['less server.log', 'man ls   (man uses a pager too — q to quit)'],
		vibe: 'Press q. That is the wisdom.'
	},
	head: {
		name: 'show the first lines of a file',
		synopsis: 'head [-n N] [file ...]',
		description:
			'Prints the first 10 lines (or -n N lines). Great for peeking at a file without flooding the screen.',
		examples: ['head server.log', 'head -n 3 notes.txt'],
		vibe: 'A polite peek at the top.'
	},
	tail: {
		name: 'show the last lines of a file',
		synopsis: 'tail [-n N] [file ...]',
		description:
			'Prints the last 10 lines (or -n N). The end of a log file is where the newest — and usually most interesting — entries live. Real tail has -f to follow a growing file live.',
		examples: ['tail server.log', 'tail -n 20 access.log'],
		vibe: 'Logs are read bottom-first.'
	},
	wc: {
		name: 'count lines, words and characters',
		synopsis: 'wc [-l] [-w] [-c] [file ...]',
		description:
			'Counts things. -l lines, -w words, -c characters; with no flags it prints all three. Shines at the end of a pipeline: `grep error log | wc -l` counts matches.',
		examples: ['wc -l access.log', 'ls | wc -l'],
		vibe: "The pipeline's scorekeeper."
	},
	grep: {
		name: 'search text for a pattern',
		synopsis: 'grep [-i -n -v -c -r] PATTERN [file ...]',
		description:
			'Prints lines matching PATTERN. -i ignores case, -n shows line numbers, -v inverts (lines NOT matching), -c counts instead of printing, -r searches whole directories. Works on files or on piped input.',
		examples: ['grep -in error server.log', "grep -r 'TODO' .", 'history | grep cd'],
		vibe: 'The single most useful command you will ever learn.'
	},
	sort: {
		name: 'sort lines of text',
		synopsis: 'sort [-r] [-n] [-u] [file ...]',
		description:
			'Sorts lines alphabetically. -n sorts numerically (so 9 comes before 10), -r reverses, -u drops duplicate lines after sorting.',
		examples: ['sort names.txt', 'sort -n scores.txt', 'sort -u tags.txt'],
		vibe: 'Chaos in, order out.'
	},
	uniq: {
		name: 'filter out repeated adjacent lines',
		synopsis: 'uniq [-c] [file]',
		description:
			'Collapses repeated lines — but only when they are ADJACENT, so sort first: `sort | uniq` is the classic pair. -c prefixes each line with how many times it appeared.',
		examples: ['sort tags.txt | uniq', "cut -d' ' -f1 access.log | sort | uniq -c | sort -n"],
		vibe: 'uniq only sees neighbors; sort makes them neighbors.'
	},
	cut: {
		name: 'select columns from each line',
		synopsis: 'cut -d DELIM -f FIELDS [file ...]',
		description:
			'Splits each line on a delimiter and keeps only the fields you ask for. -d sets the delimiter (default: tab), -f picks fields like 1, 1,3 or 2-4.',
		examples: ["cut -d',' -f2 data.csv", "cut -d' ' -f1 access.log"],
		vibe: 'Spreadsheet columns, terminal style.'
	},
	tr: {
		name: 'translate or delete characters',
		synopsis: 'tr SET1 SET2   tr -d SET1',
		description:
			'Replaces every character in SET1 with the matching character in SET2 (ranges like a-z work), or deletes them with -d. Reads from a pipe.',
		examples: ['echo hello | tr a-z A-Z', "echo 'ha-ha' | tr -d '-'"],
		vibe: 'Tiny find-and-replace, one character at a time.'
	},
	sed: {
		name: 'stream editor — find & replace on flowing text',
		synopsis: "sed [-n] [-E] [-i[.bak]] 'SCRIPT' [file ...]",
		description:
			'Edits text line by line as it streams past. The star is substitution — read s/mango/kiwi/g as: s (substitute), / (a delimiter; s|mango|kiwi| and s,mango,kiwi, work too), mango (find this), kiwi (replace with this — & in the replacement stands for the whole match), g (every match on the line, not just the first; I ignores case). A command can take an address first: a line number (5), a range (5,9), $ (the last line), a /regex/, or /start/,/stop/. d deletes the selected lines and p prints them — pair p with -n, which silences the default printing, to show only what you select: sed -n \'5,9p\'. -E turns on extended regex, making + ? | ( ) special without backslashes. sed never touches the input file unless you pass -i, and the house rule is -i.bak: the original is kept as file.bak — instant backup, instant undo. grep answers "which lines?"; sed makes them different.',
		examples: [
			"sed 's/mango/kiwi/g' menu.txt",
			"sed -n '5,9p' server.log",
			"sed '/DEBUG/d' app.log > clean.log",
			"sed -i.bak 's/http:/https:/g' config.yml"
		],
		vibe: 'Find & replace, unplugged from any editor.'
	},
	awk: {
		name: 'pull columns out of text',
		synopsis: "awk [-F,] 'PROGRAM' [file ...]",
		description:
			"Splits every line into fields and prints the ones you ask for: awk '{print $2}' prints the second column, $0 is the whole line, and commas join fields with a space — awk '{print $1, $3}'. Fields split on runs of spaces by default, which is what makes awk shine on ragged output like ps aux; -F sets a different separator (-F, for CSV, -F: for /etc/passwd style). A /pattern/ in front filters which lines the action runs on: awk '/error/ {print $1}'. Rule of thumb: cut for clean single-character delimiters, awk when the spacing is messy. Real awk is a whole programming language (BEGIN blocks, variables, printf) — this playground speaks just the field-printing dialect this course teaches.",
		examples: [
			"awk '{print $2}' table.txt",
			"awk -F, '{print $1, $3}' signups.csv",
			"awk '/error/ {print $1}' server.log",
			"ps aux | awk '{print $2}'"
		],
		vibe: 'The column-puller for ragged tables.'
	},
	echo: {
		name: 'print text',
		synopsis: 'echo [-n] [-e] [text ...]',
		description:
			'Prints its arguments. -n skips the trailing newline; -e interprets \\n and \\t. Echo is also the safest way to preview an expansion: `echo rm *.txt` shows what the glob would hit before you run the real thing.',
		examples: ['echo hello', 'echo $HOME', "echo 'line' >> notes.txt"],
		vibe: 'The terminal\'s "say it out loud first" habit.'
	},
	printf: {
		name: 'formatted printing',
		synopsis: 'printf FORMAT [args ...]',
		description:
			'Prints arguments through a format string: %s for strings, %d for integers, \\n for newlines. Unlike echo it adds no newline unless you ask.',
		examples: ["printf '%s: %d\\n' score 42"],
		vibe: 'echo with a tailored suit on.'
	},
	cp: {
		name: 'copy files and directories',
		synopsis: 'cp [-r] [-i] SOURCE… DEST',
		description:
			'Copies SOURCE to DEST. If DEST is an existing directory, the copy lands inside it — and with more than one source, DEST has to be a directory that already exists, because cp never creates one. Directories need -r (recursive) to copy everything within. Overwrites existing files silently — like the real thing; -i stops and asks first.',
		examples: [
			'cp notes.txt backup.txt',
			'cp -i config.yaml backups/',
			'cp -r project/ project-backup/'
		],
		vibe: 'Duplicate first, experiment second.'
	},
	mv: {
		name: 'move or rename',
		synopsis: 'mv [-i] SOURCE DEST',
		description:
			'One command, two jobs: `mv old new` renames; `mv file dir/` moves into a directory. It silently replaces an existing DEST — add -i to be asked first (in the sandbox, -i simply refuses).',
		examples: ['mv draft.md final.md', 'mv *.png images/'],
		vibe: 'Rename and move are the same thing wearing different hats.'
	},
	rm: {
		name: 'remove files — permanently',
		synopsis: 'rm [-r] [-f] [-i] file ...',
		description:
			'Deletes files. THERE IS NO TRASH CAN: rm does not undo. -r removes directories and all their contents, -f skips complaints. Run ls with the same arguments first so you see exactly what will disappear.',
		examples: ['rm old-draft.txt', 'ls temp/   (look first!)', 'rm -r temp/'],
		vibe: 'rm is forever. ls first.'
	},
	rmdir: {
		name: 'remove empty directories',
		synopsis: 'rmdir dir ...',
		description:
			'Removes a directory only if it is already empty — a built-in safety check that rm -r deliberately lacks.',
		examples: ['rmdir old-empty-folder'],
		vibe: 'The cautious sibling of rm -r.'
	},
	find: {
		name: 'search for files by name, type or location',
		synopsis: "find [path] [-name 'PATTERN'] [-type f|d] [-maxdepth N]",
		description:
			'Walks a directory tree and prints every path that matches. Quote the -name pattern so the shell does not expand it first. find searches file NAMES; grep -r searches file CONTENTS.',
		examples: ["find . -name '*.py'", 'find projects -type d', 'find . -maxdepth 1 -type f'],
		vibe: 'find knows where; grep knows what.'
	},
	which: {
		name: 'locate a command on PATH',
		synopsis: 'which command',
		description:
			'Prints the full path of the program that would run. If which finds nothing, that is precisely what "command not found" means: the program is not in any PATH directory.',
		examples: ['which ls', 'which python3'],
		vibe: '"command not found", demystified.'
	},
	type: {
		name: 'say what kind of command something is',
		synopsis: 'type command',
		description:
			'Tells you whether a name is an alias, a shell builtin, or a program on PATH — which which alone cannot. Useful when an alias is shadowing the real command.',
		examples: ['type cd', 'type ll', 'type ls'],
		vibe: 'Who exactly am I about to run?'
	},
	whoami: {
		name: 'print your username',
		synopsis: 'whoami',
		description:
			'Prints the user the shell is running as. In the sandbox that is always vibe. On real machines it matters most when sudo or ssh may have changed who you are.',
		examples: ['whoami'],
		vibe: 'An existential question with a one-word answer.'
	},
	id: {
		name: 'print your user and group identity',
		synopsis: 'id [-un] [-gn]',
		description:
			'Prints who the system thinks you are: your user id and name, and the group you belong to. Bare id prints all of it at once. -u asks for the user and -g for the group; adding -n asks for the name instead of the number, so id -gn prints the group name — the second name in every ls -l line (Part 5.1).',
		examples: ['id', 'id -gn', 'id -un'],
		vibe: 'whoami, with your group along for the ride.'
	},
	date: {
		name: 'print the current date and time',
		synopsis: 'date',
		description:
			'Prints the system clock. Real date accepts +FORMAT strings for custom output; the playground keeps it simple.',
		examples: ['date'],
		vibe: "Time flies when you're piping."
	},
	cal: {
		name: 'show a calendar',
		synopsis: 'cal',
		description:
			'Prints the current month as a small calendar grid. A tiny, delightful proof that terminals are not just for "serious" work.',
		examples: ['cal'],
		vibe: 'Paper calendars, 1969 edition.'
	},
	clear: {
		name: 'clear the screen',
		synopsis: 'clear',
		description:
			'Wipes the terminal display. Nothing is deleted — your files and history are untouched; it only tidies the view. Ctrl-L does the same.',
		examples: ['clear'],
		vibe: 'A clean desk for your brain.'
	},
	help: {
		name: 'list the commands this playground supports',
		synopsis: 'help',
		description:
			'Prints a compact, grouped list of every supported command plus the shell syntax that works here.',
		examples: ['help'],
		vibe: 'The map of the sandbox.'
	},
	man: {
		name: 'read the manual',
		synopsis: 'man [section] command   man -k keyword',
		description:
			"Shows the manual page for a command. Real man pages open in a pager (q quits). A leading section number picks between pages that share a name — man 1 crontab is the command, man 5 crontab the file format. man -k searches every page's one-line description, which is how you find a command whose name you do not know yet. Reading man pages — or asking your AI to explain one — is the core skill of verifying commands before running them.",
		examples: ['man grep', 'man rm', 'man -k download'],
		vibe: 'RTFM, said with love.'
	},
	history: {
		name: 'show commands you have run',
		synopsis: 'history',
		description:
			'Prints your numbered command history for this session. Up-arrow recalls commands one by one; on a real machine Ctrl-R searches history as you type.',
		examples: ['history', 'history | grep cd'],
		vibe: "Your terminal remembers so you don't have to."
	},
	env: {
		name: 'print environment variables',
		synopsis: 'env',
		description:
			"Lists every environment variable as NAME=value. These are the shell's settings: HOME is your home directory, PATH is where commands are searched for, USER is you.",
		examples: ['env', 'env | grep PATH'],
		vibe: "The shell's control panel, in plain text."
	},
	export: {
		name: 'set an environment variable',
		synopsis: 'export NAME=value',
		description:
			'Sets a variable and marks it for child programs to inherit. Plain NAME=value also works for the current shell. Read a variable back with echo $NAME.',
		examples: ['export EDITOR=nano', 'export PATH="$PATH:/home/vibe/bin"', 'echo $EDITOR'],
		vibe: 'Settings, but composable.'
	},
	unset: {
		name: 'remove a variable',
		synopsis: 'unset NAME',
		description:
			'Deletes an environment variable entirely — different from setting it to an empty string.',
		examples: ['unset EDITOR'],
		vibe: 'The ctrl-z of export (sort of).'
	},
	alias: {
		name: 'create a command shortcut',
		synopsis: "alias name='command'   alias",
		description:
			"Defines a shorthand: after `alias ll='ls -la'`, typing ll runs ls -la. With no arguments it lists your aliases. Aliases live only in the current session unless saved in ~/.bashrc and loaded with source.",
		examples: ["alias ll='ls -la'", 'alias', 'll'],
		vibe: 'Laziness, institutionalized — beautifully.'
	},
	unalias: {
		name: 'remove an alias',
		synopsis: 'unalias name   unalias -a',
		description: 'Deletes an alias. -a removes them all.',
		examples: ['unalias ll'],
		vibe: 'Shortcut regret, resolved.'
	},
	chmod: {
		name: 'change file permissions',
		synopsis: 'chmod [ugoa][+-][rwx] file   chmod 755 file',
		description:
			'Changes who may read (r), write (w) and execute (x) a file. + adds a permission, - removes one, and a letter in front picks the audience: u you, g your group, o everyone else, a all three. A bare +x means a+x, so chmod u+x grants it to you alone. +x makes a script runnable — the step everyone forgets before ./script.sh. Octal recipes: 755 = I do everything / others read & run; 644 = I read & write / others read.',
		examples: ['chmod +x deploy.sh', 'chmod u+x deploy.sh', './deploy.sh', 'chmod 644 notes.txt'],
		vibe: 'The bouncer of the filesystem.'
	},
	diff: {
		name: 'compare two files line by line',
		synopsis: 'diff OLD NEW',
		description:
			'Prints only the lines where two files disagree: < is a line from the first file, > the matching line from the second. The everyday use is checking an edit you just made — diff config.yml.bak config.yml after a sed -i.bak run. Identical files print nothing and exit 0; any difference exits 1.',
		examples: ['diff config.yml.bak config.yml', 'diff notes.txt notes-old.txt'],
		vibe: 'The undo button starts with knowing what changed.'
	},
	df: {
		name: 'disk free space',
		synopsis: 'df [-h]',
		description:
			'Reports how full each disk is. -h prints human-readable sizes (G, M). The sandbox shows plausible fake numbers — there is no real disk behind it.',
		examples: ['df -h'],
		vibe: 'Is my disk full? The eternal question.',
		simulated: true
	},
	file: {
		name: 'guess what a file is',
		synopsis: 'file name',
		description:
			'Inspects contents (not the extension!) to say what a file is: text, a script, a directory. Handy before you cat something suspicious.',
		examples: ['file notes.txt', 'file deploy.sh'],
		vibe: 'Judge a file by its contents, not its name.'
	},
	stat: {
		name: 'detailed file status',
		synopsis: 'stat file',
		description:
			'Shows the metadata behind ls -l: size, permission bits (octal and rwx form), and modification time.',
		examples: ['stat notes.txt'],
		vibe: 'ls -l with the microscope out.'
	},
	basename: {
		name: 'strip the directory from a path',
		synopsis: 'basename path [suffix]',
		description:
			'Prints just the final component of a path. An optional suffix argument is trimmed too — nice for turning report.txt into report.',
		examples: ['basename /home/vibe/notes.txt', 'basename report.txt .txt'],
		vibe: 'The filename, hold the path.'
	},
	dirname: {
		name: 'strip the filename from a path',
		synopsis: 'dirname path',
		description:
			'Prints everything before the final component — the folder that contains the thing.',
		examples: ['dirname /home/vibe/notes.txt'],
		vibe: "basename's other half."
	},
	seq: {
		name: 'print a sequence of numbers',
		synopsis: 'seq LAST   seq FIRST LAST   seq FIRST STEP LAST',
		description:
			'Prints numbers one per line. Mostly a pipeline ingredient and loop fuel on real machines.',
		examples: ['seq 5', 'seq 2 2 10'],
		vibe: 'Counting, outsourced.'
	},
	tee: {
		name: 'write to a file AND pass output along',
		synopsis: 'command | tee [-a] file',
		description:
			'Like a plumbing T-fitting: saves the piped input to a file while also printing it, so you can watch and record at once. -a appends.',
		examples: ['ls -l | tee listing.txt', 'echo done | tee -a log.txt'],
		vibe: 'Have your output and save it too.'
	},
	xargs: {
		name: 'turn piped words into command arguments',
		synopsis: 'command | xargs [command]',
		description:
			'Reads words from the pipe and appends them as arguments to another command — the bridge between "a list of names" and "a command that wants arguments".',
		examples: ["find . -name '*.tmp' | xargs rm", 'echo a b c | xargs mkdir'],
		vibe: 'The adapter plug of pipelines.'
	},
	sleep: {
		name: 'wait a number of seconds',
		synopsis: 'sleep SECONDS',
		description:
			'Pauses before the prompt returns; used in scripts to wait for slow things. The sandbox winks and skips the actual waiting.',
		examples: ['sleep 2'],
		vibe: 'Even terminals nap.'
	},
	true: {
		name: 'do nothing, successfully',
		synopsis: 'true',
		description:
			'Exits with code 0 (success). Exists for logic: testing && chains, placeholder commands.',
		examples: ['true && echo it-ran'],
		vibe: 'Success at doing absolutely nothing.'
	},
	false: {
		name: 'do nothing, unsuccessfully',
		synopsis: 'false',
		description:
			'Exits with code 1 (failure). The other half of the exit-code teaching kit: try false || echo plan-b.',
		examples: ['false || echo plan-b', 'false; echo $?'],
		vibe: 'Failure, on demand, for science.'
	},
	exit: {
		name: 'leave the shell (with an exit code)',
		synopsis: 'exit [code]',
		description:
			'Ends the shell session. In scripts, exit N stops the script and reports code N — 0 means success, anything else means failure. The sandbox tab stays open, but the code is real: check it with echo $?.',
		examples: ['exit 1', 'echo $?'],
		vibe: 'Every command gets a final grade.'
	},
	source: {
		name: "run a file's lines in the CURRENT shell",
		synopsis: 'source file   . file',
		description:
			'Executes each line of a file right here — so variables and aliases it defines stick around. This is how ~/.bashrc loads, and why config changes need `source ~/.bashrc` to take effect now.',
		examples: ['source ~/.bashrc'],
		vibe: "Reload your shell's personality."
	},
	bash: {
		name: 'the shell itself (run a script)',
		synopsis: 'bash script.sh [args]',
		description:
			'Runs a script in a fresh shell — no execute bit needed, unlike ./script.sh. Bash (1989) is the lingua franca of shells; zsh on macOS speaks the same language for everything this course covers.',
		examples: ['bash backup.sh', './backup.sh   (needs chmod +x first)'],
		vibe: 'The language this whole course is teaching.'
	},
	nano: {
		name: 'a friendly full-screen text editor',
		synopsis: 'nano file',
		description:
			'On a real machine nano takes over the terminal for editing (Ctrl-O saves, Ctrl-X exits). The playground has no full-screen mode — build files with echo/>>/cat instead.',
		examples: ["echo 'hello' > file.txt   (the sandbox way)"],
		vibe: 'The editor that prints its own cheat sheet.',
		simulated: true
	},
	vim: {
		name: 'a powerful modal text editor',
		synopsis: 'vim file',
		description:
			'A full-screen editor with modes; famously, :q quits (the most searched question in terminal history). No full-screen editing in the playground — use echo redirection to build files.',
		examples: [":q   (you're welcome)", "echo 'text' >> file.txt   (the sandbox way)"],
		vibe: 'Enter as a novice; leave when you learn :q.',
		simulated: true
	},
	sudo: {
		name: 'run a command as the administrator',
		synopsis: 'sudo command',
		description:
			"Elevates one command to root powers after asking your password. Root can change ANYTHING, so treat sudo with respect — and never sudo a command you don't understand, especially one an AI suggested. The sandbox has no root and needs none.",
		examples: ['sudo apt install cowsay   (on a real Linux box)'],
		vibe: 'Great power, great "are you sure?".',
		simulated: true
	},
	curl: {
		// The real NAME line, verbatim from `whatis curl`. Note it contains no
		// "download", which is why `man -k download` does not find curl —
		// exactly the lesson 1.3 draws about keyword search.
		name: 'transfer a URL',
		synopsis: 'curl [-s] [-I] [-o FILE] [-H "Name: value"] URL',
		description:
			'Asks a server for something and prints what comes back — the terminal\'s way of checking a claim like "the dev server is running". curl localhost:3000/health is the fastest way to find out for yourself. -o FILE saves the reply instead of printing it, -s hides the progress meter (use it in scripts and pipelines), -I asks for just the headers, and -H adds a request header. The reply is usually JSON, so it pipes straight into jq. In this sandbox localhost is answered by whatever process actually holds the port — kill the server and curl fails with "Connection refused", exactly like the real thing; other hosts answer from the scenario\'s canned network.',
		examples: [
			'curl localhost:3000/health',
			'curl -o page.html https://example.com',
			'curl -s api.vibecloud.dev/releases | jq -r .latest'
		],
		vibe: 'Ask the network. Believe the answer, not the promise.'
	},
	tar: {
		name: 'pack many files into one, and unpack them again',
		synopsis: 'tar -czf ARCHIVE PATHS…   ·   tar -tzf ARCHIVE   ·   tar -xzf ARCHIVE',
		description:
			'The flag soup decoded, one letter at a time: c creates an archive, x extracts one, t lists what is inside without unpacking, z means the archive is also gzip-compressed (the .gz in .tar.gz), f says "the next word is the archive filename", and v prints each file as it goes. So tar -xzf release.tar.gz reads: extract, un-gzip, this file. The habit worth keeping: run tar -tzf first to see what will land where — archives can contain paths that scatter files across your folder, and t costs you nothing.',
		examples: [
			'tar -tzf release.tar.gz',
			'tar -xzf release.tar.gz',
			'tar -czf backup.tar.gz notes/'
		],
		vibe: 'Peek before you unpack.'
	},
	unzip: {
		name: 'unpack a .zip archive',
		synopsis: 'unzip [-l] ARCHIVE',
		description:
			"Extracts a zip archive into the current directory. -l lists the contents without extracting — the zip world's version of tar -tzf, and worth the same habit. Its partner zip -r archive.zip folder/ packs one up.",
		examples: ['unzip -l assets.zip', 'unzip assets.zip', 'zip -r assets.zip images/'],
		vibe: 'The other crate opener.'
	},
	brew: {
		name: 'install tools (macOS package manager)',
		synopsis: 'brew install NAME   ·   brew list',
		description:
			'Fetches a tool, unpacks it, and puts it somewhere your $PATH already looks — usually /usr/local/bin. That last part is the whole trick: "installing" a command-line tool mostly means placing a file where the shell can find it, which is why Part 5\'s PATH lesson explains what package managers are really doing. Linux uses apt (sudo apt install NAME) and JavaScript tools come from npm (npm i -g NAME); the shape is the same everywhere. Read what an install pulls in before running it, especially when an agent suggests it.',
		examples: ['brew install cowsay', 'brew list', 'which cowsay'],
		vibe: 'One command fetches, unpacks and shelves.'
	},
	du: {
		name: 'how much space is this using?',
		synopsis: 'du -sh [PATH…]',
		description:
			'Measures disk usage in disk blocks, which is why even a tiny file costs 4K. -h prints human sizes (K, M, G) and -s gives one summary line per argument instead of every subfolder. The everyday incantation is du -sh */ — the size of each folder here, so the space hog is obvious at a glance. Measure before you delete: it turns "I think node_modules is big" into a number, and it is the honest first step before any rm.',
		examples: ['du -sh *', 'du -sh node_modules', 'df -h'],
		vibe: 'Find the space hog before you swing.'
	},
	jq: {
		name: 'read a value out of JSON',
		synopsis: 'jq [-r] FILTER [file]',
		description:
			'APIs answer in JSON — nested boxes of values. A jq filter is the path to the box you want: `.` is the whole document, `.latest` is one key, `.server.port` walks deeper, `.items[0]` picks the first element of an array. By default jq prints valid JSON, so a string comes back with its quotes; -r ("raw") hands you the bare value, which is what you want when the result feeds another command. If jq says "parse error", look at the raw response with cat — an error page is HTML, not JSON.',
		examples: [
			'curl -s api.vibecloud.dev/releases | jq .',
			'curl -s api.vibecloud.dev/releases | jq -r .latest',
			'jq .server.port config.json'
		],
		vibe: 'The key to the nested jar.'
	},
	wget: {
		// Real GNU wget's NAME line, so `man -k download` matches it here for
		// the same reason it does on a real machine.
		name: 'The non-interactive network downloader',
		synopsis: 'wget URL',
		description:
			'Like curl, but saves to a file by default instead of printing. The playground simulates the download and writes a small canned file.',
		examples: ['wget https://example.com/data.json', 'cat data.json'],
		vibe: "curl's sibling that keeps what it fetches.",
		simulated: true
	},
	ssh: {
		name: 'open a shell on another machine',
		synopsis: 'ssh user@host',
		description:
			'Connects your terminal to a remote computer securely; every command you then type runs THERE. It is how servers are administered. The sandbox has no network, so this is explanation-only.',
		examples: ['ssh vibe@myserver.com   (on a real machine)'],
		vibe: 'Your terminal, teleported.',
		simulated: true
	},
	open: {
		name: 'open a file or URL in its default app',
		synopsis: 'open target   (macOS)   xdg-open target   (Linux)',
		description:
			'Hands a file, folder or URL to the graphical world: Finder/Explorer, your browser, an image viewer. The bridge from terminal to GUI. No GUI in the sandbox, so simulated.',
		examples: ['open .   (current folder in Finder)', 'xdg-open photo.png'],
		vibe: 'The terminal waving at the GUI.',
		simulated: true
	},
	ps: {
		name: 'list running processes',
		synopsis: 'ps [aux]',
		description:
			"Every running program is a row with a number. PID is that number — the handle you pass to kill. %CPU is how hard it is working (a runaway sits near 100). COMMAND is what it actually is. Plain ps lists only what is attached to this terminal — your shell and the jobs it started — which is why the server you are hunting is never in it. ps aux (BSD spelling) and ps -ef (System V spelling) both widen it to the whole machine. Pipe it: ps aux | grep node finds a process by name, and awk '{print $2}' pulls the PID column out.",
		examples: ['ps', 'ps aux', 'ps aux | grep node'],
		vibe: 'The census of everything running.'
	},
	pgrep: {
		name: 'find process ids by name',
		synopsis: 'pgrep NAME',
		description:
			'Prints the PID of every process whose command contains NAME — the short way to do ps aux | grep NAME. Prints nothing and exits 1 when there is no match, which makes it easy to test with && and ||.',
		examples: ['pgrep node', 'pgrep serve'],
		vibe: 'Straight to the number.'
	},
	kill: {
		name: 'signal a process to stop',
		synopsis: 'kill [-SIGNAL] PID',
		description:
			'Sends a signal to a process. Plain kill sends SIGTERM (15): a polite letter that says "please finish up and stop" — the program can save its work, close files, and bow out cleanly. It can also catch that signal and ignore it. kill -9 sends SIGKILL: the floor simply opens, with no cleanup and no goodbye, and no program can refuse it. Ask politely first; -9 is the last resort, not the default. Find the PID with ps, pgrep, or lsof -i :PORT. kill %1 addresses a background job by its number. Every signal has a number and a name, and -N means "send signal N": -15/-TERM is the default, -9/-KILL cannot be caught, -2/-INT is what Ctrl+C sends, -1/-HUP is the traditional "reload your config".',
		examples: ['kill 412', 'kill -9 412', 'kill -HUP 412', 'kill %1'],
		vibe: 'Ask nicely. Then insist.'
	},
	lsof: {
		name: 'who is holding this port?',
		synopsis: 'lsof -i :PORT',
		description:
			'Real lsof lists open files (the name is "ls of open files"); the question worth memorizing is the port one. lsof -i :3000 prints the process listening on port 3000 — its COMMAND and, crucially, its PID, which you then hand to kill. Silence means the port is free. This is the fix for "address already in use": find the squatter, stop it, start yours.',
		examples: ['lsof -i :3000', 'lsof -i'],
		vibe: "The harbormaster's ledger."
	},
	jobs: {
		name: 'list background jobs from this shell',
		synopsis: 'jobs',
		description:
			'Shows what this shell sent backstage with &, each with its job number in [brackets]. Use that number with fg %1 to bring it forward or kill %1 to stop it. Job numbers are per-shell and small; PIDs are machine-wide and large.',
		examples: ['jobs', 'fg %1', 'kill %1'],
		vibe: "Who's waiting in the wings?"
	},
	fg: {
		name: 'bring a background job to the foreground',
		synopsis: 'fg [%N]',
		description:
			'Pulls a backgrounded job back into the spotlight, so its output comes to your terminal and Ctrl+C would interrupt it. With no argument it takes the most recent job. In this playground a backgrounded command waits until you fg it — real background jobs run the whole time, but the concepts (& sends it away, jobs lists it, fg brings it back) are the same ones.',
		examples: ['fg', 'fg %1'],
		vibe: 'Back into the spotlight.'
	},
	bg: {
		name: 'resume a stopped job in the background',
		synopsis: 'bg [%N]',
		description:
			'Restarts a job you paused (Ctrl+Z stops the foreground job) and leaves it running backstage — the same state it would be in had you started it with &. The classic rescue: you ran a long command, forgot the &, pressed Ctrl+Z, and now want your prompt back.',
		examples: ['bg', 'bg %1'],
		vibe: 'Carry on — quietly.'
	},
	serve: {
		name: 'start a small web server on a port',
		synopsis: 'serve [PORT]',
		description:
			'Starts a development server listening on PORT (3000 by default) and keeps it running. If something already holds that port you get the error every web developer meets — EADDRINUSE, "address already in use" — and the fix is the Part 8 ritual: lsof -i :PORT to find the PID, kill it, start again. Stop your own with kill PID.',
		examples: ['serve', 'serve 8080', 'lsof -i :3000'],
		vibe: 'One ship per pier.'
	},
	top: {
		name: 'live view of processes and resources',
		synopsis: 'top',
		description:
			'A continuously updating dashboard of processes, CPU and memory; q quits. The sandbox shows one frozen, simulated frame.',
		examples: ['top   (q to quit, on a real machine)'],
		vibe: 'Mission control for your machine.',
		simulated: true
	}
};

/**
 * The short answer `<command> --help` gives: a usage line, then the flags.
 * Returns null when the command has no page, so dispatch falls through.
 */
function usageFor(name: string): ExecResult | null {
	const page = MAN_PAGES[MAN_ALIASES[name] ?? name];
	if (!page) return null;
	const text =
		`Usage: ${page.synopsis}\n${page.name}\n\n` +
		page.examples.map((e) => `  ${e}`).join('\n') +
		`\n\n(the full page: man ${name})\n`;
	return {
		out: text,
		err: '',
		code: 0,
		html:
			span(`Usage: ${page.synopsis}`, HEADING_STYLE) +
			span(`\n${page.name}\n\n` + page.examples.map((e) => `  ${e}`).join('\n'), OUT_STYLE) +
			span(`\n\n(the full page: man ${name})`, META_STYLE)
	};
}

/**
 * `man -k WORD` — apropos: search every page's one-line description. The way
 * you find a command whose name you don't know yet (Part 1.3).
 */
function manKeyword(word: string): ExecResult {
	const needle = word.toLowerCase();
	const hits = Object.entries(MAN_PAGES)
		.filter(([cmd, page]) => cmd.includes(needle) || page.name.toLowerCase().includes(needle))
		.map(([cmd, page]) => `${cmd}(1) - ${page.name}`);
	if (!hits.length) {
		return fail(`${word}: nothing appropriate.\n(no manual page here mentions that word)`);
	}
	return ok(hits.join('\n') + '\n');
}

function cmdMan(args: string[]): ExecResult {
	const kIndex = args.findIndex((a) => a === '-k' || a === '--apropos');
	if (kIndex !== -1) {
		const word = args[kIndex + 1];
		if (!word) return fail('man: -k needs a word to search for — try: man -k download');
		return manKeyword(word);
	}
	if (!args.length) {
		return fail(
			'What manual page do you want?\nFor example, try: man ls   (each supported command has a short page here)'
		);
	}
	// `man 5 crontab` — a leading section number picks which page, and with
	// only one page per name here it just gets skipped (Part 1.3).
	const name = /^\d+$/.test(args[0]) ? args[1] : args[0];
	const page = name ? MAN_PAGES[MAN_ALIASES[name] ?? name] : undefined;
	if (!page) {
		return fail(
			`No manual entry for ${name ?? args[0]}\n(try \`help\` for the list of supported commands)`
		);
	}
	const indent = (s: string) =>
		s
			.split('\n')
			.map((l) => '    ' + l)
			.join('\n');
	const wrap = (s: string): string => {
		// Soft-wrap description prose at ~76 chars so man pages read like man pages.
		const out: string[] = [];
		for (const para of s.split('\n')) {
			let line = '';
			for (const word of para.split(' ')) {
				if (line && line.length + word.length + 1 > 72) {
					out.push(line);
					line = word;
				} else line = line ? line + ' ' + word : word;
			}
			out.push(line);
		}
		return out.join('\n');
	};
	const sections: [string, string][] = [
		['NAME', `${name} — ${page.name}`],
		['SYNOPSIS', page.synopsis],
		[
			'DESCRIPTION',
			wrap(page.description) +
				(page.simulated
					? '\n\nNote: simulated in this playground — shown for learning, not the real thing.'
					: '')
		],
		['EXAMPLES', page.examples.join('\n')],
		['THE VIBE', page.vibe]
	];
	const title = `${name.toUpperCase()}(1)${' '.repeat(Math.max(1, 40 - name.length))}TerminalVibes Manual`;
	const text = title + '\n\n' + sections.map(([h, b]) => `${h}\n${indent(b)}`).join('\n\n');
	const html =
		span(title, META_STYLE) +
		'\n\n' +
		sections
			.map(([h, b]) => span(h, HEADING_STYLE) + '\n' + span(indent(b), OUT_STYLE))
			.join('\n\n');
	return { out: text + '\n', err: '', code: 0, html };
}

/* ── entry point ──────────────────────────────────────────────────── */

export async function runShellCommand(engine: ShellEngine, input: string): Promise<CommandResult> {
	const trimmed = input.trim();
	if (!trimmed) return { output: '' };
	engine.historyLog.push(trimmed);

	const ctx: Ctx = {
		engine,
		params: [],
		vars: engine.shellVars,
		depth: 0,
		exit: engine.lastExitCode,
		exited: false
	};
	let line: LineResult;
	try {
		line = await runLine(ctx, trimmed);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		line = { out: '', err: msg + '\n', code: 1, display: [{ text: msg, isErr: true }] };
	}
	engine.lastExitCode = line.code;

	if (line.display.length === 1 && !line.display[0].isErr && line.display[0].text === '__CLEAR__') {
		return { output: '__CLEAR__' };
	}
	const error = line.code !== 0;
	const hasAnsi = line.display.some((p) => p.html === undefined && p.text.includes('\x1b['));
	if (hasAnsi || line.display.some((p) => p.html !== undefined)) {
		const output = line.display
			.map((p) => {
				if (p.html !== undefined) return p.html;
				if (p.text.includes('\x1b[')) return ansiToHtml(p.text);
				return span(p.text, p.isErr ? ERR_STYLE : OUT_STYLE);
			})
			.join('\n');
		return { output, colored: true, error };
	}
	const output = line.display.map((p) => p.text).join('\n');
	return error ? { output, error } : { output };
}
