import { beforeEach, describe, expect, it } from 'vitest';
import { ShellEngine } from './shell-engine';
import { runShellCommand } from './shell-commands';

let engine: ShellEngine;

async function run(command: string) {
	return runShellCommand(engine, command);
}

/** Colored results are HTML — strip tags/entities to assert on the text. */
function strip(output: string): string {
	return output
		.replace(/<[^>]*>/g, '')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

beforeEach(async () => {
	engine = new ShellEngine();
	await engine.reset({
		files: {
			'~/notes.txt': 'alpha\nbeta\ngamma\n',
			'~/todo.md': '- [ ] learn pipes\n',
			'~/.secret': 'shh\n',
			'~/projects/readme.md': 'hello world\n',
			'~/projects/app/main.py': 'print("hi")\n',
			'~/projects/app/util.py': '# TODO: refactor\n',
			'~/logs/access.log':
				'alice GET /\nbob GET /about\nalice POST /login\ncarol GET /\nalice GET /pricing\nbob GET /\n',
			'~/scripts/greet.sh':
				'#!/bin/bash\n# greeting script\necho "hello $1"\nNAME=vibe\necho "from $NAME"\n'
		},
		dirs: ['~/empty']
	});
});

describe('parser: quoting and expansion', () => {
	it('preserves spaces inside quotes', async () => {
		expect((await run('echo "hello   world"')).output).toBe('hello   world');
		expect((await run("echo 'a  b'")).output).toBe('a  b');
	});

	it('expands $VAR and ${VAR} in double quotes but not single quotes', async () => {
		expect((await run('echo "$USER"')).output).toBe('vibe');
		expect((await run('echo ${HOME}')).output).toBe('/home/vibe');
		expect((await run("echo '$USER'")).output).toBe('$USER');
	});

	it('expands ~ at the start of a word', async () => {
		expect((await run('echo ~/notes.txt')).output).toBe('/home/vibe/notes.txt');
	});

	it('expands $? to the last exit code', async () => {
		await run('false');
		expect((await run('echo $?')).output).toBe('1');
		await run('true');
		expect((await run('echo $?')).output).toBe('0');
	});

	it('strips trailing comments', async () => {
		expect((await run('echo hi # a comment')).output).toBe('hi');
	});

	it('expands globs against the filesystem', async () => {
		expect((await run('echo *.txt')).output).toBe('notes.txt');
		expect((await run('echo projects/app/*.py')).output).toBe(
			'projects/app/main.py projects/app/util.py'
		);
	});

	it('leaves unmatched and quoted globs literal', async () => {
		expect((await run('echo *.zip')).output).toBe('*.zip');
		expect((await run("echo '*.txt'")).output).toBe('*.txt');
	});

	it('rejects command substitution with a friendly message', async () => {
		const subst = await run('echo $(pwd)');
		expect(subst.error).toBe(true);
		expect(subst.output).toContain('substitution');
	});

	it('only accepts & at the end of a line', async () => {
		const mid = await run('sleep 5 & echo hi');
		expect(mid.error).toBe(true);
		expect(mid.output).toContain('&&');
	});

	it('rejects interactive loops with a pointer to && and scripts', async () => {
		const res = await run('for f in *.txt');
		expect(res.error).toBe(true);
		expect(res.output).toContain('&&');
	});
});

describe('parser: pipes, redirection, chaining', () => {
	it('pipes output between commands', async () => {
		expect((await run('cat notes.txt | wc -l')).output.trim()).toBe('3');
	});

	it('writes and appends with > and >>', async () => {
		await run('echo one > f.txt');
		expect(engine.readFile('/home/vibe/f.txt')).toBe('one\n');
		await run('echo two >> f.txt');
		expect(engine.readFile('/home/vibe/f.txt')).toBe('one\ntwo\n');
		await run('echo three > f.txt');
		expect(engine.readFile('/home/vibe/f.txt')).toBe('three\n');
	});

	it('redirects stderr with 2> and reads stdin with <', async () => {
		const res = await run('ls missing-dir 2> errors.txt');
		expect(res.output).toBe('');
		expect(engine.readFile('/home/vibe/errors.txt')).toContain('cannot access');
		expect((await run('wc -l < notes.txt')).output.trim()).toBe('3');
	});

	it('short-circuits && and ||', async () => {
		expect((await run('false && echo yes')).output).toBe('');
		expect((await run('false || echo fallback')).output).toBe('fallback');
		expect((await run('true && echo ran')).output).toBe('ran');
		expect((await run('true || echo skipped')).output).toBe('');
	});

	it('runs each ;-separated command regardless of failures', async () => {
		const res = await run('echo a; false; echo b');
		expect(res.output).toContain('a');
		expect(res.output).toContain('b');
	});

	it('supports the classic access-log pipeline', async () => {
		const res = await run("cat logs/access.log | cut -d' ' -f1 | sort | uniq -c | sort -n");
		const lines = res.output.trim().split('\n');
		expect(lines[lines.length - 1].trim()).toBe('3 alice');
		expect(lines[0].trim()).toBe('1 carol');
	});
});

describe('variables, environment, history', () => {
	it('supports bare NAME=value assignment and export', async () => {
		await run('GREETING=hello');
		expect((await run('echo $GREETING')).output).toBe('hello');
		await run('export EDITOR=nano');
		expect(engine.env.EDITOR).toBe('nano');
		await run('unset EDITOR');
		expect(engine.env.EDITOR).toBeUndefined();
	});

	it('lists the environment with env', async () => {
		expect((await run('env')).output).toContain('HOME=/home/vibe');
	});

	it('logs every command and tracks exit codes', async () => {
		await run('pwd');
		await run('nosuchcmd');
		expect(engine.historyLog).toEqual(['pwd', 'nosuchcmd']);
		expect(engine.lastExitCode).toBe(127);
		const res = await run('history');
		expect(res.output).toContain('1  pwd');
		expect(res.output).toContain('3  history');
	});
});

describe('navigation: pwd, cd, ls', () => {
	it('walks directories with cd, cd .., cd - and bare cd', async () => {
		expect((await run('pwd')).output).toBe('/home/vibe');
		await run('cd projects/app');
		expect((await run('pwd')).output).toBe('/home/vibe/projects/app');
		await run('cd ..');
		expect((await run('pwd')).output).toBe('/home/vibe/projects');
		await run('cd');
		expect((await run('pwd')).output).toBe('/home/vibe');
		const back = await run('cd -');
		expect(back.output).toBe('/home/vibe/projects');
		expect(engine.cwd).toBe('/home/vibe/projects');
	});

	it('explains a bad cd target', async () => {
		const res = await run('cd nowhere');
		expect(res.error).toBe(true);
		expect(res.output).toContain('No such file or directory');
	});

	it('hides dotfiles unless -a is given', async () => {
		const plain = await run('ls');
		expect(plain.output).toContain('notes.txt');
		expect(plain.output).not.toContain('.secret');
		expect(plain.colored).toBe(true);
		const all = await run('ls -a');
		expect(all.output).toContain('.secret');
	});

	it('shows mode strings, owner and size with ls -l', async () => {
		const res = await run('ls -l');
		expect(res.output).toContain('-rw-r--r--');
		expect(res.output).toContain('drwxr-xr-x');
		expect(res.output).toContain('vibe');
	});

	it('classifies with -F and recurses with -R', async () => {
		expect((await run('ls -F')).output).toContain('projects/');
		const rec = await run('ls -R projects');
		expect(rec.output).toContain('projects:');
		expect(rec.output).toContain('projects/app:');
		expect(rec.output).toContain('main.py');
	});

	it('reports a missing path', async () => {
		const res = await run('ls ghost');
		expect(res.error).toBe(true);
		expect(res.output).toContain("cannot access 'ghost'");
	});
});

describe('mkdir, touch, rmdir', () => {
	it('creates directories, and chains with -p', async () => {
		await run('mkdir demo');
		expect(engine.isDir('/home/vibe/demo')).toBe(true);
		const dup = await run('mkdir demo');
		expect(dup.error).toBe(true);
		expect(dup.output).toContain('File exists');
		const deep = await run('mkdir deep/er/est');
		expect(deep.error).toBe(true);
		await run('mkdir -p deep/er/est');
		expect(engine.isDir('/home/vibe/deep/er/est')).toBe(true);
	});

	it('touch creates empty files', async () => {
		await run('touch new.txt');
		expect(engine.readFile('/home/vibe/new.txt')).toBe('');
	});

	it('rmdir only removes empty directories', async () => {
		await run('rmdir empty');
		expect(engine.exists('/home/vibe/empty')).toBe(false);
		const res = await run('rmdir logs');
		expect(res.error).toBe(true);
		expect(res.output).toContain('Directory not empty');
	});
});

describe('reading files: cat, head, tail, less, wc', () => {
	it('cat prints contents and numbers lines with -n', async () => {
		expect((await run('cat notes.txt')).output).toBe('alpha\nbeta\ngamma');
		expect((await run('cat -n notes.txt')).output).toContain('1\talpha');
	});

	it('cat explains missing files and directories', async () => {
		const missing = await run('cat ghost.txt');
		expect(missing.error).toBe(true);
		expect(missing.output).toContain('No such file or directory');
		const dir = await run('cat projects');
		expect(dir.output).toContain('Is a directory');
	});

	it('head and tail take -n', async () => {
		expect((await run('head -n 2 notes.txt')).output).toBe('alpha\nbeta');
		expect((await run('tail -n 1 notes.txt')).output).toBe('gamma');
		expect((await run('tail logs/access.log')).output.split('\n')).toHaveLength(6);
	});

	it('less prints the file plus a pager note', async () => {
		const res = await run('less notes.txt');
		expect(res.output).toContain('alpha');
		expect(res.output).toContain('q');
	});

	it('wc counts lines, words and characters', async () => {
		const res = await run('wc notes.txt');
		expect(res.output).toContain('3');
		expect(res.output).toContain('notes.txt');
		expect((await run('wc -w todo.md')).output.trim()).toContain('5');
	});
});

describe('grep', () => {
	it('finds matching lines, case-insensitively with -i', async () => {
		expect(strip((await run('grep beta notes.txt')).output)).toBe('beta');
		expect(strip((await run('grep -i BETA notes.txt')).output)).toBe('beta');
		expect((await run('grep beta notes.txt')).colored).toBe(true);
	});

	it('numbers, inverts and counts with -n -v -c', async () => {
		expect(strip((await run('grep -n beta notes.txt')).output)).toBe('2:beta');
		expect(strip((await run('grep -v alpha notes.txt')).output)).toBe('beta\ngamma');
		expect(strip((await run('grep -c alice logs/access.log')).output)).toBe('3');
	});

	it('exits 1 on no match — fuel for && lessons', async () => {
		const res = await run('grep zeta notes.txt');
		expect(res.output).toBe('');
		expect(engine.lastExitCode).toBe(1);
	});

	it('searches directories with -r and reports missing files', async () => {
		const rec = await run('grep -r TODO .');
		expect(rec.output).toContain('projects/app/util.py');
		const missing = await run('grep x ghost.txt');
		expect(missing.error).toBe(true);
		expect(missing.output).toContain('No such file or directory');
	});
});

describe('sed', () => {
	it('substitutes the first match per line; g replaces them all', async () => {
		expect((await run("echo 'aaa' | sed 's/a/b/'")).output).toBe('baa');
		expect((await run("echo 'a-a-a' | sed 's/a/b/g'")).output).toBe('b-b-b');
		expect((await run("sed 's/alpha/ALPHA/' notes.txt")).output).toBe('ALPHA\nbeta\ngamma');
	});

	it('I ignores case; an empty replacement deletes the match', async () => {
		expect((await run("echo 'Hello' | sed 's/hello/bye/'")).output).toBe('Hello');
		expect((await run("echo 'Hello' | sed 's/hello/bye/I'")).output).toBe('bye');
		expect((await run("echo 'hello world' | sed 's/ world//'")).output).toBe('hello');
	});

	it('accepts alternate delimiters — no escaping slashes in paths', async () => {
		expect((await run("echo '/usr/bin' | sed 's|/usr|/opt|'")).output).toBe('/opt/bin');
		expect((await run("echo 'path' | sed 's,path,trail,'")).output).toBe('trail');
	});

	it('& in the replacement is the whole match; \\& is a literal &', async () => {
		expect((await run("echo 'cat' | sed 's/cat/[&]/'")).output).toBe('[cat]');
		expect((await run("echo 'x' | sed 's/x/a\\&b/'")).output).toBe('a&b');
	});

	it('applies addresses to s', async () => {
		expect((await run("sed '2s/beta/B/' notes.txt")).output).toBe('alpha\nB\ngamma');
		expect((await run("sed '/alpha/s/a/A/' notes.txt")).output).toBe('Alpha\nbeta\ngamma');
	});

	it('d deletes by regex, line number, range and $', async () => {
		expect((await run("sed '/beta/d' notes.txt")).output).toBe('alpha\ngamma');
		expect((await run("sed '1d' notes.txt")).output).toBe('beta\ngamma');
		expect((await run("sed '2,3d' notes.txt")).output).toBe('alpha');
		expect((await run("sed '$d' notes.txt")).output).toBe('alpha\nbeta');
	});

	it('-n with p prints only the selected lines', async () => {
		expect((await run("sed -n '2p' notes.txt")).output).toBe('beta');
		expect((await run("seq 10 | sed -n '5,9p'")).output).toBe('5\n6\n7\n8\n9');
		expect((await run("sed -n '2,$p' notes.txt")).output).toBe('beta\ngamma');
		expect((await run("sed -n '$p' notes.txt")).output).toBe('gamma');
	});

	it('without -n, p prints selected lines twice — the classic gotcha', async () => {
		expect((await run("sed '2p' notes.txt")).output).toBe('alpha\nbeta\nbeta\ngamma');
	});

	it('regex ranges open at /start/, close at /stop/, and re-arm after', async () => {
		expect((await run("sed -n '/bob/,/carol/p' logs/access.log")).output).toBe(
			'bob GET /about\nalice POST /login\ncarol GET /\nbob GET /'
		);
		await run("printf 'a\\nBEGIN\\nx\\nEND\\nb\\nBEGIN\\ny\\nEND\\n' > blocks.txt");
		expect((await run("sed -n '/BEGIN/,/END/p' blocks.txt")).output).toBe(
			'BEGIN\nx\nEND\nBEGIN\ny\nEND'
		);
		expect((await run("sed -n '1,/POST/p' logs/access.log")).output).toBe(
			'alice GET /\nbob GET /about\nalice POST /login'
		);
	});

	it('edits in place with -i; a suffix keeps the original as a backup', async () => {
		const res = await run("sed -i.bak 's/beta/BETA/' notes.txt");
		expect(res.output).toBe('');
		expect(engine.readFile('/home/vibe/notes.txt')).toBe('alpha\nBETA\ngamma\n');
		expect(engine.readFile('/home/vibe/notes.txt.bak')).toBe('alpha\nbeta\ngamma\n');
		await run("sed -i 's/BETA/beta2/' notes.txt");
		expect(engine.readFile('/home/vibe/notes.txt')).toBe('alpha\nbeta2\ngamma\n');
		expect(engine.readFile('/home/vibe/notes.txt.bak')).toBe('alpha\nbeta\ngamma\n');
	});

	it('-i handles several files at once, and insists on having one', async () => {
		await run('echo mango > m1.txt');
		await run('echo mango > m2.txt');
		await run("sed -i 's/mango/kiwi/' m1.txt m2.txt");
		expect(engine.readFile('/home/vibe/m1.txt')).toBe('kiwi\n');
		expect(engine.readFile('/home/vibe/m2.txt')).toBe('kiwi\n');
		const res = await run("sed -i 's/a/b/'");
		expect(res.error).toBe(true);
		expect(res.output).toContain('file');
	});

	it('treats + ? ( ) as literal without -E, special with it', async () => {
		expect((await run("echo 'a+b' | sed 's/a+/X/'")).output).toBe('Xb');
		expect((await run("echo 'aaa' | sed 's/a+/X/'")).output).toBe('aaa');
		expect((await run("echo 'aaa' | sed -E 's/a+/X/'")).output).toBe('X');
		expect((await run("echo 'aaa' | sed 's/a\\+/X/'")).output).toBe('X');
		expect((await run("echo '(x)' | sed 's/(x)/y/'")).output).toBe('y');
		expect((await run("echo 'abc' | sed 's/./X/g'")).output).toBe('XXX');
		expect((await run("echo 'cat hat' | sed 's/[ch]at/X/g'")).output).toBe('X X');
	});

	it('reads files and pipes alike', async () => {
		expect((await run("cat notes.txt | sed 's/beta/B/'")).output).toBe('alpha\nB\ngamma');
		expect((await run("sed 's/hello/goodbye/' projects/readme.md")).output).toBe('goodbye world');
	});

	it('reports missing scripts, broken scripts and unreadable files', async () => {
		const noScript = await run('sed');
		expect(noScript.error).toBe(true);
		expect(noScript.output).toContain('missing script');
		const unterminated = await run("sed 's/a/b' notes.txt");
		expect(unterminated.error).toBe(true);
		expect(unterminated.output).toContain('unterminated');
		const unknown = await run("sed 'q' notes.txt");
		expect(unknown.error).toBe(true);
		expect(unknown.output).toContain('unknown command');
		const badRe = await run("echo aa | sed -E 's/(a/X/'");
		expect(badRe.error).toBe(true);
		expect(badRe.output).toContain('pattern');
		const ghost = await run("sed 's/a/b/' ghost.txt");
		expect(ghost.error).toBe(true);
		expect(ghost.output).toContain("can't read");
		expect(engine.lastExitCode).toBe(2);
	});

	it('names the sed features beyond the playground, kindly', async () => {
		const y = await run("sed 'y/abc/xyz/' notes.txt");
		expect(y.error).toBe(true);
		expect(y.output).toContain('tr');
		const hold = await run("sed 'G' notes.txt");
		expect(hold.error).toBe(true);
		expect(hold.output).toContain('hold space');
		const branch = await run("sed ':top' notes.txt");
		expect(branch.error).toBe(true);
		expect(branch.output).toContain('branching');
		const append = await run("sed '1a hello' notes.txt");
		expect(append.error).toBe(true);
		expect(append.output).toContain('appends');
		const wflag = await run("sed 's/a/b/w out.txt' notes.txt");
		expect(wflag.error).toBe(true);
		expect(wflag.output).toContain('redirection');
		expect(engine.exists('/home/vibe/out.txt')).toBe(false);
	});

	it('has a man page and shows up in help and on PATH', async () => {
		const man = await run('man sed');
		expect(man.output).toContain('SYNOPSIS');
		expect(strip(man.output)).toContain('-i.bak');
		expect((await run('help')).output).toContain('sed');
		expect((await run('which sed')).output).toBe('/usr/bin/sed');
	});
});

describe('awk', () => {
	it('prints fields split on runs of whitespace by default', async () => {
		expect((await run("printf 'a  b c\\nd e f\\n' | awk '{print $2}'")).output).toBe('b\ne');
		expect((await run("printf '  padded line\\n' | awk '{print $1}'")).output).toBe('padded');
	});

	it('joins comma-separated fields with a space; $0 is the whole line', async () => {
		expect((await run("printf 'a b c\\n' | awk '{print $3, $1}'")).output).toBe('c a');
		expect((await run("printf 'a b\\n' | awk '{print $0}'")).output).toBe('a b');
		expect((await run("printf 'a b\\n' | awk '{print}'")).output).toBe('a b');
	});

	it('-F sets the field separator, attached or separate', async () => {
		expect((await run("printf 'x,y,z\\n' | awk -F, '{print $2}'")).output).toBe('y');
		expect((await run("printf 'x:y\\n' | awk -F : '{print $2}'")).output).toBe('y');
	});

	it('a /pattern/ guard filters lines, with ERE support', async () => {
		expect((await run("printf 'ok 1\\nerror 2\\nok 3\\n' | awk '/error/ {print $2}'")).output).toBe(
			'2'
		);
		expect((await run("printf 'aa\\nab\\n' | awk '/a+b/ {print $1}'")).output).toBe('ab');
		expect((await run("printf 'one\\ntwo\\n' | awk '/two/'")).output).toBe('two');
	});

	it('missing fields print as empty; reads files too', async () => {
		expect((await run("printf 'a\\n' | awk '{print $5}'")).output).toBe('');
		expect((await run("awk '{print $1}' notes.txt")).output).toBe('alpha\nbeta\ngamma');
	});

	it('rejects bad programs with teaching errors', async () => {
		const empty = await run("printf 'x\\n' | awk ''");
		expect(empty.error).toBe(true);
		expect(empty.output).toContain('{print $1}');
		const shape = await run("printf 'x\\n' | awk 'print $1'");
		expect(shape.error).toBe(true);
		expect(shape.output).toContain('{print $1, $2}');
		const notField = await run("printf 'x\\n' | awk '{print name}'");
		expect(notField.error).toBe(true);
		expect(notField.output).toContain('$1 the first column');
	});

	it('names the awk features beyond the playground, kindly', async () => {
		const begin = await run("printf 'x\\n' | awk 'BEGIN {print $1}'");
		expect(begin.error).toBe(true);
		expect(begin.output).toContain('BEGIN');
		const nf = await run("printf 'x\\n' | awk '{print NF}'");
		expect(nf.error).toBe(true);
		expect(nf.output).toContain('last field');
		const vflag = await run("printf 'x\\n' | awk -v n=1 '{print $1}'");
		expect(vflag.error).toBe(true);
		expect(vflag.output).toContain('-v');
	});

	it('has a man page and shows up in help and on PATH', async () => {
		const man = await run('man awk');
		expect(man.output).toContain('SYNOPSIS');
		expect(strip(man.output)).toContain('-F');
		expect((await run('which awk')).output).toBe('/usr/bin/awk');
	});
});

describe('processes, ports and jobs', () => {
	beforeEach(async () => {
		await engine.reset({
			files: { '~/notes.txt': 'alpha\nbeta\ngamma\n' },
			processes: [
				{ command: 'node server.js', cpu: 0.4, port: 3000 },
				{ command: 'spinner.sh', cpu: 97.3, ignoresTerm: true }
			]
		});
	});

	it('ps lists seeded processes plus the shell itself', async () => {
		const res = await run('ps');
		expect(res.output).toContain('PID');
		expect(res.output).toContain('node server.js');
		expect(res.output).toContain('spinner.sh');
		expect(res.output).toContain('bash');
		expect((await run('ps aux')).output).toContain('node server.js');
		expect((await run('ps -ef')).output).toContain('node server.js');
	});

	it('ps output pipes into grep and awk like any other text', async () => {
		expect(strip((await run('ps aux | grep node')).output)).toContain('node server.js');
		const pids = await run("ps aux | grep spinner | awk '{print $2}'");
		const pid = engine.processes.find((p) => p.command.includes('spinner'))!.pid;
		expect(pids.output.trim()).toBe(String(pid));
	});

	it('pgrep prints matching pids and exits 1 when nothing matches', async () => {
		const pid = engine.processes.find((p) => p.command.includes('node'))!.pid;
		expect((await run('pgrep node')).output.trim()).toBe(String(pid));
		await run('pgrep nothing-here');
		expect(engine.lastExitCode).toBe(1);
	});

	it('kill sends SIGTERM and the process shuts down cleanly', async () => {
		const pid = engine.processes.find((p) => p.command.includes('node'))!.pid;
		const res = await run(`kill ${pid}`);
		expect(res.output).toContain('terminated');
		expect(engine.findProcess(pid)).toBeUndefined();
	});

	it('a SIGTERM-ignoring process survives kill and needs kill -9', async () => {
		const pid = engine.processes.find((p) => p.command.includes('spinner'))!.pid;
		const polite = await run(`kill ${pid}`);
		expect(polite.output).toContain('still running');
		expect(engine.findProcess(pid)).toBeDefined();

		const forced = await run(`kill -9 ${pid}`);
		expect(forced.output).toContain('SIGKILL');
		expect(engine.findProcess(pid)).toBeUndefined();
	});

	it('kill reports an unknown pid and an unknown signal', async () => {
		const gone = await run('kill 99999');
		expect(gone.error).toBe(true);
		expect(gone.output).toContain('No such process');
		const sig = await run('kill -FOO 1');
		expect(sig.error).toBe(true);
		expect(sig.output).toContain('-9');
	});

	it('lsof -i finds the port holder and stays silent when free', async () => {
		const pid = engine.processes.find((p) => p.port === 3000)!.pid;
		const held = await run('lsof -i :3000');
		expect(held.output).toContain(String(pid));
		expect(held.output).toContain('LISTEN');
		expect((await run('lsof -i:3000')).output).toContain('LISTEN');

		await run('lsof -i :9999');
		expect(engine.lastExitCode).toBe(1);
	});

	it('serve refuses a taken port with EADDRINUSE and takes a free one', async () => {
		const busy = await run('serve 3000');
		expect(busy.error).toBe(true);
		expect(busy.output).toContain('EADDRINUSE');

		const okRes = await run('serve 8080');
		expect(okRes.output).toContain('listening');
		expect(engine.findByPort(8080)).toBeDefined();
	});

	it('the free-the-port ritual: find it, kill it, start yours', async () => {
		const pid = engine.findByPort(3000)!.pid;
		await run(`kill ${pid}`);
		const res = await run('serve 3000');
		expect(res.output).toContain('listening');
		expect(engine.findByPort(3000)!.pid).not.toBe(pid);
	});

	it('& backgrounds a job, jobs lists it, fg runs it', async () => {
		const bg = await run('echo built > out.txt &');
		expect(bg.output).toMatch(/^\[1\] \d+/);
		expect(engine.readFile('~/out.txt')).toBeNull();

		expect((await run('jobs')).output).toContain('[1]');
		expect((await run('jobs')).output).toContain('Running');

		await run('fg %1');
		expect(engine.readFile('~/out.txt')).toBe('built\n');
		expect((await run('jobs')).output).toBe('');
	});

	it('kill %1 stops a background job by its job number', async () => {
		await run('sleep 30 &');
		expect((await run('jobs')).output).toContain('[1]');
		const res = await run('kill %1');
		expect(res.output).toContain('terminated');
		expect((await run('jobs')).output).toBe('');
	});

	it('fg with no jobs explains what to do instead', async () => {
		const res = await run('fg');
		expect(res.error).toBe(true);
		expect(res.output).toContain('no current jobs');
	});

	it('has man pages and shows up on PATH', async () => {
		expect(strip((await run('man kill')).output)).toContain('SIGKILL');
		expect(strip((await run('man lsof')).output)).toContain(':3000');
		expect(strip((await run('man ps')).output)).toContain('PID');
		expect((await run('which lsof')).output).toBe('/usr/bin/lsof');
	});
});

describe('curl and jq', () => {
	beforeEach(async () => {
		await engine.reset({
			files: { '~/config.json': '{"server":{"port":3000},"debug":false}\n' },
			processes: [{ command: 'node server.js', port: 3000 }],
			network: {
				'api.vibecloud.dev/releases': '{"latest":"2.1.0","items":[{"tag":"2.1.0"},{"tag":"2.0.4"}]}'
			}
		});
	});

	it('localhost is answered by the process holding the port', async () => {
		expect((await run('curl localhost:3000/health')).output).toContain('"status":"ok"');
		expect((await run('curl http://localhost:3000/')).output).toContain('It works');
	});

	it('killing the server makes curl fail with connection refused', async () => {
		const pid = engine.findByPort(3000)!.pid;
		await run(`kill ${pid}`);
		const res = await run('curl localhost:3000/health');
		expect(res.error).toBe(true);
		expect(res.output).toContain('Connection refused');
	});

	it('an unused port refuses too, and names the way to check', async () => {
		const res = await run('curl localhost:9999/');
		expect(res.error).toBe(true);
		expect(res.output).toContain('lsof -i :9999');
	});

	it('-o saves the body, -s silences the meter, -I shows headers', async () => {
		await run('curl -s -o status.json localhost:3000/health');
		expect(engine.readFile('~/status.json')).toContain('"status":"ok"');
		const head = await run('curl -I localhost:3000/health');
		expect(head.output).toContain('HTTP/1.1 200 OK');
		expect(head.output).toContain('application/json');
	});

	it('remote hosts answer from the scenario network, unknown ones do not resolve', async () => {
		expect((await run('curl -s api.vibecloud.dev/releases')).output).toContain('2.1.0');
		const bad = await run('curl -s nowhere.example.com/x');
		expect(bad.error).toBe(true);
		expect(bad.output).toContain('Could not resolve host');
	});

	it('jq walks keys, indexes and prints raw strings with -r', async () => {
		expect((await run('curl -s api.vibecloud.dev/releases | jq .latest')).output).toBe('"2.1.0"');
		expect((await run('curl -s api.vibecloud.dev/releases | jq -r .latest')).output).toBe('2.1.0');
		expect((await run('curl -s api.vibecloud.dev/releases | jq -r .items[0].tag')).output).toBe(
			'2.1.0'
		);
		expect((await run('jq .server.port config.json')).output).toBe('3000');
	});

	it('jq explains bad JSON and bad filters', async () => {
		const parse = await run('curl -s localhost:3000/ | jq .');
		expect(parse.error).toBe(true);
		expect(parse.output).toContain('not valid JSON');
		const filter = await run('jq latest config.json');
		expect(filter.error).toBe(true);
		expect(filter.output).toContain("'.latest'");
	});

	it('the whole pipeline: ask the API, extract, save', async () => {
		await run('curl -s api.vibecloud.dev/releases | jq -r .latest > version.txt');
		expect(engine.readFile('~/version.txt')).toBe('2.1.0\n');
	});

	it('has man pages and lives on PATH', async () => {
		expect(strip((await run('man curl')).output)).toContain('-o FILE');
		expect(strip((await run('man jq')).output)).toContain('nested');
		expect((await run('which jq')).output).toBe('/usr/bin/jq');
	});
});

describe('text shaping: sort, uniq, cut, tr, echo, printf', () => {
	it('sorts alphabetically, numerically, reversed and unique', async () => {
		expect((await run('printf "b\\na\\nc\\n" | sort')).output).toBe('a\nb\nc');
		expect((await run('printf "10\\n9\\n2\\n" | sort -n')).output).toBe('2\n9\n10');
		expect((await run('printf "a\\nb\\n" | sort -r')).output).toBe('b\na');
		expect((await run('printf "a\\na\\nb\\n" | sort -u')).output).toBe('a\nb');
	});

	it('uniq collapses only adjacent duplicates', async () => {
		expect((await run('printf "a\\na\\nb\\na\\n" | uniq')).output).toBe('a\nb\na');
		expect((await run('printf "a\\na\\n" | uniq -c')).output.trim()).toBe('2 a');
	});

	it('cut selects delimited fields', async () => {
		expect((await run("echo 'a,b,c' | cut -d, -f2")).output).toBe('b');
		expect((await run("echo 'a,b,c' | cut -d, -f1,3")).output).toBe('a,c');
	});

	it('tr translates and deletes characters', async () => {
		expect((await run('echo hello | tr a-z A-Z')).output).toBe('HELLO');
		expect((await run('echo hello | tr -d l')).output).toBe('heo');
	});

	it('echo supports -n and -e', async () => {
		expect((await run('echo -n hi | wc -c')).output.trim()).toBe('2');
		expect((await run('echo hi | wc -c')).output.trim()).toBe('3');
		expect((await run("echo -e 'a\\tb'")).output).toBe('a\tb');
	});

	it('printf formats %s and %d', async () => {
		expect((await run("printf '%s-%d\\n' hi 42")).output).toBe('hi-42');
	});
});

describe('cp, mv, rm', () => {
	it('copies files and refuses directories without -r', async () => {
		await run('cp notes.txt copy.txt');
		expect(engine.readFile('/home/vibe/copy.txt')).toBe('alpha\nbeta\ngamma\n');
		const noR = await run('cp projects backup');
		expect(noR.error).toBe(true);
		expect(noR.output).toContain('-r not specified');
		await run('cp -r projects backup');
		expect(engine.readFile('/home/vibe/backup/readme.md')).toBe('hello world\n');
	});

	it('mv renames and moves into directories', async () => {
		await run('mv todo.md done.md');
		expect(engine.exists('/home/vibe/todo.md')).toBe(false);
		expect(engine.exists('/home/vibe/done.md')).toBe(true);
		await run('mv done.md projects');
		expect(engine.exists('/home/vibe/projects/done.md')).toBe(true);
	});

	it('mv -i refuses to overwrite', async () => {
		const res = await run('mv -i notes.txt todo.md');
		expect(res.error).toBe(true);
		expect(engine.readFile('/home/vibe/todo.md')).toBe('- [ ] learn pipes\n');
	});

	it('rm removes files but refuses directories without -r', async () => {
		await run('rm notes.txt');
		expect(engine.exists('/home/vibe/notes.txt')).toBe(false);
		const dir = await run('rm projects');
		expect(dir.error).toBe(true);
		expect(dir.output).toContain('Is a directory');
		expect(dir.output).toContain('-r');
		await run('rm -r projects');
		expect(engine.exists('/home/vibe/projects')).toBe(false);
	});

	it('rm -f silences missing files; plain rm complains', async () => {
		expect((await run('rm ghost.txt')).error).toBe(true);
		expect((await run('rm -f ghost.txt')).error).toBeFalsy();
	});

	it('refuses to nuke / or home, reinforcing the lesson', async () => {
		const res = await run('rm -rf /');
		expect(res.error).toBe(true);
		expect(engine.exists('/home/vibe/notes.txt')).toBe(true);
	});

	it('removes glob matches', async () => {
		await run('rm *.txt');
		expect(engine.exists('/home/vibe/notes.txt')).toBe(false);
		expect(engine.exists('/home/vibe/todo.md')).toBe(true);
	});
});

describe('find, which, type', () => {
	it('finds by quoted -name pattern', async () => {
		const res = await run("find . -name '*.py'");
		expect(res.output).toContain('./projects/app/main.py');
		expect(res.output).toContain('./projects/app/util.py');
	});

	it('filters by -type and -maxdepth', async () => {
		const dirs = await run('find projects -type d');
		expect(dirs.output.trim().split('\n')).toEqual(['projects', 'projects/app']);
		const shallow = await run('find . -maxdepth 1 -type f');
		expect(shallow.output).toContain('./notes.txt');
		expect(shallow.output).not.toContain('main.py');
	});

	it('which locates binaries and explains misses', async () => {
		expect((await run('which ls')).output).toBe('/usr/bin/ls');
		const miss = await run('which pancake');
		expect(miss.error).toBe(true);
		expect(miss.output).toContain('PATH');
	});

	it('type distinguishes aliases, builtins and binaries', async () => {
		await run("alias ll='ls -l'");
		expect((await run('type ll')).output).toContain('aliased');
		expect((await run('type cd')).output).toContain('builtin');
		expect((await run('type grep')).output).toContain('/usr/bin/grep');
	});
});

describe('chmod and script execution', () => {
	it('blocks ./script.sh until chmod +x, then runs it with args', async () => {
		const denied = await run('./scripts/greet.sh world');
		expect(denied.error).toBe(true);
		expect(denied.output).toContain('Permission denied');
		expect(denied.output).toContain('chmod +x');

		await run('chmod +x scripts/greet.sh');
		expect(engine.isExecutable('/home/vibe/scripts/greet.sh')).toBe(true);
		const res = await run('./scripts/greet.sh world');
		expect(res.output).toContain('hello world');
		expect(res.output).toContain('from vibe');
	});

	it('bash script.sh runs without the executable bit', async () => {
		const res = await run('bash scripts/greet.sh crew');
		expect(res.output).toContain('hello crew');
	});

	it('chmod octal updates the ls -l mode string and the real x bit', async () => {
		await run('chmod 755 scripts/greet.sh');
		expect(engine.isExecutable('/home/vibe/scripts/greet.sh')).toBe(true);
		expect((await run('ls -l scripts/greet.sh')).output).toContain('-rwxr-xr-x');
		await run('chmod 644 scripts/greet.sh');
		expect(engine.isExecutable('/home/vibe/scripts/greet.sh')).toBe(false);
		expect((await run('ls -l scripts/greet.sh')).output).toContain('-rw-r--r--');
	});

	it('runs executables found via PATH — the command-not-found lesson', async () => {
		await run('mkdir bin');
		await run("echo 'echo tool-ran' > bin/tool");
		await run('chmod +x bin/tool');
		expect((await run('tool')).error).toBe(true);
		await run('export PATH="$PATH:/home/vibe/bin"');
		expect((await run('tool')).output).toBe('tool-ran');
	});

	it('reports a missing script distinctly', async () => {
		const res = await run('./nothing.sh');
		expect(res.error).toBe(true);
		expect(res.output).toContain('No such file or directory');
	});
});

describe('aliases and source', () => {
	it('defines, lists, uses and removes aliases', async () => {
		await run("alias la='ls -a'");
		expect((await run('alias')).output).toContain("alias la='ls -a'");
		expect((await run('la')).output).toContain('.secret');
		await run('unalias la');
		expect((await run('alias')).output).not.toContain('la=');
	});

	it('source runs a file in the current shell (the .bashrc lesson)', async () => {
		engine.writeFile('/home/vibe/.bashrc', "alias ll='ls -l'\nexport GREETING=hey\n");
		await run('source ~/.bashrc');
		expect(engine.aliases.get('ll')).toBe('ls -l');
		expect(engine.env.GREETING).toBe('hey');
		expect((await run('ll')).output).toContain('-rw-r--r--');
	});
});

describe('info commands and stubs', () => {
	it('whoami, pwd basics', async () => {
		expect((await run('whoami')).output).toBe('vibe');
	});

	it('clear returns the magic token', async () => {
		expect((await run('clear')).output).toBe('__CLEAR__');
	});

	it('help lists command groups; man renders a page', async () => {
		const help = await run('help');
		expect(help.output).toContain('grep');
		expect(help.output).toContain('pipes');
		const man = await run('man grep');
		expect(man.output).toContain('NAME');
		expect(man.output).toContain('SYNOPSIS');
		expect(man.output).toContain('THE VIBE');
		expect(strip((await run('man uniq')).output)).toContain('ADJACENT');
		expect((await run('man nosuchthing')).error).toBe(true);
		expect((await run('man')).error).toBe(true);
	});

	it('unknown commands get code 127 and a hint', async () => {
		const res = await run('pancakes');
		expect(res.error).toBe(true);
		expect(res.output).toContain('command not found');
		expect(res.output).toContain('help');
		expect(engine.lastExitCode).toBe(127);
	});

	it('exit records its code without closing anything', async () => {
		const res = await run('exit 3');
		expect(res.output).toContain('exit');
		expect(engine.lastExitCode).toBe(3);
		expect((await run('echo $?')).output).toBe('3');
	});

	it('seq, basename, dirname, file, tee, xargs', async () => {
		expect((await run('seq 3')).output).toBe('1\n2\n3');
		expect((await run('basename /a/b.txt')).output).toBe('b.txt');
		expect((await run('dirname /a/b.txt')).output).toBe('/a');
		expect((await run('file notes.txt')).output).toBe('notes.txt: ASCII text');
		expect((await run('file scripts/greet.sh')).output).toContain('script');
		await run('echo hi | tee out.txt');
		expect(engine.readFile('/home/vibe/out.txt')).toBe('hi\n');
		expect((await run('echo start | xargs echo said:')).output).toBe('said: start');
	});

	it('du walks real sizes; df fakes plausibly', async () => {
		expect((await run('du')).output).toContain('\t.');
		expect((await run('df -h')).output).toContain('Filesystem');
	});

	it('editor, sudo and network stubs teach instead of pretending', async () => {
		const nano = await run('nano notes.txt');
		expect(nano.output).toContain('>>');
		const sudo = await run('sudo rm notes.txt');
		expect(sudo.error).toBe(true);
		expect(sudo.output).toContain('root');
		expect(engine.exists('/home/vibe/notes.txt')).toBe(true);
		// With no scenario network configured, curl still answers from the
		// generic teaching body rather than erroring.
		const curl = await run('curl https://api.example.com/data.json');
		expect(curl.output).toContain('"status"');
		await run('wget https://example.com/data.json');
		expect(engine.exists('/home/vibe/data.json')).toBe(true);
		expect((await run('ps')).output).toContain('PID');
		expect((await run('sleep 1')).output).toContain('pretend');
	});
});
