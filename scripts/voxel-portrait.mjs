// Turns a cut-out portrait (PNG with a transparent background) into a grid of
// voxels in the Vienna Voxel palette, saved to src/data/voxel-portrait.json.
//
// Usage: node scripts/voxel-portrait.mjs <cutout.png> [--cols 44] [--preview out.png]
//
// Each cell is the average colour of its block of pixels. Mostly transparent
// cells stay empty; the rest get a colour from a tone ramp (see below).
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const args = process.argv.slice(2);
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
if (!input) {
  console.error('usage: node scripts/voxel-portrait.mjs <cutout.png> [--cols 44] [--preview out.png]');
  process.exit(2);
}

let cols = Number(option('--cols', 44));
const previewPath = option('--preview', null);
// Keep only the top part of the cut-out (head and shoulders), as a fraction of its height.
const keep = Number(option('--keep', 1));
// Below this chroma (CIELAB), a cell counts as grey.
const minChroma = Number(option('--min-chroma', 18));
// Ordered dithering between neighbouring ramp steps (0 = off, 1 = full).
const dither = Number(option('--dither', 0));
// Contrast stretch around mid-grey before matching (1 = unchanged).
const contrast = Number(option('--contrast', 1));
// Histogram equalisation of lightness across the figure (0 = off, 1 = full),
// so the darkest and lightest cells use the ends of each ramp.
const equalize = Number(option('--equalize', 0));
const OUT = new URL('../src/data/voxel-portrait.json', import.meta.url);

// Token names from tokens.css, and their light-theme values for matching.
// One character per cell: "." is empty, letters index into this list.
const PALETTE = [
  { key: 'a', token: 'palette-ink-800', hex: '#2a2a2a' },
  { key: 'b', token: 'palette-ink-600', hex: '#6b6b6b' },
  { key: 'c', token: 'palette-ink-300', hex: '#d4d4d4' },
  { key: 'd', token: 'palette-ink-100', hex: '#f0f0f0' },
  { key: 'e', token: 'palette-voxel-navy', hex: '#1c2541' },
  { key: 'f', token: 'palette-voxel-blue', hex: '#3b5bd9' },
  { key: 'g', token: 'palette-voxel-violet', hex: '#6c4cf1' },
  { key: 'h', token: 'palette-voxel-yellow', hex: '#f6c21c' },
  { key: 'i', token: 'palette-voxel-red', hex: '#e0492a' },
  { key: 'j', token: 'palette-voxel-lime', hex: '#b7e33a' },
];

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

function lab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const x = (0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.95047;
  const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  const z = (0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27) * t / 116 + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const paletteLab = PALETTE.map((p) => lab(hexToRgb(p.hex)));

const image = sharp(input).ensureAlpha();
const trimmed = await image.trim({ threshold: 0 }).raw().toBuffer({ resolveWithObject: true });
const { data, info } = trimmed;
const cell = info.width / cols;
let rows = Math.round((info.height * keep) / cell);

// First pass: average colour (in Lab) and coverage of every cell.
const grid = [];
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const x0 = Math.floor(col * cell);
    const x1 = Math.min(info.width, Math.floor((col + 1) * cell));
    const y0 = Math.floor(row * cell);
    const y1 = Math.min(info.height, Math.floor((row + 1) * cell));
    let r = 0;
    let g = 0;
    let b = 0;
    let alpha = 0;
    let count = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * info.width + x) * 4;
        const a = data[i + 3] / 255;
        r += data[i] * a;
        g += data[i + 1] * a;
        b += data[i + 2] * a;
        alpha += a;
        count++;
      }
    }
    const filled = count > 0 && alpha / count >= 0.5;
    const value = filled ? lab([r / alpha, g / alpha, b / alpha]) : null;
    if (value) value[0] = Math.min(100, Math.max(0, 50 + (value[0] - 50) * contrast));
    grid.push(value);
  }
}

if (equalize) {
  const filled = grid.filter(Boolean);
  const sorted = filled.map((v) => v[0]).sort((x, y) => x - y);
  const rank = (l) => {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < l) lo = mid + 1;
      else hi = mid;
    }
    return lo / Math.max(1, sorted.length - 1);
  };
  for (const value of filled) {
    const target = 12 + 86 * rank(value[0]);
    value[0] = value[0] + (target - value[0]) * equalize;
  }
}

