export const site = {
  name: 'Debadeep Chaudhury',
  url: 'https://dchaudhury.com',
  location: 'Warsaw, Poland',
  email: { user: 'contact', domain: 'dchaudhury.com' },
  discord: '@delta._.43',
  repo: 'https://github.com/Delta-43/dchaudhury.com',
  profiles: {
    linkedin: 'https://www.linkedin.com/in/dchaudhury',
    github: 'https://github.com/Delta-43',
    orcid: 'https://orcid.org/0000-0002-9089-732X',
    scholar: 'https://scholar.google.com/citations?user=zDcS-78AAAAJ',
  },
} as const;

export const nav = [
  { href: '/work', label: 'Work' },
  { href: '/research', label: 'Research' },
  { href: '/teaching', label: 'Teaching and writing' },
  { href: '/cv', label: 'CV' },
  { href: '/contact', label: 'Contact' },
] as const;
