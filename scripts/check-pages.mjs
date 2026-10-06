// Checks every built page in a real browser, in light and dark themes:
// - axe-core accessibility rules for WCAG 2.0, 2.1 and 2.2 A and AA
// - no requests to any host other than the site itself (no third parties)
//
// Usage: node scripts/check-pages.mjs [base-url]   (default http://127.0.0.1:8787)
// Serve the built site first, for example with `pnpm exec wrangler dev`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8787';
const DIST = new URL('../dist/', import.meta.url).pathname;
const AXE = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    if (!name.endsWith('.html')) return [];
    const route = `/${relative(DIST, path)}`.replace(/\.html$/, '').replace(/\/index$/, '/');
    return [route === '/404' ? '/this-page-does-not-exist' : route];
  });
}

const routes = pages(DIST).sort();
const site = new URL(BASE).host;
const browser = await chromium.launch();
let failures = 0;

for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({ colorScheme: scheme, reducedMotion: 'reduce' });
  for (const route of routes) {
    const page = await context.newPage();
    const external = new Set();
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith('http') && url.host !== site) external.add(url.origin);
    });
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.addScriptTag({ content: AXE });
    const result = await page.evaluate((tags) => window.axe.run(document, { runOnly: tags }), TAGS);

    for (const violation of result.violations) {
      failures++;
      const where = violation.nodes.map((node) => node.target.join(' ')).slice(0, 3).join(' | ');
      console.log(`✗ ${scheme} ${route}: ${violation.id} (${violation.impact}) ${violation.help} → ${where}`);
    }
    for (const origin of external) {
      failures++;
      console.log(`✗ ${scheme} ${route}: request to a third party: ${origin}`);
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
console.log(`${routes.length} pages × 2 themes checked, ${failures} problem(s).`);
process.exit(failures ? 1 : 0);
