import { beforeEach, describe, expect, it } from 'vitest';
import { ShellEngine, globToRegExp, isGlob } from './shell-engine';

let engine: ShellEngine;

beforeEach(async () => {
	engine = new ShellEngine();
	await engine.reset();
});

describe('resolve', () => {
	it('normalizes . and .. against the cwd', () => {
		engine.cwd = '/home/vibe/projects/app';
		expect(engine.resolve('..')).toBe('/home/vibe/projects');
		expect(engine.resolve('../..')).toBe('/home/vibe');
		expect(engine.resolve('./src/../lib')).toBe('/home/vibe/projects/app/lib');
		expect(engine.resolve('.')).toBe('/home/vibe/projects/app');
	});

	it('expands ~ and ~/ to HOME', () => {
		expect(engine.resolve('~')).toBe('/home/vibe');
		expect(engine.resolve('~/docs/notes.txt')).toBe('/home/vibe/docs/notes.txt');
	});

	it('keeps absolute paths absolute and clamps .. at the root', () => {
		expect(engine.resolve('/etc/../usr//bin')).toBe('/usr/bin');
		expect(engine.resolve('/../..')).toBe('/');
		expect(engine.resolve('')).toBe(engine.cwd);
	});

	it('pretty-prints home-relative paths', () => {
		expect(engine.pretty('/home/vibe')).toBe('~');
		expect(engine.pretty('/home/vibe/docs')).toBe('~/docs');
		expect(engine.pretty('/etc')).toBe('/etc');
	});
});

describe('mkdirp and writeFile', () => {
	it('creates nested directories and is idempotent', () => {
		engine.mkdirp('/home/vibe/a/b/c');
		expect(engine.isDir('/home/vibe/a/b/c')).toBe(true);
		expect(() => engine.mkdirp('/home/vibe/a/b/c')).not.toThrow();
	});

	it('throws when a path component is an existing file', () => {
		engine.writeFile('/home/vibe/blocker', 'x');
		expect(() => engine.mkdirp('/home/vibe/blocker/sub')).toThrow(/Not a directory/);
	});

	it('writeFile creates parents and overwrites content', () => {
		engine.writeFile('/home/vibe/deep/nest/file.txt', 'one');
		expect(engine.readFile('/home/vibe/deep/nest/file.txt')).toBe('one');
		expect(engine.isDir('/home/vibe/deep/nest')).toBe(true);
		engine.writeFile('/home/vibe/deep/nest/file.txt', 'two');
		expect(engine.readFile('/home/vibe/deep/nest/file.txt')).toBe('two');
	});

	it('writeFile refuses to clobber a directory', () => {
		engine.mkdirp('/home/vibe/dir');
		expect(() => engine.writeFile('/home/vibe/dir', 'x')).toThrow(/Is a directory/);
	});
});

describe('removeNode and cloneNode', () => {
	it('removes files and whole subtrees, but never the root', () => {
		engine.writeFile('/home/vibe/a/f.txt', 'x');
		expect(engine.removeNode('/home/vibe/a/f.txt')).toBe(true);
		expect(engine.exists('/home/vibe/a/f.txt')).toBe(false);
		expect(engine.removeNode('/home/vibe/a')).toBe(true);
		expect(engine.removeNode('/home/vibe/ghost')).toBe(false);
		expect(engine.removeNode('/')).toBe(false);
	});

	it('cloneNode deep-copies so mutations do not leak', () => {
		engine.writeFile('/home/vibe/src/inner/file.txt', 'original');
		const node = engine.getNode('/home/vibe/src')!;
		const clone = engine.cloneNode(node, 'copy');
		engine.attachNode('/home/vibe/copy', clone);
		engine.writeFile('/home/vibe/src/inner/file.txt', 'changed');
		expect(engine.readFile('/home/vibe/copy/inner/file.txt')).toBe('original');
	});
});

describe('listDir and walk', () => {
	it('lists sorted children, null for files and missing paths', () => {
		engine.writeFile('/home/vibe/b.txt', '');
		engine.writeFile('/home/vibe/a.txt', '');
		expect(engine.listDir('/home/vibe')).toEqual(['a.txt', 'b.txt']);
		expect(engine.listDir('/home/vibe/a.txt')).toBeNull();
		expect(engine.listDir('/home/vibe/ghost')).toBeNull();
	});

	it('walks depth-first, parents before children', () => {
		engine.writeFile('/home/vibe/x/one.txt', '');
		engine.writeFile('/home/vibe/x/sub/two.txt', '');
		const visited: string[] = [];
		engine.walk('/home/vibe/x', (p) => visited.push(p));
		expect(visited).toEqual([
			'/home/vibe/x',
			'/home/vibe/x/one.txt',
			'/home/vibe/x/sub',
			'/home/vibe/x/sub/two.txt'
		]);
	});
});

describe('reset with a seed', () => {
	it('builds files, dirs, executables, cwd, env and aliases', async () => {
		engine.historyLog.push('stale');
		engine.lastExitCode = 9;
		await engine.reset({
			files: { '~/app/run.sh': 'echo hi\n', '/etc/motd': 'welcome\n' },
			dirs: ['~/empty'],
			executables: ['~/app/run.sh'],
			cwd: '~/app',
			env: { STAGE: 'test' },
			aliases: { ll: 'ls -l' }
		});
		expect(engine.readFile('/home/vibe/app/run.sh')).toBe('echo hi\n');
		expect(engine.readFile('/etc/motd')).toBe('welcome\n');
		expect(engine.isDir('/home/vibe/empty')).toBe(true);
		expect(engine.isExecutable('/home/vibe/app/run.sh')).toBe(true);
		expect(engine.cwd).toBe('/home/vibe/app');
		expect(engine.env.PWD).toBe('/home/vibe/app');
		expect(engine.env.STAGE).toBe('test');
		expect(engine.aliases.get('ll')).toBe('ls -l');
		expect(engine.historyLog).toEqual([]);
		expect(engine.lastExitCode).toBe(0);
	});

	it('always creates home, even with no seed', () => {
		expect(engine.isDir('/home/vibe')).toBe(true);
		expect(engine.cwd).toBe('/home/vibe');
	});
});

describe('globToRegExp and isGlob', () => {
	it('translates *, ? and character classes', () => {
		expect(globToRegExp('*.txt').test('notes.txt')).toBe(true);
		expect(globToRegExp('*.txt').test('notes.txt.bak')).toBe(false);
		expect(globToRegExp('file?.md').test('file1.md')).toBe(true);
		expect(globToRegExp('file?.md').test('file12.md')).toBe(false);
		expect(globToRegExp('[abc].txt').test('b.txt')).toBe(true);
		expect(globToRegExp('[a-c].txt').test('d.txt')).toBe(false);
		expect(globToRegExp('[!a]x').test('bx')).toBe(true);
		expect(globToRegExp('[!a]x').test('ax')).toBe(false);
	});

	it('escapes regex metacharacters and * never crosses a slash', () => {
		expect(globToRegExp('a.b').test('axb')).toBe(false);
		expect(globToRegExp('*').test('dir/file')).toBe(false);
		expect(globToRegExp('[unclosed').test('[unclosed')).toBe(true);
	});

	it('isGlob detects pattern characters', () => {
		expect(isGlob('*.txt')).toBe(true);
		expect(isGlob('file?.md')).toBe(true);
		expect(isGlob('[ab]')).toBe(true);
		expect(isGlob('plain.txt')).toBe(false);
	});
});
