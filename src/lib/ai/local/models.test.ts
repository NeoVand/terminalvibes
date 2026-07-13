import { describe, expect, it } from 'vitest';
import {
	attemptCascade,
	canRunModel,
	DEFAULT_MODEL_ID,
	getModelSpec,
	LOCAL_MODELS,
	QUALITY_MODEL_ID,
	selectBackend
} from './models';

const small = getModelSpec(DEFAULT_MODEL_ID)!;
const big = getModelSpec(QUALITY_MODEL_ID)!;

describe('model catalog', () => {
	it('ships the two expected models with honest sizes', () => {
		expect(LOCAL_MODELS).toHaveLength(2);
		expect(small.sizeMb).toBeLessThan(600);
		expect(small.requiresWebGpu).toBe(false);
		expect(big.requiresWebGpu).toBe(true);
		expect(big.recommendedRamGb).toBe(8);
	});

	it('gates the 2B behind WebGPU', () => {
		expect(canRunModel(big, { webgpu: false, ramGb: 8 }).ok).toBe(false);
		expect(canRunModel(big, { webgpu: true, ramGb: 8 }).ok).toBe(true);
	});

	it('gates by RAM when the browser reports it', () => {
		expect(canRunModel(big, { webgpu: true, ramGb: 2 }).ok).toBe(false);
		expect(canRunModel(small, { webgpu: false, ramGb: 2 }).ok).toBe(true);
		// Unknown RAM → benefit of the doubt (the warm-up probe still decides).
		expect(canRunModel(big, { webgpu: true, ramGb: null }).ok).toBe(true);
	});

	it('builds the device attempt cascade per model', () => {
		expect(attemptCascade(small, { webgpu: true, ramGb: 8 })).toEqual(['webgpu', 'wasm']);
		expect(attemptCascade(small, { webgpu: false, ramGb: 8 })).toEqual(['wasm']);
		expect(attemptCascade(big, { webgpu: true, ramGb: 8 })).toEqual(['webgpu']);
		expect(attemptCascade(big, { webgpu: false, ramGb: 8 })).toEqual([]);
	});
});

describe('backend selection ladder (webgpu → wasm → mock)', () => {
	const caps = { webgpu: true, ramGb: 8 };

	it('prefers webgpu when everything lines up', () => {
		expect(selectBackend(small, caps, true)).toBe('local-webgpu');
	});

	it('falls to wasm when the webgpu probe failed', () => {
		expect(selectBackend(small, caps, true, { webgpu: false })).toBe('local-wasm');
	});

	it('falls to mock when every device probe failed', () => {
		expect(selectBackend(small, caps, true, { webgpu: false, wasm: false })).toBe('mock');
	});

	it('never leaves mock without an explicit download', () => {
		expect(selectBackend(small, caps, false)).toBe('mock');
	});

	it('is mock without a model or without capability', () => {
		expect(selectBackend(null, caps, true)).toBe('mock');
		expect(selectBackend(big, { webgpu: false, ramGb: 8 }, true)).toBe('mock');
	});

	it('2B has no wasm rung: failed webgpu probe → mock', () => {
		expect(selectBackend(big, caps, true, { webgpu: false })).toBe('mock');
	});

	it('wasm-only browsers run the 0.8B on wasm', () => {
		expect(selectBackend(small, { webgpu: false, ramGb: 8 }, true)).toBe('local-wasm');
	});
});
