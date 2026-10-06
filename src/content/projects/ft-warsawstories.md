---
title: ft_WarsawStories
order: 3
dates: Aug 2026
event: 42 Warsaw Hacks 2026 · 3rd place
summary: A live community dashboard for 42 Warsaw.
role: I managed the team of 2 and made most of the commits.
stack: [FastAPI, SQLite, React 19, TypeScript, Vite, Recharts, GitHub Actions]
figure:
  value: 3rd
  label: place at 42 Warsaw Hacks 2026
links:
  - label: Live dashboard
    href: https://delta-43.github.io/42-Warsaw-Hacks-ft-Riders/
  - label: Code
    href: https://github.com/Delta-43/42-Warsaw-Hacks-ft-Riders
---

- Cache-first FastAPI and SQLite backend. Scheduled jobs sync with the 42 Intra API, and the dashboard falls back to the cache when the API is stale.
- Deployed on Railway and GitHub Pages with GitHub Actions.
