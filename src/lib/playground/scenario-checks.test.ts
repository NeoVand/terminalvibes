import { beforeEach, describe, expect, it } from 'vitest';
import { ShellEngine } from './shell-engine';
import { runShellCommand } from './shell-commands';
import { getScenario, loadScenarioSeed, lessonScenarioIds, playgroundScenarios } from './scenarios';

let engine: ShellEngine;

beforeEach(() => {
	engine = new ShellEngine();
});

/**
 * CLICK-SOLVABILITY INVARIANT: every lesson scenario must be solvable by
 * clicking its suggestedCommands chips top to bottom — the chips fill the
 * terminal input verbatim, so the complete solution has to live inside them.
 * Each test below (1) proves the check is false on the untouched seed, then
 * (2) replays the chips in order via the real interpreter and expects the
 * check to pass.
 *
 * Some chips fail ON PURPOSE (teaching moments: ./setup.sh before chmod +x,
 * `deploy` off PATH, `false` demonstrating a nonzero exit). Those are listed
 * here and tolerated exactly like a learner clicking through them; any other
 * chip erroring is a broken scenario.
 */
const EXPECTED_CHIP_FAILURES: Record<string, string[]> = {
	'fix-permissions': ['./setup.sh'],
	'path-repair': ['deploy', 'which deploy'],
	'exit-codes': ['false', 'false && ./deploy.sh']
};

describe('scenario checks — click-only solvability', () => {
	for (const id of lessonScenarioIds) {
		it(`${id}: check is false on the seed, true after clicking every chip in order`, async () => {
			const scenario = getScenario(id);
			expect(scenario.id).toBe(id);
			expect(scenario.check, `${id} must define a check`).toBeDefined();

			await loadScenarioSeed(engine, scenario);
			expect(await scenario.check!(engine)).toBe(false);

			const tolerated = new Set(EXPECTED_CHIP_FAILURES[id] ?? []);
			for (const command of scenario.suggestedCommands) {
				const result = await runShellCommand(engine, command);
				if (result.error && !tolerated.has(command)) {
					throw new Error(`chip failed: ${command}\n${result.output}`);
				}
			}
			expect(await scenario.check!(engine)).toBe(true);
		});
	}

	it('audit-the-agent: running the destructive command fails the check for good', async () => {
		const scenario = getScenario('audit-the-agent');
		await loadScenarioSeed(engine, scenario);
		// The two safe commands first — the check would pass at this point...
		await runShellCommand(engine, 'mkdir -p ~/backups');
		await runShellCommand(engine, 'cp ~/notes/ideas.md ~/backups/ideas.md');
		expect(await scenario.check!(engine)).toBe(true);
		// ...but obeying the agent's third command sinks it permanently.
		await runShellCommand(engine, 'rm -rf ~/*');
		expect(await scenario.check!(engine)).toBe(false);
	});

	it('exit-codes: false && ./deploy.sh must NOT deploy', async () => {
		const scenario = getScenario('exit-codes');
		await loadScenarioSeed(engine, scenario);
		await runShellCommand(engine, 'false && ./deploy.sh');
		expect(engine.exists('~/projects/site/deployed.txt')).toBe(false);
		expect(await scenario.check!(engine)).toBe(false);
	});

	it('every scenario is a lesson scenario (no strays, none missing)', () => {
		expect(playgroundScenarios.map((s) => s.id)).toEqual([...lessonScenarioIds]);
	});

	it('getScenario falls back to the first scenario for unknown ids', () => {
		expect(getScenario('does-not-exist').id).toBe(playgroundScenarios[0].id);
	});
});
