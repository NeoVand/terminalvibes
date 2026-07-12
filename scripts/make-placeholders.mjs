// Generate placeholder banners for images the user will create from
// docs/IMAGE_PROMPTS.md. Sage/bark gradient + title text, 1672x941.
import { execSync } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import sharp from 'sharp';

const grep = execSync(
  `grep -rhoE 'images/[A-Za-z0-9._-]+\\.(webp|jpg|png)' src/lib/components src/routes | sort -u`,
  { encoding: 'utf8' }
);
const refs = [...new Set(grep.trim().split('\n').map((l) => l.replace('images/', '')))];
let made = 0;
for (const name of refs) {
  const path = `static/images/${name}`;
  if (existsSync(path)) continue;
  const title = name.replace(/\.(webp|jpg|png)$/, '').replace(/[-_]/g, ' ');
  const isPhoto = name.endsWith('.jpg');
  const w = isPhoto ? 720 : 1672;
  const h = isPhoto ? 1080 : 941;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1c2b1a"/>
      <stop offset="0.55" stop-color="#2c4025"/>
      <stop offset="1" stop-color="#4a3319"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="${w * 0.06}" y="${h * 0.12}" width="${w * 0.88}" height="${h * 0.76}" rx="24"
        fill="none" stroke="#7ee787" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="14 10"/>
  <text x="50%" y="46%" text-anchor="middle" font-family="Menlo, monospace"
        font-size="${Math.round(w / 24)}" fill="#a8e6a3">$ ${title}</text>
  <text x="50%" y="58%" text-anchor="middle" font-family="Menlo, monospace"
        font-size="${Math.round(w / 46)}" fill="#c8b48a">placeholder — generate from docs/IMAGE_PROMPTS.md</text>
</svg>`;
  const buf = Buffer.from(svg);
  if (name.endsWith('.webp')) await sharp(buf).webp({ quality: 80 }).toFile(path);
  else if (name.endsWith('.jpg')) await sharp(buf).jpeg({ quality: 80 }).toFile(path);
  else await sharp(buf).png().toFile(path);
  made++;
}
console.log(`created ${made} placeholders for ${refs.length} referenced images`);
