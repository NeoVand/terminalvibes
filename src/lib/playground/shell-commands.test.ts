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

	it('rejects command substitution and background jobs with friendly messages', async () => {
		const subst = await run('echo $(pwd)');
		expect(subst.error).toBe(true);
		expect(subst.output).toContain('substitution');
		const bg = await run('sleep 5 &');
		expect(bg.error).toBe(true);
		expect(bg.output).toContain('background');
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
		const curl = await run('curl https://api.example.com/data.json');
		expect(curl.output).toContain('simulated');
		await run('wget https://example.com/data.json');
		expect(engine.exists('/home/vibe/data.json')).toBe(true);
		expect((await run('ps')).output).toContain('PID');
		expect((await run('sleep 1')).output).toContain('pretend');
	});
});
