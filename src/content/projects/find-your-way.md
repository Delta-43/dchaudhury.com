---
title: Find YOUR way
order: 1
dates: Oct 2026
event: Warsaw Open Data Hackathon 2026 · Top 10, Challenge 1 (Warsaw 2076)
summary: A calm, guided walk through Warsaw on open data. You say how you feel, and it picks an outing and draws the street route.
role: I managed the team of 5 and owned the architecture, routing, AI, the MCP server, integration and the API contract. I made 28 of the 81 commits in the 24-hour window.
languages: [Python, TypeScript]
stack: [FastAPI, Pydantic, SQLite, OSRM, MCP, React 19, MapLibre GL JS, Docker Compose]
figure:
  value: "104"
  label: backend tests (pytest) for 7 API routes
---

- A language model through OpenRouter picks one of 6 predefined outings from the user's words, with a keyword fallback when no key is set. OSRM draws the street route, and a committed route cache keeps the demo working offline.
- A dark 3D map lights up only along the route: buildings, parks, culture, public transport stops and moving vehicles from the ZTM Warsaw GTFS timetable. Every number is labelled real, estimated or simulated.
- A Streamable HTTP MCP server lets an AI agent use the same planner.
- I split the team into a backend pair and a frontend trio, ran the work through GitHub issues and small reviewed pull requests, and set a feature freeze 5 hours before the deadline.
