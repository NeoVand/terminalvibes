<script lang="ts">
	import './layout.css';
	import BackgroundPixels from '$lib/components/layout/BackgroundPixels.svelte';

	let { children } = $props();
</script>

<BackgroundPixels />
{@render children()}
