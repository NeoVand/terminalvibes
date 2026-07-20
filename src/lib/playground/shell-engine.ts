/**
 * ShellEngine — the in-memory virtual filesystem + shell state behind the
 * TerminalVibes playground. It is deliberately tiny and synchronous under the
 * hood; the async surface exists so it stays a drop-in for the UI (which was
 * built against the async git engine of GitVibes).
 *
 * The sandbox models a single user, `vibe`, whose home is /home/vibe. There
 * is no real kernel here: permissions are a single "executable" bit plus a
 * display mode string, timestamps are wall-clock, and ownership is cosmetic.
 * That is exactly enough to teach ls -l, chmod +x and ./script.sh honestly
 * without pretending to be Linux.
 */

export interface VfsFile {
	kind: 'file';
	name: string;
	content: string;
	executable: boolean;
	mtime: number;
}

export interface VfsDir {
	kind: 'dir';
	name: string;
	children: Map<string, VfsNode>;
	mtime: number;
}

export type VfsNode = VfsFile | VfsDir;

/**
 * A running program in the sandbox. There is no scheduler here: processes are
 * rows in a table that commands read and mutate, which is exactly the mental
 * model `ps`, `kill` and `lsof` teach — every running program is a row with a
 * number, and a port is a door only one of them can hold.
 */
export interface SandboxProcess {
	pid: number;
	/** The command line, as ps prints it under COMMAND. */
	command: string;
	/** %CPU, for reading ps output (a runaway sits near 100). */
	cpu: number;
	/** %MEM, cosmetic. */
	mem: number;
	/** Wall-clock start label ps shows under START. */
	start: string;
	/** TCP port this process is listening on, if any. */
	port?: number;
	/**
	 * Ignores SIGTERM — a polite `kill` bounces off and the learner has to
	 * escalate to `kill -9`. This is the whole lesson of 8.2.
	 */
	ignoresTerm?: boolean;
	/** Background job number from this shell (`[1]`), if started with `&`. */
	job?: number;
	/** Backgrounded jobs can be paused; `fg` resumes and runs them. */
	stopped?: boolean;
	/** The command line to actually execute when this job is brought to fg. */
	pending?: string;
}

/** A process as a scenario seeds it — the pid is assigned by the engine. */
export interface ProcessSeed {
	command: string;
	cpu?: number;
	mem?: number;
	start?: string;
	port?: number;
	ignoresTerm?: boolean;
}

/**
 * Scenario seed: file paths (absolute or ~-relative) mapped to contents.
 * Directories are created implicitly; list empty dirs in `dirs`.
 */
export interface FsSeed {
	files?: Record<string, string>;
	/** Empty directories to create (parents implied). */
	dirs?: string[];
	/** Paths from `files` that should carry the executable bit. */
	executables?: string[];
	/** Starting working directory (default: ~). */
	cwd?: string;
	/** Extra environment variables layered over the defaults. */
	env?: Record<string, string>;
	/** Pre-defined aliases (e.g. from a seeded ~/.bashrc). */
	aliases?: Record<string, string>;
	/** Programs already running when the scenario opens. */
	processes?: ProcessSeed[];
}

export const HOME = '/home/vibe';
export const USER = 'vibe';
export const HOSTNAME = 'sandbox';

const DEFAULT_ENV: Record<string, string> = {
	HOME,
	USER,
	SHELL: '/bin/bash',
	HOSTNAME,
	PATH: '/usr/local/bin:/usr/bin:/bin',
	PWD: HOME,
	LANG: 'en_US.UTF-8',
	TERM: 'xterm-256color'
};

/** Commands that exist "on PATH" in the sandbox (for which/type/PATH lessons). */
export const BIN_COMMANDS = [
	'agent',
	'alias',
	'awk',
	'basename',
	'bash',
	'bg',
	'cal',
	'cat',
	'cd',
	'chmod',
	'clear',
	'cp',
	'cut',
	'date',
	'df',
	'dirname',
	'du',
	'echo',
	'env',
	'exit',
	'export',
	'false',
	'fg',
	'file',
	'find',
	'grep',
	'head',
	'help',
	'history',
	'jobs',
	'kill',
	'less',
	'ls',
	'lsof',
	'man',
	'mkdir',
	'more',
	'mv',
	'pgrep',
	'printf',
	'ps',
	'pwd',
	'rm',
	'rmdir',
	'sed',
	'seq',
	'serve',
	'sh',
	'sleep',
	'sort',
	'source',
	'stat',
	'tail',
	'tee',
	'touch',
	'tr',
	'true',
	'type',
	'unalias',
	'uniq',
	'unset',
	'wc',
	'which',
	'whoami',
	'xargs'
];

export class ShellEngine {
	root: VfsDir = mkdirNode('');
	cwd: string = HOME;
	env: Record<string, string> = { ...DEFAULT_ENV };
	aliases: Map<string, string> = new Map();
	lastExitCode = 0;
	/** Every command line the learner has run this session (for `history`). */
	historyLog: string[] = [];
	/** Programs currently "running" — see SandboxProcess. */
	processes: SandboxProcess[] = [];
	/** The shell itself is always pid 1's child; learner processes start here. */
	private nextPid = 400;
	private nextJob = 1;

