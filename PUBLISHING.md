# Publishing policy

Every task that drafts content for this site from Ben's private sources (the
productivity system, task notes, calendar, email, transcripts) follows this policy.
Drafts always go to Ben for approval; nothing is published without him merging it.

## The test

A topic or sentence is publishable only if **everything it says is already public**
(published papers, public talks, public web pages) **or is Ben's own general reflection
that reveals nothing about unpublished work or other people.** When in doubt, leave it
out and mention the doubt to Ben privately rather than in the draft.

## Allowed

- Published papers (arXiv or journal), public talks, and public events.
- General physics explanations, and methods or tools that are not tied to unpublished
  results.
- Things learned from other people's *published* work.
- Side projects Ben has already made public (e.g. the Ma'avar Yabok translation).
- General reflections on teaching, mentoring and outreach, without identifiable people.

## Never

- Results, numbers, ideas or even topics of papers in preparation, however vaguely
  described.
- Anything about students' or collaborators' unpublished work, progress, difficulties or
  evaluations; naming a person in connection with anything not already public.
- Refereeing, grants, fellowships, hiring, admissions, committees, or other confidential
  service.
- Contents of email, private messages, meetings or transcripts, unless Ben points to a
  specific item and says it may be used.
- Health, personal or family life, finances, and travel beyond what is on the public
  travel calendar.
- Opinions about named people or institutions.

## Writing

- Every factual claim must be traceable to a public source; list the sources in the PR
  description. Never invent numbers, quotes or results.
- No hype ("groundbreaking", "revolutionary", "for the first time ever" unless the paper
  says so). Match the paper's own level of confidence.
- Ben's voice: plain, precise, a little dry; first person singular for framing, "we" for
  the work of a paper's author team.
- Math sparingly. Inline `$...$`; display math with `$$` on their own lines.

## Paper explainers

Drafted by the weekly explainer task for papers that qualify under
`src/data/explainers.yaml`.

- **File:** `src/content/notes/<slug>.md` with front matter `title` (a plain-language
  title, not the paper's), `date` (the draft date), `arxiv`, `summary` (one sentence),
  and optionally `figure`, `figure_alt`, `figure_caption`.
- **Audience:** a curious, scientifically literate non-specialist.
- **Length and shape:** 400–700 words. The question; the key idea; what the paper finds;
  why it matters and what comes next. Name the coauthors once, near the top.
- **Sources:** the arXiv abstract and full text only.
- **Figure (optional):** one key figure from the paper's arXiv source, converted to PNG at
  most 1600 px wide, saved as `public/img/notes/<arxiv>.png`, with a caption crediting
  the paper.
- **Delivery:** one PR per paper, branch `explainer-<arxiv>`, titled
  `Explainer: <plain-language title>`. Merging the PR publishes it.

## Weekly topic scout

Reads the productivity system for the past week and looks for something website-worthy
that is **incidental or orthogonal to publishable work** (a technique, a tool, a
teaching or outreach moment, something learned from published literature). Most weeks
there will be nothing, and that is the expected outcome.

- It **only proposes**: at most two topics, each with a working title, a two- or
  three-sentence pitch, the public sources it would rely on, and any policy concerns.
- It writes nothing to the repo. Ben approves a pitch by replying in that run's
  conversation; only then does it draft a note (same file format as above, without
  `arxiv`) as a PR titled `Note: <title>`.
- Pitched topics are logged privately in `~/Dropbox/Files/Website/scout-log.md`
  (outside the public repo) so declined topics are not pitched again.
