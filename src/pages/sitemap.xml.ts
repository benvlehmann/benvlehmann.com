// sitemap.xml listing the site's real pages (redirect stubs for old Squarespace
// URLs are deliberately left out). New posts are picked up automatically.
import type { APIRoute } from 'astro';
import { posts } from '../lib/posts';
import { notes } from '../lib/notes';
import { url } from '../lib/data';

export const GET: APIRoute = ({ site }) => {
  const abs = (path: string) => new URL(url(path), site).href;
  const pages = ['', 'people/', 'travel/', 'public/', ...posts.map((p) => `public/${p.slug}/`), ...(notes.length ? ['notes/', ...notes.map((n) => `notes/${n.slug}/`)] : [])];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map((p) => `  <url><loc>${abs(p)}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
