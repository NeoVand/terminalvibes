import { describe, expect, it } from 'vitest';
import {
	buildAgentTools,
	createSearchCourseTool,
	formatCourseHits,
	TUTOR_SYSTEM_PROMPT
} from './tools';

describe('tutor system prompt', () => {
	it('carries the persona, the bash-only stance, and the citation contract', () => {
		expect(TUTOR_SYSTEM_PROMPT).toContain('TerminalVibes tutor');
		expect(TUTOR_SYSTEM_PROMPT).toContain('bash');
		expect(TUTOR_SYSTEM_PROMPT).toContain('search_course');
		expect(TUTOR_SYSTEM_PROMPT).toContain('[[section-5-2]]');
	});
});

describe('search_course tool', () => {
	it('returns retrieved chunks tagged with citation tokens', async () => {
		const tool = createSearchCourseTool();
		const result = (await tool.invoke({ query: 'chmod 755 permissions' })) as string;
		expect(result).toContain('[[section-5-2]]');
		expect(result.length).toBeGreaterThan(100);
	});

	it('says so when nothing matches', async () => {
		const tool = createSearchCourseTool();
		const result = (await tool.invoke({ query: 'xyzzyqwlkj blorptastic' })) as string;
		expect(result).toMatch(/No course sections matched/);
	});

	it('formatCourseHits includes title and snippet per hit', () => {
		const text = formatCourseHits('pipes sort uniq');
		expect(text).toMatch(/\[\[section-4-\d\]\]/);
		expect(text).toContain('relevance');
	});
});

describe('tool registry', () => {
	it('phase 2 registers exactly the search tool (bash seam reserved)', () => {
		const tools = buildAgentTools();
		expect(tools.map((t) => (t as { name: string }).name)).toEqual(['search_course']);
	});
});
