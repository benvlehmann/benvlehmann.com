import { defineConfig } from 'astro/config';
import newTabLinks from './src/integrations/new-tab-links.mjs';
import paperPreviews from './src/integrations/paper-previews.mjs';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// SITE_URL / SITE_BASE let the same code deploy to the GitHub Pages preview
// address (https://benvlehmann.github.io/benvlehmann.com) or to the custom
// domain (https://www.benvlehmann.com, base "/"). Set them in the workflow.
// GitHub Pages serves both github.io and custom domains over HTTPS, but reports an
// http:// origin until "Enforce HTTPS" is ticked, so always canonicalize to https.
const site = (process.env.SITE_URL || 'https://www.benvlehmann.com').replace(/^http:/, 'https:');

export default defineConfig({
  site,
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [newTabLinks(), paperPreviews()],
  // $...$ math in notes and posts, rendered to MathML at build time (no client-side math library).
  markdown: { remarkPlugins: [remarkMath], rehypePlugins: [[rehypeKatex, { output: 'mathml' }]] },
});
