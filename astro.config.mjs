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
    // The hardware page is noindex, so it stays out too.
    sitemap({
      filter: (page) => !['https://dchaudhury.com/cv', 'https://dchaudhury.com/homelab/specs'].includes(page),
    }),
  ],
});
