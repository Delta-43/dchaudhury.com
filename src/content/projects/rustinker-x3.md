---
title: RustInker-X3
order: 10
dates: Oct – Nov 2026
event: Open source, v0.1.1
summary: "Rust firmware that turns the Xteink X3 e-reader into an offline article reader and a Magic: The Gathering token display, fed from my own server."
role: I built it alone, from the first hardware notes to the release. It runs every day on my own X3.
languages: [Rust]
stack: [ESP32-C3, no_std, esp-hal, Embassy, TLS 1.3, axum, SQLite, Docker]
figure:
  value: 3,162
  label: simulated power cuts during writes, all recovered
---

- I send a web page, an email summary, a card token or a picture to a small Rust server at home. When I press Receive, the X3 joins Wi-Fi, pulls what is waiting, checks each item's SHA-256, saves it to the microSD card and turns Wi-Fi off.
- The chip has about 380 KB of RAM, so the server does the heavy work: page extraction, image dithering and layout. The device gets pages ready to draw.
- It installs next to the stock firmware, not over it. A menu on the device switches back, with no computer.
- Shared logic is `no_std` Rust, tested on a PC first (220 host tests) and drawn screen by screen in a simulator.
- Not done yet: a 7-day battery run, a 24-hour soak test and testing on a second unit.
