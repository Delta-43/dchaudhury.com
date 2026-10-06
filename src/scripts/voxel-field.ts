// Draws the voxel band: one column per day of GitHub contributions, newest on
// the right. Column height grows with the day's count (log scale, so one busy
// day doesn't flatten the rest). Colour follows height, like contour bands on a
// map. Days with no contributions keep a single grey voxel as the baseline.

const GAP = 1;
const DURATION = 1800;
const LAYERS = 5;

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const yearFormat = new Intl.DateTimeFormat('en-GB', { year: 'numeric', timeZone: 'UTC' });

function formatRange(from: Date, to: Date): string {
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const start = sameYear ? dateFormat.format(from) : `${dateFormat.format(from)} ${yearFormat.format(from)}`;
  return `${start} – ${dateFormat.format(to)} ${yearFormat.format(to)}`;
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function mountVoxelField(root: HTMLElement): void {
  const canvas = root.querySelector('canvas');
  const range = root.querySelector<HTMLElement>('[data-range]');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;

  const counts: number[] = JSON.parse(root.dataset.counts ?? '[]');
  const first = new Date(`${root.dataset.start}T00:00:00Z`);
  const rows = Number(root.dataset.rows ?? 10);
  const peak = Math.max(2, ...counts);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  const heightOf = (count: number) =>
    count <= 0 ? 0 : Math.max(1, Math.round(1 + (Math.log2(count) / Math.log2(peak)) * (rows - 1)));

  let voxel = 12;
  let columns: number[] = [];
  let colours: string[] = [];
  let baseline = '';
  let progress = 0;
  let frame = 0;

  function readColours() {
    const style = getComputedStyle(root);
    colours = Array.from({ length: LAYERS }, (_, i) => style.getPropertyValue(`--color-voxel-${i + 1}`).trim());
    baseline = style.getPropertyValue('--color-border').trim();
  }

  function measure() {
    const style = getComputedStyle(root);
    voxel = Number.parseFloat(style.getPropertyValue('--voxel')) || 12;
    const pitch = voxel + GAP;
    const count = Math.max(1, Math.floor((root.clientWidth + GAP) / pitch));
    const visible = counts.slice(-count);
    columns = visible.map(heightOf);

    const ratio = window.devicePixelRatio || 1;
    const width = columns.length * pitch - GAP;
    const height = rows * pitch - GAP;
    canvas!.width = Math.round(width * ratio);
    canvas!.height = Math.round(height * ratio);
    canvas!.style.inlineSize = `${width}px`;
    canvas!.style.blockSize = `${height}px`;
    context!.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (range) {
      const from = new Date(first);
      from.setUTCDate(from.getUTCDate() + counts.length - visible.length);
      const to = new Date(first);
      to.setUTCDate(to.getUTCDate() + counts.length - 1);
      range.textContent = formatRange(from, to);
    }
  }

  function draw() {
    const pitch = voxel + GAP;
    const total = columns.length;
    context!.clearRect(0, 0, total * pitch, rows * pitch);

    columns.forEach((target, i) => {
      const x = i * pitch;
      const bottom = (rows - 1) * pitch;
      if (target === 0) {
        context!.fillStyle = baseline;
        context!.fillRect(x, bottom, voxel, voxel);
        return;
      }
      // Columns rise from left to right, each over the last 40% of its window.
      const delay = (i / total) * 0.6;
      const local = Math.min(1, Math.max(0, (progress - delay) / 0.4));
      const height = Math.max(1, Math.round(target * easeOut(local)));
      for (let r = 0; r < height; r++) {
        context!.fillStyle = colours[Math.min(LAYERS - 1, Math.floor((r / rows) * LAYERS))];
        context!.fillRect(x, bottom - r * pitch, voxel, voxel);
      }
    });
  }

  function animate(start: number) {
    const step = (now: number) => {
      progress = Math.min(1, (now - start) / DURATION);
      draw();
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }

  readColours();
  measure();
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    progress = 1;
    draw();
  } else {
    // Draw the resting state, then rise once the band is on screen, so the
    // reveal isn't spent below the fold.
    draw();
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        animate(performance.now());
      },
      { threshold: 0.3 },
    );
    observer.observe(root);
  }

  let lastWidth = root.clientWidth;
  new ResizeObserver(() => {
    if (root.clientWidth === lastWidth) return;
    lastWidth = root.clientWidth;
    measure();
    draw();
  }).observe(root);

  const recolour = () => {
    readColours();
    draw();
  };
  new MutationObserver(recolour).observe(document.documentElement, { attributeFilter: ['data-theme'] });
  darkScheme.addEventListener('change', recolour);
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    cancelAnimationFrame(frame);
    progress = 1;
    draw();
  });
}
