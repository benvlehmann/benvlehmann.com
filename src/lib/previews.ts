// Builds the paper-preview index (title + short description per arXiv id) from
// the INSPIRE data fetched at build time. Math in titles and abstracts is
// rendered to MathML at build time, so browsers need no math library.
import katex from 'katex';
import { parse } from 'yaml';
import summariesRaw from '../data/paper-summaries.yaml?raw';
import { allPapers } from './inspire';

const overrides: Record<string, string> = parse(summariesRaw) ?? {};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Text-mode LaTeX that shows up in abstracts, turned into plain typography. */
function cleanText(s: string) {
  return escapeHtml(s)
    .replace(/\\(?:textit|emph)\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\(?:text|textrm|mathrm)\{([^}]*)\}/g, '$1')
    .replace(/``/g, '“').replace(/''/g, '”')
    .replace(/---/g, '—').replace(/--/g, '–')
    .replace(/\\%/g, '%').replace(/\\&amp;/g, '&amp;').replace(/~/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Render a string with $...$ / \(...\) math segments into HTML (MathML for math). */
export function renderTex(s: string): string {
  const parts = s.split(/(\$[^$]+\$|\\\([^)]*?\\\))/g);
  return parts
    .map((part) => {
      const m = part.match(/^\$([^$]+)\$$/) ?? part.match(/^\\\(([\s\S]*)\\\)$/);
      if (!m) return cleanText(part);
      return katex.renderToString(m[1], { output: 'mathml', throwOnError: false, strict: 'ignore' });
    })
    .join('');
}

/** First two or three sentences of an abstract, at most ~420 characters. */
export function excerpt(abstract: string): string {
  const text = abstract.replace(/\s+/g, ' ').trim();
  // Protect math from the sentence splitter.
  const math: string[] = [];
  const shielded = text.replace(/\$[^$]+\$/g, (m) => `\u0000${math.push(m) - 1}\u0000`);
  const sentences = shielded.split(/(?<=[.!?])\s+(?=[A-Z\u0000(“"])/);
  let out = '';
  for (const s of sentences) {
    if (out && (out.length >= 200 || out.length + s.length > 420)) break;
    out += (out ? ' ' : '') + s;
  }
  let truncated = out.length < shielded.length;
  if (out.length > 420) {
    out = out.slice(0, 400).replace(/\s+\S*$/, '');
    truncated = true;
  }
  const restored = out.replace(/\u0000(\d+)\u0000/g, (_, i) => math[+i]);
  return truncated ? restored.replace(/[\s,;:]+$/, '') + ' …' : restored;
}

export interface Preview { t: string; y: string; d: string }

export async function previewIndex(): Promise<Record<string, Preview>> {
  const { papers } = await allPapers();
  const index: Record<string, Preview> = {};
  for (const p of papers) {
    if (!p.arxiv) continue;
    const desc = overrides[p.arxiv] ?? (p.abstract ? excerpt(p.abstract) : '');
    index[p.arxiv] = {
      t: renderTex(p.title),
      y: p.date ? p.date.slice(0, 4) : '',
      d: desc ? renderTex(desc) : '',
    };
  }
  return index;
}
