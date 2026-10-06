// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://dchaudhury.com',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [
    // /cv repeats /cv/software, so only the focus URLs go in the sitemap.
    sitemap({ filter: (page) => page !== 'https://dchaudhury.com/cv' }),
  ],
});
