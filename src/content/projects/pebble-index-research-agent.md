---
title: Pebble Index research agent
order: 8
dates: Aug – Sept 2026
summary: Turns a voice note on a Pebble Index 01 ring into a researched, tagged note in Obsidian.
role: My own project. I designed and built the workflow.
stack: [n8n, MCP, Obsidian, MinIO, Docker, Ubuntu]
---

- Voice note, then an n8n workflow, then AI research through MCP servers, then a tagged note in an Obsidian vault.
- The vault syncs through Self-hosted LiveSync on MinIO. Everything runs on a headless Ubuntu server with Docker.
