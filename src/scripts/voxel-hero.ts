// The home page hero: a field of drifting voxels, and the voxel portrait drawn
// on the same canvas.
//
// Field voxels fade in, drift slowly and lean towards the pointer, each by its
// own amount, so the field has depth (the same model as Magic UI's Particles).
// The portrait's voxels fly in from the field the first time it comes into
// view, then step aside from the pointer and settle back.
//
// Without JavaScript, or with reduced motion, none of this runs and the static
// SVG portrait shows instead.

import portrait from '../data/voxel-portrait.json';

const STATICITY = 50;
const EASE = 50;
const FIELD_DENSITY = 9000; // one field voxel per this many square pixels
const REPEL_RADIUS = 90;
const REPEL_DISTANCE = 22;
const FLIGHT = 1000; // ms for one portrait voxel to reach its place
const STAGGER = 800; // ms between the bottom row starting and the top row starting

type Particle = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  colour: number;
  alpha: number;
  targetAlpha: number;
  magnetism: number;
  tx: number;
  ty: number;
};

type Voxel = {
  col: number;
  row: number;
  colour: number;
  startX: number;
  startY: number;
  delay: number;
  ox: number;
  oy: number;
};

const easeOut = (t: number) => 1 - (1 - t) ** 4;
// Per-frame rates are tuned for 60 Hz; this turns them into per-step rates,
// so drift and easing feel the same on 120 Hz screens.
const FRAME = 1000 / 60;
const lerpFactor = (perFrame: number, steps: number) => 1 - (1 - perFrame) ** steps;
const random = (min: number, max: number) => min + Math.random() * (max - min);

