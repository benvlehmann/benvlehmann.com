// Notes: short public write-ups. A note with an `arxiv` field is a plain-language
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
