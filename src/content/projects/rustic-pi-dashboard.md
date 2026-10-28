---
title: rustic-pi dashboard
order: 9
dates: Oct 2026
summary: A touch dashboard on a Raspberry Pi that watches my 2 main servers and other devices, and controls my smart-home devices.
role: I built it alone. It works today, on my own servers and devices.
languages: [Python]
stack: [Raspberry Pi 3 B+, pygame, Linux framebuffer, Home Assistant, systemd]
---

- No desktop and no browser on the Pi. Python and pygame draw each frame off screen, and only the rows that changed go to the display.
- 9 pages: clock, weather, server stats, health, Home Assistant controls, a terminal mirror, a timer, a gallery and a QR code page.
- A web preview shows the exact screen pixels on a desktop, so I can test a page before it goes on the Pi.
- Styled with Comic Deck, a design system from my design library.
