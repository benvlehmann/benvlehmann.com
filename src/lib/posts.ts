// Posts in src/content/posts/*.md live at /public/<slug>/, matching the old
// Squarespace URLs. They are deliberately not linked from the site nav.
const modules = import.meta.glob('../content/posts/*.md', { eager: true }) as Record<string, any>;

export const posts = Object.entries(modules)
  .map(([path, mod]) => ({
    slug: path.split('/').pop()!.replace(/\.md$/, ''),
    title: mod.frontmatter.title as string,
    date: String(mod.frontmatter.date instanceof Date ? mod.frontmatter.date.toISOString() : mod.frontmatter.date).slice(0, 10),
    Content: mod.Content,
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

export const formatDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
