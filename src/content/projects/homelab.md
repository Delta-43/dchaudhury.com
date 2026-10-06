---
title: Homelab
order: 6
summary: An Ubuntu home server that runs my tools, demos and automation.
role: I set it up and run it.
stack: [Ubuntu 26.04 LTS, Docker Compose, Caddy, Cloudflare Tunnel, Tailscale, PostgreSQL 18, Ollama]
figure:
  value: "25"
  label: Docker containers in 16 Docker Compose stacks
---

- A Caddy reverse proxy and 5 Cloudflare Tunnels. I reach the server over Tailscale.
- Gitea, n8n, MinIO object storage, SearXNG and 2 custom MCP servers, Home Assistant with MQTT, and Beszel monitoring.
- Its live status is on the [Homelab page](/homelab).
