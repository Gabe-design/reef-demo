import { addDays, addMonths, format, parseISO, differenceInCalendarDays, isValid } from "date-fns";
import type { Cents, DateStr, Instant, Line, Service, ServiceId } from "./types";

export const TZ = "America/Los_Angeles";

/** Today's calendar date in Reef's timezone. */
export function businessToday(): DateStr {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Current local wall-clock time in Reef's timezone as YYYY-MM-DDTHH:mm:ss */
export function businessNow(): Instant {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

export function shiftDate(date: DateStr, days: number): DateStr {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}

export function shiftMonths(date: DateStr, months: number): DateStr {
  // date-fns clamps month-end (Jan 31 + 1 month = Feb 28/29), matching spec 5.
  return format(addMonths(parseISO(date), months), "yyyy-MM-dd");
}

export function daysBetween(a: DateStr, b: DateStr): number {
  return differenceInCalendarDays(parseISO(b), parseISO(a));
}

export function instant(date: DateStr, time = "09:00"): Instant {
  return `${date}T${time.length === 5 ? time + ":00" : time}`;
}

export function dateOf(i: Instant): DateStr {
  return i.slice(0, 10);
}

export function weekdayName(date: DateStr): string {
  return format(parseISO(date), "EEEE");
}

// ---------- formatting ----------

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function money(c: Cents, opts?: { whole?: boolean }): string {
  return (opts?.whole ? usd0 : usd).format(c / 100);
}

export function compactMoney(c: Cents): string {
  const d = c / 100;
  if (Math.abs(d) >= 1000) return "$" + (d / 1000).toFixed(d >= 10000 ? 0 : 1) + "k";
  return usd0.format(d);
}

export function pct(n: number | null, digits = 0): string {
  if (n === null || !isFinite(n)) return "N/A";
  return (n * 100).toFixed(digits) + "%";
}

export function fmtDate(d: DateStr | Instant, pattern = "MMM d"): string {
  const p = parseISO(d);
  return isValid(p) ? format(p, pattern) : d;
}

export function fmtTime(t: string): string {
  // "13:30" -> "1:30 PM"
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hh} ${suffix}` : `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function fmtWindow(a: string, b: string): string {
  return `${fmtTime(a)} - ${fmtTime(b)}`;
}

export function relDay(date: DateStr, today: DateStr): string {
  const n = daysBetween(today, date);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return format(parseISO(date), "EEEE");
  return format(parseISO(date), "MMM d");
}

export function fmtAgo(at: Instant, now: Instant): string {
  const mins = Math.round((parseISO(now).getTime() - parseISO(at).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return fmtDate(at);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

// ---------- pricing ----------

export function lineTotal(l: Line): Cents {
  return Math.round(l.qty * l.unitPrice);
}

export function subtotal(lines: Line[]): Cents {
  return lines.reduce((s, l) => s + lineTotal(l), 0);
}

export function estimateMinutes(lines: Line[], services: Service[]): number {
  const byId = new Map(services.map((s) => [s.id, s]));
  const mins = lines.reduce((s, l) => s + l.qty * (byId.get(l.serviceId)?.minutesPerUnit ?? 0), 0);
  return Math.max(45, Math.round(mins / 15) * 15);
}

export function serviceName(id: ServiceId, services: Service[]): string {
  return services.find((s) => s.id === id)?.name ?? id;
}

// ---------- deterministic random ----------

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed: number) {
  const r = mulberry32(seed);
  const api = {
    next: r,
    int: (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min,
    chance: (p: number) => r() < p,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!,
    weighted: <T extends string>(w: Record<T, number>): T => {
      const entries = Object.entries(w) as [T, number][];
      const total = entries.reduce((s, [, v]) => s + v, 0);
      let x = r() * total;
      for (const [k, v] of entries) {
        x -= v;
        if (x <= 0) return k;
      }
      return entries[entries.length - 1]![0];
    },
    shuffle: <T,>(arr: T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j]!, a[i]!];
      }
      return a;
    },
  };
  return api;
}
export type Rng = ReturnType<typeof makeRng>;

let idCounter = 0;
/** IDs for records created during a demo session (not seed data). */
export function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export const PHOTO = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;
