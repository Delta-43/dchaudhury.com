// Saves Delta's public GitHub contribution calendar to src/data/contributions.json.
// The site reads that file at build time, so the browser never calls GitHub.
//
// Usage: GITHUB_TOKEN=<token> pnpm contributions   (falls back to `gh auth token`)
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const LOGIN = 'Delta-43';
const OUT = new URL('../src/data/contributions.json', import.meta.url);

const token = process.env.GITHUB_TOKEN ?? execSync('gh auth token', { encoding: 'utf8' }).trim();

const query = `query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { login: LOGIN } }),
});
if (!res.ok) throw new Error(`GitHub returned ${res.status}`);

const json = await res.json();
const calendar = json.data.user.contributionsCollection.contributionCalendar;
const days = calendar.weeks
  .flatMap((week) => week.contributionDays)
  .map((day) => [day.date, day.contributionCount]);

const data = {
  source: `https://github.com/${LOGIN}`,
  total: calendar.totalContributions,
  from: days[0][0],
  to: days.at(-1)[0],
  days,
};

writeFileSync(OUT, `${JSON.stringify(data)}\n`);
console.log(`Saved ${days.length} days (${data.from} to ${data.to}), ${data.total} contributions.`);
