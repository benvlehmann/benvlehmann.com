// MAINTENANCE.md §2: checks what the build-time coauthor match can't decide.
// Run `npm run refresh-papers` first; this reads src/data/papers-cache.json.
//   npm run check-people [-- --cv /path/to/cv.txt]   (cv.txt = pdftotext output)
// Reports only; it never edits people.yaml. Exit 0 = ran (read the report),
// exit 2 = INSPIRE unreachable (record the section as "blocked").
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

let blocked = false;
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
out.push(`## People with no matched papers (${none.length})`);
for (const p of none) {
  const [last, first] = keyOf(p);
  try {
    const res = await fetch(
      `https://inspirehep.net/api/authors?size=5&fields=name.value,control_number&q=${encodeURIComponent(`${first} ${last}`)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error(`INSPIRE ${res.status}`);
    const hits = (await res.json()).hits.hits.map((h) => `${h.metadata.name.value} (recid ${h.metadata.control_number})`);
    out.push(`- ${p.name} [${p.section}]: INSPIRE candidates: ${hits.join('; ') || 'none'}`);
  } catch (e) {
    blocked = true;
    out.push(`- ${p.name} [${p.section}]: lookup failed (${e.message})`);
  }
}
out.push('(A candidate is only a lead: a joint paper must exist under that spelling before proposing `inspire_name`.)', '');

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
process.exit(blocked ? 2 : 0);
