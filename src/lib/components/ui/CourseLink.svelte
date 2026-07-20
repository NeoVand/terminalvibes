<script lang="ts">
	import { courseEntry } from '$lib/data/sidebar-nav';

	/**
	 * An in-course cross-reference that names its destination.
	 *
	 * Prose used to say "Part 11" — a number the table of contents never shows,
	 * pointing at nothing clickable. This renders the part's real name and icon
	 * and links to its anchor, resolving both from the sidebar data, so the
	 * reference survives a rename or a reordering of the curriculum.
	 *
	 *   <CourseLink to="part-8" />            → 🖥 Processes & Ports
	 *   <CourseLink to="section-9-4" />       → Keys & Secrets
	 *   <CourseLink to="part-8" label="…" />  → override the wording
	 */
	let {
		to,
		label,
		icon = true
	}: {
		to: string;
		label?: string;
		icon?: boolean;
	} = $props();

	const entry = $derived(courseEntry(to));
	const text = $derived(label ?? entry?.label ?? to);
	const Icon = $derived(entry?.icon);
</script>

<a
	href="#{to}"
	class="course-link"
	title={entry ? `Go to ${entry.label}` : undefined}
	data-sveltekit-noscroll={undefined}
>
	{#if icon && Icon}
		<Icon size={13} class="course-link-icon" aria-hidden="true" />
	{/if}<span>{text}</span>
</a>

<style>
	.course-link {
		display: inline-flex;
		align-items: baseline;
		gap: 0.25em;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-thickness: 1px;
		text-decoration-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
		font-weight: 500;
		transition: text-decoration-color 0.15s ease;
	}

	.course-link:hover {
		text-decoration-color: var(--color-primary);
	}

	/* Nudge the icon onto the text baseline without disturbing line height. */
	.course-link :global(.course-link-icon) {
		align-self: center;
		flex-shrink: 0;
		transform: translateY(0.06em);
	}
</style>