// Second pass: pick a colour family from the hue, then a step on that
// family's dark-to-light ramp from the lightness. Lightness carries the
// likeness; hue only decides which colours a region uses.
const byToken = (token) => PALETTE.findIndex((p) => p.token === token);
const RAMPS = {
  neutral: ['palette-ink-800', 'palette-ink-600', 'palette-ink-300', 'palette-ink-100'],
  warm: ['palette-ink-800', 'palette-voxel-red', 'palette-voxel-yellow', 'palette-ink-100'],
  cool: ['palette-voxel-navy', 'palette-voxel-blue', 'palette-ink-300', 'palette-ink-100'],
  violet: ['palette-voxel-navy', 'palette-voxel-violet', 'palette-ink-300', 'palette-ink-100'],
  green: ['palette-ink-800', 'palette-ink-600', 'palette-voxel-lime', 'palette-ink-100'],
};
const rampSteps = Object.fromEntries(
  Object.entries(RAMPS).map(([name, tokens]) => [
    name,
    tokens.map((token) => ({ index: byToken(token), l: paletteLab[byToken(token)][0] })),
  ]),
);

function family([, a, b]) {
  const chroma = Math.hypot(a, b);
  if (chroma < minChroma) return 'neutral';
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  const h = hue < 0 ? hue + 360 : hue;
  if (h < 105 || h >= 345) return 'warm';
  if (h < 170) return 'green';
  if (h < 285) return 'cool';
  return 'violet';
}

// 4 × 4 Bayer matrix for ordered dithering between two neighbouring steps.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

let cells = '';
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const value = grid[row * cols + col];
    if (!value) {
      cells += '.';
      continue;
    }
    const steps = rampSteps[family(value)];
    const l = value[0];
    let index = steps[steps.length - 1].index;
    for (let s = 0; s < steps.length - 1; s++) {
      const low = steps[s];
      const high = steps[s + 1];
      if (l <= high.l || s === steps.length - 2) {
        const t = Math.min(1, Math.max(0, (l - low.l) / (high.l - low.l)));
        // Without dithering, round to the nearer step; with it, mix by position.
        const threshold = dither ? 0.5 + (BAYER[(row % 4) * 4 + (col % 4)] - 0.5) * dither : 0.5;
        index = t < threshold ? low.index : high.index;
        break;
      }
    }
    cells += PALETTE[index].key;
  }
}

// Drop empty columns and rows left over from cropping.
const filledAt = (c, r) => cells[r * cols + c] !== '.';
const usedCols = [...Array(cols).keys()].filter((c) => [...Array(rows).keys()].some((r) => filledAt(c, r)));
const usedRows = [...Array(rows).keys()].filter((r) => [...Array(cols).keys()].some((c) => filledAt(c, r)));
const [left, right] = [usedCols[0], usedCols.at(-1)];
const [top, bottom] = [usedRows[0], usedRows.at(-1)];
cells = usedRows.length
  ? [...Array(bottom - top + 1).keys()].map((r) => cells.slice((top + r) * cols + left, (top + r) * cols + right + 1)).join('')
  : '';
cols = right - left + 1;
rows = bottom - top + 1;

const result = {
  cols,
  rows,
  palette: Object.fromEntries(PALETTE.map((p) => [p.key, p.token])),
  cells,
};
writeFileSync(OUT, `${JSON.stringify(result)}\n`);
console.log(`Saved ${cols} × ${rows} voxels.`);

if (previewPath) {
  const scale = 12;
  const gap = 1;
  const pitch = scale + gap;
  const width = cols * pitch;
  const height = rows * pitch;
  const pixels = Buffer.alloc(width * height * 4, 255);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = cells[row * cols + col];
      if (key === '.') continue;
      const rgb = hexToRgb(PALETTE.find((p) => p.key === key).hex);
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const i = ((row * pitch + y) * width + col * pitch + x) * 4;
          pixels[i] = rgb[0];
          pixels[i + 1] = rgb[1];
          pixels[i + 2] = rgb[2];
        }
      }
    }
  }
  await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toFile(previewPath);
  console.log(`Preview: ${previewPath}`);
}
