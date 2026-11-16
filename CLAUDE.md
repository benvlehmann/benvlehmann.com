# Notes for agents working on this repo

- Edit content in `src/data/*.yaml` and `src/content/notes/`, not in page templates.
  Facts that change (title, institution, years) belong in `src/data/site.yaml` only.
- Avoid time-relative wording in prose ("recently", "now", "currently", "this year").
- Notes (`src/content/notes/`, served at `/public/<slug>/` and listed at `/public/`) are public
  write-ups, linked from the footer but never from the nav or home page. The `/public/` path keeps
  the old Squarespace post URLs working. A note with an
  `arxiv` field is that paper's plain-language explainer. Anything drafted from Ben's
  private sources must follow `PUBLISHING.md`.
- People page: a former student's `next` is their step immediately after working with
  Ben. Do not update it for later career moves.
- `public/ethica/` and `public/s/ethica*` are build output of the private spinoza repository, replaced
  as a whole by `make publish` there. Never edit them here, not even typos: fixes belong in spinoza.
- The design tokens (`--bg`, `--text`, `--accent`, …) and the header and footer styles live in
  `public/chrome.css`, which the Ethica edition also uses: its stylesheet is written in those token
  names. Changing a value is fine; renaming or removing a token changes the edition too.
- Keep old URLs working: `/s/*.pdf`, `/public/<slug>/`, `/notes/` (redirects to `/public/`), and the redirects in
  `src/pages/[legacy].astro` and `src/pages/travel/[slug].astro`.
- Mechanical fixes (typos, dead links, papers cache refresh) can go straight to `main`.
  Anything that states a fact about Ben's life or career goes in a pull request for him to approve.
- The scheduled maintenance check follows `MAINTENANCE.md`. After a clean pass, set `last_verified` in `src/data/verified.json`.
- Run `npm run build` before pushing; the build must succeed.