	async reset(seed?: FsSeed): Promise<void> {
		this.root = mkdirNode('');
		this.cwd = HOME;
		this.env = { ...DEFAULT_ENV };
		this.aliases = new Map();
		this.lastExitCode = 0;
		this.historyLog = [];
		this.processes = [];
		this.nextPid = 400;
		this.nextJob = 1;

		// Home always exists, even with an empty seed.
		this.mkdirp(HOME);

		if (!seed) return;

		for (const dir of seed.dirs ?? []) {
			this.mkdirp(this.resolve(dir));
		}
		for (const [path, content] of Object.entries(seed.files ?? {})) {
			this.writeFile(this.resolve(path), content);
		}
		for (const path of seed.executables ?? []) {
			const node = this.getNode(this.resolve(path));
			if (node?.kind === 'file') node.executable = true;
		}
		if (seed.cwd) {
			const target = this.resolve(seed.cwd);
			this.mkdirp(target);
			this.cwd = target;
		}
		this.env.PWD = this.cwd;
		if (seed.env) Object.assign(this.env, seed.env);
		for (const [name, value] of Object.entries(seed.aliases ?? {})) {
			this.aliases.set(name, value);
		}
		for (const proc of seed.processes ?? []) {
			this.spawnProcess(proc);
		}
	}

	/* ── processes ────────────────────────────────────────────────── */

	/** Register a new process and return it (pid assigned here). */
	spawnProcess(proc: ProcessSeed & { job?: number; pending?: string }): SandboxProcess {
		const created: SandboxProcess = {
			pid: this.nextPid,
			command: proc.command,
			cpu: proc.cpu ?? 0.2,
			mem: proc.mem ?? 0.4,
			start: proc.start ?? '09:12',
			...(proc.port !== undefined ? { port: proc.port } : {}),
			...(proc.ignoresTerm ? { ignoresTerm: true } : {}),
			...(proc.job !== undefined ? { job: proc.job } : {}),
			...(proc.pending !== undefined ? { pending: proc.pending } : {})
		};
		// Real pids don't march by one; a small jitter keeps learners reading
		// the PID column instead of predicting it.
		this.nextPid += 37;
		this.processes.push(created);
		return created;
	}

	/** Claim the next `[n]` background job number. */
	allocateJob(): number {
		return this.nextJob++;
	}

	findProcess(pid: number): SandboxProcess | undefined {
		return this.processes.find((p) => p.pid === pid);
	}

	/** The process listening on a port, if any. */
	findByPort(port: number): SandboxProcess | undefined {
		return this.processes.find((p) => p.port === port);
	}

	findJob(job: number): SandboxProcess | undefined {
		return this.processes.find((p) => p.job === job);
	}

	/** Remove a process from the table. Returns false if it was already gone. */
	removeProcess(pid: number): boolean {
		const i = this.processes.findIndex((p) => p.pid === pid);
		if (i === -1) return false;
		this.processes.splice(i, 1);
		return true;
	}

	/* ── path helpers ─────────────────────────────────────────────── */

	/** Expand ~ and resolve `.`/`..` against cwd → normalized absolute path. */
	resolve(path: string): string {
		if (!path) return this.cwd;
		let p = path;
		if (p === '~') p = this.env.HOME ?? HOME;
		else if (p.startsWith('~/')) p = (this.env.HOME ?? HOME) + p.slice(1);
		if (!p.startsWith('/')) p = `${this.cwd}/${p}`;

		const parts: string[] = [];
		for (const part of p.split('/')) {
			if (part === '' || part === '.') continue;
			if (part === '..') {
				parts.pop();
			} else {
				parts.push(part);
			}
		}
		return '/' + parts.join('/');
	}

	/** Render an absolute path with the home prefix shortened to ~. */
	pretty(path: string): string {
		const home = this.env.HOME ?? HOME;
		if (path === home) return '~';
		if (path.startsWith(home + '/')) return '~' + path.slice(home.length);
		return path;
	}

	/* ── node access ──────────────────────────────────────────────── */

	getNode(absPath: string): VfsNode | null {
		const norm = this.resolve(absPath);
		if (norm === '/') return this.root;
		let current: VfsNode = this.root;
		for (const part of norm.slice(1).split('/')) {
			if (current.kind !== 'dir') return null;
			const next = current.children.get(part);
			if (!next) return null;
			current = next;
		}
		return current;
	}

	exists(path: string): boolean {
		return this.getNode(path) !== null;
	}

	isDir(path: string): boolean {
		return this.getNode(path)?.kind === 'dir';
	}

	isFile(path: string): boolean {
		return this.getNode(path)?.kind === 'file';
	}

	isExecutable(path: string): boolean {
		const node = this.getNode(path);
		return node?.kind === 'file' && node.executable;
	}

