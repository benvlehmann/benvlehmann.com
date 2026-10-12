import { parse } from 'yaml';
import siteRaw from '../data/site.yaml?raw';
import researchRaw from '../data/research.yaml?raw';
import aboutRaw from '../data/about.yaml?raw';
import outreachRaw from '../data/outreach.yaml?raw';
import peopleRaw from '../data/people.yaml?raw';
import archiveRaw from '../data/travel-archive.yaml?raw';

export const site = parse(siteRaw);
export const research = parse(researchRaw);
export const outreach = parse(outreachRaw);
export const people = parse(peopleRaw);
export const travelArchive: Trip[] = parse(archiveRaw);

/** Replace {key} placeholders with values from site.yaml, so facts live in one place. */
export function fill(text: string): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in site ? String(site[k]) : m));
}

const aboutData = parse(aboutRaw);
export const about = {
  ...aboutData,
  paragraphs: aboutData.paragraphs.map(fill),
};

export interface Trip {
  title: string;
  slug?: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  place?: string;
  url?: string;
}

/** Prefix a site-relative path with the deploy base (handles the GitHub Pages preview subpath). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (/^(https?:|mailto:)/.test(path)) return path;
  return `${base}/${path.replace(/^\//, '')}`;
}

export const arxiv = (id: string) => `https://arxiv.org/abs/${id}`;
