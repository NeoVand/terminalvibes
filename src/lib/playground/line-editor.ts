/** A small, explicit Readline-style editor shared by the course's practice inputs. */
export type LineAction =
	| 'start'
	| 'end'
	| 'killEnd'
	| 'killStart'
	| 'killWord'
	| 'yank'
	| 'wordBackward'
	| 'wordForward'
	| 'killNextWord'
	| 'cancel'
	| 'clearScreen';

export interface LineState {
	value: string;
	start: number;
	end: number;
	killBuffer: string;
	/** Consecutive kills accumulate, as they do in Readline. Clear after normal typing. */
	lastKill?: boolean;
}

export interface LineEdit extends LineState {
	removed?: string;
	cancelled?: boolean;
	cleared?: boolean;
}

type Key = Pick<
	KeyboardEvent,
	'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey' | 'isComposing'
>;

export function actionForKey(event: Key): LineAction | null {
	if (event.isComposing || event.metaKey || event.shiftKey) return null;
	const key = event.key.toLowerCase();
	if (event.ctrlKey && !event.altKey) {
		const controls: Record<string, LineAction> = {
			a: 'start',
			e: 'end',
			k: 'killEnd',
			u: 'killStart',
			w: 'killWord',
			y: 'yank',
			c: 'cancel',
			l: 'clearScreen'
		};
		return controls[key] ?? null;
	}
	if (event.altKey && !event.ctrlKey) {
		const words: Record<string, LineAction> = {
			b: 'wordBackward',
			f: 'wordForward',
			d: 'killNextWord'
		};
		return words[key] ?? null;
	}
	return null;
}

const isWord = (char: string) => /[\p{L}\p{N}]/u.test(char);
const previous = (text: string, offset: number) => {
	const last = Array.from(text.slice(0, offset)).at(-1);
	return Math.max(0, offset - (last?.length ?? 1));
};
const next = (text: string, offset: number) =>
	Math.min(text.length, offset + String.fromCodePoint(text.codePointAt(offset) ?? 0).length);

function wordBack(text: string, cursor: number) {
	let point = cursor;
	while (point > 0 && !isWord(text.slice(previous(text, point), point)))
		point = previous(text, point);
	while (point > 0 && isWord(text.slice(previous(text, point), point)))
		point = previous(text, point);
	return point;
}

function wordForward(text: string, cursor: number) {
	let point = cursor;
	while (point < text.length && !isWord(text.slice(point, next(text, point))))
		point = next(text, point);
	while (point < text.length && isWord(text.slice(point, next(text, point))))
		point = next(text, point);
	return point;
}

export function editLine(
	state: LineState,
	action: LineAction,
	shell: 'bash' | 'zsh' = 'bash'
): LineEdit {
	const { value } = state;
	const start = Math.max(0, Math.min(state.start, value.length));
	const end = Math.max(start, Math.min(state.end, value.length));
	const result: LineEdit = { ...state, start, end, lastKill: false };
	const move = (position: number) => ({ ...result, start: position, end: position });
	const kill = (from: number, to: number, backward: boolean): LineEdit => {
		const removed = value.slice(from, to);
		return {
			...result,
			value: value.slice(0, from) + value.slice(to),
			start: from,
			end: from,
			removed,
			lastKill: !!removed,
			killBuffer: !removed
				? state.killBuffer
				: state.lastKill
					? backward
						? removed + state.killBuffer
						: state.killBuffer + removed
					: removed
		};
	};
	switch (action) {
		case 'start':
			return move(0);
		case 'end':
			return move(value.length);
		case 'wordBackward':
			return move(wordBack(value, start));
		case 'wordForward':
			return move(wordForward(value, end));
		case 'killEnd':
			return kill(start, value.length, false);
		case 'killStart':
			return kill(0, shell === 'zsh' ? value.length : start, true);
		case 'killWord': {
			let point = start;
			while (point > 0 && /\s/.test(value[point - 1])) point--;
			while (point > 0 && !/\s/.test(value[point - 1])) point--;
			return kill(point, end, true);
		}
		case 'killNextWord':
			return kill(start, wordForward(value, end), false);
		case 'yank':
			return {
				...result,
				value: value.slice(0, start) + state.killBuffer + value.slice(end),
				start: start + state.killBuffer.length,
				end: start + state.killBuffer.length
			};
		case 'cancel':
			return { ...result, value: '', start: 0, end: 0, cancelled: true };
		case 'clearScreen':
			return { ...result, cleared: true };
	}
}

