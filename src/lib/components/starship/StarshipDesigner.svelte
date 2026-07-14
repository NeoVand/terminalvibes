<script lang="ts">
	import { onMount } from 'svelte';
	import { Copy, Check, Download, ChevronDown, Terminal, Link2, Palette, Zap } from 'lucide-svelte';
	import PromptPreview from './PromptPreview.svelte';
	import { PRESETS, getPreset } from '$lib/starship/presets';
	import { PALETTES, rolesOf, resolvePalette } from '$lib/starship/palettes';
	import { toToml, toOneLiner, INIT_LINES } from '$lib/starship/generate';
	import { encodeDesign, decodeDesign } from '$lib/starship/share';
	import {
		MODULE_IDS,
		type CustomColors,
		type ModuleId,
		type PromptDesign,
		type Separator
	} from '$lib/starship/types';
	import CodeBlock from '$lib/components/ui/CodeBlock.svelte';

	let design = $state<PromptDesign>(clone(getPreset('tokyonight')));
	let activePreset = $state('tokyonight');
	let dropdownOpen = $state(false);
	let copied = $state(false);
	let linkCopied = $state(false);
	let shell = $state<'zsh' | 'bash' | 'fish'>('zsh');

	// A shared "?sp=…" link restores an exact design on load.
	onMount(() => {
		const sp = new URLSearchParams(window.location.search).get('sp');
		if (!sp) return;
		const restored = decodeDesign(sp);
		if (restored) {
			design = restored;
			activePreset = '';
		}
	});

	function clone(p: PromptDesign): PromptDesign {
		return {
			palette: p.palette,
			separator: p.separator,
			symbols: p.symbols,
			twoLine: p.twoLine,
			charSymbol: p.charSymbol,
			modules: [...p.modules],
			addNewline: p.addNewline ?? false,
			truncation: p.truncation ?? 3,
			...(p.customColors ? { customColors: { ...p.customColors } } : {})
		};
	}

	function pickPreset(id: string) {
		activePreset = id;
		design = clone(getPreset(id));
		dropdownOpen = false;
	}

	let currentName = $derived(activePreset ? getPreset(activePreset).name : 'Custom design');

	// ── Custom palette ──────────────────────────────────────────────
	const COLOR_ROLES: { key: keyof CustomColors; label: string }[] = [
		{ key: 'dir', label: 'Directory' },
		{ key: 'git', label: 'Git' },
		{ key: 'runtime', label: 'Runtime' },
		{ key: 'user', label: 'User' },
		{ key: 'meta', label: 'Accent' },
		{ key: 'bg', label: 'Background' }
	];

	function pickPalette(id: string) {
		if (id === 'custom') {
			// Seed the editor from whatever palette is showing now, so "Custom"
			// starts from a coherent theme instead of a blank slate.
			if (!design.customColors) design.customColors = rolesOf(resolvePalette(design));
		}
		design.palette = id;
		activePreset = '';
	}

	function setColor(key: keyof CustomColors, value: string) {
		if (!design.customColors) design.customColors = rolesOf(resolvePalette(design));
		design.customColors[key] = value;
		activePreset = '';
	}

	const UI_MODULES: { ids: ModuleId[]; label: string }[] = [
		{ ids: ['directory'], label: 'Directory' },
		{ ids: ['git_branch', 'git_status'], label: 'Git branch + status' },
		{ ids: ['nodejs'], label: 'Node.js' },
		{ ids: ['python'], label: 'Python' },
		{ ids: ['rust'], label: 'Rust' },
		{ ids: ['golang'], label: 'Go' },
		{ ids: ['java'], label: 'Java' },
		{ ids: ['ruby'], label: 'Ruby' },
		{ ids: ['php'], label: 'PHP' },
		{ ids: ['docker_context'], label: 'Docker' },
		{ ids: ['kubernetes'], label: 'Kubernetes' },
		{ ids: ['aws'], label: 'AWS' },
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
		design.modules = MODULE_IDS.filter((id) => next.includes(id));
		activePreset = '';
	}

	const SEPARATORS: { id: Separator; label: string }[] = [
		{ id: 'powerline', label: 'Powerline' },
		{ id: 'round', label: 'Rounded' },
		{ id: 'plain', label: 'Plain' },
		{ id: 'brackets', label: 'Brackets' }
	];

	const CHAR_SYMBOLS = ['❯', '❯❯', '➜', '→', '$', '%', 'λ', '▶', '»', '✦', '○', '⚡'];
	const DEPTHS: { v: number; label: string }[] = [
		{ v: 0, label: 'Full' },
		{ v: 3, label: '3 deep' },
		{ v: 1, label: 'Name only' }
	];

	function set<K extends keyof PromptDesign>(key: K, value: PromptDesign[K]) {
		design[key] = value;
		activePreset = '';
	}

	let toml = $derived(toToml(design));
	let oneLiner = $derived(toOneLiner(toml, shell));

	async function copyToml() {
		try {
			await navigator.clipboard.writeText(toml);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			/* clipboard unavailable */
		}
	}

	async function copyLink() {
		const enc = encodeDesign(design);
		const { origin, pathname } = window.location;
		const url = `${origin}${pathname}?sp=${enc}#prompt-designer`;
		try {
			await navigator.clipboard.writeText(url);
			linkCopied = true;
			setTimeout(() => (linkCopied = false), 1800);
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
	<!-- ── Preset dropdown (graphical) ─────────────────────────────── -->
	<div class="sd-row">
		<span class="sd-row-label">Preset</span>
		<div class="sd-dd">
			<button
				type="button"
				class="sd-dd-trigger"
				class:sd-open={dropdownOpen}
				onclick={() => (dropdownOpen = !dropdownOpen)}
				aria-haspopup="listbox"
				aria-expanded={dropdownOpen}
			>
				<span class="sd-dd-thumb"><PromptPreview {design} mini /></span>
				<span class="sd-dd-name">{currentName}</span>
				<ChevronDown size={16} class="sd-dd-caret" />
			</button>
			{#if dropdownOpen}
				<button
					class="sd-dd-scrim"
					aria-label="Close preset list"
					onclick={() => (dropdownOpen = false)}
				></button>
				<div class="sd-dd-menu" role="listbox">
					{#each PRESETS as p (p.id)}
						<button
							type="button"
							class="sd-dd-item"
							class:sd-dd-item-on={activePreset === p.id}
							role="option"
							aria-selected={activePreset === p.id}
							onclick={() => pickPreset(p.id)}
						>
							<span class="sd-dd-item-thumb"><PromptPreview design={p} mini /></span>
							<span class="sd-dd-item-text">
								<span class="sd-dd-item-name">{p.name}</span>
								<span class="sd-dd-item-desc">{p.description}</span>
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- ── Editor: controls + a sticky live preview below them ─────── -->
	<div class="sd-editor">
		<div class="sd-panel">
			<div class="sd-grid">
				<div class="sd-field sd-field-full">
					<span class="sd-label">Palette</span>
					<div class="sd-swatches">
						{#each PALETTES as p (p.id)}
							<button
								type="button"
								class="sd-swatch"
								class:sd-swatch-on={design.palette === p.id}
								onclick={() => pickPalette(p.id)}
								title={p.name}
								aria-label={p.name}
								style="background: {p.bg};"
							>
								{#each p.ring.slice(0, 5) as c, i (i)}
									<span style="background: {c};"></span>
								{/each}
							</button>
						{/each}
						<button
							type="button"
							class="sd-swatch sd-swatch-custom"
							class:sd-swatch-on={design.palette === 'custom'}
							onclick={() => pickPalette('custom')}
							title="Design your own colors"
							aria-label="Custom palette"
						>
							<Palette size={15} />
						</button>
					</div>
				</div>

				{#if design.palette === 'custom' && design.customColors}
					<div class="sd-field sd-field-full sd-custom">
						<span class="sd-label">Your colors</span>
						<div class="sd-colors">
							{#each COLOR_ROLES as role (role.key)}
								<label class="sd-color">
									<input
										type="color"
										value={design.customColors[role.key]}
										oninput={(e) => setColor(role.key, e.currentTarget.value)}
									/>
									<span class="sd-color-label">{role.label}</span>
									<span class="sd-color-hex">{design.customColors[role.key]}</span>
								</label>
							{/each}
						</div>
						<p class="sd-custom-hint">
							Five roles color the whole prompt — pick each one and watch the preview below.
							Powerline styles use them as segment backgrounds; plain and bracket styles as text
							colors.
						</p>
					</div>
				{/if}

				<div class="sd-field">
					<span class="sd-label">Segment style</span>
					<div class="sd-toggle">
						{#each SEPARATORS as s (s.id)}
							<button class:sd-on={design.separator === s.id} onclick={() => set('separator', s.id)}
								>{s.label}</button
							>
						{/each}
					</div>
				</div>

				<div class="sd-field">
					<span class="sd-label">Icons</span>
					<div class="sd-toggle">
						<button class:sd-on={design.symbols === 'nerd'} onclick={() => set('symbols', 'nerd')}
							>Nerd Font</button
						>
						<button class:sd-on={design.symbols === 'plain'} onclick={() => set('symbols', 'plain')}
							>Plain text</button
						>
					</div>
				</div>

				<div class="sd-field">
					<span class="sd-label">Layout</span>
					<div class="sd-toggle">
						<button class:sd-on={!design.twoLine} onclick={() => set('twoLine', false)}
							>One line</button
						>
						<button class:sd-on={design.twoLine} onclick={() => set('twoLine', true)}
							>Two lines</button
						>
					</div>
				</div>

				<div class="sd-field">
					<span class="sd-label">Blank line above</span>
					<div class="sd-toggle">
						<button class:sd-on={!design.addNewline} onclick={() => set('addNewline', false)}
							>Off</button
						>
						<button class:sd-on={design.addNewline} onclick={() => set('addNewline', true)}
							>On</button
						>
					</div>
				</div>

				<div class="sd-field">
					<span class="sd-label">Path depth</span>
					<div class="sd-toggle">
						{#each DEPTHS as d (d.v)}
							<button
								class:sd-on={(design.truncation ?? 3) === d.v}
								onclick={() => set('truncation', d.v)}>{d.label}</button
							>
						{/each}
					</div>
				</div>

				<div class="sd-field sd-field-full">
					<span class="sd-label">Prompt character</span>
					<div class="sd-chars">
						{#each CHAR_SYMBOLS as c (c)}
							<button
								class="sd-char"
								class:sd-on={design.charSymbol === c}
								onclick={() => set('charSymbol', c)}>{c}</button
							>
						{/each}
					</div>
				</div>

				<div class="sd-field sd-field-full">
					<span class="sd-label">Modules to show</span>
					<div class="sd-modules">
						{#each UI_MODULES as m (m.label)}
							<button
								type="button"
								class="sd-mod"
								class:sd-mod-on={isOn(m.ids)}
								onclick={() => toggleModule(m.ids)}
							>
								<span class="sd-mod-mark">{isOn(m.ids) ? '✓' : '+'}</span>
								{m.label}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Live preview: a terminal window, pinned to the bottom of the
		     viewport while you scroll the controls above, so you always see the
		     effect of your changes. -->
		<div class="sd-stage">
			<div class="sd-window">
				<div class="sd-titlebar">
					<span class="sd-dots"><i></i><i></i><i></i></span>
					<span class="sd-title"><Terminal size={11} /> {shell} — starship</span>
				</div>
				<PromptPreview {design} />
			</div>
		</div>
	</div>

	<!-- ── Export ──────────────────────────────────────────────────── -->
	<div class="sd-export">
		<div class="sd-export-head">
			<span class="sd-export-title"><Download size={15} /> Take it to your terminal</span>
			<div class="sd-actions">
				<button type="button" class="sd-btn" onclick={copyLink}>
					{#if linkCopied}<Check size={13} /> Link copied{:else}<Link2 size={13} /> Copy link{/if}
				</button>
				<button type="button" class="sd-btn" onclick={copyToml}>
					{#if copied}<Check size={13} /> Copied{:else}<Copy size={13} /> Copy{/if}
				</button>
				<button type="button" class="sd-btn sd-btn-primary" onclick={downloadToml}>
					<Download size={13} /> Download starship.toml
				</button>
			</div>
		</div>

		<!-- Fast path: one self-contained command per shell -->
		<div class="sd-oneliner">
			<div class="sd-oneliner-head">
				<span class="sd-oneliner-title"><Zap size={14} /> One command, done</span>
				<div class="sd-shell-tabs">
					{#each ['zsh', 'bash', 'fish'] as sh (sh)}
						<button class:sd-on={shell === sh} onclick={() => (shell = sh as typeof shell)}
							>{sh}</button
						>
					{/each}
				</div>
			</div>
			<CodeBlock
				code={oneLiner}
				title="paste into {shell} — assumes Starship is installed"
				lang="bash"
			/>
			<p class="sd-oneliner-note">
				This writes your config to <code>~/.config/starship.toml</code>, turns Starship on, and
				reloads your shell — the new prompt appears immediately. It's deliberately <em>not</em> a
				<code>curl … | sh</code>: the whole config is right there in the command, so you can read
				every line before you run it — exactly the habit from Part 6.
			</p>
		</div>

		<CodeBlock code={toml} title="starship.toml" lang="toml" />

		<div class="sd-steps">
			<p class="sd-steps-title">Prefer to do it by hand? Three steps:</p>
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
				and select it in your terminal's settings, or the arrows and icons show as boxes. The preview
				above draws them with CSS so you can design without one. Every design here is just a text file
				— open it, read it, tweak it. It's your prompt now.
			</p>
			<p class="sd-steps-foot">
				<strong style="color: var(--color-text-secondary);">Copy link</strong> saves your whole design
				— palette, colors and all — into a shareable URL. Bookmark it to come back to this exact prompt,
				or send it to a friend and they'll open the designer pre-loaded with it.
			</p>
		</div>
	</div>
</div>

<style>
	.sd {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		--sd-border: color-mix(in srgb, var(--color-border) 90%, transparent);
	}

	/* ── Preset dropdown ── */
	.sd-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.sd-row-label {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}
	.sd-dd {
		position: relative;
		flex: 1;
		min-width: 0;
	}
	.sd-dd-trigger {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.5rem 0.65rem;
		border-radius: 10px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}
	.sd-dd-trigger:hover,
	.sd-dd-trigger.sd-open {
		border-color: color-mix(in srgb, var(--color-primary) 55%, transparent);
	}
	.sd-dd-thumb {
		flex: 0 0 auto;
		width: 200px;
		max-width: 42%;
		overflow: hidden;
		border-radius: 6px;
	}
	.sd-dd-name {
		font-size: 13.5px;
		font-weight: 700;
		color: var(--color-text);
		font-family: var(--font-heading);
		flex: 1;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	:global(.sd-dd-caret) {
		flex-shrink: 0;
		color: var(--color-text-muted);
		transition: transform 0.15s ease;
	}
	.sd-open :global(.sd-dd-caret) {
		transform: rotate(180deg);
	}
	.sd-dd-scrim {
		position: fixed;
		inset: 0;
		z-index: 30;
		cursor: default;
	}
	.sd-dd-menu {
		position: absolute;
		z-index: 31;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		max-height: 340px;
		overflow-y: auto;
		padding: 0.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		border-radius: 12px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.55);
	}
	.sd-dd-item {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.45rem;
		border-radius: 9px;
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		text-align: left;
		transition: background 0.12s ease;
	}
	.sd-dd-item:hover {
		background: var(--color-bg-secondary);
	}
	.sd-dd-item-on {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
	}
	.sd-dd-item-thumb {
		flex: 0 0 190px;
		max-width: 50%;
		overflow: hidden;
		border-radius: 6px;
	}
	.sd-dd-item-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.sd-dd-item-name {
		font-size: 12.5px;
		font-weight: 700;
		color: var(--color-text);
	}
	.sd-dd-item-desc {
		font-size: 11px;
		color: var(--color-text-muted);
		line-height: 1.3;
	}

	/* ── Editor ── */
	.sd-editor {
		display: flex;
		flex-direction: column;
	}
	.sd-panel {
		border-radius: 14px;
		border: 1px solid var(--sd-border);
		background: var(--color-bg-secondary);
		padding: 1.1rem 1.2rem;
	}
	.sd-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.1rem 1.5rem;
	}
	.sd-field-full {
		grid-column: 1 / -1;
	}
	.sd-label {
		display: block;
		font-size: 10.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}
	.sd-swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.sd-swatch {
		display: flex;
		gap: 1px;
		padding: 3px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		cursor: pointer;
		transition: transform 0.1s ease;
	}
	.sd-swatch:hover {
		transform: translateY(-1px);
	}
	.sd-swatch span {
		width: 9px;
		height: 17px;
		border-radius: 1px;
	}
	.sd-swatch-on {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 1.5px var(--color-primary);
	}
	.sd-swatch-custom {
		width: 29px;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
		background: conic-gradient(
			from 0deg,
			#f7768e,
			#e0af68,
			#9ece6a,
			#7dcfff,
			#7aa2f7,
			#bb9af7,
			#f7768e
		);
	}
	.sd-swatch-custom :global(svg) {
		filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.7));
		color: #fff;
	}

	/* ── Custom color editor ── */
	.sd-custom {
		border-radius: 12px;
		border: 1px dashed color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 5%, transparent);
		padding: 0.85rem 0.9rem;
	}
	.sd-colors {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
	}
	.sd-color {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.32rem 0.55rem 0.32rem 0.35rem;
		border-radius: 9px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		cursor: pointer;
	}
	.sd-color input[type='color'] {
		width: 26px;
		height: 26px;
		padding: 0;
		border: none;
		border-radius: 6px;
		background: none;
		cursor: pointer;
	}
	.sd-color input[type='color']::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	.sd-color input[type='color']::-webkit-color-swatch {
		border: 1px solid var(--color-border);
		border-radius: 6px;
	}
	.sd-color input[type='color']::-moz-color-swatch {
		border: 1px solid var(--color-border);
		border-radius: 6px;
	}
	.sd-color-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-text-secondary);
	}
	.sd-color-hex {
		font-size: 10.5px;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
	}
	.sd-custom-hint {
		margin: 0.6rem 0 0;
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
	.sd-toggle {
		display: inline-flex;
		flex-wrap: wrap;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid var(--color-border);
	}
	.sd-toggle button {
		padding: 0.38rem 0.72rem;
		font-size: 12px;
		font-weight: 600;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
		border-right: 1px solid var(--color-border);
	}
	.sd-toggle button:last-child {
		border-right: none;
	}
	.sd-toggle button.sd-on {
		background: var(--color-primary);
		color: var(--color-text-inverse);
	}
	.sd-chars {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.sd-char {
		min-width: 2.4ch;
		padding: 0.3rem 0.5rem;
		font-family: var(--font-mono);
		font-size: 13px;
		border-radius: 7px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
	}
	.sd-char.sd-on {
		background: var(--color-primary);
		color: var(--color-text-inverse);
		border-color: var(--color-primary);
	}
	.sd-modules {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.sd-mod {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.32rem 0.7rem;
		font-size: 12px;
		font-weight: 600;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 0.12s ease;
	}
	.sd-mod-mark {
		font-weight: 800;
		opacity: 0.7;
	}
	.sd-mod-on {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
		color: var(--color-primary);
	}
	.sd-mod-on .sd-mod-mark {
		opacity: 1;
	}

	/* ── Sticky terminal-window preview ── */
	.sd-stage {
		position: sticky;
		bottom: 0.75rem;
		z-index: 6;
		margin-top: 0.85rem;
	}
	.sd-window {
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--sd-border);
		box-shadow: 0 12px 34px -14px rgba(0, 0, 0, 0.6);
		background: var(--color-bg-secondary);
	}
	.sd-titlebar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.4rem 0.7rem;
		background: color-mix(in srgb, var(--color-bg-tertiary) 60%, transparent);
		border-bottom: 1px solid var(--sd-border);
	}
	.sd-dots {
		display: inline-flex;
		gap: 5px;
	}
	.sd-dots i {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #ff5f57;
	}
	.sd-dots i:nth-child(2) {
		background: #febc2e;
	}
	.sd-dots i:nth-child(3) {
		background: #28c840;
	}
	.sd-title {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 11px;
		font-family: var(--font-mono);
		color: var(--color-text-muted);
	}

	/* ── Export ── */
	.sd-export {
		border-radius: 14px;
		border: 1px solid var(--sd-border);
		background: var(--color-bg-secondary);
		padding: 1.1rem 1.2rem;
	}
	.sd-oneliner {
		margin-bottom: 0.9rem;
		padding: 0.85rem 0.9rem 0.7rem;
		border-radius: 12px;
		border: 1px solid color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 6%, transparent);
	}
	.sd-oneliner-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.sd-oneliner-title {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 13.5px;
		font-weight: 700;
		color: var(--color-text);
		font-family: var(--font-heading);
	}
	.sd-oneliner-note {
		margin: 0.1rem 0 0;
		font-size: 12px;
		line-height: 1.55;
		color: var(--color-text-muted);
	}
	.sd-oneliner-note code {
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: var(--color-code-bg);
		border-radius: 4px;
		padding: 0.03em 0.3em;
	}
	.sd-export-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		margin-bottom: 0.6rem;
	}
	.sd-export-title {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 14px;
		font-weight: 700;
		color: var(--color-text);
		font-family: var(--font-heading);
	}
	.sd-actions {
		display: flex;
		gap: 0.5rem;
	}
	.sd-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.42rem 0.8rem;
		font-size: 12px;
		font-weight: 600;
		border-radius: 8px;
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
		color: var(--color-text-inverse);
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
	.sd-steps a {
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
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
		color: var(--color-text-inverse);
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

	@media (max-width: 560px) {
		.sd-grid {
			grid-template-columns: 1fr;
		}
		.sd-dd-thumb {
			display: none;
		}
	}
</style>
