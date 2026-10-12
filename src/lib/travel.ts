// Merges the static travel archive with an optional public iCal feed (a
// dedicated "Travel" Google Calendar). Trips sort themselves into upcoming /
// past by date at build time; the nightly build keeps that current.
import { site, travelArchive, type Trip } from './data';

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
          place: ev.LOCATION ? unescapeIcs(ev.LOCATION.value).split(',')[0] : undefined,
          url: ev.URL?.value,
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

let feedLogged = false;

export async function allTrips(): Promise<{ trips: Trip[]; feedOk: boolean | null }> {
  const feed = process.env.TRAVEL_ICS_URL || site.travel_ics_url;
  let fromFeed: Trip[] = [];
  let feedOk: boolean | null = null;
  if (!feed && !feedLogged) console.log('[travel] no calendar feed configured; using archive only');
  if (feed) {
    try {
      const res = await fetch(feed, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`feed ${res.status}`);
      fromFeed = parseIcs(await res.text());
      feedOk = true;
      if (!feedLogged) console.log(`[travel] calendar feed OK: ${fromFeed.length} event(s)`);
    } catch (err) {
      console.warn(`[travel] calendar feed failed: ${err}`);
      feedOk = false;
    }
  }
  // Feed entries win over archive entries with the same title and start date.
  const key = (t: Trip) => `${t.title.toLowerCase()}|${t.start}`;
  const seen = new Set(fromFeed.map(key));
  const trips = [...fromFeed, ...travelArchive.filter((t) => !seen.has(key(t)))];
  trips.sort((a, b) => b.start.localeCompare(a.start));
  feedLogged = true;
  return { trips, feedOk };
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
