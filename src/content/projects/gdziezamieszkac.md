---
title: GdzieZamieszkać
order: 1
dates: Oct 2026
event: HackYeah 2026 · Top 10, Artificial Intelligence track
summary: Compares Kraków's 18 districts on 51 measures from public data, with the source, date and caveat on every number.
role: I coordinated the team of 3 and built the backend, the data layer and the city service, with 131 of the 208 commits.
languages: [Python, TypeScript, SQL]
stack: [FastAPI, PostgreSQL, PostGIS, React 19, OpenRouter, Docker]
figure:
  value: "161"
  label: offline tests for the data API's 16 operations
---

- PostgreSQL with PostGIS: 22 migrations, 47 of the 51 measures populated.
- The city service writes district reports with a language model through OpenRouter. A guard drops any text that contains a number not in the source facts (31 tests).
- React 19 and TypeScript frontend in Polish and English.
- A hackathon prototype, not kept online. Warsaw in Numbers takes its place.
