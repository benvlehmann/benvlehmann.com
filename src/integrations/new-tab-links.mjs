// After the build, rewrite every generated page so that external links and links
// to static files (PDFs and anything under /s/) open in a new tab. Doing it here
// covers links from templates, YAML data, and Markdown posts alike.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STATIC_FILE = /\.(pdf|zip|png|jpe?g|gif|svg|txt|tex|bib|csv|json)(?:[?#]|$)/i;

export function shouldOpenInNewTab(href, siteHosts) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  const abs = href.match(/^https?:\/\/([^/]+)/i);
  if (abs) return !siteHosts.has(abs[1].toLowerCase());
  const path = href.split(/[?#]/)[0];
  return STATIC_FILE.test(path) || /(^|\/)s\//.test(path);
}

export function rewriteHtml(html, siteHosts) {
  return html.replace(/<a\b([^>]*)>/gi, (tag, attrs) => {
    const m = attrs.match(/\shref\s*=\s*(["'])(.*?)\1/i);
    if (!m || /\starget\s*=/i.test(attrs) || !shouldOpenInNewTab(m[2], siteHosts)) return tag;
    const rel = /\srel\s*=/i.test(attrs) ? '' : ' rel="noopener"';
    return `<a${attrs} target="_blank"${rel}>`;
  });
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

export default function newTabLinks() {
  let siteHosts = new Set();
  return {
    name: 'new-tab-links',
    hooks: {
      'astro:config:done': ({ config }) => {
        const host = config.site ? new URL(config.site).host.toLowerCase() : '';
        const bare = host.replace(/^www\./, '');
        siteHosts = new Set([host, bare, `www.${bare}`].filter(Boolean));
      },
      'astro:build:done': async ({ dir, logger }) => {
        let changed = 0;
        for await (const file of htmlFiles(fileURLToPath(dir))) {
          const html = await readFile(file, 'utf8');
          const out = rewriteHtml(html, siteHosts);
          if (out !== html) { await writeFile(file, out); changed++; }
        }
        logger.info(`external and file links set to open in a new tab (${changed} pages)`);
      },
    },
  };
}
