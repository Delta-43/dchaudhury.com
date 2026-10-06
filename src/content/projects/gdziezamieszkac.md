---
title: GdzieZamieszkać
order: 1
dates: Oct 2026
event: HackYeah 2026 · Top 10, Artificial Intelligence track
summary: Compares Kraków's 18 districts on 51 measures from public data, with the source, date and caveat on every number.
role: I coordinated the team of 3 and built the backend, the data layer and the city service.
stack: [FastAPI, PostgreSQL, PostGIS, React 19, TypeScript, OpenRouter, Docker]
figure:
  value: "161"
  label: offline tests for the data API's 16 operations
links:
  - label: Code
    href: https://github.com/Delta-43/GdzieZamieszkac
---

- PostgreSQL with PostGIS: 22 migrations, 47 of the 51 measures populated.
- The city service writes district reports with a language model through OpenRouter. A guard drops any text that contains a number not in the source facts (31 tests).
- React 19 and TypeScript frontend in Polish and English.
