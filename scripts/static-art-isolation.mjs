/** Private artwork is never a published static asset or an offline cache entry. */
export function isPrivateArtPath(path) {
	return path.split('/').includes('art-candidates');
}

/** @param {import('@sveltejs/kit').Adapter} adapter */
export function excludePrivateArt(adapter) {
	return {
		...adapter,
		/** @param {import('@sveltejs/kit').Builder} builder */
		async adapt(builder) {
			await adapter.adapt(builder);
			// adapter-static uses build/ with this project's default options. Remove
			// its copy, never the artist's local source images under static/.
			builder.rimraf('build/art-candidates');
		}
	};
}
