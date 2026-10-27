// Bookkeeping for the scheduled drift check (MAINTENANCE.md). Results live in
// .drift/results.json (untracked). This script records and checks; it never writes
// verified.json. Setting last_verified stays a judgment call for the agent.
//   npm run drift -- record <section> <clean|changes|needs-ben|blocked> ["note"]
//   npm run drift -- status     print the per-section table (paste into the PR body)
//   npm run drift -- check      exit 0 only if every section is recorded as clean
import { mkdir, readFile, writeFile } from 'node:fs/promises';

export const SECTIONS = ['papers', 'people', 'cv', 'travel', 'links', 'wording'];
const OUTCOMES = ['clean', 'changes', 'needs-ben', 'blocked'];
const file = new URL('../.drift/results.json', import.meta.url);
const load = async () => JSON.parse(await readFile(file, 'utf8').catch(() => '{}'));

const [cmd, section, outcome, ...note] = process.argv.slice(2);
const results = await load();

if (cmd === 'record') {
  if (!SECTIONS.includes(section)) throw new Error(`section must be one of ${SECTIONS.join(', ')}`);
  if (!OUTCOMES.includes(outcome)) throw new Error(`outcome must be one of ${OUTCOMES.join(', ')}`);
  if (outcome !== 'clean' && !note.join(' ').trim())
    throw new Error('a non-clean outcome needs a note: the proposal, the question for Ben, or the exact error');
  results[section] = { outcome, note: note.join(' ') };
  await mkdir(new URL('../.drift/', import.meta.url), { recursive: true });
  await writeFile(file, JSON.stringify(results, null, 2) + '\n');
} else if (cmd === 'status' || cmd === 'check') {
  const rows = SECTIONS.map((s) => `| ${s} | ${results[s]?.outcome ?? 'NOT RECORDED'} | ${results[s]?.note ?? ''} |`);
  console.log(['| Section | Outcome | Note |', '| --- | --- | --- |', ...rows].join('\n'));
  if (cmd === 'check') {
    const bad = SECTIONS.filter((s) => results[s]?.outcome !== 'clean');
    if (bad.length) {
      console.error(`\nNot all clear (${bad.join(', ')}): do not set last_verified.`);
      process.exit(1);
    }
  }
} else {
  throw new Error('usage: drift.mjs record|status|check');
}
