# dchaudhury.com

Source for [dchaudhury.com](https://dchaudhury.com), the portfolio of Debadeep Chaudhury: software development and data engineering, with research, teaching and writing behind it.

## How it's built

- [Astro](https://astro.build), static output, TypeScript strict, no UI framework. Page text lives in Markdown content collections under `src/content`.
- Design: the Vienna Voxel system. Schibsted Grotesk and DM Mono are self-hosted (SIL Open Font License); icons are from Lucide (ISC).
- Hosting: Cloudflare Workers with static assets. Every push to `main` deploys, and every pull request gets a preview.
- The voxel band on the home page is my GitHub contribution calendar. `pnpm contributions` refreshes `src/data/contributions.json`.
- [`/homelab`](https://dchaudhury.com/homelab) shows the live status of my two servers. Each server runs `scripts/homelab-report.py`, which signs a short summary with its own Ed25519 key. `worker/index.ts` checks the signature against the public keys in `src/data/homelab.json` and only accepts the services listed there.

## Run it locally

```sh
pnpm install
pnpm dev                 # Astro dev server
pnpm check               # astro check, plus type checks for the Worker
pnpm build
pnpm exec wrangler dev   # the built site with the Worker, as in production
```
