// Fetches Ben's full publication list from INSPIRE once per build (with author
// lists), and derives both "Recent papers" and per-person coauthored papers from
// it. If INSPIRE is unreachable, the committed cache is used so a flaky API never
// breaks a deploy. Refresh the cache with `npm run refresh-papers`.
import cache from '../data/papers-cache.json';
import { site } from './data';

export interface Paper {
  title: string;
  arxiv?: string;
  inspire: number;
  date: string; // YYYY-MM-DD (may be empty)
  url: string;
  authors: string[]; // INSPIRE "Last, First M." form
  abstract?: string;
}

export const INSPIRE_QUERY = (authorId: number | string) =>
  `https://inspirehep.net/api/literature?sort=mostrecent&size=250&q=${encodeURIComponent(`authors.recid:${authorId}`)}` +
  `&fields=titles,arxiv_eprints,preprint_date,control_number,authors.full_name,abstracts`;

export function toPaper(m: any): Paper {
  const ax = m.arxiv_eprints?.[0]?.value;
  return {
    title: m.titles[0].title,
    arxiv: ax,
    inspire: m.control_number,
    date: m.preprint_date ?? '',
    url: ax ? `https://arxiv.org/abs/${ax}` : `https://inspirehep.net/literature/${m.control_number}`,
    authors: (m.authors ?? []).map((a: any) => a.full_name),
    // Prefer the authors' own (arXiv) abstract over publisher copies.
    abstract: ((m.abstracts ?? []).find((a: any) => a.source === 'arXiv') ?? (m.abstracts ?? [])[0])?.value ?? '',
  };
}

let memo: Promise<{ papers: Paper[]; live: boolean }> | null = null;

export function allPapers() {
  memo ??= (async () => {
    try {
      const res = await fetch(INSPIRE_QUERY(site.links.inspire_author_id), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`INSPIRE ${res.status}`);
      const papers: Paper[] = (await res.json()).hits.hits.map((h: any) => toPaper(h.metadata));
      if (!papers.length) throw new Error('INSPIRE returned no papers');
      console.log(`[inspire] ${papers.length} papers`);
      return { papers, live: true };
    } catch (err) {
      console.warn(`[inspire] using cached papers: ${err}`);
      return { papers: cache as Paper[], live: false };
    }
  })();
  return memo;
}

export async function recentPapers(n = 5) {
  const { papers, live } = await allPapers();
  return { papers: papers.slice(0, n), live };
}

const norm = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Papers coauthored with a person, matched on surname + first initial against
 * INSPIRE author lists. `inspireName` ("Last, First") overrides the parsed name;
 * `exclude` drops specific arXiv ids or INSPIRE record numbers (false matches).
 */
export async function coauthored(name: string, opts: { inspireName?: string; exclude?: (string | number)[] } = {}) {
  const { papers } = await allPapers();
  let last: string, first: string;
  if (opts.inspireName) [last, first] = opts.inspireName.split(',').map(norm);
  else {
    const parts = name.trim().split(/\s+/);
    last = norm(parts[parts.length - 1]);
    first = norm(parts[0]);
  }
  const excluded = new Set((opts.exclude ?? []).map(String));
  return papers.filter((p) => {
    if (excluded.has(String(p.arxiv)) || excluded.has(String(p.inspire))) return false;
    return p.authors.some((a) => {
      const [l, f = ''] = a.split(',').map(norm);
      return l === last && f[0] === first[0];
    });
  });
}
