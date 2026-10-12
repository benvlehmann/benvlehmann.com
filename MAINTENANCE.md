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

- Compare `public/s/lehmann_cv.pdf` with `~/Dropbox/Science/CV/update/build/web/lehmann_cv.pdf`
  (needs Ben's computer). If the Dropbox build is newer and differs, copy it in (PR).
- Compare the CV's "Students and mentoring" section with `src/data/people.yaml`;
  propose updates for differences (PR).
- Compare title, institution and fellowship dates in the CV header with
  `src/data/site.yaml` (PR).

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
