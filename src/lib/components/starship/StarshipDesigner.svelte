<script lang="ts">
	import { Copy, Check, Download, Rocket, Palette as PaletteIcon } from 'lucide-svelte';
	import PromptPreview from './PromptPreview.svelte';
	import { PRESETS, getPreset } from '$lib/starship/presets';
	import { PALETTES } from '$lib/starship/palettes';
	import { toToml, INIT_LINES } from '$lib/starship/generate';
	import {
		MODULE_IDS,
		type ModuleId,
		type PromptDesign,
		type Separator
	} from '$lib/starship/types';
	import CodeBlock from '$lib/components/ui/CodeBlock.svelte';

	// Start on Tokyo Night. `structuredClone` keeps presets immutable as the
	// learner edits their working copy.
	let design = $state<PromptDesign>(clone(getPreset('tokyonight')));
	let activePreset = $state('tokyonight');
	let copied = $state(false);
	let shell = $state<'bash' | 'zsh' | 'fish'>('zsh');

	function clone(p: PromptDesign): PromptDesign {
		return {
			palette: p.palette,
			separator: p.separator,
			symbols: p.symbols,
			twoLine: p.twoLine,
			charSymbol: p.charSymbol,
			modules: [...p.modules]
		};
	}

	function pickPreset(id: string) {
		activePreset = id;
		design = clone(getPreset(id));
	}

	// UI groups modules into friendly toggles; git branch + status travel together.
	const UI_MODULES: { ids: ModuleId[]; label: string }[] = [
		{ ids: ['directory'], label: 'Directory' },
		{ ids: ['git_branch', 'git_status'], label: 'Git branch + status' },
		{ ids: ['nodejs'], label: 'Node.js' },
		{ ids: ['python'], label: 'Python' },
		{ ids: ['rust'], label: 'Rust' },
		{ ids: ['golang'], label: 'Go' },
		{ ids: ['package'], label: 'Package version' },
		{ ids: ['cmd_duration'], label: 'Command time' },
		{ ids: ['time'], label: 'Clock' },
		{ ids: ['username'], label: 'Username' },
		{ ids: ['hostname'], label: 'Hostname' },
		{ ids: ['battery'], label: 'Battery' }
	];

	function isOn(ids: ModuleId[]): boolean {
		return ids.every((id) => design.modules.includes(id));
	}

	function toggleModule(ids: ModuleId[]) {
		const on = isOn(ids);
		const without = design.modules.filter((m) => !ids.includes(m));
		const next = on ? without : [...without, ...ids];
		// Rebuild in canonical order so the prompt stays sensibly arranged.
		design.modules = MODULE_IDS.filter((id) => next.includes(id));
		activePreset = '';
	}

	const SEPARATORS: { id: Separator; label: string }[] = [
		{ id: 'powerline', label: 'Powerline' },
		{ id: 'round', label: 'Rounded' },
		{ id: 'plain', label: 'Plain' },
		{ id: 'brackets', label: 'Brackets' }
	];

	const CHAR_SYMBOLS = ['❯', '➜', '$', 'λ', '▶', '»'];

	function set<K extends keyof PromptDesign>(key: K, value: PromptDesign[K]) {
		design[key] = value;
		activePreset = '';
	}

	let toml = $derived(toToml(design));

	async function copyToml() {
		try {
			await navigator.clipboard.writeText(toml);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			/* clipboard unavailable */
		}
	}

	function downloadToml() {
		const blob = new Blob([toml], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'starship.toml';
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}
</script>

<div class="sd">
	<!-- Live preview -->
	<div class="sd-preview-wrap">
		<PromptPreview {design} />
		<p class="sd-note">
			A live approximation. On your machine the powerline arrows and icons need a
			<a href="https://www.nerdfonts.com/" target="_blank" rel="noopener noreferrer">Nerd Font</a> — the
			plain and bracket styles work in any terminal.
		</p>
	</div>

	<!-- Preset gallery -->
	<div class="sd-block">
		<h4 class="sd-h">
			<Rocket size={15} style="color: var(--color-primary);" /> Start from a design
		</h4>
		<div class="sd-presets">
			{#each PRESETS as preset (preset.id)}
				<button
					type="button"
					class="sd-preset"
					class:sd-preset-on={activePreset === preset.id}
					onclick={() => pickPreset(preset.id)}
				>
					<PromptPreview design={preset} mini />
					<span class="sd-preset-name">{preset.name}</span>
					<span class="sd-preset-desc">{preset.description}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Customizer -->
	<div class="sd-block">
		<h4 class="sd-h">
			<PaletteIcon size={15} style="color: var(--color-primary);" /> Make it yours
		</h4>

		<div class="sd-controls">
			<div class="sd-control">
				<span class="sd-label">Palette</span>
				<div class="sd-swatches">
					{#each PALETTES as p (p.id)}
						<button
							type="button"
							class="sd-swatch"
							class:sd-swatch-on={design.palette === p.id}
							onclick={() => set('palette', p.id)}
							title={p.name}
							aria-label={p.name}
							style="background: {p.bg};"
						>
							{#each p.ring.slice(0, 5) as c, i (i)}
								<span style="background: {c};"></span>
							{/each}
						</button>
					{/each}
				</div>
			</div>

			<div class="sd-control">
				<span class="sd-label">Style</span>
				<div class="sd-seg-toggle">
					{#each SEPARATORS as s (s.id)}
						<button
							type="button"
							class:sd-on={design.separator === s.id}
							onclick={() => set('separator', s.id)}>{s.label}</button
						>
					{/each}
				</div>
			</div>

			<div class="sd-control">
				<span class="sd-label">Symbols</span>
				<div class="sd-seg-toggle">
					<button class:sd-on={design.symbols === 'nerd'} onclick={() => set('symbols', 'nerd')}
						>Nerd Font</button
					>
					<button class:sd-on={design.symbols === 'plain'} onclick={() => set('symbols', 'plain')}
						>Plain text</button
					>
				</div>
			</div>

			<div class="sd-control">
				<span class="sd-label">Layout</span>
				<div class="sd-seg-toggle">
					<button class:sd-on={!design.twoLine} onclick={() => set('twoLine', false)}
						>One line</button
					>
					<button class:sd-on={design.twoLine} onclick={() => set('twoLine', true)}
						>Two lines</button
					>
				</div>
			</div>

			<div class="sd-control">
				<span class="sd-label">Prompt character</span>
				<div class="sd-seg-toggle sd-chars">
					{#each CHAR_SYMBOLS as c (c)}
						<button class:sd-on={design.charSymbol === c} onclick={() => set('charSymbol', c)}
							>{c}</button
						>
					{/each}
				</div>
			</div>

			<div class="sd-control sd-control-wide">
				<span class="sd-label">Show</span>
				<div class="sd-modules">
					{#each UI_MODULES as m (m.label)}
						<button
							type="button"
							class="sd-mod"
							class:sd-mod-on={isOn(m.ids)}
							onclick={() => toggleModule(m.ids)}
						>
							{isOn(m.ids) ? '✓' : '+'}
							{m.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Export -->
	<div class="sd-block">
		<div class="sd-export-head">
			<h4 class="sd-h">
				<Download size={15} style="color: var(--color-primary);" /> Take it to your terminal
			</h4>
			<div class="sd-actions">
				<button type="button" class="sd-btn" onclick={copyToml}>
					{#if copied}<Check size={13} /> Copied{:else}<Copy size={13} /> Copy{/if}
				</button>
				<button type="button" class="sd-btn sd-btn-primary" onclick={downloadToml}>
					<Download size={13} /> Download starship.toml
				</button>
			</div>
		</div>

		<CodeBlock code={toml} title="starship.toml" lang="toml" />

		<div class="sd-steps">
			<p class="sd-steps-title">Three steps to wear it:</p>
			<ol>
				<li>
					<strong>Install Starship.</strong> The official one-liner is
					<code>curl -sS https://starship.rs/install.sh | sh</code> — but you learned in Part 6 to
					be wary of <code>curl | sh</code>, so <code>brew install starship</code> (macOS) or
					<code>winget install starship</code> (Windows) are just as good.
				</li>
				<li>
					<strong>Save the config.</strong> Put the downloaded file at
					<code>~/.config/starship.toml</code> (run
					<code>mkdir -p ~/.config</code> first if that folder doesn't exist).
				</li>
				<li>
					<strong>Turn it on in your shell.</strong> Add one line to your config and reload:
					<div class="sd-shell-tabs">
						{#each ['zsh', 'bash', 'fish'] as sh (sh)}
							<button class:sd-on={shell === sh} onclick={() => (shell = sh as typeof shell)}
								>{sh}</button
							>
						{/each}
					</div>
					<pre class="sd-shell-cmd">echo '{INIT_LINES[shell].line}' >> {INIT_LINES[shell].file}
source {INIT_LINES[shell].file}</pre>
				</li>
			</ol>
			<p class="sd-steps-foot">
				Using a powerline or Nerd Font design? Install a
				<a href="https://www.nerdfonts.com/" target="_blank" rel="noopener noreferrer">Nerd Font</a>
				and select it in your terminal's settings, or the arrows and icons show as boxes. Every design
				here is just a text file — open it, read it, tweak it. It's your prompt now.
			</p>
		</div>
	</div>
</div>

<style>
	.sd {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.sd-preview-wrap {
		border-radius: 12px;
		padding: 0.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
	}
	.sd-note {
		font-size: 11.5px;
		color: var(--color-text-muted);
		padding: 0.4rem 0.5rem 0.2rem;
		margin: 0;
	}
	.sd-note a,
	.sd-steps a {
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.sd-block {
		border-radius: 12px;
		border: 1px solid var(--color-border);
		background: var(--color-bg-secondary);
		padding: 1rem 1.1rem;
	}
	.sd-h {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 14px;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.9rem;
		font-family: var(--font-heading);
	}
	.sd-presets {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
		gap: 0.7rem;
	}
	.sd-preset {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		text-align: left;
		padding: 0.5rem;
		border-radius: 9px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			transform 0.1s ease;
	}
	.sd-preset:hover {
		border-color: color-mix(in srgb, var(--color-primary) 55%, transparent);
	}
	.sd-preset-on {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 1px var(--color-primary);
	}
	.sd-preset-name {
		font-size: 12.5px;
		font-weight: 700;
		color: var(--color-text);
	}
	.sd-preset-desc {
		font-size: 11px;
		color: var(--color-text-muted);
		line-height: 1.35;
	}
	.sd-controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem 1.4rem;
	}
	.sd-control-wide {
		grid-column: 1 / -1;
	}
	.sd-label {
		display: block;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: 0.45rem;
	}
	.sd-swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.sd-swatch {
		display: flex;
		gap: 1px;
		padding: 3px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		cursor: pointer;
	}
	.sd-swatch span {
		width: 9px;
		height: 16px;
		border-radius: 1px;
	}
	.sd-swatch-on {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 1px var(--color-primary);
	}
	.sd-seg-toggle {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0;
		border-radius: 7px;
		overflow: hidden;
		border: 1px solid var(--color-border);
	}
	.sd-seg-toggle button {
		padding: 0.35rem 0.7rem;
		font-size: 12px;
		font-weight: 600;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
		border-right: 1px solid var(--color-border);
	}
	.sd-seg-toggle button:last-child {
		border-right: none;
	}
	.sd-seg-toggle button.sd-on {
		background: var(--color-primary);
		color: white;
	}
	.sd-chars button {
		font-family: var(--font-mono);
		min-width: 2.2ch;
	}
	.sd-modules {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.sd-mod {
		padding: 0.3rem 0.65rem;
		font-size: 12px;
		font-weight: 600;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 0.12s ease;
	}
	.sd-mod-on {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
		color: var(--color-primary);
	}
	.sd-export-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		margin-bottom: 0.4rem;
	}
	.sd-export-head .sd-h {
		margin: 0;
	}
	.sd-actions {
		display: flex;
		gap: 0.5rem;
	}
	.sd-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.75rem;
		font-size: 12px;
		font-weight: 600;
		border-radius: 7px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
	}
	.sd-btn:hover {
		border-color: var(--color-primary);
	}
	.sd-btn-primary {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}
	.sd-steps {
		margin-top: 0.9rem;
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.55;
	}
	.sd-steps-title {
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.5rem;
	}
	.sd-steps ol {
		margin: 0;
		padding-left: 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.sd-steps li {
		list-style: decimal;
	}
	.sd-steps code {
		font-family: var(--font-mono);
		font-size: 0.85em;
		background: var(--color-code-bg);
		border-radius: 4px;
		padding: 0.05em 0.35em;
	}
	.sd-shell-tabs {
		display: inline-flex;
		margin: 0.5rem 0 0.35rem;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid var(--color-border);
	}
	.sd-shell-tabs button {
		padding: 0.25rem 0.7rem;
		font-size: 11.5px;
		font-family: var(--font-mono);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
		border-right: 1px solid var(--color-border);
	}
	.sd-shell-tabs button:last-child {
		border-right: none;
	}
	.sd-shell-tabs button.sd-on {
		background: var(--color-primary);
		color: white;
	}
	.sd-shell-cmd {
		font-family: var(--font-mono);
		font-size: 12px;
		background: var(--color-terminal-bg);
		color: var(--color-terminal-command);
		border-radius: 7px;
		padding: 0.6rem 0.75rem;
		overflow-x: auto;
		margin: 0;
		white-space: pre;
	}
	.sd-steps-foot {
		margin-top: 0.8rem;
		font-size: 12px;
		color: var(--color-text-muted);
	}
</style>
