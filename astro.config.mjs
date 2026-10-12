import { defineConfig } from 'astro/config';

// SITE_URL / SITE_BASE let the same code deploy to the GitHub Pages preview
// address (https://benvlehmann.github.io/benvlehmann.com) or to the custom
// domain (https://www.benvlehmann.com, base "/"). Set them in the workflow.
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.benvlehmann.com',
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
