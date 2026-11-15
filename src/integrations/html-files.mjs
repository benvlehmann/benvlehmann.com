// The built pages that the post-build integrations rewrite: every .html file under
// dist/, except in directories that are copied in from elsewhere and must be served
// exactly as built. public/ethica/ is the web edition of the Ethica, the output of
// `make publish` in the spinoza repository.
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const VERBATIM_DIRS = ['ethica'];

export async function* htmlFiles(dir, top = true) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!(top && VERBATIM_DIRS.includes(entry.name))) yield* htmlFiles(p, false);
    } else if (entry.name.endsWith('.html')) yield p;
  }
}
