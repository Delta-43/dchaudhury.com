---
title: MTG Azor
order: 4
dates: Jul 2026 – present
summary: "A self-hosted AI agent that answers Magic: The Gathering rules questions and checks every citation against its sources."
role: My own project. I designed and built it.
stack: [TypeScript, Python, Docker]
links:
  - label: Reply server code
    href: https://github.com/Delta-43/mtg-rules-agent
note: The main app is private. The reply server is public.
---

- The agent chooses between the Comprehensive Rules (retrieval-augmented generation), live Scryfall card data, official rulings and web search. Then it verifies every citation against the tool results.
- A streaming web app and a Discord bot (`/judge`) share one API.
- Runs on local models or hosted providers.
