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
| Unlisted posts (`/public/<slug>/`) | `src/content/posts/*.md` |
| Notes and paper explainers (`/notes/<slug>/`) | `src/content/notes/*.md` |
| Which papers get explainers | `src/data/explainers.yaml` |
| PDFs (CV, post attachments) at `/s/<file>.pdf` | `public/s/` |
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
  (`~/Dropbox/Science/CV/update/build/web/lehmann_cv.pdf`).

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
