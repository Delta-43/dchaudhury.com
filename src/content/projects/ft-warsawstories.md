---
title: ft_WarsawStories
order: 4
dates: Aug 2026
event: 42 Warsaw Hacks 2026 · 3rd place
summary: A live community dashboard for 42 Warsaw.
role: I managed the team of 2 and made 17 of the 28 commits.
languages: [Python, TypeScript]
stack: [FastAPI, SQLite, React 19, Vite, Recharts, GitHub Actions]
figure:
  value: 3rd
  label: place at 42 Warsaw Hacks 2026
demo:
  href: https://delta-43.github.io/42-Warsaw-Hacks-ft-Riders/
  note: A static build on synthetic data, with no student data.
---

- Cache-first FastAPI and SQLite backend. Scheduled jobs sync with the 42 Intra API, and the dashboard falls back to the cache when the API is stale.
- Deployed on Railway and GitHub Pages with GitHub Actions.
