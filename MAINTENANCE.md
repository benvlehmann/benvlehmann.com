# Maintenance check

The scheduled drift check follows this list. Each item says what to compare and
what to do about a difference. Rules for what may go straight to `main` versus a
pull request are in `CLAUDE.md`: mechanical fixes directly, anything stating a
fact about Ben's life or career as a PR for him to approve.

Start from a fresh clone, run `npm ci && npm run build`, and fix the build first if
it fails.

## Recording results (every run)

No section may be skipped for being slow or tedious. Every section ends with one
recorded outcome:

    npm run drift -- record <section> <clean|changes|needs-ben|blocked> "note"

Sections: `papers`, `people`, `cv`, `travel`, `links`, `wording`. Outcomes: `clean`;
`changes` (fixes or proposals are in the PR); `needs-ben` (a question or decision for
Ben); `blocked` (could not run, with the exact error). A non-clean outcome requires a
note. "Not run" with no error is not a valid outcome.

Finish by pasting the output of `npm run drift -- status` into the PR body (CI checks
that every section has a row on `drift-check-*` PRs).

## 1. Papers (INSPIRE)

- Run `npm run refresh-papers`. If `src/data/papers-cache.json` changed, commit it
  (mechanical).
- Selected papers in `src/data/research.yaml`: confirm each arXiv id still resolves.
- Record `papers`.

## 2. Coauthored papers on the People page

Joint papers are matched automatically at build time (`coauthored()` in
`src/lib/inspire.ts`, surname + first initial). Run
`npm run check-people -- --cv <pdftotext output of the CV>` after the papers refresh
(§3's text extraction can supply the CV; if the CV is unavailable, run without
`--cv` and say so). It prints the three reports below; judge them as follows. Exit
code 2 means INSPIRE was unreachable: record `blocked` with that error.

- **People with no matched papers.** For each, search INSPIRE for the name. If a
  joint paper exists under a different spelling, propose an `inspire_name` override
  in `src/data/people.yaml` (PR).
- **Possible false matches.** Flag any match where the INSPIRE full name differs
  from the listed name beyond initials/accents (e.g. a different first name with the
  same initial). Propose an `exclude` entry if it is wrong (PR).
- **Students missing from the page.** List coauthors on papers from the last two
  years who are not on the People page and who appear in the CV's "Students and
  mentoring" section. Report them; do not add people on your own.

Record `people`.

## 3. CV

Only Ben rebuilds the CV (never run `make` here), so this section reacts only to
changes he has made since the site's copy. It keeps no state: the previous version is
the PDF already in the repo.

- **Repo copy:** `public/s/lehmann_cv.pdf`
- **Ben's build:** `~/Dropbox/Science/CV/_cv/build/web/lehmann_cv.pdf` on his computer,
  which is `/Science/CV/_cv/build/web/lehmann_cv.pdf` in Dropbox (file id
  `id:_-pSVMw-2hsAAAAAAB9bwg`, which survives moves). Without his computer, get it
  through the Dropbox connector: `download_link`, then download the single-use URL once.
  Read only; never change anything in Dropbox.

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

Record `cv` (`clean` also covers "same file" and "same content"). If the CV could not
be fetched, record `blocked` with the error.

## 4. Travel

The rule: trips that have ended (before today, Eastern time) are frozen into
`src/data/travel-archive.yaml` and committed; upcoming trips stay out of the source
and come from the calendar feed at build time. The build does the freezing; don't
edit the archive by hand for this.

- The check needs `TRAVEL_ICS_URL` set in the session environment. If it is missing,
  or the build log says `calendar feed failed` or `no calendar feed configured`,
  record `blocked` with that line; never `clean`.
- Run `TRAVEL_WRITE_ARCHIVE=1 npm run build`. It appends past feed trips that ended
  within the last 3 months to the archive (slug from the title, plus the calendar
  `uid`) and logs each as `[travel] froze into archive: ...`. Commit the change
  (mechanical). Frozen entries win over the feed from then on; slugs are never
  regenerated.
- A `[travel] past trip older than 3-month lookback` warning means a past trip was
  never frozen. Record `needs-ben` with the trip; freeze it only on his say-so, with
  `TRAVEL_LOOKBACK_MONTHS=<n>` for that one run.
- Record `travel`.

## 5. Links and wording

- Check every external link in the built site; fix or report dead ones (mechanical).
  Known false alarms: `physics.mit.edu`, `www.space.mit.edu` and `www.mttamcollege.edu`
  return 403 to non-browser clients. Ben has checked them by hand; skip them.
- Search prose in `src/data/` and `src/content/` for time-relative wording
  ("recently", "now", "currently", "this year") and report or fix it. Cached paper
  abstracts in `papers-cache.json` are not prose and are exempt.
- Record `links` and `wording`.

## 6. Finish

- Run `npm run drift -- check`. It exits non-zero unless all six sections are recorded
  `clean`; in that case do not set `last_verified`. When it passes, setting
  `last_verified` in `src/data/verified.json` to today's date is still your call: hold
  it back if anything gives you a reason (for example a question for Ben that you
  recorded as `clean`), and say why in the PR.
- Summarize what changed, what is waiting in PRs, and anything that needs Ben.
