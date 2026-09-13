import { describe, expect, it, vi } from 'vitest';
import { CloudBackend, sseData } from './backend';
import type { AgentEvent, AgentBash, AgentBashDecision } from '../types';

const key = 'test-session-key-not-a-real-secret';
function stream(events: unknown[]): Response {
	const bytes = new TextEncoder().encode(
		events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('')
	);
	return new Response(
		new ReadableStream({
			start(controller) {
				for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
				controller.close();
			}
		}),
		{ status: 200 }
	);
}
const openaiAnswer = () =>
	stream([
		{ type: 'response.output_text.delta', delta: 'Try pwd.' },
		{
			type: 'response.completed',
			response: {
				output: [
					{
						type: 'message',
						role: 'assistant',
						content: [{ type: 'output_text', text: 'Try pwd.' }]
					}
				],
				usage: { input_tokens: 12, output_tokens: 3 }
			}
		}
	]);
const anthropicAnswer = () =>
	stream([
		{ type: 'message_start', message: { usage: { input_tokens: 10 } } },
		{ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
		{ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Try pwd.' } },
		{ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 3 } },
		{ type: 'message_stop' }
	]);
const question = [{ role: 'user' as const, content: 'Why did my command fail?' }];

describe('static cloud tutor', () => {
	it('reassembles SSE across byte boundaries including UTF-8 and CRLF', async () => {
		const bytes = new TextEncoder().encode('data: {"text":"café 🌱"}\r\n\r\ndata: [DONE]\r\n\r\n');
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
				controller.close();
			}
		});
		const events = [];
		for await (const event of sseData(body)) events.push(event);
		expect(events).toEqual([{ text: 'café 🌱' }]);
	});
	it.each(['openai', 'anthropic'] as const)(
		'sends %s requests directly with key only in headers and no model discovery',
		async (provider) => {
			const fetcher = vi
				.fn<typeof fetch>()
				.mockResolvedValue(provider === 'openai' ? openaiAnswer() : anthropicAnswer());
			const backend = new CloudBackend(provider, 'a-new-model', key, fetcher);
			const events: AgentEvent[] = [];
			await backend.generate([{ role: 'user', content: `Please explain ${key}` }], {
				context: 'last command: ech hello; exit 127',
				onEvent: (event) => events.push(event)
			});
			const [url, request] = fetcher.mock.calls[0];
			expect(url).toBe(
				provider === 'openai'
					? 'https://api.openai.com/v1/responses'
					: 'https://api.anthropic.com/v1/messages'
			);
			expect(request?.body).not.toContain(key);
			expect(request?.body).toContain('last command: ech hello');
			expect(request?.credentials).toBe('omit');
			expect(request?.redirect).toBe('error');
			expect(request?.cache).toBe('no-store');
			expect(
				new Headers(request?.headers).get(provider === 'openai' ? 'authorization' : 'x-api-key')
			).toContain(key);
			if (provider === 'openai') expect(JSON.parse(request?.body as string).store).toBe(false);
			else
				expect(new Headers(request?.headers).get('anthropic-dangerous-direct-browser-access')).toBe(
					'true'
				);
			expect(events).toContainEqual({ type: 'token', text: 'Try pwd.' });
			expect(events.at(-1)).toEqual({ type: 'doneTurn' });
			expect(fetcher).toHaveBeenCalledTimes(1);
		}
	);
	it('waits for approval, runs an edited command, and returns its result to OpenAI', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				stream([
					{
						type: 'response.completed',
						response: {
							output: [
								{
									type: 'function_call',
									call_id: 'call-one',
									name: 'bash',
									arguments: '{"cmd":"ls"}'
								}
							]
						}
					}
				])
			)
			.mockResolvedValueOnce(openaiAnswer());
		let decide!: (value: { decision: 'edit'; cmd: string }) => void;
		const bash: AgentBash = {
			propose: vi.fn(
				() =>
					new Promise<AgentBashDecision>((resolve) => {
						decide = resolve;
					})
			),
			run: vi.fn().mockResolvedValue({ output: '/home/vibe' })
		};
		const pending = new CloudBackend('openai', 'new-model', key, fetcher).generate(question, {
			bash,
			onEvent() {}
		});
		await vi.waitFor(() => expect(bash.propose).toHaveBeenCalledWith('ls'));
		expect(bash.run).not.toHaveBeenCalled();
		decide({ decision: 'edit', cmd: 'pwd' });
		await pending;
		expect(bash.run).toHaveBeenCalledExactlyOnceWith('pwd');
		const sent = JSON.parse(fetcher.mock.calls[1][1]?.body as string);
		expect(sent.input.at(-1).call_id).toBe('call-one');
		expect(sent.input.at(-1).output).toContain('/home/vibe');
	});
	it('preserves Anthropic tool-use blocks and sends the denied result without executing', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				stream([
					{
						type: 'content_block_start',
						index: 0,
						content_block: { type: 'tool_use', id: 'tool-one', name: 'bash', input: {} }
					},
					{
						type: 'content_block_delta',
						index: 0,
						delta: { type: 'input_json_delta', partial_json: '{"cmd":"rm note.txt"}' }
					},
					{ type: 'message_stop' }
				])
			)
			.mockResolvedValueOnce(anthropicAnswer());
		const bash: AgentBash = {
			propose: vi.fn().mockResolvedValue({ decision: 'deny', cmd: 'rm note.txt' }),
			run: vi.fn()
		};
		await new CloudBackend('anthropic', 'new-model', key, fetcher).generate(question, {
			bash,
			onEvent() {}
		});
		expect(bash.run).not.toHaveBeenCalled();
		const messages = JSON.parse(fetcher.mock.calls[1][1]?.body as string).messages;
		expect(messages.at(-2).content[0].input).toEqual({ cmd: 'rm note.txt' });
		expect(messages.at(-1).content[0]).toMatchObject({
			type: 'tool_result',
			tool_use_id: 'tool-one'
		});
		expect(messages.at(-1).content[0].content).toContain('declined');
	});
	it('does not execute a command if stopped while approval was pending', async () => {
		const controller = new AbortController();
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			stream([
				{
					type: 'response.completed',
					response: {
						output: [
							{ type: 'function_call', call_id: 'one', name: 'bash', arguments: '{"cmd":"ls"}' }
						]
					}
				}
			])
		);
		const bash: AgentBash = {
			propose: async (cmd) => {
				controller.abort();
				return { decision: 'allow', cmd };
			},
			run: vi.fn()
		};
		await expect(
			new CloudBackend('openai', 'new-model', key, fetcher).generate(question, {
				bash,
				signal: controller.signal,
				onEvent() {}
			})
		).rejects.toThrow();
		expect(bash.run).not.toHaveBeenCalled();
	});
	it.each([401, 403, 404, 429, 500])(
		'reports HTTP %s without reflecting sensitive provider bodies',
		async (status) => {
			const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(key, { status }));
			await expect(
				new CloudBackend('openai', 'new-model', key, fetcher).generate(question, { onEvent() {} })
			).rejects.not.toThrow(key);
		}
	);
	it('forgets the key on disconnect and makes no further request', async () => {
		const fetcher = vi.fn<typeof fetch>();
		const backend = new CloudBackend('openai', 'new-model', key, fetcher);
		backend.disconnect();
		await expect(backend.generate(question, { onEvent() {} })).rejects.toThrow('disconnected');
		expect(fetcher).not.toHaveBeenCalled();
	});
	it('detects truncated streams rather than marking an unfinished reply complete', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(stream([{ type: 'response.output_text.delta', delta: 'hello' }]));
		await expect(
			new CloudBackend('openai', 'new-model', key, fetcher).generate(question, { onEvent() {} })
		).rejects.toThrow('before the response finished');
	});
	it('rejects duplicate action identifiers before requesting approval', async () => {
		const call = {
			type: 'function_call',
			call_id: 'same-call',
			name: 'bash',
			arguments: '{"cmd":"echo hi"}'
		};
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(
				stream([{ type: 'response.completed', response: { output: [call, call] } }])
			);
		const bash: AgentBash = { propose: vi.fn(), run: vi.fn() };
		await expect(
			new CloudBackend('openai', 'model', key, fetcher).generate(question, { bash, onEvent() {} })
		).rejects.toThrow('repeated an action identifier');
		expect(bash.propose).not.toHaveBeenCalled();
		expect(bash.run).not.toHaveBeenCalled();
	});
});
