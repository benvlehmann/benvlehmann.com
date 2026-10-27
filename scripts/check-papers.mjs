// MAINTENANCE.md §1: every selected paper in research.yaml must be one of Ben's
// papers in the INSPIRE cache, which catches a mistyped arXiv id. (arXiv ids are
// persistent, so checking that they resolve would add nothing.) Run after
// `npm run refresh-papers`. Exit 1 lists the ids that are not in the cache.
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const ids = [...(await read('src/data/research.yaml')).matchAll(/arxiv:\s*["']?(\d{4}\.\d{4,5})/g)].map((m) => m[1]);
const cached = new Set(JSON.parse(await read('src/data/papers-cache.json')).map((p) => p.arxiv));
const missing = [...new Set(ids)].filter((id) => !cached.has(id));
console.log(`${ids.length} selected paper(s) in research.yaml; ${missing.length} not among Ben's INSPIRE papers`);
for (const id of missing) console.log(`- ${id}`);
process.exit(missing.length ? 1 : 0);
