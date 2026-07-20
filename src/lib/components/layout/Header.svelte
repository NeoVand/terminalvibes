<script lang="ts">
	import { Sun, Moon, ScrollText, Github, Gamepad2, Bot, X, Linkedin } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Search from './Search.svelte';

	let {
		theme = 'system',
		onToggleTheme,
		onToggleCheatSheet,
		onTogglePlayground,
		onToggleAgent,
		onNavigate
	}: {
		theme: string;
		onToggleTheme: () => void;
		onToggleCheatSheet: () => void;
		onTogglePlayground: () => void;
		onToggleAgent: () => void;
		onNavigate?: (id: string) => void;
	} = $props();

	let aboutOpen = $state(false);
</script>

<header
	class="app-header fixed top-0 right-0 left-0 z-50 flex items-center"
	style="height: var(--header-height);"
>
	<div
		class="flex flex-shrink-0 items-center justify-center"
		style="width: var(--sidebar-collapsed-width);"
	>
		<button
			onclick={() => (aboutOpen = true)}
			class="flex h-7 w-7 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
			aria-label="About TerminalVibes"
		>
			<img
				src="{base}/images/logo-transparent.webp"
				alt=""
				class="h-8 w-8"
				width="32"
				height="32"
			/>
		</button>
	</div>

	<span
		class="-ml-1.5 hidden text-[15px] font-bold tracking-tight sm:inline"
		style="color: var(--color-text); font-family: var(--font-heading); letter-spacing: -0.02em;"
	>
		TerminalVibes
	</span>

	<div class="flex-1"></div>

	<!-- One control set for all breakpoints: label/link visibility adapts via CSS -->
	<div class="flex flex-shrink-0 items-center gap-0.5 pr-2 sm:gap-1">
		<div class="sm:mr-1">
			<Search {onNavigate} />
		</div>

		<button
			onclick={onTogglePlayground}
			class="playground-btn flex h-8 w-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg transition-all sm:w-auto sm:px-2.5"
			aria-label="Open Terminal Playground"
		>
			<Gamepad2 size={16} />
			<span class="hidden text-xs font-semibold sm:inline">Playground</span>
		</button>

		<button
			onclick={onToggleAgent}
			class="agent-btn flex h-8 w-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg transition-all sm:w-auto sm:px-2.5"
			aria-label="Open Agent"
		>
			<Bot size={16} />
			<span class="hidden text-xs font-semibold sm:inline">Agent</span>
		</button>

		<button
			onclick={onToggleCheatSheet}
			class="cheatsheet-btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all"
			aria-label="Terminal Cheat Sheet"
		>
			<ScrollText size={16} />
		</button>

		<a
			href="https://github.com/NeoVand/terminalvibes"
			target="_blank"
			rel="noopener noreferrer"
			class="hidden h-8 w-8 items-center justify-center rounded-lg transition-opacity hover:opacity-70 sm:flex"
			style="color: var(--color-text-muted);"
			aria-label="View on GitHub"
		>
			<Github size={16} />
		</a>

		<button
			onclick={onToggleTheme}
			class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-opacity hover:opacity-70"
			style="color: var(--color-text-muted);"
			aria-label="Toggle theme"
		>
			{#if theme === 'dark'}
				<Sun size={16} />
			{:else}
				<Moon size={16} />
			{/if}
		</button>
	</div>
</header>

{#if aboutOpen}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
		<button
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			onclick={() => (aboutOpen = false)}
			aria-label="Close about"
		></button>
		<div
			class="about-modal relative flex w-full max-w-xl flex-col overflow-hidden rounded-xl border shadow-2xl sm:flex-row"
			style="background: var(--color-surface); border-color: var(--color-border);"
		>
			<button
				onclick={() => (aboutOpen = false)}
				class="absolute top-3 right-3 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-opacity hover:opacity-70"
				style="color: var(--color-text-muted); background: color-mix(in srgb, var(--color-surface) 70%, transparent);"
				aria-label="Close"
			>
				<X size={16} />
			</button>

			<!-- The leafy T fills the whole left half — the logo IS the artwork -->
			<div class="about-logo-pane sm:w-1/2">
				<img
					src="{base}/images/logo-transparent.webp"
					alt="TerminalVibes logo"
					class="h-full w-full object-contain p-6"
					width="512"
					height="512"
				/>
			</div>

			<div class="flex flex-col justify-center p-6 sm:w-1/2 sm:p-7">
				<h2
					class="text-xl font-bold"
					style="color: var(--color-text); font-family: var(--font-heading); letter-spacing: -0.02em;"
				>
					TerminalVibes
				</h2>
				<p class="mb-4 text-xs" style="color: var(--color-text-muted);">
					The Terminal for Vibe Coders
				</p>

				<p class="mb-5 text-sm leading-relaxed" style="color: var(--color-text-secondary);">
					An interactive educational app built to teach the terminal to developers working with AI
					tools. For educational purposes only.
				</p>

				<p class="mb-4 text-sm font-medium" style="color: var(--color-text);">
					Created by Neo Mohsenvand
				</p>

				<div class="flex gap-2">
					<a
						href="https://github.com/NeoVand"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
						style="background: var(--color-bg-tertiary); color: var(--color-text-secondary); border: 1px solid var(--color-border);"
					>
						<Github size={14} />
						GitHub
					</a>
					<a
						href="https://linkedin.com/in/mohsenvand"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
						style="background: var(--color-bg-tertiary); color: var(--color-text-secondary); border: 1px solid var(--color-border);"
					>
						<Linkedin size={14} />
						LinkedIn
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Frosted glass, matching the sidebar's treatment: content scrolls
	   visibly behind the header through the blur. */

	/* The logo webp is transparent — no plate behind it, so the pane
	   reads as one continuous modal surface. */
	.about-logo-pane {
		min-height: 220px;
	}

	.app-header {
		background: var(--header-glass);
		backdrop-filter: blur(20px) saturate(1.4);
		-webkit-backdrop-filter: blur(20px) saturate(1.4);
		box-shadow: 0 1px 0 color-mix(in srgb, var(--color-border) 80%, transparent);
	}

	/* The trio reads as a warm gradient across the header: playground tan,
	   agent amber, cheat sheet moss — each with the same 10% hover wash. */
	.playground-btn {
		color: var(--color-btn-playground);
	}

	.playground-btn:hover {
		background: color-mix(in srgb, var(--color-btn-playground) 10%, transparent);
	}

	.agent-btn {
		color: var(--color-btn-agent);
	}

	.agent-btn:hover {
		background: color-mix(in srgb, var(--color-btn-agent) 10%, transparent);
	}

	/* Same inviting treatment as the playground button, in the cheat
	   sheet's accent — matching its "Quick reference" callout on the page */
	.cheatsheet-btn {
		color: var(--color-btn-cheatsheet);
	}

	.cheatsheet-btn:hover {
		background: color-mix(in srgb, var(--color-btn-cheatsheet) 10%, transparent);
	}
</style>
