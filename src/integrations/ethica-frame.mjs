// After the build, put the site's header and footer around each page of the Ethica
// edition (public/ethica/, copied in by `make publish` in the spinoza repository), with
// the site's shared <head> tags: its fonts, public/chrome.css (whose design tokens the
// edition's own stylesheet is written in) and the theme switch. The edition is then
// navigated and themed like the rest of the site, and its markup is otherwise left as it
// was built. The pieces come from src/pages/ethica-frame.astro, made of the same
// components as every other page (src/components/Site*.astro); that page is deleted here.
//
// Runs after new-tab-links, so that the footer's external links are already marked to
// open in a new tab, as on every other page.
import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MARK = '<!--ethica:content-->';
const FRAME = 'ethica-frame';
const EDITION = 'ethica';

/** The frame page split into what goes into <head>, before a page's content and after it. */
export function frameParts(html) {
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/);
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  const pieces = body ? body[1].split(MARK) : [];
  if (!head || pieces.length !== 2) throw new Error(`ethica-frame: ${FRAME} page has no head, or not one ${MARK}`);
  return { head: head[1], before: pieces[0], after: pieces[1] };
}

/** One page of the edition inside the frame. */
export function framePage(html, parts, name) {
  const n = (re) => (html.match(re) || []).length;
  if (n(/<\/head>/g) !== 1 || n(/<body[^>]*>/g) !== 1 || n(/<\/body>/g) !== 1)
    throw new Error(`ethica-frame: ${EDITION}/${name} does not have exactly one head and one body`);
  // Functions as replacements, so that a "$" in the pieces is taken literally.
  return html
    .replace('</head>', () => `${parts.head}</head>`)
    .replace(/<body[^>]*>/, (tag) => tag + parts.before)
    .replace('</body>', () => `${parts.after}</body>`);
}

export default function ethicaFrame() {
  return {
    name: 'ethica-frame',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const parts = frameParts(await readFile(join(root, FRAME, 'index.html'), 'utf8'));
        await rm(join(root, FRAME), { recursive: true });
        let names;
        try {
          names = (await readdir(join(root, EDITION))).filter((f) => f.endsWith('.html'));
        } catch {
          logger.info(`no edition in public/${EDITION}/; nothing to frame`);
          return;
        }
        for (const name of names) {
          const file = join(root, EDITION, name);
          await writeFile(file, framePage(await readFile(file, 'utf8'), parts, name));
        }
        logger.info(`site header and footer put around ${names.length} pages of the edition`);
      },
    },
  };
}
