// Fetches recent papers from INSPIRE at build time. Falls back to the committed
// cache if INSPIRE is unreachable, so a flaky API never breaks a deploy.
import cache from '../data/papers-cache.json';
import { site } from './data';

export interface Paper {
  title: string;
  arxiv?: string;
  date: string; // YYYY-MM-DD
  url: string;
}

export async function recentPapers(n = 5): Promise<{ papers: Paper[]; live: boolean }> {
  const q = encodeURIComponent(`authors.recid:${site.links.inspire_author_id}`);
  const api = `https://inspirehep.net/api/literature?sort=mostrecent&size=${n}&q=${q}&fields=titles,arxiv_eprints,preprint_date,control_number`;
  try {
    const res = await fetch(api, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`INSPIRE ${res.status}`);
    const json = await res.json();
    const papers: Paper[] = json.hits.hits.map((h: any) => {
      const m = h.metadata;
      const ax = m.arxiv_eprints?.[0]?.value;
      return {
        title: m.titles[0].title,
        arxiv: ax,
        date: m.preprint_date ?? '',
        url: ax ? `https://arxiv.org/abs/${ax}` : `https://inspirehep.net/literature/${m.control_number}`,
      };
    });
    if (papers.length) return { papers, live: true };
    throw new Error('INSPIRE returned no papers');
  } catch (err) {
    console.warn(`[inspire] using cached papers: ${err}`);
    return { papers: (cache as Paper[]).slice(0, n), live: false };
  }
}
