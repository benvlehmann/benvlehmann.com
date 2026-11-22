# benvlehmann.com

Personal academic site, built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Where things live

| What | File |
| --- | --- |
| Title, institution, office, links, hero text | `src/data/site.yaml` |
| About me | `src/data/about.yaml` |
| Research topics and selected papers | `src/data/research.yaml` |
| Outreach | `src/data/outreach.yaml` |
| Students and collaborators | `src/data/people.yaml` |
| Past trips (migrated from Squarespace) | `src/data/travel-archive.yaml` |
| Notes, paper explainers and the old Squarespace posts (`/public/<slug>/`, listed at `/public/`) | `src/content/notes/*.md` |
| Which papers get explainers | `src/data/explainers.yaml` |
| PDFs (CV, post attachments) at `/s/<file>.pdf` | `public/s/` |
| The *Ethica* edition: web edition at `/ethica/`, PDFs and EPUBs at `/s/ethica*` | `public/ethica/`, `public/s/ethica*` (build output of the spinoza repository; see below) |
| Colours, type, header and footer styles (shared with the *Ethica* edition) | `public/chrome.css` |
| Header, footer and the `<head>` tags every page shares | `src/components/Site*.astro` |
| Images | `public/img/` |

Facts that change (title, institution, start year) live once in `site.yaml`; other files
reference them as `{role}`, `{institution}`, etc.

## Automatic content

- **Recent papers** are fetched from INSPIRE at build time (author id in `site.yaml`).
  If INSPIRE is down, `src/data/papers-cache.json` is used instead (`npm run refresh-papers`).
- **Coauthored papers** on the People page are matched from the same INSPIRE data
  (surname + first initial); `inspire_name` / `exclude` in `people.yaml` fix mismatches.
- **Paper previews**: hovering (or tabbing to) an arXiv link to one of Ben's papers shows a card
  with the title and the first sentences of the abstract, built from the same INSPIRE data.
  Hand-written descriptions go in `src/data/paper-summaries.yaml`. No previews on touch devices.
- **Upcoming trips** come from the iCal feed of a dedicated travel calendar
  (the `TRAVEL_ICS_URL` repository secret — use the calendar's secret iCal address), merged
  with the archive. Trips move from Upcoming to Recent on their own.
- The site rebuilds on every push to `main` and nightly, so both stay current.
- **CV**: `public/s/lehmann_cv.pdf` is the `make web` target of the CV build
  (`~/Dropbox/Science/CV/build/cv-public/lehmann_cv.pdf`).
- **The *Ethica***: `public/ethica/` (the web edition) and `public/s/ethica.pdf`, `ethica-print.pdf`,
  `ethica.epub`, `ethica-english.epub` and `ethica-latin.epub` are the output of `make publish` in the
  (private) spinoza repository, which builds a release tag and opens a pull request here; merging it
  publishes. They are never edited here. After the build, `src/integrations/ethica-frame.mjs` puts the
  site's header and footer around each page of the edition (made from the same components as every page,
  via `src/pages/ethica-frame.astro`), with `public/chrome.css`, whose colour tokens the edition's own
  stylesheet is written in; so the edition follows the site's theme and its switch. Nothing else in it
  is changed (`src/integrations/html-files.mjs`).

## Drafted content

Paper explainers and occasional notes are drafted by scheduled tasks and arrive as
pull requests; merging publishes them. The rules are in `PUBLISHING.md`.

## Old URLs

Old Squarespace paths (`/about`, `/work`, `/collaborators`, `/where`, `/travel/<slug>`, …)
redirect to their new homes; `/s/*.pdf` and `/public/*` keep their original URLs.

## Local development

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
```