export interface HistoryPosition {
	index: number;
	draft: string;
}

export function navigateHistory(
	history: readonly string[],
	position: HistoryPosition,
	value: string,
	direction: 'older' | 'newer'
): HistoryPosition & { value: string } {
	if (!history.length) return { ...position, value };
	if (direction === 'older') {
		const draft = position.index < 0 ? value : position.draft;
		const index = Math.min(position.index + 1, history.length - 1);
		return { index, draft, value: history[history.length - 1 - index] };
	}
	if (position.index < 0) return { ...position, value };
	const index = position.index - 1;
	return {
		index,
		draft: position.draft,
		value: index < 0 ? position.draft : history[history.length - 1 - index]
	};
}

export interface CompletionContext {
	start: number;
	end: number;
	prefix: string;
	quote: "'" | '"' | null;
	closedQuote: boolean;
	isCommand: boolean;
}

const separator = (char: string) => /[\s|&;<>]/.test(char);

/** Find the word at the cursor, respecting quoted/escaped spaces and command separators. */
export function completionContext(value: string, cursor: number): CompletionContext {
	const point = Math.max(0, Math.min(cursor, value.length));
	let start = 0;
	let quote: "'" | '"' | null = null;
	let escaped = false;
	let isCommand = true;
	let inWord = false;
	for (let i = 0; i < point; i++) {
		const char = value[i];
		if (escaped) {
			escaped = false;
			inWord = true;
			continue;
		}
		if (char === '\\' && quote !== "'") {
			escaped = true;
			inWord = true;
			continue;
		}
		if (quote) {
			if (char === quote) quote = null;
			continue;
		}
		if (char === "'" || char === '"') {
			quote = char;
			inWord = true;
			continue;
		}
		if (separator(char)) {
			if (inWord) isCommand = false;
			if (/[|&;]/.test(char)) isCommand = true;
			start = i + 1;
			inWord = false;
		} else inWord = true;
	}
	let end = point;
	for (; end < value.length; end++) {
		const char = value[end];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (char === '\\' && quote !== "'") {
			escaped = true;
			continue;
		}
		if (quote) {
			if (char === quote) quote = null;
			continue;
		}
		if (char === "'" || char === '"') {
			quote = char;
			continue;
		}
		if (separator(char)) break;
	}
	const raw = value.slice(start, point);
	let prefix = '';
	quote = null;
	for (let i = 0; i < raw.length; i++) {
		const char = raw[i];
		if (char === '\\' && quote !== "'" && i + 1 < raw.length) {
			const following = raw[i + 1];
			if (!quote || /["$`\\\n]/.test(following)) {
				prefix += following;
				i++;
			} else prefix += char;
		} else if (quote) {
			if (char === quote) quote = null;
			else prefix += char;
		} else if (char === "'" || char === '"') quote = char;
		else prefix += char;
	}
	const first = value[start];
	const openingQuote = first === "'" || first === '"' ? first : null;
	return {
		start,
		end,
		prefix,
		quote: openingQuote,
		closedQuote: !!openingQuote && end > start + 1 && value[end - 1] === openingQuote,
		isCommand
	};
}

export function longestCommonPrefix(values: readonly string[]): string {
	let prefix = values[0] ?? '';
	for (const value of values.slice(1))
		while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
	return prefix;
}

export function applyCompletion(
	value: string,
	context: CompletionContext,
	candidate: string,
	unique: boolean
) {
	const done = unique && !candidate.endsWith('/');
	let encoded: string;
	if (context.quote === "'")
		encoded = "'" + candidate.replaceAll("'", "'\\''") + (done || context.closedQuote ? "'" : '');
	else if (context.quote === '"')
		encoded =
			'"' + candidate.replace(/["$`\\]/g, '\\$&') + (done || context.closedQuote ? '"' : '');
	else encoded = candidate.replace(/[^\p{L}\p{N}_./~-]/gu, '\\$&');
	const suffix = value.slice(context.end);
	if (done && !suffix) encoded += ' ';
	return {
		value: value.slice(0, context.start) + encoded + suffix,
		cursor: context.start + encoded.length
	};
}
