---
title: Warsaw Geeks meetup bot
order: 7
dates: Oct 2026
event: Live on the Warsaw Geeks Discord server
summary: A Discord bot that runs the meetups for Warsaw Geeks, the board-game community I have managed for over 4 years.
role: I built it alone. It replaced the third-party bot the server used for events.
languages: [Python]
stack: [discord.py, iCalendar]
figure:
  value: 100+
  label: members, meeting every Friday with 8 to 20 people
---

- Each meetup gets a Discord event, a card with Going, Maybe and Can't go buttons, a live headcount and an optional waitlist.
- Each meetup also gets a chat thread, with reminders 24 hours and 1 hour before the start. Calendar links for Google and Outlook, and an `.ics` file for other apps.
- Repeating meetups create their next date when the current one ends. Every Monday, the bot posts the week's meetups.
- It also runs the front door: an introduction of at least 100 characters unlocks the full server, and a roles panel lets members pick their interests.
