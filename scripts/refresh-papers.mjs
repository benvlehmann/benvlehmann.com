// Refreshes src/data/papers-cache.json (the fallback used when INSPIRE is down)
// from the live INSPIRE API. Run with `npm run refresh-papers`.
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';

const site = parse(await readFile(new URL('../src/data/site.yaml', import.meta.url), 'utf8'));
const id = site.links.inspire_author_id;
const url =
  `https://inspirehep.net/api/literature?sort=mostrecent&size=250&q=${encodeURIComponent(`authors.recid:${id}`)}` +
  `&fields=titles,arxiv_eprints,preprint_date,control_number,authors.full_name`;

const res = await fetch(url, { headers: { Accept: 'application/json' } });
if (!res.ok) throw new Error(`INSPIRE ${res.status}`);
const papers = (await res.json()).hits.hits.map(({ metadata: m }) => {
  const ax = m.arxiv_eprints?.[0]?.value;
  return {
    title: m.titles[0].title,
    arxiv: ax,
    inspire: m.control_number,
    date: m.preprint_date ?? '',
    url: ax ? `https://arxiv.org/abs/${ax}` : `https://inspirehep.net/literature/${m.control_number}`,
    authors: (m.authors ?? []).map((a) => a.full_name),
  };
});
await writeFile(new URL('../src/data/papers-cache.json', import.meta.url), JSON.stringify(papers, null, 1) + '\n');
console.log(`Wrote ${papers.length} papers to src/data/papers-cache.json`);
