import { describe, expect, it } from 'vitest';
import { tokenizeCodeBlock, tokenizeShellCommand } from './bash-syntax';

describe('tokenizeShellCommand', () => {
	it('types commands, flags, strings, and args', () => {
		const tokens = tokenizeShellCommand('grep -i "error" server.log');
		expect(tokens.map((t) => t.type)).toEqual([
			'command',
			'space',
			'flag',
			'space',
			'string',
			'space',
			'arg'
		]);
	});

	it('starts a new command after every pipe and chain operator', () => {
		const tokens = tokenizeShellCommand('cat access.log | sort | uniq -c && echo done');
		const commands = tokens.filter((t) => t.type === 'command').map((t) => t.text);
		expect(commands).toEqual(['cat', 'sort', 'uniq', 'echo']);
	});

	it('gives operators a visible type of their own', () => {
		const tokens = tokenizeShellCommand('npm test && echo ok > out.txt 2> err.txt');
		const operators = tokens.filter((t) => t.type === 'hash').map((t) => t.text);
		expect(operators).toEqual(['&&', '>', '2>']);
	});

	it('redirection targets are files, not commands', () => {
		const tokens = tokenizeShellCommand('echo hi > out.txt');
		const target = tokens[tokens.length - 1];
		expect(target).toEqual({ text: 'out.txt', type: 'arg' });
	});

	it('types $VAR and <placeholders> as placeholder', () => {
		expect(tokenizeShellCommand('echo $HOME')[2]).toEqual({ text: '$HOME', type: 'placeholder' });
		expect(tokenizeShellCommand('man <command>')[2]).toEqual({
			text: '<command>',
			type: 'placeholder'
		});
		expect(tokenizeShellCommand('echo $?')[2]).toEqual({ text: '$?', type: 'placeholder' });
	});

	it('a leading <placeholder> command is never mistaken for redirection', () => {
		const tokens = tokenizeShellCommand('<command> | <command>');
		expect(tokens.map((t) => t.type)).toEqual([
			'placeholder',
			'space',
			'hash',
			'space',
			'placeholder'
		]);
	});

	it('highlights glob wildcards in arguments', () => {
		const tokens = tokenizeShellCommand('rm -r *.log');
		expect(tokens[tokens.length - 1]).toEqual({ text: '*.log', type: 'hash' });
	});

	it('treats known multi-word tools as command + subcommand', () => {
		const tokens = tokenizeShellCommand('git status');
		expect(tokens.map((t) => t.type)).toEqual(['command', 'space', 'subcommand']);
		// ...but ordinary arguments stay arguments
		expect(tokenizeShellCommand('cd projects')[2].type).toBe('arg');
	});

	it('sudo re-arms command detection', () => {
		const tokens = tokenizeShellCommand('sudo apt install cowsay');
		expect(tokens.map((t) => [t.text, t.type])).toEqual([
			['sudo', 'command'],
			[' ', 'space'],
			['apt', 'command'],
			[' ', 'space'],
			['install', 'subcommand'],
			[' ', 'space'],
			['cowsay', 'arg']
		]);
	});

	it('types ./scripts as commands', () => {
		expect(tokenizeShellCommand('./deploy.sh --dry-run')[0]).toEqual({
			text: './deploy.sh',
			type: 'command'
		});
	});

	it('keeps a shebang as a single comment token', () => {
		expect(tokenizeShellCommand('#!/usr/bin/env bash')).toEqual([
			{ text: '#!/usr/bin/env bash', type: 'comment' }
		]);
	});

	it('splits operators even without surrounding spaces', () => {
		const tokens = tokenizeShellCommand('mkdir demo&&cd demo');
		expect(tokens.map((t) => [t.text, t.type])).toEqual([
			['mkdir', 'command'],
			[' ', 'space'],
			['demo', 'arg'],
			['&&', 'hash'],
			['cd', 'command'],
			[' ', 'space'],
			['demo', 'arg']
		]);
	});

	it('round-trips the original text exactly', () => {
		const commands = [
			'grep -rn "TODO" . | wc -l',
			'find . -name "*.md" -type f',
			'tar -xzf archive.tar.gz 2>/dev/null && echo ok || echo failed',
			"alias gs='git status'",
			'echo $PATH'
		];
		for (const cmd of commands) {
			expect(
				tokenizeShellCommand(cmd)
					.map((t) => t.text)
					.join('')
			).toBe(cmd);
		}
	});
});

describe('shell code blocks', () => {
	it('separates trailing comments from code', () => {
		const [line] = tokenizeCodeBlock('ls -a   # show hidden files too');
		expect(line[0]).toEqual({ text: 'ls', type: 'command' });
		expect(line[line.length - 1]).toEqual({ text: '# show hidden files too', type: 'comment' });
	});

	it('round-trips multi-line blocks exactly', () => {
		const block = [
			'#!/usr/bin/env bash',
			'mkdir -p backup',
			'cp -r notes backup/ # keep a copy'
		].join('\n');
		const rebuilt = tokenizeCodeBlock(block)
			.map((line) => line.map((t) => t.text).join(''))
			.join('\n');
		expect(rebuilt).toBe(block);
	});
});

describe('config mode', () => {
	const SAMPLE = ['# OS junk', '.DS_Store', 'Thumbs.db', 'node_modules/', '!.env.example'].join(
		'\n'
	);

	it('never types a pattern as a command (Thumbs.db regression)', () => {
		const lines = tokenizeCodeBlock(SAMPLE, 'config');
		const types = lines.flat().map((t) => t.type);
		expect(types).not.toContain('command');
		expect(types).not.toContain('subcommand');
	});

	it('comments, negation, and wildcards get their own types', () => {
		const lines = tokenizeCodeBlock('# deps\n!keep.txt\n*.pyc', 'config');
		expect(lines[0][0].type).toBe('comment');
		expect(lines[1][0]).toEqual({ text: '!', type: 'flag' });
		expect(lines[2].map((t) => [t.text, t.type])).toEqual([
			['*', 'hash'],
			['.pyc', 'text']
		]);
	});

	it("still answers to the legacy 'gitignore' mode name", () => {
		const lines = tokenizeCodeBlock('*.tmp', 'gitignore');
		expect(lines[0][0]).toEqual({ text: '*', type: 'hash' });
	});

	it('round-trips each line exactly', () => {
		const lines = tokenizeCodeBlock(SAMPLE, 'config');
		const rebuilt = lines.map((line) => line.map((t) => t.text).join('')).join('\n');
		expect(rebuilt).toBe(SAMPLE);
	});
});
