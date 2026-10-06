// The site's Worker. Static files are served straight from the assets
// binding; only /api/* reaches this code (see run_worker_first in
// wrangler.jsonc).
//
// /api/homelab          GET   The latest report from each server, for /homelab.
// /api/homelab/report   POST  A server's signed report (scripts/homelab-report.py).
//
// Reports are signed with Ed25519. Each server keeps its private key; the
// public keys are in src/data/homelab.json. Only services listed there are
// accepted, so a report can't add anything to the page that isn't public.

import catalogue from '../src/data/homelab.json';

interface Env {
  ASSETS: Fetcher;
  HOMELAB: KVNamespace;
}

type Report = {
  server: string;
  running: number;
  services: Record<string, boolean>;
};

type Stored = Report & { reportedAt: number };

const MAX_BODY = 4096;
const MAX_CLOCK_SKEW = 5 * 60 * 1000;

const securityHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...securityHeaders, ...headers } });

const fromBase64 = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const fromHex = (value: string) =>
  /^[0-9a-f]{128}$/i.test(value) ? Uint8Array.from(value.match(/../g)!, (byte) => Number.parseInt(byte, 16)) : null;

async function verify(publicKey: string, signature: Uint8Array, message: string): Promise<boolean> {
  const key = await crypto.subtle.importKey('raw', fromBase64(publicKey), { name: 'Ed25519' }, false, ['verify']);
  return crypto.subtle.verify({ name: 'Ed25519' }, key, signature, new TextEncoder().encode(message));
}

function validate(value: unknown): Report | null {
  if (!value || typeof value !== 'object') return null;
  const { server, running, services } = value as Record<string, unknown>;
  const entry = catalogue.servers.find((s) => s.id === server);
  if (!entry) return null;
  if (!Number.isInteger(running) || (running as number) < 0 || (running as number) > 500) return null;
  if (!services || typeof services !== 'object' || Array.isArray(services)) return null;
  const allowed = new Set(entry.services.map((s) => s.id));
  const clean: Record<string, boolean> = {};
  for (const [id, up] of Object.entries(services)) {
    if (!allowed.has(id) || typeof up !== 'boolean') return null;
    clean[id] = up;
  }
  return { server: entry.id, running: running as number, services: clean };
}

async function receive(request: Request, env: Env): Promise<Response> {
  const length = Number(request.headers.get('Content-Length') ?? '0');
  if (length > MAX_BODY) return json({ error: 'Report too large' }, 413);
  const body = await request.text();
  if (body.length > MAX_BODY) return json({ error: 'Report too large' }, 413);

  const timestamp = Number(request.headers.get('X-Homelab-Timestamp'));
  const signature = fromHex(request.headers.get('X-Homelab-Signature') ?? '');
  if (!Number.isFinite(timestamp) || !signature) return json({ error: 'Missing signature' }, 401);
  if (Math.abs(Date.now() - timestamp) > MAX_CLOCK_SKEW) return json({ error: 'Clock skew too large' }, 401);

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const report = validate(parsed);
  if (!report) return json({ error: 'Report does not match the catalogue' }, 422);

  const server = catalogue.servers.find((s) => s.id === report.server);
  if (!server?.publicKey) return json({ error: 'Server has no key yet' }, 403);
  if (!(await verify(server.publicKey, signature, `${timestamp}.${body}`))) {
    return json({ error: 'Bad signature' }, 401);
  }

  // Reject replays: each report must be newer than the last one stored.
  const previous = await env.HOMELAB.get<Stored>(`server:${report.server}`, 'json');
  if (previous && previous.reportedAt >= timestamp) return json({ error: 'Stale report' }, 409);

  const stored: Stored = { ...report, reportedAt: timestamp };
  await env.HOMELAB.put(`server:${report.server}`, JSON.stringify(stored));
  return new Response(null, { status: 204 });
}

async function status(env: Env): Promise<Response> {
  const servers = await Promise.all(
    catalogue.servers.map(async (server) => {
      const stored = await env.HOMELAB.get<Stored>(`server:${server.id}`, { type: 'json', cacheTtl: 60 });
      return {
        id: server.id,
        reportedAt: stored?.reportedAt ?? null,
        running: stored?.running ?? null,
        services: stored?.services ?? {},
      };
    }),
  );
  return json({ generatedAt: Date.now(), servers }, 200, { 'Cache-Control': 'public, max-age=60' });
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/homelab') {
      return request.method === 'GET' ? status(env) : json({ error: 'Method not allowed' }, 405, { Allow: 'GET' });
    }
    if (pathname === '/api/homelab/report') {
      return request.method === 'POST' ? receive(request, env) : json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
    }
    if (pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
