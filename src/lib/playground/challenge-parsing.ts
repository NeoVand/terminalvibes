/**
 * Two pure helpers shared by challenges.ts and the fourteen per-part challenge
 * files.
 *
 * They live here rather than in challenges.ts because the part files import
 * them at RUNTIME while challenges.ts imports the part files — a cycle, which
 * ES modules resolve by leaving the later binding in its temporal dead zone.
 * It surfaced as `ReferenceError: Cannot access 'challengePart6' before
 * initialization` and a blank page. A leaf module both sides can depend on
 * breaks the cycle for good; nothing here may import from challenges.ts.
 */

/**
 * Split a command line into simple commands on unquoted | && || ; — the
 * definition of an "element". Quotes are respected, so `sed 's/a|b/c/'` is one
 * segment and `2>&1` never reads as `&&`. A trailing `#` comment is dropped.
 */
export function splitSegments(line: string): string[] {
	const out: string[] = [];
	let cur = '';
	let quote: '' | "'" | '"' = '';
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (quote) {
			cur += ch;
			if (ch === quote) quote = '';
			continue;
		}
		if (ch === "'" || ch === '"') {
			quote = ch;
			cur += ch;
			continue;
		}
		if (ch === '#' && (cur === '' || /\s$/.test(cur))) break;
		if (ch === '&' && line[i + 1] === '&') {
			out.push(cur);
			cur = '';
			i++;
			continue;
		}
		if (ch === '|' && line[i + 1] === '|') {
			out.push(cur);
			cur = '';
			i++;
			continue;
		}
		if (ch === '|' || ch === ';') {
			out.push(cur);
			cur = '';
			continue;
		}
		cur += ch;
	}
	out.push(cur);
	return out.map((s) => s.trim()).filter(Boolean);
}

/**
 * The command word of a segment: the first token, past any VAR=value prefixes,
 * unquoted. A path invocation (`./setup.sh`, `~/tools/deploy`) returns itself
 * and is therefore never free — running a script is work.
 */
export function commandWordOf(segment: string): string {
	const tokens = segment.split(/\s+/).filter(Boolean);
	let i = 0;
	while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++;
	return (tokens[i] ?? '').replace(/^['"]/, '').replace(/['"]$/, '');
}
