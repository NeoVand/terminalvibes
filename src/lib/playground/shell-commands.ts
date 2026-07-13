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

/* ── execution context ────────────────────────────────────────────── */

interface Ctx {
	engine: ShellEngine;
	/** Positional parameters $1..$9 (set for script execution). */
	params: string[];
	/**
	 * Script-local variable store; null means "interactive" and reads/writes
	 * go straight to engine.env (so NAME=value persists across commands).
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
	'bash: background jobs (&) are not supported in this playground — every command runs in the foreground.\nDid you mean && (run the next command only if this one succeeds)?';
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
			throw new ParseError(BG_MSG);
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

const STUBS = new Set([
	'nano',
	'vim',
	'vi',
	'sudo',
	'curl',
	'wget',
	'ssh',
	'open',
	'xdg-open',
	'ps',
	'top',
	'kill'
]);

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
		case 'curl':
			return cmdCurl(args);
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
		case 'ps':
			return ok(
				'  PID TTY          TIME CMD\n    1 pts/0    00:00:00 bash\n   42 pts/0    00:00:00 ps\n(simulated — the sandbox has no real processes)\n'
			);
		case 'top':
			return ok(
				'top - snapshot (simulated)\nTasks: 2 total, 1 running\n  PID USER  %CPU %MEM COMMAND\n    1 vibe   0.3  0.1 bash\n   42 vibe   0.1  0.1 top\n(real top updates live and quits with q — the sandbox shows one frozen frame)\n'
			);
		case 'kill':
			if (!args.length)
				return fail(
					'kill: usage: kill PID (but see below)\n(simulated — the sandbox has no real processes to signal)'
				);
			return ok(
				`kill: (simulated) process ${args[args.length - 1]} politely ignored you — there are no real processes in the sandbox.\n`
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

/** Display modes for chmod-octal'd nodes; keyed by live VFS node. */
const customModes = new WeakMap<VfsNode, string>();

function modeString(node: VfsNode): string {
	const custom = customModes.get(node);
	if (custom) return custom;
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

function lsLongLine(
	node: VfsNode,
	name: string,
	classify: boolean
): { text: string; html: string } {
	const mode = modeString(node);
	const links = node.kind === 'dir' ? 2 : 1;
	const size = node.kind === 'dir' ? 4096 : node.content.length;
	const meta = ` ${links} ${USER} ${USER} ${String(size).padStart(6)} ${fmtMtime(node.mtime)} `;
	const nm = lsName(node, name, classify);
	return {
		text: mode + meta + nm.text,
		html: span(mode, META_STYLE) + span(meta, OUT_STYLE) + nm.html
	};
}

function cmdLs(engine: ShellEngine, args: string[]): ExecResult {
	const { flags, rest } = flagSplit(args, 'laFR', 'ls');
	const long = flags.has('l');
	const all = flags.has('a');
	const classify = flags.has('F');
	const recursive = flags.has('R');
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
				const line = lsLongLine(node, f, classify);
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
		if (long) {
			g.text.push(`total ${entries.length}`);
			g.html.push(span(`total ${entries.length}`, OUT_STYLE));
			for (const e of entries) {
				const line = lsLongLine(e.node, e.name, classify);
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
			c === 'n' ? '\n' : c === 't' ? '\t' : c === '\\' ? '\\' : m
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
				res += n === 'n' ? '\n' : n === 't' ? '\t' : n === '\\' ? '\\' : '\\' + n;
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

function cmdCp(engine: ShellEngine, args: string[]): ExecResult {
	const { flags, rest } = flagSplit(args, 'rR', 'cp');
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
	const symbolic = mode.match(/^[ugoa]*([+-])x$/);
	const octal = mode.match(/^[0-7]{3}$/);
	if (!symbolic && !octal) {
		return fail(
			`chmod: invalid mode: '${mode}'\n(this playground supports +x, -x, u+x-style modes and 3-digit octal like 755 or 644)`
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
			if (node.kind === 'file') node.executable = symbolic[1] === '+';
			customModes.delete(node);
		} else {
			const digits = mode.split('').map(Number);
			// Only the owner-execute bit changes real behavior in the sandbox;
			// the full string is remembered so ls -l tells the truth about it.
			if (node.kind === 'file') node.executable = (digits[0] & 1) === 1;
			customModes.set(node, (node.kind === 'dir' ? 'd' : '-') + digits.map(octalTriple).join(''));
		}
	}
	return errs.length ? fail(errs.join('\n')) : ok();
}

/* ── info & misc ──────────────────────────────────────────────────── */

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
	if (n < 1024) return String(n);
	if (n < 1024 * 1024) return (n / 1024).toFixed(1) + 'K';
	return (n / (1024 * 1024)).toFixed(1) + 'M';
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
	const fmt = (n: number) => (human ? humanSize(n) : String(n));
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
			if (cur.kind === 'file') return cur.content.length;
			let sum = 0;
			for (const [name, child] of cur.children) {
				sum += child.kind === 'dir' ? rec(`${label}/${name}`, child) : child.content.length;
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
		else if (node.content.startsWith('#!')) {
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
			`Access: (${modeToOctal(mode)}/${mode})  Uid: (1000/${USER})   Gid: (1000/${USER})`,
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

function cmdCurl(args: string[]): ExecResult {
	const url = args.find((a) => !a.startsWith('-'));
	if (!url)
		return fail(
			'curl: no URL specified\n(usage: curl https://example.com — the response is simulated here)'
		);
	return ok(
		`${cannedBody(url)}\n(simulated response — the playground has no real network access)\n`
	);
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

/* ── help & man ───────────────────────────────────────────────────── */

const HELP_LINES: [string, string][] = [
	['Orientation', 'pwd  ls  cd  clear  whoami  date  cal  history  help  man'],
	['Files & dirs', 'mkdir  touch  cp  mv  rm  rmdir  cat  less  head  tail  file  stat'],
	['Text tools', 'grep  sort  uniq  cut  tr  wc  echo  printf  seq  tee  xargs'],
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
		synopsis: 'ls [-l] [-a] [-F] [-R] [path ...]',
		description:
			'Lists what a directory contains. -l shows the long view (permissions, owner, size, date), -a includes hidden dotfiles, -F marks directories with / and executables with *, -R descends into subdirectories.',
		examples: ['ls', 'ls -la', 'ls -l projects/'],
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
		synopsis: 'cp [-r] SOURCE DEST',
		description:
			'Copies SOURCE to DEST. If DEST is an existing directory, the copy lands inside it. Directories need -r (recursive) to copy everything within. Overwrites existing files silently — like the real thing.',
		examples: ['cp notes.txt backup.txt', 'cp -r project/ project-backup/'],
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
		synopsis: 'man command',
		description:
			'Shows the manual page for a command. Real man pages open in a pager (q quits). Reading man pages — or asking your AI to explain one — is the core skill of verifying commands before running them.',
		examples: ['man grep', 'man rm'],
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
		synopsis: 'chmod +x file   chmod 755 file',
		description:
			'Changes who may read (r), write (w) and execute (x) a file. +x makes a script runnable — the step everyone forgets before ./script.sh. Octal recipes: 755 = I do everything / others read & run; 644 = I read & write / others read.',
		examples: ['chmod +x deploy.sh', './deploy.sh', 'chmod 644 notes.txt'],
		vibe: 'The bouncer of the filesystem.'
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
	du: {
		name: 'disk usage of directories',
		synopsis: 'du [-h] [-s] [path]',
		description:
			'Measures how much space directories take (in the sandbox: real byte counts of your files). -h humanizes sizes, -s prints only the total.',
		examples: ['du -h', 'du -sh projects'],
		vibe: 'WHERE did my disk space go? du knows.'
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
		name: 'fetch a URL',
		synopsis: 'curl URL',
		description:
			"Downloads a web resource and prints it — the terminal's window onto the network, beloved for testing APIs. The playground has no network, so responses are canned.",
		examples: ['curl https://api.example.com/status.json'],
		vibe: 'The whole internet, one URL at a time.',
		simulated: true
	},
	wget: {
		name: 'download a file from a URL',
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
		synopsis: 'ps',
		description:
			'Shows the programs currently running. The sandbox prints a tiny fake table — there are no real processes behind it.',
		examples: ['ps'],
		vibe: "Who's running around in here?",
		simulated: true
	},
	top: {
		name: 'live view of processes and resources',
		synopsis: 'top',
		description:
			'A continuously updating dashboard of processes, CPU and memory; q quits. The sandbox shows one frozen, simulated frame.',
		examples: ['top   (q to quit, on a real machine)'],
		vibe: 'Mission control for your machine.',
		simulated: true
	},
	kill: {
		name: 'send a signal to a process',
		synopsis: 'kill PID',
		description:
			'Politely asks a process (by PID, from ps) to terminate; kill -9 stops asking politely. No real processes exist in the sandbox, so this is simulated.',
		examples: ['kill 4242   (on a real machine)'],
		vibe: 'The off switch, with etiquette levels.',
		simulated: true
	}
};

function cmdMan(args: string[]): ExecResult {
	if (!args.length) {
		return fail(
			'What manual page do you want?\nFor example, try: man ls   (each supported command has a short page here)'
		);
	}
	const name = args[0];
	const page = MAN_PAGES[MAN_ALIASES[name] ?? name];
	if (!page) {
		return fail(`No manual entry for ${name}\n(try \`help\` for the list of supported commands)`);
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
		vars: null,
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
	if (line.display.some((p) => p.html !== undefined)) {
		const output = line.display
			.map((p) => p.html ?? span(p.text, p.isErr ? ERR_STYLE : OUT_STYLE))
			.join('\n');
		return { output, colored: true, error };
	}
	const output = line.display.map((p) => p.text).join('\n');
	return error ? { output, error } : { output };
}
