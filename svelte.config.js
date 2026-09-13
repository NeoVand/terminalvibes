import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { excludePrivateArt, isPrivateArtPath } from './scripts/static-art-isolation.mjs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: excludePrivateArt(adapter()),
		serviceWorker: {
			files: (file) => !isPrivateArtPath(file) && !/\.DS_Store/.test(file)
		},
		paths: {
			base: process.env.BASE_PATH ?? ''
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	},
	preprocess: [mdsvex()],
	extensions: ['.svelte', '.svx']
};

export default config;
