# Notes for agents working on this repo

- Edit content in `src/data/*.yaml` and `src/content/posts/`, not in page templates.
  Facts that change (title, institution, years) belong in `src/data/site.yaml` only.
- Avoid time-relative wording in prose ("recently", "now", "currently", "this year").
- Posts under `/public/` are intentionally unlisted: never add them to the nav or home page.
- Notes (`src/content/notes/`, shown at `/notes/`) are public write-ups; a note with an
  `arxiv` field is that paper's plain-language explainer. Anything drafted from Ben's
  private sources must follow `PUBLISHING.md`.
- People page: a former student's `next` is their step immediately after working with
  Ben. Do not update it for later career moves.
- Keep old URLs working: `/s/*.pdf`, `/public/<slug>/`, and the redirects in
  `src/pages/[legacy].astro` and `src/pages/travel/[slug].astro`.
- Mechanical fixes (typos, dead links, papers cache refresh) can go straight to `main`.
  Anything that states a fact about Ben's life or career goes in a pull request for him to approve.
- The scheduled maintenance check follows `MAINTENANCE.md`. After a clean pass, set `last_verified` in `src/data/verified.json`.
- Run `npm run build` before pushing; the build must succeed.