	readFile(path: string): string | null {
		const node = this.getNode(path);
		return node?.kind === 'file' ? node.content : null;
	}

	/** Sorted child names of a directory (or null if not a dir). */
	listDir(path: string): string[] | null {
		const node = this.getNode(path);
		if (node?.kind !== 'dir') return null;
		return [...node.children.keys()].sort((a, b) => a.localeCompare(b));
	}

	/* ── mutation ─────────────────────────────────────────────────── */

	/** Create a directory chain; returns the deepest dir. Throws on file collision. */
	mkdirp(absPath: string): VfsDir {
		const norm = this.resolve(absPath);
		let current = this.root;
		if (norm === '/') return current;
		for (const part of norm.slice(1).split('/')) {
			const next = current.children.get(part);
			if (next) {
				if (next.kind !== 'dir') {
					throw new Error(`mkdir: cannot create directory '${absPath}': Not a directory`);
				}
				current = next;
			} else {
				const dir = mkdirNode(part);
				current.children.set(part, dir);
				current = dir;
			}
		}
		return current;
	}

	/** Write (create or overwrite) a file; parent dirs are created. */
	writeFile(absPath: string, content: string): VfsFile {
		const norm = this.resolve(absPath);
		const slash = norm.lastIndexOf('/');
		const parent = this.mkdirp(norm.slice(0, slash) || '/');
		const name = norm.slice(slash + 1);
		if (!name) throw new Error(`cannot write to '${absPath}': Is a directory`);
		const existing = parent.children.get(name);
		if (existing?.kind === 'dir') {
			throw new Error(`cannot write to '${absPath}': Is a directory`);
		}
		if (existing?.kind === 'file') {
			existing.content = content;
			existing.mtime = Date.now();
			return existing;
		}
		const file: VfsFile = {
			kind: 'file',
			name,
			content,
			executable: false,
			mtime: Date.now()
		};
		parent.children.set(name, file);
		return file;
	}

	/** Remove a node (file or dir subtree). Returns false if missing. */
	removeNode(absPath: string): boolean {
		const norm = this.resolve(absPath);
		if (norm === '/') return false;
		const slash = norm.lastIndexOf('/');
		const parentNode = this.getNode(norm.slice(0, slash) || '/');
		if (parentNode?.kind !== 'dir') return false;
		return parentNode.children.delete(norm.slice(slash + 1));
	}

	/** Deep-copy a node under a new name (for cp). */
	cloneNode(node: VfsNode, newName: string): VfsNode {
		if (node.kind === 'file') {
			return { ...node, name: newName, mtime: Date.now() };
		}
		const dir = mkdirNode(newName);
		for (const [key, child] of node.children) {
			dir.children.set(key, this.cloneNode(child, key));
		}
		return dir;
	}

	/** Attach an existing node at an absolute path (for cp/mv). */
	attachNode(absPath: string, node: VfsNode): void {
		const norm = this.resolve(absPath);
		const slash = norm.lastIndexOf('/');
		const parent = this.mkdirp(norm.slice(0, slash) || '/');
		const name = norm.slice(slash + 1);
		node.name = name;
		parent.children.set(name, node);
	}

	/* ── traversal for tree views / find / grep -r ────────────────── */

	/**
	 * Depth-first walk from absPath. Visits dirs before their children.
	 * The visitor receives the node's absolute path.
	 */
	walk(absPath: string, visit: (path: string, node: VfsNode) => void): void {
		const start = this.getNode(absPath);
		if (!start) return;
		const base = this.resolve(absPath);
		const recur = (path: string, node: VfsNode) => {
			visit(path, node);
			if (node.kind === 'dir') {
				for (const name of [...node.children.keys()].sort((a, b) => a.localeCompare(b))) {
					const child = node.children.get(name)!;
					recur(path === '/' ? `/${name}` : `${path}/${name}`, child);
				}
			}
		};
		recur(base, start);
	}
}

function mkdirNode(name: string): VfsDir {
	return { kind: 'dir', name, children: new Map(), mtime: Date.now() };
}

/** Glob → RegExp for a single path segment (`*`, `?`, `[abc]`, `[a-z]`). */
export function globToRegExp(glob: string): RegExp {
	let re = '^';
	for (let i = 0; i < glob.length; i++) {
		const ch = glob[i];
		if (ch === '*') re += '[^/]*';
		else if (ch === '?') re += '[^/]';
		else if (ch === '[') {
			const close = glob.indexOf(']', i + 1);
			if (close === -1) {
				re += '\\[';
			} else {
				let cls = glob.slice(i + 1, close);
				if (cls.startsWith('!')) cls = '^' + cls.slice(1);
				re += `[${cls}]`;
				i = close;
			}
		} else {
			re += ch.replace(/[.+^${}()|\\]/g, '\\$&');
		}
	}
	return new RegExp(re + '$');
}

export function isGlob(token: string): boolean {
	return /[*?[]/.test(token);
}
