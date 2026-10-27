// MAINTENANCE.md §2: checks what the build-time coauthor match can't decide.
// Run `npm run refresh-papers` first; this reads src/data/papers-cache.json.
//   npm run check-people [-- --cv /path/to/cv.txt]   (cv.txt = pdftotext output)
// Reports only; it never edits people.yaml. Works offline from the cache.
// A lead or match Ben has reviewed and rejected goes in that person's `exclude`
// list (arXiv id or INSPIRE record number), so it is not reported again.
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const people = parse(await read('src/data/people.yaml'));
const papers = JSON.parse(await read('src/data/papers-cache.json'));
const cvArg = process.argv.indexOf('--cv');
const cv = cvArg > 0 ? await readFile(process.argv[cvArg + 1], 'utf8') : null;

// Same normalisation and matching as coauthored() in src/lib/inspire.ts; keep in sync.
const norm = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const listed = ['current', 'theses', 'former']
  .flatMap((k) => (people[k] ?? []).map((p) => ({ ...p, section: k })))
  .filter((p) => p.name);
const keyOf = (p) => {
  if (p.inspire_name) return p.inspire_name.split(',').map(norm);
  const parts = p.name.trim().split(/\s+/);
  return [norm(parts.at(-1)), norm(parts[0])];
};
const matches = (p) => {
  const [last, first] = keyOf(p);
  const ex = new Set((p.exclude ?? []).map(String));
  return papers.flatMap((paper) => {
    if (ex.has(String(paper.arxiv)) || ex.has(String(paper.inspire))) return [];
    return paper.authors
      .filter((a) => { const [l, f = ''] = a.split(',').map(norm); return l === last && f[0] === first[0]; })
      .map((author) => ({ paper, author }));
  });
};

const out = [];

// 1. People with no matched papers: look for other spellings in INSPIRE.
const none = [];
const suspicious = [];
for (const p of listed) {
  const m = matches(p);
  if (!m.length) { none.push(p); continue; }
  const first = keyOf(p)[1];
  for (const { paper, author } of m) {
    const f = norm(author.split(',')[1] ?? '').replace(/\./g, '');
    const tok = f.split(/\s+/)[0] ?? '';
    // Initial-only INSPIRE names are fine; otherwise the first names should agree.
    if (tok.length > 1 && !(tok.startsWith(first) || first.startsWith(tok)))
      suspicious.push(`${p.name}: "${author}" on ${paper.arxiv ?? paper.inspire} (${paper.title})`);
  }
}
// Leads for them come from Ben's own papers: an author with the same surname, or
// the same first name and a surname within two edits. Excluded papers are skipped.
const dist = (x, y) => {
  const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++)
    for (let j = 1; j <= y.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
  return d[x.length][y.length];
};
const leads = none.flatMap((p) => {
  const [last, first] = keyOf(p);
  const ex = new Set((p.exclude ?? []).map(String));
  return papers.flatMap((paper) => {
    if (ex.has(String(paper.arxiv)) || ex.has(String(paper.inspire)) || paper.authors.length > 30) return [];
    return paper.authors
      .filter((a) => {
        const [l, f = ''] = a.split(',').map(norm);
        const tok = f.replace(/\./g, '').split(/\s+/)[0] ?? '';
        return (l === last && !(l === 'lehmann' && tok[0] === 'b')) || (tok === first && dist(l, last) <= 2);
      })
      .map((a) => `- ${p.name}: "${a}" on ${paper.arxiv ?? paper.inspire} (${paper.title})`);
  });
});
out.push(
  `## People with no matched papers (${none.length})`,
  none.map((p) => p.name).join(', ') || '(none)',
  `Leads under other spellings (${leads.length}); reviewed and rejected ones belong in \`exclude\`:`,
  ...leads,
  '',
);

out.push(`## Possible false matches (${suspicious.length})`, ...suspicious.map((s) => `- ${s}`), '');

// 2. Recent coauthors not on the page (report only; never add anyone).
const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 2);
const seen = new Map();
for (const paper of papers) {
  if (!paper.date || new Date(paper.date) < cutoff || paper.authors.length > 30) continue;
  for (const a of paper.authors) {
    const [l, f = ''] = a.split(',').map(norm);
    if (l === 'lehmann' && f[0] === 'b') continue;
    if (listed.some((p) => { const [pl, pf] = keyOf(p); return pl === l && pf[0] === f[0]; })) continue;
    (seen.get(a) ?? seen.set(a, []).get(a)).push(paper.arxiv ?? paper.inspire);
  }
}
// The section runs from its heading to the next top-level CV heading.
const END_HEADING = 'Professional activities';
const students = cv
  ? (([a]) => cv.slice(a, cv.indexOf(END_HEADING, a) > 0 ? cv.indexOf(END_HEADING, a) : undefined))([cv.indexOf('Students and mentoring')])
  : null;
const inCv = (a) => {
  if (!students) return null;
  const [l, f = ''] = a.split(',').map(norm);
  return norm(students).split('\n').some((line) => line.includes(l) && line.includes(f[0]));
};
const rows = [...seen].map(([a, ids]) => ({ a, ids, cv: inCv(a) }));
const flagged = cv ? rows.filter((r) => r.cv) : rows;
out.push(
  `## Recent coauthors (last two years, papers with <=30 authors) not on the People page (${flagged.length})`,
  cv ? 'Filtered to names appearing in the CV "Students and mentoring" section.' : 'No --cv given: unfiltered; judge by hand.',
  ...flagged.map((r) => `- ${r.a}: ${r.ids.join(', ')}`),
);

// 3. CV-listed students ("Name, Month YYYY–...") missing from the page (report only).
if (students) {
  const names = [...students.matchAll(/^\s*([A-Z][\w.’' -]+?),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gm)].map((m) => m[1].trim());
  const missing = names.filter((n) => !listed.some((p) => norm(p.name).replace(/[. ]/g, '') === norm(n).replace(/[. ]/g, '')));
  out.push('', `## CV students not on the People page (${missing.length})`, ...missing.map((n) => `- ${n}`));
}
console.log(out.join('\n'));
