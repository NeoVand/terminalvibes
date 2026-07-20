// Compose docs/images/banner-poster.webp: a thumbnail grid of every section
// banner, in curriculum order. Order is extracted from the section components
// themselves, so regenerating after adding/replacing art just works:
//   node scripts/make-poster.mjs
import { readdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';

// Hero first, then every PartN component in numeric page order — discovered
// rather than listed, so adding a part needs no edit here.
const SECTIONS_DIR = 'src/lib/components/sections';
const SECTION_FILES = [
	'Hero',
	...(await readdir(SECTIONS_DIR))
		.filter((f) => /^Part\d+\.svelte$/.test(f))
		.sort((a, b) => parseInt(a.slice(4), 10) - parseInt(b.slice(4), 10))
		.map((f) => f.replace('.svelte', ''))
];
const EXCLUDE = new Set(['logo']);
const COLS = 5;
const THUMB_W = 400;
const THUMB_H = 225;
const GAP = 12;
const MARGIN = 24;
const BG = '#0c110a'; // the banner series' own base tone

const seen = new Set();
const banners = [];
for (const name of SECTION_FILES) {
	const src = await readFile(`${SECTIONS_DIR}/${name}.svelte`, 'utf8');
	for (const [, banner] of src.matchAll(/images\/([A-Za-z0-9.-]+)\.webp/g)) {
		if (EXCLUDE.has(banner) || seen.has(banner)) continue;
		seen.add(banner);
		banners.push(banner);
	}
}

const rows = Math.ceil(banners.length / COLS);
const width = COLS * THUMB_W + (COLS - 1) * GAP + 2 * MARGIN;
const height = rows * THUMB_H + (rows - 1) * GAP + 2 * MARGIN;

const composites = [];
for (let i = 0; i < banners.length; i++) {
	composites.push({
		input: await sharp(`static/images/${banners[i]}.webp`).resize(THUMB_W, THUMB_H).toBuffer(),
		left: MARGIN + (i % COLS) * (THUMB_W + GAP),
		top: MARGIN + Math.floor(i / COLS) * (THUMB_H + GAP)
	});
}

await sharp({ create: { width, height, channels: 3, background: BG } })
	.composite(composites)
	.webp({ quality: 82, effort: 6 })
	.toFile('docs/images/banner-poster.webp');

console.log(`banner-poster.webp: ${banners.length} banners, ${COLS}x${rows}, ${width}x${height}`);
