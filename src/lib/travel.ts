// Merges the static travel archive with an optional public iCal feed (a
// dedicated "Travel" Google Calendar). Trips sort themselves into upcoming /
// past by date at build time; the nightly build keeps that current.
//
// Past trips belong in the archive ("frozen"); upcoming ones come from the feed.
// With TRAVEL_WRITE_ARCHIVE=1 (set by the drift check, never by the deploy), the
// build appends feed trips that ended within the lookback window to
// src/data/travel-archive.yaml. Once frozen, the archive entry wins over the feed.
import { readFile, writeFile } from 'node:fs/promises';
import { stringify } from 'yaml';
import { site, travelArchive, type Trip } from './data';

const ARCHIVE_PATH = 'src/data/travel-archive.yaml';
const LOOKBACK_MONTHS = Number(process.env.TRAVEL_LOOKBACK_MONTHS) || 3;

/** Today's date in Eastern time, as YYYY-MM-DD. */
export function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

function unescapeIcs(s: string) {
  return s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();
}

/** Convert an iCal DTSTART/DTEND value to an Eastern-time YYYY-MM-DD. */
function icsDate(value: string, isEnd: boolean, allDay: boolean): string {
  const d = value.slice(0, 8);
  let iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  if (allDay && isEnd) {
    // All-day DTEND is exclusive: step back one day.
    const dt = new Date(`${iso}T12:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() - 1);
    iso = dt.toISOString().slice(0, 10);
  } else if (value.endsWith('Z') && value.length >= 15) {
    const t = `${iso}T${value.slice(9, 11)}:${value.slice(11, 13)}:00Z`;
    iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(t));
  }
  return iso;
}

export function parseIcs(text: string): Trip[] {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/); // unfold continuation lines
  const trips: Trip[] = [];
  let ev: Record<string, { params: string; value: string }> | null = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') ev = {};
    else if (line === 'END:VEVENT' && ev) {
      if (ev.SUMMARY && ev.DTSTART && ev.STATUS?.value !== 'CANCELLED') {
        const allDay = ev.DTSTART.params.includes('VALUE=DATE') || ev.DTSTART.value.length === 8;
        const start = icsDate(ev.DTSTART.value, false, allDay);
        const end = ev.DTEND ? icsDate(ev.DTEND.value, true, allDay) : start;
        trips.push({
          title: unescapeIcs(ev.SUMMARY.value),
          start,
          end: end < start ? start : end,
          // The event's location is shown verbatim (e.g. "Princeton, NJ").
          place: ev.LOCATION ? unescapeIcs(ev.LOCATION.value) || undefined : undefined,
          url: ev.URL?.value,
          uid: ev.UID?.value,
        });
      }
      ev = null;
    } else if (ev) {
      const m = line.match(/^([A-Z-]+)((?:;[^:]*)?):(.*)$/);
      if (m) ev[m[1]] = { params: m[2], value: m[3] };
    }
  }
  return trips;
}

function slugify(title: string, taken: Set<string>): string {
  const base = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'trip';
  let slug = base;
  for (let i = 1; taken.has(slug); i++) slug = `${base}-${i}`;
  taken.add(slug);
  return slug;
}

/** Append trips to the archive file, keeping its header comments; newest first, like the file. */
async function freeze(trips: Trip[]) {
  const text = await readFile(ARCHIVE_PATH, 'utf8');
  const taken = new Set(travelArchive.map((t) => t.slug).filter(Boolean) as string[]);
  const entries = trips
    .sort((a, b) => b.start.localeCompare(a.start))
    // Only fields the site shows, plus the UID; never descriptions or notes.
    .map(({ title, start, end, place, url, uid }) => ({ title, slug: slugify(title, taken), start, end, place, url, uid }));
  const header = text.match(/^(#.*\n)*/)![0];
  const yaml = stringify(entries, { defaultStringType: 'PLAIN', defaultKeyType: 'PLAIN' }).replace(/^(\s+\w+: )(\d{4}-\d{2}-\d{2})$/gm, "$1'$2'");
  await writeFile(ARCHIVE_PATH, header + yaml + text.slice(header.length));
  for (const e of entries) console.log(`[travel] froze into archive: ${e.title} (${e.start}) as ${e.slug}`);
}

let memo: Promise<{ trips: Trip[]; feedOk: boolean | null }> | null = null;

export function allTrips(): Promise<{ trips: Trip[]; feedOk: boolean | null }> {
  memo ??= (async () => {
    const feed = process.env.TRAVEL_ICS_URL || site.travel_ics_url;
    let fromFeed: Trip[] = [];
    let feedOk: boolean | null = null;
    if (!feed) console.log('[travel] no calendar feed configured; using archive only');
    else {
      try {
        const res = await fetch(feed, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(`feed ${res.status}`);
        fromFeed = parseIcs(await res.text());
        feedOk = true;
        console.log(`[travel] calendar feed OK: ${fromFeed.length} event(s)`);
      } catch (err) {
        console.warn(`[travel] calendar feed failed: ${err}`);
        feedOk = false;
      }
    }
    // Archive entries win: drop feed events already frozen (by UID, or by title and
    // start date for entries archived before UIDs were recorded).
    const key = (t: Trip) => `${t.title.toLowerCase()}|${t.start}`;
    const uids = new Set(travelArchive.map((t) => t.uid).filter(Boolean));
    const keys = new Set(travelArchive.map(key));
    const live = fromFeed.filter((t) => !(t.uid && uids.has(t.uid)) && !keys.has(key(t)));

    // Past feed trips: freeze those inside the lookback; warn about older ones
    // (still shown, but they need a decision rather than a silent import).
    const t = today();
    const cutoff = new Date(`${t}T12:00:00Z`);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - LOOKBACK_MONTHS);
    const since = cutoff.toISOString().slice(0, 10);
    const past = live.filter((x) => x.end < t);
    const toFreeze = past.filter((x) => x.end >= since);
    for (const x of past.filter((x) => x.end < since))
      console.warn(`[travel] past trip older than ${LOOKBACK_MONTHS}-month lookback, not in archive: ${x.title} (${x.start})`);
    if (toFreeze.length) {
      if (process.env.TRAVEL_WRITE_ARCHIVE === '1') await freeze(toFreeze);
      else console.log(`[travel] ${toFreeze.length} past trip(s) not yet in archive (set TRAVEL_WRITE_ARCHIVE=1 to freeze)`);
    }

    const trips = [...live, ...travelArchive];
    trips.sort((a, b) => b.start.localeCompare(a.start));
    return { trips, feedOk };
  })();
  return memo;
}

export async function splitTrips() {
  const { trips, feedOk } = await allTrips();
  const t = today();
  const upcoming = trips.filter((x) => x.end >= t).reverse(); // soonest first
  const past = trips.filter((x) => x.end < t);
  return { upcoming, past, feedOk };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Apr 13–17, 2026", "Dec 24, 2025 – Jan 7, 2026", "Mar 6, 2023". */
export function formatRange(start: string, end: string): string {
  const [y1, m1, d1] = start.split('-').map(Number);
  const [y2, m2, d2] = end.split('-').map(Number);
  const a = `${MONTHS[m1 - 1]} ${d1}`;
  if (start === end) return `${a}, ${y1}`;
  if (y1 !== y2) return `${a}, ${y1} – ${MONTHS[m2 - 1]} ${d2}, ${y2}`;
  if (m1 !== m2) return `${a} – ${MONTHS[m2 - 1]} ${d2}, ${y1}`;
  return `${a}–${d2}, ${y1}`;
}

export function formatMonth(date: string): string {
  const [y, m] = date.split('-').map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : String(y);
}
