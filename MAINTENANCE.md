# Maintenance check

The scheduled drift check follows this list. Each item says what to compare and
what to do about a difference. Rules for what may go straight to `main` versus a
pull request are in `CLAUDE.md`: mechanical fixes directly, anything stating a
fact about Ben's life or career as a PR for him to approve.

Start from a fresh clone, run `npm ci && npm run build`, and fix the build first if
it fails.

## 1. Papers (INSPIRE)

- Run `npm run refresh-papers`. If `src/data/papers-cache.json` changed, commit it
  (mechanical).
- Selected papers in `src/data/research.yaml`: confirm each arXiv id still resolves.

## 2. Coauthored papers on the People page

Joint papers are matched automatically at build time (`coauthored()` in
`src/lib/inspire.ts`, surname + first initial). The check looks for what the
automatic match can't decide:

- **People with no matched papers.** For each, search INSPIRE for the name. If a
  joint paper exists under a different spelling, propose an `inspire_name` override
  in `src/data/people.yaml` (PR).
- **Possible false matches.** Flag any match where the INSPIRE full name differs
  from the listed name beyond initials/accents (e.g. a different first name with the
  same initial). Propose an `exclude` entry if it is wrong (PR).
- **Students missing from the page.** List coauthors on papers from the last two
  years who are not on the People page and who appear in the CV's "Students and
  mentoring" section. Report them; do not add people on your own.

## 3. CV

Needs Ben's computer. Only Ben rebuilds the CV (never run `make` here), so this
section reacts only to changes he has made since the site's copy. It keeps no state:
the previous version is the PDF already in the repo.

- **Repo copy:** `public/s/lehmann_cv.pdf`
- **Ben's build:** `~/Dropbox/Science/CV/update/build/web/lehmann_cv.pdf`

1. **Same file?** Compare md5 hashes of the two PDFs. If they match, skip the rest of
   this section.
2. **Same content?** Extract text from both (`pdftotext`), remove the
   `(Updated <date>)` line near the top, and compare. If the texts match, Ben rebuilt
   without changing anything: skip the rest of this section and do not copy the PDF.
3. **Content changed.** Copy Ben's build over the repo copy (PR), and diff the two
   texts (with the date line removed). Only the changed lines are in scope:
   - Changes in "Students and mentoring": propose matching updates to
     `src/data/people.yaml` (PR).
   - Changes to name, title, institution or fellowship lines: propose matching updates
     to `src/data/site.yaml` (PR). If the role or institution changed, also note that
     `public/img/og-card.jpg` needs regenerating.
   - Never raise differences between the CV and the site in lines that did **not**
     change. Those are either already in sync or differences Ben has chosen to keep.

## 4. Travel

- Past trips that exist only in the calendar feed: append them to
  `src/data/travel-archive.yaml` with a slug generated from the title (mechanical).
- If the build log says the calendar feed failed, report it.

## 5. Links and wording

- Check every external link in the built site; fix or report dead ones (mechanical).
- Search prose in `src/data/` and `src/content/` for time-relative wording
  ("recently", "now", "currently", "this year") and report or fix it.

## 6. Finish

- If everything above is clean, set `last_verified` in `src/data/verified.json` to
  today's date.
- Summarize what changed, what is waiting in PRs, and anything that needs Ben.
