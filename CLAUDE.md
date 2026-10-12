# Notes for agents working on this repo

- Edit content in `src/data/*.yaml` and `src/content/posts/`, not in page templates.
  Facts that change (title, institution, years) belong in `src/data/site.yaml` only.
- Avoid time-relative wording in prose ("recently", "now", "currently", "this year").
- Posts under `/public/` are intentionally unlisted: never add them to the nav or home page.
- Keep old URLs working: `/s/*.pdf`, `/public/<slug>/`, and the redirects in
  `src/pages/[legacy].astro` and `src/pages/travel/[slug].astro`.
- Mechanical fixes (typos, dead links, papers cache refresh) can go straight to `main`.
  Anything that states a fact about Ben's life or career goes in a pull request for him to approve.
- After a clean maintenance pass, set `last_verified` in `src/data/verified.json`.
- Run `npm run build` before pushing; the build must succeed.
