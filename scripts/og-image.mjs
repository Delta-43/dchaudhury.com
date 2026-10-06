// Renders public/og.png, the 1200 × 630 image that link previews show
// (LinkedIn, Discord, Slack, WhatsApp, X).
//
// Usage: pnpm og
//
// Layout: the voxel portrait left of centre, standing on the GitHub voxel band;
// name and tagline on the right; the logo small in the top-right corner. The
// face sits inside the centre square, so square-cropped thumbnails still show it.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
// Fonts and the logo are embedded, so the page needs no file access.
const dataUri = (path, type) => `data:${type};base64,${readFileSync(new URL(path, root)).toString('base64')}`;
const json = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const portrait = json('src/data/voxel-portrait.json');
const contributions = json('src/data/contributions.json');
const tokens = readFileSync(new URL('src/styles/tokens.css', root), 'utf8');
const palette = Object.fromEntries(
  [...tokens.matchAll(/--(palette-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, value]) => [name, value]),
);

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: "Schibsted Grotesk"; src: url("${dataUri('public/fonts/schibsted-grotesk/schibsted-grotesk-latin-wght-normal.woff2', 'font/woff2')}") format("woff2"); font-weight: 400 900; }
@font-face { font-family: "DM Mono"; src: url("${dataUri('public/fonts/dm-mono/dm-mono-latin-400-normal.woff2', 'font/woff2')}") format("woff2"); }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #ffffff; color: #0a0a0a; }
canvas { position: absolute; left: 0; top: 0; }
.text { position: absolute; left: 684px; top: 150px; }
h1 { margin: 0; font: 400 80px/0.95 "Schibsted Grotesk"; letter-spacing: -0.03em; text-transform: uppercase; }
.label { display: inline-block; margin: 26px 0 0; font: 400 19px/1.5 "Schibsted Grotesk"; text-transform: uppercase; text-align: justify; text-align-last: justify; }
.logo { position: absolute; right: 48px; top: 40px; width: 92px; height: 92px; }
.caption { position: absolute; left: 60px; bottom: 30px; margin: 0; font: 400 15px/1.3 "DM Mono"; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; }
</style></head><body>
<canvas id="c" width="1200" height="630"></canvas>
<div class="text"><h1>Debadeep<br>Chaudhury</h1><p class="label">Software and data engineering<br>Web apps for real-world data</p></div>
<img class="logo" src="${dataUri('src/assets/logo.png', 'image/png')}" alt="">
<p class="caption">dchaudhury.com</p>
<script>
(() => {
const portrait = ${JSON.stringify(portrait)};
const counts = ${JSON.stringify(contributions.days.map(([, count]) => count))};
const palette = ${JSON.stringify(palette)};
const ctx = document.getElementById('c').getContext('2d');

// The band: one column per day, newest on the right, as on the home page.
const voxel = 12, gap = 2, pitch = voxel + gap, rows = 7, bandBottom = 560;
const columns = Math.ceil(1200 / pitch);
const days = counts.slice(-columns);
const peak = Math.max(2, ...counts);
const height = (c) => (c <= 0 ? 0 : Math.max(1, Math.round(1 + (Math.log2(c) / Math.log2(peak)) * (rows - 1))));
const layers = ['palette-voxel-navy', 'palette-voxel-blue', 'palette-voxel-yellow', 'palette-voxel-red', 'palette-voxel-lime'];
const offset = 1200 - days.length * pitch;
days.forEach((count, i) => {
  const x = offset + i * pitch, h = height(count);
  if (!h) { ctx.fillStyle = palette['palette-ink-300']; ctx.fillRect(x, bandBottom - voxel, voxel, voxel); return; }
  for (let r = 0; r < h; r++) {
    ctx.fillStyle = palette[layers[Math.min(4, Math.floor((r / rows) * 5))]];
    ctx.fillRect(x, bandBottom - voxel - r * pitch, voxel, voxel);
  }
});

// The portrait, 4 px per voxel, standing on the band.
// No gaps between portrait voxels: at preview sizes, gaps only wash the colours out.
const p = 4, size = 4, originX = 214, originY = bandBottom - rows * pitch - portrait.rows * p - 4;
for (let i = 0; i < portrait.cells.length; i++) {
  const key = portrait.cells[i];
  if (key === '.') continue;
  ctx.fillStyle = palette[portrait.palette[key]];
  ctx.fillRect(originX + (i % portrait.cols) * p, originY + Math.floor(i / portrait.cols) * p, size, size);
}
})();
</script>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
page.on('pageerror', (error) => console.error('og-image page error:', error.message));
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('public/og.png', root).pathname });
await browser.close();
console.log('public/og.png written');
