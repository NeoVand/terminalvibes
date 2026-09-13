<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base, resolve } from '$app/paths';
	import rawCatalog from '$lib/data/art-concepts.json';
	import {
		ART_REVIEW_STORAGE_KEY,
		choiceIsCurrent,
		parseAvailability,
		parseDecisions,
		selectionExport,
		type ArtCatalog,
		type ArtConcept,
		type ArtDecision,
		type ArtDecisions,
		type ArtVariant,
		type AvailableArt
	} from './art-review';

	const catalog = rawCatalog as ArtCatalog;
	let search = $state('');
	let chapter = $state('all');
	let reviewFilter = $state('all');
	let activeId = $state(catalog.concepts[0].id);
	let decisions = $state<ArtDecisions>({});
	let files = $state<AvailableArt[]>([]);
	let failedPaths = $state<string[]>([]);
	let loading = $state(true);
	let notice = $state('');
	let storageNotice = $state('');
	let availabilityNotice = $state('');
	let preview = $state<{ src: string; alt: string; title: string } | null>(null);
	let previewDialog: HTMLDialogElement;
	let feedback = $state<HTMLTextAreaElement>();
	const usableFiles = $derived(files.filter((file) => !failedPaths.includes(file.path)));
	const totalSlots = catalog.concepts.reduce((sum, concept) => sum + concept.variants.length, 0);
	const chosenCount = $derived(
		catalog.concepts.filter((concept) =>
			choiceIsCurrent(concept, decisions[concept.id], usableFiles)
		).length
	);
	const changesCount = $derived(
		catalog.concepts.filter((concept) => decisions[concept.id]?.status === 'changes-requested')
			.length
	);
	const filtered = $derived(
		catalog.concepts.filter((concept) => {
			const matchesText = `${concept.title} ${concept.id} ${concept.purpose}`
				.toLowerCase()
				.includes(search.toLowerCase().trim());
			const matchesChapter = chapter === 'all' || String(concept.chapter) === chapter;
			const selected = choiceIsCurrent(concept, decisions[concept.id], usableFiles);
			const requested = decisions[concept.id]?.status === 'changes-requested';
			const matchesReview =
				reviewFilter === 'all' ||
				(reviewFilter === 'chosen' && selected) ||
				(reviewFilter === 'changes' && requested) ||
				(reviewFilter === 'unreviewed' && !selected && !requested) ||
				(reviewFilter === 'missing' && concept.variants.some((variant) => !available(variant)));
			return matchesText && matchesChapter && matchesReview;
		})
	);
	const current = $derived(filtered.find((concept) => concept.id === activeId) ?? filtered[0]);
	const currentIndex = $derived(current ? filtered.indexOf(current) : -1);
	const currentDecision = $derived(current ? decisions[current.id] : undefined);
	const original = $derived(current?.sourceRefs[0]);

	onMount(() => {
		try {
			const saved = localStorage.getItem(ART_REVIEW_STORAGE_KEY);
			if (saved) decisions = parseDecisions(JSON.parse(saved), catalog);
		} catch {
			storageNotice =
				'Saved choices could not be read. Export your choices before leaving this page.';
		}
		void refreshAvailability();
	});

	function available(variant: ArtVariant) {
		return usableFiles.find((file) => file.path === variant.path);
	}
	function chapterLabel(value: number | 'brand') {
		return value === 'brand' ? 'Brand' : value === 0 ? 'Start here' : `Part ${value}`;
	}
	function statusLabel(concept: ArtConcept) {
		if (choiceIsCurrent(concept, decisions[concept.id], usableFiles)) return 'Chosen';
		if (decisions[concept.id]?.status === 'changes-requested') return 'Changes requested';
		if (decisions[concept.id]?.status === 'chosen') return 'Choice needs rechecking';
		return 'Not chosen';
	}
	async function refreshAvailability() {
		loading = true;
		availabilityNotice = '';
		failedPaths = [];
		try {
			const response = await fetch(`${base}/art-candidates/availability.json`, {
				cache: 'no-store'
			});
			if (response.status === 404) {
				files = [];
				availabilityNotice =
					'No local candidate index yet. The slots below are waiting for real images.';
			} else if (!response.ok) {
				throw new Error('unavailable');
			} else {
				const data: unknown = await response.json();
				files = parseAvailability(data, catalog);
				if (!files.length) availabilityNotice = 'No readable candidates are indexed yet.';
			}
		} catch {
			files = [];
			availabilityNotice =
				'Could not read the local candidate index. Run the availability scanner, then refresh.';
		} finally {
			loading = false;
		}
	}
	function saveDecision(concept: ArtConcept, decision: ArtDecision | null) {
		const next = { ...decisions };
		if (decision) next[concept.id] = decision;
		else delete next[concept.id];
		decisions = next;
		try {
			localStorage.setItem(
				ART_REVIEW_STORAGE_KEY,
				JSON.stringify({ schemaVersion: 1, catalogVersion: catalog.version, decisions: next })
			);
			storageNotice = '';
		} catch {
			storageNotice = 'This browser could not save your choices. Export them before leaving.';
		}
	}
	function choose(concept: ArtConcept, variant: ArtVariant) {
		const file = available(variant);
		if (!file) return;
		saveDecision(concept, {
			status: 'chosen',
			variant: variant.id,
			sha256: file.sha256,
			note: decisions[concept.id]?.note ?? '',
			updatedAt: new Date().toISOString()
		});
		notice = `${concept.title}: ${variant.label} chosen. Saved in this browser.`;
	}
	function saveNote(concept: ArtConcept, note: string) {
		const previous = decisions[concept.id];
		saveDecision(concept, {
			status: previous?.status ?? 'draft',
			variant: previous?.variant ?? null,
			sha256: previous?.sha256 ?? null,
			note,
			updatedAt: new Date().toISOString()
		});
	}
	function requestChanges(concept: ArtConcept) {
		const previous = decisions[concept.id];
		if (!previous?.note.trim()) {
			notice = 'Add a note describing what needs to change first.';
			feedback?.focus();
			return;
		}
		saveDecision(concept, {
			...previous,
			status: 'changes-requested',
			updatedAt: new Date().toISOString()
		});
		notice = `${concept.title}: changes requested. No candidate is approved for replacement.`;
	}
	function clearDecision(concept: ArtConcept) {
		saveDecision(concept, null);
		notice = `${concept.title}: choice and notes cleared.`;
	}
	function move(direction: number) {
		const next = filtered[currentIndex + direction];
		if (next) {
			activeId = next.id;
			notice = '';
		}
	}
	function imagePath(variant: ArtVariant) {
		const file = available(variant);
		return `${base}/${variant.path}?v=${file?.sha256.slice(0, 12) ?? ''}`;
	}
	async function openPreview(src: string, alt: string, title: string) {
		preview = { src, alt, title };
		await tick();
		previewDialog.showModal();
	}
	function exportChoices() {
		const payload = selectionExport(catalog, decisions, usableFiles);
		const url = URL.createObjectURL(
			new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' })
		);
		const link = document.createElement('a');
		link.href = url;
		link.download = `terminalvibes-art-choices-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(url);
		notice = 'Selection JSON exported. No artwork has been replaced or uploaded.';
	}
</script>

<main class="art-review">
	<header class="review-header">
		<div>
			<p class="eyebrow">TerminalVibes · local artwork studio</p>
			<h1>Give every idea its best picture.</h1>
			<p class="intro">
				Compare five real alternatives. Choose what works, or describe what needs another pass.
				Nothing is chosen automatically.
			</p>
		</div>
		<div class="header-actions">
			<a href={resolve('/')}>Open the course</a>
			<button type="button" onclick={exportChoices}>Export choices</button>
		</div>
	</header>

	<div class="summary" aria-label="Review progress">
		<span><strong>{catalog.concepts.length}</strong> concepts</span>
		<span><strong>{usableFiles.length}/{totalSlots}</strong> images ready</span>
		<span><strong>{chosenCount}</strong> chosen</span>
		<span><strong>{changesCount}</strong> need changes</span>
	</div>
	<p class="local-copy">
		Choices and notes stay in this browser. Export the JSON to hand them over. Choosing here does
		not replace course artwork.
	</p>
	{#if storageNotice}<p class="warning" role="alert">{storageNotice}</p>{/if}
	<div class="availability-row">
		<p>
			{loading
				? 'Checking the local image index…'
				: availabilityNotice || 'Ready to review the indexed images.'}
			<span class="scanner-help"
				>After adding images, run <code>node scripts/art-inventory.mjs --availability</code>.</span
			>
		</p>
		<button type="button" class="quiet" disabled={loading} onclick={refreshAvailability}
			>Refresh images</button
		>
	</div>

	<form
		class="filters"
		onsubmit={(event) => event.preventDefault()}
		aria-label="Filter artwork concepts"
	>
		<label
			>Find a concept<input
				type="search"
				bind:value={search}
				placeholder="Try “editor”, “paths”, or “scripts”"
			/></label
		>
		<label
			>Chapter<select bind:value={chapter}>
				<option value="all">All chapters</option><option value="0">Start here</option>
				{#each Array.from({ length: 14 }, (_, i) => i + 1) as part (part)}<option
						value={String(part)}>Part {part}</option
					>{/each}
				<option value="brand">Brand</option>
			</select></label
		>
		<label
			>Review status<select bind:value={reviewFilter}>
				<option value="all">Every concept</option><option value="unreviewed">Not chosen</option
				><option value="chosen">Chosen</option><option value="changes">Changes requested</option
				><option value="missing">Missing alternatives</option>
			</select></label
		>
	</form>

	<p class="notice" role="status" aria-live="polite">{notice}</p>
	{#if current}
		<nav class="concept-navigation" aria-label="Browse artwork concepts">
			<button type="button" class="quiet" disabled={currentIndex <= 0} onclick={() => move(-1)}
				>← Previous</button
			>
			<label class="concept-picker"
				><span>Concept {currentIndex + 1} of {filtered.length}</span><select
					value={current.id}
					onchange={(event) => {
						activeId = event.currentTarget.value;
						notice = '';
					}}
				>
					{#each filtered as concept (concept.id)}<option value={concept.id}
							>{chapterLabel(concept.chapter)} · {concept.title} · {statusLabel(concept)}</option
						>{/each}
				</select></label
			>
			<button
				type="button"
				class="quiet"
				disabled={currentIndex >= filtered.length - 1}
				onclick={() => move(1)}>Next →</button
			>
		</nav>
		{#key current.id}
			<section class="concept" aria-labelledby="concept-title">
				<div class="concept-intro">
					<div>
						<p class="eyebrow">
							{chapterLabel(current.chapter)} · {current.kind === 'new'
								? 'New explanation'
								: current.kind === 'brand'
									? 'Brand artwork'
									: 'Replacement'} · {current.aspectRatio}
						</p>
						<h2 id="concept-title">{current.title}</h2>
						<p class="purpose">{current.purpose}</p>
						<div class="lesson-links">
							{#each [...new Set([...current.sourceRefs, ...current.placements].map((reference) => reference.section))] as section (section)}<a
									href={resolve(`/#${section}`)}
									target="_blank"
									rel="noreferrer">Read this lesson ↗ <span class="section-id">{section}</span></a
								>{/each}
						</div>
					</div>
					<span class="status-badge">{statusLabel(current)}</span>
				</div>
				{#if currentDecision?.status === 'chosen' && !choiceIsCurrent(current, currentDecision, usableFiles)}<p
						class="warning"
						role="alert"
					>
						The chosen file has changed or is missing. Inspect it again and choose explicitly; the
						old choice does not approve a new image.
					</p>{/if}
				<div class="candidate-grid" role="group" aria-label="Compare five alternatives">
					{#each current.variants as variant (variant.id)}
						{@const file = available(variant)}
						{@const selected =
							currentDecision?.variant === variant.id &&
							choiceIsCurrent(current, currentDecision, usableFiles)}
						<article class:chosen={selected} class="candidate">
							<div class="candidate-top">
								<h3>{variant.label}</h3>
								<span
									>Brief: {catalog.variantDirections.find(
										(direction) => direction.id === variant.id
									)?.name}</span
								>
							</div>
							{#if file}
								<button
									type="button"
									class="image-button"
									aria-label={`Preview ${variant.label}: ${current.title}`}
									onclick={() =>
										openPreview(
											imagePath(variant),
											`${current.title}, unapproved ${variant.label.toLowerCase()}`,
											`${current.title} · ${variant.label}`
										)}
								>
									<img
										src={imagePath(variant)}
										alt={`${current.title}, unapproved ${variant.label.toLowerCase()}`}
										width={file.width}
										height={file.height}
										onerror={() => {
											failedPaths = [...failedPaths, variant.path];
										}}
									/>
								</button>
								<p class="dimensions">
									{file.width} × {file.height} · {Math.round(file.bytes / 1024)} KB · open to inspect
								</p>
							{:else}
								<div class="missing-image">
									<span aria-hidden="true">{variant.id}</span><strong
										>{failedPaths.includes(variant.path)
											? 'Image could not load'
											: 'Not generated'}</strong
									>
									<p>
										{failedPaths.includes(variant.path)
											? 'Check the file and refresh the index.'
											: 'A real alternative will appear here.'}
									</p>
								</div>
							{/if}
							<button
								type="button"
								class="choose-button"
								disabled={!file}
								aria-pressed={selected}
								onclick={() => choose(current, variant)}
								>{selected ? '✓ Chosen' : `Choose ${variant.id}`}</button
							>
						</article>
					{/each}
				</div>
				<div class="review-detail">
					<div class="feedback-panel">
						<label for="art-feedback">Your notes</label>
						<p class="hint">
							Call out anything you notice: anatomy, confusing objects, colors, accuracy, clutter,
							or a detail worth keeping. Name an alternative number when useful.
						</p>
						<textarea
							bind:this={feedback}
							id="art-feedback"
							rows="5"
							value={currentDecision?.note ?? ''}
							oninput={(event) => saveNote(current, event.currentTarget.value)}
							placeholder="Alternative 03: I like the lighting, but…"
						></textarea>
						<div class="feedback-actions">
							<button type="button" onclick={() => requestChanges(current)}>Request changes</button
							><button
								type="button"
								class="quiet"
								disabled={!currentDecision}
								onclick={() => clearDecision(current)}>Clear choice & notes</button
							>
						</div>
						<p class="hint">
							Notes save as you type. Requesting changes means no image for this concept is approved
							yet.
						</p>
					</div>
					<details class="brief-panel" open>
						<summary>What this picture should explain</summary>
						<p>{current.visualBrief}</p>
						<ul>
							{#each current.visualChecks as check (check)}<li>{check}</li>{/each}
						</ul>
						<details>
							<summary>Suggested alt text · verify after choosing</summary>
							<p>{current.altSuggestion}</p>
						</details>
					</details>
				</div>
				<details class="reference-panel">
					<summary
						>{original
							? 'Current artwork and source references'
							: 'New concept placement and derived assets'}</summary
					>
					{#if original}
						<div class="original-reference">
							<button
								type="button"
								class="image-button"
								aria-label={`Preview current artwork: ${current.title}`}
								onclick={() =>
									openPreview(
										`${base}/${original.src}`,
										original.alt || current.title,
										`${current.title} · current course artwork`
									)}
								><img
									src="{base}/{original.src}"
									alt={original.alt || current.title}
									loading="lazy"
								/></button
							>
							<div>
								<p><strong>Existing file:</strong> <code>static/{original.src}</code></p>
								<p>
									<strong>Current alt:</strong>
									{original.alt ||
										'(Decorative image; the surrounding control has its own accessible label.)'}
								</p>
								{#if original.caption}<p>
										<strong>Current caption:</strong>
										{original.caption}
									</p>{/if}
							</div>
						</div>
					{/if}
					<ul class="source-list">
						{#each [...current.sourceRefs, ...current.placements] as reference, index (index)}<li>
								<code>{reference.file}#{reference.section}</code>
							</li>{/each}
					</ul>
					{#each current.derivedAssets as asset (asset.path)}<p>
							<code>{asset.path}</code> — {asset.purpose}
						</p>{/each}
				</details>
			</section>
		{/key}
	{:else}
		<div class="empty">
			<h2>No concepts match those filters.</h2>
			<button
				type="button"
				onclick={() => {
					search = '';
					chapter = 'all';
					reviewFilter = 'all';
				}}>Show all concepts</button
			>
		</div>
	{/if}
	<footer>
		<p>Local review only · {catalog.version}</p>
		<p>
			Images remain unapproved until you choose. The production course never loads this gallery or
			its candidate files.
		</p>
	</footer>
</main>

<dialog
	bind:this={previewDialog}
	onclose={() => {
		preview = null;
	}}
	aria-labelledby="preview-title"
	class="preview-dialog"
>
	{#if preview}
		<div class="preview-heading">
			<h2 id="preview-title">{preview.title}</h2>
			<button type="button" onclick={() => previewDialog.close()}>Close preview</button>
		</div>
		<img src={preview.src} alt={preview.alt} />
		<p>Inspect the details at a larger size. Press Escape or Close preview to return.</p>
	{/if}
</dialog>

<style>
	.art-review {
		position: relative;
		min-height: 100vh;
		background: #f6f4ef;
		color: #252830;
		padding: clamp(1rem, 3vw, 3rem);
		font-family: system-ui, sans-serif;
		line-height: 1.6;
	}
	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
		max-width: 112rem;
		margin: 0 auto 1.75rem;
	}
	.eyebrow {
		color: #65616b;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 0.72rem;
		font-weight: 700;
		margin: 0 0 0.6rem;
	}
	h1 {
		font-size: clamp(2rem, 3.2vw, 3.2rem);
		letter-spacing: -0.04em;
		line-height: 1.12;
		font-weight: 650;
		max-width: 24ch;
	}
	.intro {
		max-width: 65ch;
		margin-top: 1rem;
		color: #575861;
	}
	.header-actions,
	.feedback-actions {
		display: flex;
		gap: 0.65rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.header-actions {
		justify-content: flex-end;
		padding-top: 0.4rem;
	}
	button,
	input,
	select,
	textarea {
		font: inherit;
	}
	button {
		min-height: 44px;
		padding: 0.55rem 0.95rem;
		border: 1px solid #35323e;
		border-radius: 0.5rem;
		background: #35323e;
		color: white;
		font-weight: 600;
		cursor: pointer;
		line-height: 1.4;
	}
	button:hover:not(:disabled) {
		background: #51495e;
		border-color: #51495e;
	}
	button:disabled {
		opacity: 0.43;
		cursor: not-allowed;
	}
	button.quiet {
		color: #35323e;
		background: #fff;
		border-color: #ccc8d0;
	}
	button.quiet:hover:not(:disabled) {
		background: #ece8f1;
	}
	button:focus-visible,
	a:focus-visible,
	input:focus-visible,
	select:focus-visible,
	textarea:focus-visible,
	summary:focus-visible {
		outline: 3px solid #655ca5;
		outline-offset: 3px;
	}
	a {
		color: #514879;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.header-actions a {
		padding: 0.65rem;
	}
	.summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem 2rem;
		padding: 1rem 0;
		border-block: 1px solid #d9d5da;
	}
	.summary span {
		color: #66616a;
	}
	.summary strong {
		color: #35313e;
		font-size: 1.3rem;
		font-weight: 650;
		margin-right: 0.3rem;
	}
	.local-copy {
		margin-top: 0.75rem;
		font-size: 0.86rem;
		color: #68636c;
	}
	.availability-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin: 1rem 0 1.7rem;
	}
	.availability-row p {
		color: #68636c;
		font-size: 0.82rem;
		max-width: 110ch;
	}
	.scanner-help {
		display: block;
	}
	code {
		font-family: ui-monospace, monospace;
		overflow-wrap: anywhere;
		font-size: 0.9em;
	}
	.filters {
		display: grid;
		grid-template-columns: minmax(16rem, 2fr) repeat(2, minmax(11rem, 1fr));
		gap: 1rem;
		background: #eae7e1;
		padding: 1.2rem;
		border-radius: 0.75rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.8rem;
		font-weight: 650;
		color: #55505c;
		min-width: 0;
	}
	input,
	select,
	textarea {
		width: 100%;
		min-width: 0;
		color: #282631;
		background: #fff;
		border: 1px solid #c5c0cc;
		border-radius: 0.45rem;
		padding: 0.65rem 0.75rem;
		font-weight: 400;
		font-size: 1rem;
		min-height: 44px;
	}
	input::placeholder,
	textarea::placeholder {
		color: #7e7884;
	}
	textarea {
		resize: vertical;
	}
	.notice {
		min-height: 1.6rem;
		margin: 0.65rem 0;
		color: #48416e;
		font-size: 0.86rem;
	}
	.concept-navigation {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: end;
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.concept-picker {
		width: min(100%, 48rem);
		justify-self: center;
	}
	.concept-intro {
		display: flex;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}
	h2 {
		font-size: clamp(1.5rem, 2.3vw, 2.25rem);
		font-weight: 650;
		letter-spacing: -0.025em;
		line-height: 1.2;
	}
	.purpose {
		margin: 0.65rem 0;
		max-width: 75ch;
	}
	.lesson-links {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		font-size: 0.8rem;
	}
	.section-id {
		font-family: ui-monospace, monospace;
		font-size: 0.85em;
		opacity: 0.8;
	}
	.status-badge {
		background: #e8e4f0;
		border: 1px solid #cdc5dd;
		padding: 0.4rem 0.7rem;
		border-radius: 99px;
		height: fit-content;
		white-space: nowrap;
		font-size: 0.75rem;
		font-weight: 650;
	}
	.candidate-grid {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.85rem;
		align-items: stretch;
	}
	.candidate {
		min-width: 0;
		background: #fff;
		border: 1px solid #d3cdd9;
		border-radius: 0.75rem;
		padding: 0.65rem;
		display: flex;
		flex-direction: column;
	}
	.candidate.chosen {
		border-color: #65548e;
		box-shadow: 0 0 0 2px #65548e;
	}
	.candidate-top {
		padding: 0.25rem 0.1rem 0.7rem;
	}
	h3 {
		font-size: 0.9rem;
		font-weight: 650;
	}
	.candidate-top span {
		display: block;
		font-size: 0.72rem;
		color: #736c7d;
	}
	.image-button {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		border-radius: 0.4rem;
		background: #e5e1e8;
		overflow: hidden;
	}
	.image-button:hover:not(:disabled) {
		background: #e5e1e8;
	}
	.image-button img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 16/9;
		object-fit: contain;
	}
	.missing-image {
		min-height: 11rem;
		flex: 1;
		aspect-ratio: 16/10;
		background: repeating-linear-gradient(
			135deg,
			#f4f2f6,
			#f4f2f6 10px,
			#efedf1 10px,
			#efedf1 11px
		);
		border: 1px dashed #cfc8d6;
		border-radius: 0.4rem;
		padding: 0.75rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.missing-image > span {
		color: #c5bdce;
		font-size: 2rem;
		font-weight: 400;
	}
	.missing-image strong {
		font-size: 0.88rem;
	}
	.missing-image p {
		font-size: 0.72rem;
		color: #7a7185;
		margin-top: 0.3rem;
	}
	.dimensions {
		font-size: 0.65rem;
		color: #7a7185;
		margin: 0.5rem 0;
	}
	.choose-button {
		width: 100%;
		margin-top: auto;
		font-size: 0.8rem;
	}
	.missing-image + .choose-button {
		margin-top: 0.7rem;
	}
	.review-detail {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin: 2rem 0;
	}
	.feedback-panel > label {
		font-size: 1rem;
	}
	.hint {
		font-size: 0.8rem;
		color: #6f6877;
		margin: 0.4rem 0 0.75rem;
	}
	.feedback-actions {
		margin-top: 0.75rem;
	}
	summary {
		cursor: pointer;
		font-weight: 650;
		min-height: 44px;
		padding: 0.5rem 0;
	}
	.brief-panel {
		border-top: 1px solid #d1cad8;
	}
	.brief-panel p,
	.brief-panel ul {
		font-size: 0.9rem;
		color: #5c5566;
		margin-bottom: 0.8rem;
	}
	.brief-panel ul {
		list-style: disc;
		padding-left: 1.25rem;
	}
	.brief-panel details {
		font-size: 0.8rem;
	}
	.reference-panel {
		border-block: 1px solid #d1cad8;
		padding: 0.5rem 0;
		font-size: 0.8rem;
		color: #6d6377;
	}
	.reference-panel summary {
		font-size: 0.9rem;
		color: #3d3548;
	}
	.original-reference {
		display: grid;
		grid-template-columns: minmax(12rem, 22rem) 1fr;
		gap: 1.25rem;
		margin: 1rem 0;
	}
	.original-reference p {
		margin-bottom: 0.6rem;
	}
	.source-list {
		margin: 1rem 0;
	}
	.warning {
		color: #6a4814;
		background: #fff1d5;
		border: 1px solid #ddc695;
		border-radius: 0.5rem;
		padding: 0.8rem;
		font-size: 0.87rem;
		margin: 1rem 0;
	}
	.empty {
		padding: 5rem 1rem;
		text-align: center;
	}
	.empty button {
		margin-top: 1rem;
	}
	footer {
		margin-top: 3rem;
		font-size: 0.72rem;
		color: #7f748a;
	}
	.preview-dialog {
		position: fixed;
		inset: 0;
		margin: auto;
		background: #f6f4ef;
		color: #302a38;
		width: min(96vw, 110rem);
		max-width: 96vw;
		max-height: 95dvh;
		border: 1px solid #b5aabd;
		border-radius: 0.7rem;
		padding: 1rem;
		overflow: auto;
	}
	.preview-dialog::backdrop {
		background: rgb(20 15 25 / 0.85);
	}
	.preview-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}
	.preview-heading h2 {
		font-size: 1rem;
	}
	.preview-dialog > img {
		width: 100%;
		max-height: 76dvh;
		object-fit: contain;
		background: #e1dde5;
	}
	.preview-dialog > p {
		font-size: 0.75rem;
		color: #6f637b;
		margin-top: 0.65rem;
	}
	@media (min-width: 1800px) {
		.art-review > :global(*) {
			max-width: 112rem;
			margin-inline: auto;
		}
	}
	@media (max-width: 1180px) {
		.candidate-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.review-header {
			flex-direction: column;
			gap: 1rem;
		}
		.header-actions {
			justify-content: flex-start;
		}
	}
	@media (max-width: 720px) {
		.candidate-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.filters {
			grid-template-columns: 1fr 1fr;
		}
		.filters > label:first-child {
			grid-column: 1 / -1;
		}
		.review-detail {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.concept-intro {
			flex-direction: column;
			gap: 0.7rem;
		}
		.availability-row {
			align-items: flex-start;
			flex-direction: column;
		}
		.original-reference {
			grid-template-columns: 1fr;
		}
		.concept-navigation {
			grid-template-columns: 1fr 1fr;
		}
		.concept-picker {
			grid-row: 1;
			grid-column: 1/-1;
		}
		.concept-navigation > button:last-child {
			justify-self: end;
		}
	}
	@media (max-width: 430px) {
		.candidate-grid {
			grid-template-columns: 1fr;
		}
		.filters {
			grid-template-columns: 1fr;
		}
		.filters > label:first-child {
			grid-column: auto;
		}
		.summary {
			gap: 0.6rem 1rem;
		}
		.summary span {
			font-size: 0.8rem;
		}
		.preview-heading {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
