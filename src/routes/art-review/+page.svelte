<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Artwork review · TerminalVibes</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if import.meta.env.DEV}
	{#await import('$lib/components/art/ArtReviewGallery.svelte')}
		<p class="local-notice" role="status">Opening the local artwork review…</p>
	{:then gallery}
		<gallery.default />
	{:catch}
		<p class="local-notice" role="alert">
			The local artwork review could not load. Restart the development server and try again.
		</p>
	{/await}
{:else}
	<main class="local-notice">
		<h1>Artwork review is local</h1>
		<p>The artwork workspace is available only on the development server.</p>
		<a href={resolve('/')}>Return to the course</a>
	</main>
{/if}

<style>
	.local-notice {
		max-width: 42rem;
		margin: 6rem auto;
		padding: 1.5rem;
		line-height: 1.7;
	}
	h1 {
		font-size: 1.75rem;
		margin-bottom: 1rem;
	}
	a {
		text-decoration: underline;
	}
</style>