export function mountVoxelHero(stage: HTMLElement): void {
  const canvas = stage.querySelector<HTMLCanvasElement>('canvas.voxel-sky');
  const svg = stage.querySelector<SVGSVGElement>('svg.voxel-portrait');
  const context = canvas?.getContext('2d');
  if (!canvas || !svg || !context) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = context;

  const { cols, rows, cells, palette } = portrait as {
    cols: number;
    rows: number;
    cells: string;
    palette: Record<string, string>;
  };
  const keys = Object.keys(palette);
  const fieldTokens = ['color-voxel-1', 'color-voxel-2', 'color-voxel-3', 'color-voxel-4', 'color-voxel-5', 'palette-voxel-violet'];

  // Portrait voxels, grouped by colour so each colour is one fillStyle change.
  const voxels: Voxel[] = [];
  const grid: (Voxel | undefined)[] = new Array(cols * rows);
  for (let i = 0; i < cells.length; i++) {
    const key = cells[i];
    if (key === '.') continue;
    const angle = Math.random() * Math.PI * 2;
    const distance = random(80, 320);
    const row = Math.floor(i / cols);
    const voxel: Voxel = {
      col: i % cols,
      row,
      colour: keys.indexOf(key),
      startX: Math.cos(angle) * distance,
      startY: Math.sin(angle) * distance,
      delay: ((rows - 1 - row) / rows) * STAGGER + random(0, 200),
      ox: 0,
      oy: 0,
    };
    voxels.push(voxel);
    grid[i] = voxel;
  }
  const byColour = keys.map((_, k) => voxels.filter((v) => v.colour === k));

  let width = 0;
  let height = 0;
  let ratio = 1;
  let pitch = 4;
  let size = 3;
  let originX = 0;
  let originY = 0;
  let portraitColours: string[] = [];
  let fieldColours: string[] = [];
  let particles: Particle[] = [];
  let pointer: { x: number; y: number } | null = null;
  // Field voxels fade out near the text, so they never sit behind it.
  let keepout: { left: number; top: number; right: number; bottom: number } | null = null;
  const KEEPOUT_FADE = 24;
  const active = new Set<Voxel>();
  const cache = document.createElement('canvas');

  // Assembly state: null until the portrait first comes into view.
  let assemblyStart: number | null = null;
  let assembled = false;
  let frame = 0;
  let running = false;
  let lastTime = 0;

  function readColours() {
    const style = getComputedStyle(document.documentElement);
    portraitColours = keys.map((key) => style.getPropertyValue(`--${palette[key]}`).trim());
    fieldColours = fieldTokens.map((token) => style.getPropertyValue(`--${token}`).trim());
  }

  function newParticle(): Particle {
    return {
      x: random(0, width),
      y: random(0, height),
      dx: random(-0.1, 0.1),
      dy: random(-0.1, 0.1),
      size: Math.random() < 0.8 ? size : size * 2 + 1,
      colour: Math.floor(Math.random() * fieldColours.length),
      alpha: 0,
      targetAlpha: random(0.15, 0.6),
      magnetism: random(0.1, 4),
      tx: 0,
      ty: 0,
    };
  }

  function measure() {
    const stageRect = stage.getBoundingClientRect();
    const svgRect = svg!.getBoundingClientRect();
    width = stage.clientWidth;
    height = stage.clientHeight;
    ratio = window.devicePixelRatio || 1;
    canvas!.width = Math.round(width * ratio);
    canvas!.height = Math.round(height * ratio);
    canvas!.style.inlineSize = `${width}px`;
    canvas!.style.blockSize = `${height}px`;

    // The SVG is sized to a whole number of pixels per voxel; match it.
    pitch = Math.max(2, Math.round(Math.min(svgRect.width / cols, svgRect.height / rows)));
    size = pitch >= 4 ? pitch - 1 : pitch;
    originX = Math.round(svgRect.left - stageRect.left);
    originY = Math.round(svgRect.bottom - stageRect.top - rows * pitch);

    const text = stage.querySelector<HTMLElement>('[data-voxel-keepout]');
    if (text) {
      const r = text.getBoundingClientRect();
      keepout = { left: r.left - stageRect.left, top: r.top - stageRect.top, right: r.right - stageRect.left, bottom: r.bottom - stageRect.top };
    }

    const target = Math.min(220, Math.max(40, Math.round((width * height) / FIELD_DENSITY)));
    particles = particles.slice(0, target).map((p) => ({ ...p, x: Math.min(p.x, width), y: Math.min(p.y, height) }));
    while (particles.length < target) particles.push(newParticle());

    renderCache();
  }

  // The portrait at rest, drawn once; frames copy it and only redraw voxels
  // that the pointer has moved.
  function renderCache() {
    cache.width = Math.round(cols * pitch * ratio);
    cache.height = Math.round(rows * pitch * ratio);
    const c = cache.getContext('2d');
    if (!c) return;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    byColour.forEach((group, k) => {
      c.fillStyle = portraitColours[k];
      for (const v of group) c.fillRect(v.col * pitch, v.row * pitch, size, size);
    });
  }

  function drawField(steps: number) {
    const pull = lerpFactor(1 / EASE, steps);
    const pointerX = pointer ? pointer.x - width / 2 : 0;
    const pointerY = pointer ? pointer.y - height / 2 : 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // Fade towards the edges, then towards the particle's own target.
      const edge = Math.min(p.x + p.tx, width - p.x - p.tx, p.y + p.ty, height - p.y - p.ty);
      const edgeFactor = Math.min(1, Math.max(0, edge / 20));
      p.alpha = Math.min(p.targetAlpha, p.alpha + 0.02 * steps);
      p.x += p.dx * steps;
      p.y += p.dy * steps;
      p.tx += (pointerX / (STATICITY / p.magnetism) - p.tx) * pull;
      p.ty += (pointerY / (STATICITY / p.magnetism) - p.ty) * pull;
      if (p.x < -p.size || p.x > width + p.size || p.y < -p.size || p.y > height + p.size) {
        particles[i] = newParticle();
        continue;
      }
      let keepoutFactor = 1;
      if (keepout) {
        const px = p.x + p.tx;
        const py = p.y + p.ty;
        const dx = Math.max(keepout.left - px, 0, px - keepout.right);
        const dy = Math.max(keepout.top - py, 0, py - keepout.bottom);
        keepoutFactor = Math.min(1, Math.hypot(dx, dy) / KEEPOUT_FADE);
      }
      ctx.globalAlpha = p.alpha * edgeFactor * keepoutFactor;
      ctx.fillStyle = fieldColours[p.colour];
      ctx.fillRect(Math.round(p.x + p.tx), Math.round(p.y + p.ty), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawAssembly(now: number) {
    const elapsed = now - (assemblyStart ?? now);
    let done = true;
    byColour.forEach((group, k) => {
      ctx.fillStyle = portraitColours[k];
      for (const v of group) {
        const t = (elapsed - v.delay) / FLIGHT;
        if (t <= 0) {
          done = false;
          continue;
        }
        if (t < 1) done = false;
        const e = easeOut(Math.min(1, t));
        const x = originX + v.col * pitch + v.startX * (1 - e);
        const y = originY + v.row * pitch + v.startY * (1 - e);
        ctx.fillRect(Math.round(x), Math.round(y), size, size);
      }
    });
    if (done) assembled = true;
  }

  function updateRepel(steps: number) {
    const settle = lerpFactor(0.18, steps);
    if (pointer) {
      const minCol = Math.max(0, Math.floor((pointer.x - originX - REPEL_RADIUS) / pitch));
      const maxCol = Math.min(cols - 1, Math.ceil((pointer.x - originX + REPEL_RADIUS) / pitch));
      const minRow = Math.max(0, Math.floor((pointer.y - originY - REPEL_RADIUS) / pitch));
      const maxRow = Math.min(rows - 1, Math.ceil((pointer.y - originY + REPEL_RADIUS) / pitch));
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const v = grid[row * cols + col];
          if (v) active.add(v);
        }
      }
    }
    for (const v of active) {
      let targetX = 0;
      let targetY = 0;
      if (pointer) {
        const cx = originX + v.col * pitch + pitch / 2;
        const cy = originY + v.row * pitch + pitch / 2;
        const ddx = cx - pointer.x;
        const ddy = cy - pointer.y;
        const distance = Math.hypot(ddx, ddy);
        if (distance < REPEL_RADIUS && distance > 0.01) {
          const push = REPEL_DISTANCE * (1 - distance / REPEL_RADIUS) ** 2;
          targetX = (ddx / distance) * push;
          targetY = (ddy / distance) * push;
        }
      }
      v.ox += (targetX - v.ox) * settle;
      v.oy += (targetY - v.oy) * settle;
      if (targetX === 0 && targetY === 0 && Math.abs(v.ox) < 0.3 && Math.abs(v.oy) < 0.3) {
        v.ox = 0;
        v.oy = 0;
        active.delete(v);
      }
    }
  }

  function drawPortrait() {
    ctx.drawImage(cache, originX, originY, cols * pitch, rows * pitch);
    if (active.size === 0) return;
    for (const v of active) ctx.clearRect(originX + v.col * pitch, originY + v.row * pitch, size, size);
    for (const v of active) {
      ctx.fillStyle = portraitColours[v.colour];
      ctx.fillRect(Math.round(originX + v.col * pitch + v.ox), Math.round(originY + v.row * pitch + v.oy), size, size);
    }
  }

  function tick(now: number) {
    const steps = lastTime ? Math.min(3, (now - lastTime) / FRAME) : 1;
    lastTime = now;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawField(steps);
    if (assemblyStart !== null) {
      if (assembled) {
        updateRepel(steps);
        drawPortrait();
      } else {
        drawAssembly(now);
      }
    }
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = 0;
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  readColours();
  measure();
  svg.style.opacity = '0';

  new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) start();
    else stop();
  }).observe(stage);

  new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      assemblyStart = performance.now();
    },
    { threshold: 0.3 },
  ).observe(svg);

  window.addEventListener(
    'pointermove',
    (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height ? { x, y } : null;
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    pointer = null;
  });

  let lastWidth = stage.clientWidth;
  let lastHeight = stage.clientHeight;
  new ResizeObserver(() => {
    if (stage.clientWidth === lastWidth && stage.clientHeight === lastHeight) return;
    lastWidth = stage.clientWidth;
    lastHeight = stage.clientHeight;
    measure();
  }).observe(stage);

  const recolour = () => {
    readColours();
    renderCache();
  };
  new MutationObserver(recolour).observe(document.documentElement, { attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolour);
}
