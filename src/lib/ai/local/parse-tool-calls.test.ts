import { describe, expect, it } from 'vitest';
import { coerceXmlToolCall, parseToolCalls } from './transformers-js';

describe('parseToolCalls — Hermes JSON format', () => {
	it('parses a JSON tool call and keeps surrounding prose as content', () => {
		const { content, toolCalls } = parseToolCalls(
			'Let me check.\n<tool_call>{"name":"search_course","arguments":{"query":"pipes"}}</tool_call>'
		);
		expect(content).toBe('Let me check.');
		expect(toolCalls).toHaveLength(1);
		expect(toolCalls[0].name).toBe('search_course');
		expect(toolCalls[0].args).toEqual({ query: 'pipes' });
	});

	it('plain prose passes through untouched', () => {
		const { content, toolCalls } = parseToolCalls('Just an answer.');
		expect(content).toBe('Just an answer.');
		expect(toolCalls).toEqual([]);
	});
});

describe('parseToolCalls — Qwen3.5 XML format (observed in the smoke test)', () => {
	const observed =
		'<tool_call>\n<function=bash>\n<parameter=cmd>\necho "hi" > hello.txt\n</parameter>\n</function>\n</tool_call>';

	it('parses <function=name> / <parameter=key> blocks', () => {
		const { content, toolCalls } = parseToolCalls(observed);
		expect(content).toBe('');
		expect(toolCalls).toHaveLength(1);
		expect(toolCalls[0].name).toBe('bash');
		expect(toolCalls[0].args).toEqual({ cmd: 'echo "hi" > hello.txt' });
	});

	it('discards everything after a hallucinated <tool_response>', () => {
		const raw =
			observed +
			'\nuser assistant<tool_call>\n<function=bash>\n<parameter=cmd>\ncat hello.txt\n</parameter>\n</function>\n</tool_call>' +
			'\nuser <tool_response>\n"hi"\n</tool_response>assistant\nYou created the file.';
		const { content, toolCalls } = parseToolCalls(raw);
		// Both real calls before the fake response survive; the imagined
		// result and wrap-up do not.
		expect(toolCalls.map((c) => c.name)).toEqual(['bash', 'bash']);
		expect(toolCalls[1].args).toEqual({ cmd: 'cat hello.txt' });
		expect(content).toBe('');
	});

	it('coerces an unterminated trailing block (generation cut mid-call)', () => {
		const { toolCalls } = parseToolCalls(
			'Running it now.\n<tool_call>\n<function=bash>\n<parameter=cmd>\nls -la'
		);
		expect(toolCalls).toHaveLength(1);
		expect(toolCalls[0].name).toBe('bash');
		expect(toolCalls[0].args.cmd).toBe('ls -la');
	});

	it('coerceXmlToolCall handles multiple parameters', () => {
		const tc = coerceXmlToolCall(
			'<function=search_course>\n<parameter=query>chmod 755</parameter>\n</function>'
		);
		expect(tc?.name).toBe('search_course');
		expect(tc?.args).toEqual({ query: 'chmod 755' });
	});
});
