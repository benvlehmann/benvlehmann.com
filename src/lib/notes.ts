// Notes: short public write-ups, served at /public/<slug>/ (the old Squarespace
// post URLs, kept for stability) and listed at /public/. A note with an `arxiv` field is a plain-language
// explainer for that paper and is linked from the paper wherever it's listed.
// Notes with `draft: true` are never built.
const modules = import.meta.glob('../content/notes/*.md', { eager: true }) as Record<string, any>;

export interface Note {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  arxiv?: string;
  figure?: string;
  figure_alt?: string;
  figure_caption?: string;
  Content: any;
}

export const notes: Note[] = Object.entries(modules)
  .filter(([, mod]) => mod.frontmatter.draft !== true)
  .map(([path, mod]) => {
    const fm = mod.frontmatter;
    return {
      slug: path.split('/').pop()!.replace(/\.md$/, ''),
      title: fm.title,
      date: String(fm.date instanceof Date ? fm.date.toISOString() : fm.date).slice(0, 10),
      summary: fm.summary,
      arxiv: fm.arxiv ? String(fm.arxiv) : undefined,
      figure: fm.figure,
      figure_alt: fm.figure_alt,
      figure_caption: fm.figure_caption,
      Content: mod.Content,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

/** The explainer note for an arXiv id, if one has been published. */
export const explainerFor = (arxiv?: string) => (arxiv ? notes.find((n) => n.arxiv === arxiv) : undefined);

export const formatDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// Titles may use *asterisks* for italics (e.g. a book title). titleHtml renders
// them as <em> for headings and lists; titleText strips them for <title> and
// link previews, which can't show formatting.
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const titleHtml = (t: string) => escapeHtml(t).replace(/\*([^*]+)\*/g, '<em>$1</em>');
export const titleText = (t: string) => t.replace(/\*([^*]+)\*/g, '$1');
