import doorsData from "./doors.json";
import {
  AUTOMATIONS,
  BUSINESSES,
  COMMERCIAL_AREAS,
  CREWS,
  EMPLOYEES,
  FIRST,
  JOB_PHOTO_SETS,
  LAST,
  MINIMUM_VISIT,
  NEIGHBORHOODS,
  PLAN_DISCOUNT,
  REFERRAL_POLICY,
  REVIEW_LINES,
  SERVICES,
} from "./catalog";
import type {
  Activity,
  ChecklistItem,
  Commission,
  CreditEntry,
  Customer,
  DateStr,
  DemoData,
  DoorOutcome,
  DoorVisit,
  Estimate,
  FollowUp,
  Invoice,
  Job,
  Lead,
  LeadSource,
  LeadStage,
  Line,
  MarketingSpend,
  Message,
  Payment,
  PlanCadence,
  PlanOffer,
  Property,
  Referral,
  Review,
  ServicePlan,
  StorefrontRoute,
  Territory,
  TimeEntry,
  WindowInventory,
} from "./types";
import {
  PHOTO,
  daysBetween,
  estimateMinutes,
  instant,
  makeRng,
  shiftDate,
  shiftMonths,
  subtotal,
  weekdayName,
  type Rng,
} from "./util";

export type Door = { id: number; lat: number; lng: number; number: number; street: string };

export const DOORS: Door[] = (doorsData.doors as unknown as [number, number, number, string][]).map(
  ([lat, lng, number, street], id) => ({ id, lat, lng, number, street }),
);
export const DOOR_SOURCE = doorsData.source;

const LNG_MIN = -117.2076;
const LNG_MAX = -117.1862;
const LAT_MIN = 32.8155;
const LAT_MAX = 32.8298;
const STRIP = (LNG_MAX - LNG_MIN) / 3;

export const TERRITORIES: Territory[] = [
  { id: "t_west", name: "Clairemont West", salespersonId: "e_brianna", color: "#db2777", polygon: box(LNG_MIN, LNG_MIN + STRIP) },
  { id: "t_central", name: "Clairemont Central", salespersonId: "e_theo", color: "#2563eb", polygon: box(LNG_MIN + STRIP, LNG_MIN + 2 * STRIP) },
  { id: "t_east", name: "Clairemont East", salespersonId: "e_jalen", color: "#ea580c", polygon: box(LNG_MIN + 2 * STRIP, LNG_MAX) },
];

function box(a: number, b: number): [number, number][] {
  return [
    [a, LAT_MIN],
    [b, LAT_MIN],
    [b, LAT_MAX],
    [a, LAT_MAX],
    [a, LAT_MIN],
  ];
}

export function territoryOfDoor(d: { lng: number }): Territory {
  const i = Math.min(2, Math.max(0, Math.floor((d.lng - LNG_MIN) / STRIP)));
  return TERRITORIES[i]!;
}

const ARRIVAL_SLOTS: [string, string][] = [
  ["08:00", "10:00"],
  ["09:30", "11:30"],
  ["11:00", "13:00"],
  ["12:30", "14:30"],
  ["14:00", "16:00"],
  ["15:30", "17:30"],
];

const CHECKLIST_BASE = (lines: Line[]): ChecklistItem[] => {
  const has = (id: string) => lines.some((l) => l.serviceId === id);
  const items: ChecklistItem[] = [
    { label: "Walk the property and note any existing damage", done: false, required: true },
    { label: "Before photos", done: false, required: true },
  ];
  if (has("ext")) items.push({ label: "Exterior glass, frames and sills", done: false, required: true });
  if (has("int")) items.push({ label: "Interior glass and sills (drop cloths down)", done: false, required: true });
  if (has("screen")) items.push({ label: "Screens washed and reinstalled", done: false, required: true });
  if (has("track")) items.push({ label: "Tracks vacuumed and wiped", done: false, required: true });
  if (has("skylight")) items.push({ label: "Skylights (log roof access)", done: false, required: true });
  if (has("hardwater")) items.push({ label: "Hard-water test spot approved by customer", done: false, required: true });
  if (has("storefront")) items.push({ label: "Doors, display glass and entry frames", done: false, required: true });
  items.push({ label: "After photos", done: false, required: true });
  items.push({ label: "Final walkthrough with customer", done: false, required: false });
  return items;
};

export function checklistFor(lines: Line[], done = false): ChecklistItem[] {
  return CHECKLIST_BASE(lines).map((c) => ({ ...c, done }));
}

const rate = (id: string) => SERVICES.find((s) => s.id === id)!.rate;

function residentialLines(inv: WindowInventory, r: Rng, full = r.chance(0.7)): Line[] {
  const lines: Line[] = [{ serviceId: "ext", qty: inv.exterior, unitPrice: rate("ext") }];
  if (full) lines.push({ serviceId: "int", qty: inv.interior, unitPrice: rate("int") });
  if (inv.screens && r.chance(0.75)) lines.push({ serviceId: "screen", qty: inv.screens, unitPrice: rate("screen") });
  if (inv.tracks && r.chance(0.45)) lines.push({ serviceId: "track", qty: inv.tracks, unitPrice: rate("track") });
  if (inv.skylights) lines.push({ serviceId: "skylight", qty: inv.skylights, unitPrice: rate("skylight") });
  if (inv.hardWaterPanes && r.chance(0.6)) lines.push({ serviceId: "hardwater", qty: inv.hardWaterPanes, unitPrice: rate("hardwater") });
  return withMinimum(lines);
}

export function withMinimum(lines: Line[]): Line[] {
  const base = lines.filter((l) => l.serviceId !== "callout");
  const sub = subtotal(base);
  if (sub > 0 && sub < MINIMUM_VISIT) return [...base, { serviceId: "callout", qty: 1, unitPrice: MINIMUM_VISIT - sub }];
  return base;
}

const phone = (r: Rng) => `(${r.pick(["619", "858", "760"])}) 555-01${String(r.int(10, 99))}`;
const code = (r: Rng, name: string) =>
  `REEF-${name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}${r.int(10, 99)}`;

/**
 * Builds a full, internally consistent sample company relative to `today`.
 * Deterministic: the same seed always yields the same records and IDs, only
 * dates move with the calendar.
 */
export function generate(today: DateStr, nowMinutes = 13 * 60): DemoData {
  const r = makeRng(20261006);
  const d = (offset: number) => shiftDate(today, offset);

  const customers: Customer[] = [];
  const properties: Property[] = [];
  const jobs: Job[] = [];
  const plans: ServicePlan[] = [];
  const planOffers: PlanOffer[] = [];
  const followUps: FollowUp[] = [];
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const messages: Message[] = [];
  const reviews: Review[] = [];
  const commissions: Commission[] = [];
  const credit: CreditEntry[] = [];
  const referrals: Referral[] = [];
  const doorVisits: DoorVisit[] = [];
  const leads: Lead[] = [];
  const estimates: Estimate[] = [];

  let jobSeq = 1000;
  let invSeq = 2400;
  let estSeq = 410;
  let msgSeq = 0;
  let payN = 0;
  const usedNames = new Set<string>();

  const personName = () => {
    for (;;) {
      const n = `${r.pick(FIRST)} ${r.pick(LAST)}`;
      if (!usedNames.has(n)) {
        usedNames.add(n);
        return n;
      }
    }
  };

  const inventory = (kind: "house" | "condo"): WindowInventory => {
    const size = kind === "condo" ? r.int(8, 16) : r.pick([r.int(14, 22), r.int(20, 30), r.int(28, 46)]);
    return {
      exterior: size,
      interior: Math.max(6, size - r.int(0, 4)),
      screens: Math.round(size * (0.45 + r.next() * 0.3)),
      tracks: Math.round(size * (0.2 + r.next() * 0.2)),
      skylights: r.chance(0.3) ? r.int(1, 3) : 0,
      hardWaterPanes: r.chance(0.22) ? r.int(2, 8) : 0,
    };
  };

  const addCustomer = (c: Omit<Customer, "id" | "referralCode" | "tags">, p: Omit<Property, "id" | "customerId">, tags: string[] = []) => {
    const id = `c${customers.length + 1}`;
    const cust: Customer = { ...c, id, referralCode: code(r, c.name), tags };
    customers.push(cust);
    properties.push({ ...p, id: `p${properties.length + 1}`, customerId: id });
    return cust;
  };

  const msg = (m: Omit<Message, "id">) => {
    msgSeq += 1;
    messages.push({ ...m, id: `m${msgSeq}` });
  };

  const crewFor = (zone: string) => (zone === "coast" ? "c_coral" : zone === "north" ? (r.chance(0.5) ? "c_coral" : "c_kelp") : "c_kelp");

  const crewMembers = (crewId: string) => CREWS.find((c) => c.id === crewId)!.memberIds;

  const photoSet = (date: DateStr, byId: string) => {
    const img = r.pick(JOB_PHOTO_SETS);
    return [
      { id: `ph${jobSeq}b`, kind: "before" as const, src: PHOTO(img, 800), takenAt: instant(date, "09:10"), byId, caption: "Before" },
      { id: `ph${jobSeq}a`, kind: "after" as const, src: PHOTO(img, 800), takenAt: instant(date, "10:40"), byId, caption: "After" },
    ];
  };

  /** Creates a job, and if it's in the past, its invoice, payment, messages, review. */
  const addJob = (opts: {
    customer: Customer;
    property: Property;
    date: DateStr;
    lines: Line[];
    discountPct?: number;
    planId?: string;
    occurrence?: number;
    crewId: string;
    slot?: number;
    status?: Job["status"];
    soldById?: string;
    autopay?: boolean;
    storefrontRouteId?: string;
  }): Job => {
    jobSeq += 1;
    const sub = subtotal(opts.lines);
    const discount = Math.round(sub * (opts.discountPct ?? 0));
    const past = daysBetween(opts.date, today) > 0;
    const slot = ARRIVAL_SLOTS[opts.slot ?? r.int(0, 5)]!;
    const status = opts.status ?? (past ? "completed" : "scheduled");
    const assignees = crewMembers(opts.crewId);
    const job: Job = {
      id: `j${jobSeq}`,
      number: `J-${jobSeq}`,
      customerId: opts.customer.id,
      propertyId: opts.property.id,
      status,
      date: opts.date,
      arrivalStart: slot[0],
      arrivalEnd: slot[1],
      durationMin: estimateMinutes(opts.lines, SERVICES),
      crewId: opts.crewId,
      assigneeIds: assignees,
      routeOrder: opts.slot ?? 0,
      lines: opts.lines,
      discount,
      total: sub - discount,
      planId: opts.planId,
      occurrence: opts.occurrence,
      checklist: checklistFor(opts.lines, status === "completed"),
      photos: status === "completed" ? photoSet(opts.date, assignees[0]!) : [],
      notes: [],
      issues: [],
      soldById: opts.soldById,
      storefrontRouteId: opts.storefrontRouteId,
    };
    if (status === "completed") {
      job.startedAt = instant(opts.date, slot[0]);
      const [h, m] = slot[0].split(":").map(Number);
      const end = h! * 60 + m! + job.durationMin;
      job.completedAt = instant(opts.date, `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`);
    }
    jobs.push(job);

    const first = opts.customer.contactName.split(" ")[0];
    const daysAgo = daysBetween(opts.date, today);
    const chatty = daysAgo < 50 && daysAgo > -15 && !opts.storefrontRouteId;

    if (chatty) {
      msg({ customerId: opts.customer.id, to: opts.customer.phone, direction: "out", trigger: "confirmation", status: "delivered", at: instant(shiftDate(opts.date, -r.int(4, 12)), "10:12"), body: `You're booked! Reef will be at ${opts.property.street} on ${opts.date.slice(5).replace("-", "/")}, arriving ${slot[0]}-${slot[1]}.` });
      if (daysAgo >= 1 || daysAgo === 0) {
        msg({ customerId: opts.customer.id, to: opts.customer.phone, direction: "out", trigger: "reminder", status: r.chance(0.97) ? "delivered" : "undelivered", at: instant(shiftDate(opts.date, -1), "17:00"), body: `Reminder: Reef Window Cleaning is coming tomorrow, arriving ${slot[0]}-${slot[1]}. Please unlock gates and side yards.` });
      }
    }

    if (status === "completed") {
      invSeq += 1;
      const commercial = opts.customer.kind === "commercial";
      const inv: Invoice = {
        id: `i${invSeq}`,
        number: `INV-${invSeq}`,
        customerId: opts.customer.id,
        jobId: job.id,
        issuedOn: opts.date,
        dueOn: commercial ? shiftDate(opts.date, 15) : opts.date,
        lines: opts.lines,
        subtotal: sub,
        discount,
        credit: 0,
        tax: 0,
        total: sub - discount,
        paid: 0,
        status: "open",
      };
      invoices.push(inv);
      job.invoiceId = inv.id;

      const recent = daysAgo <= 9;
      let paid = true;
      let method: Payment["method"] = "online";
      if (opts.autopay) {
        method = "card_on_file";
        if (r.chance(0.035) && daysAgo < 40) {
          paid = false;
          payN += 1;
          payments.push({ id: `pay${payN}`, invoiceId: inv.id, customerId: opts.customer.id, amount: inv.total, method, status: "failed", at: job.completedAt!, brand: opts.customer.cardOnFile?.brand, last4: opts.customer.cardOnFile?.last4, kind: "payment", failureReason: r.pick(["Card expired", "Insufficient funds", "Card declined by bank"]) });
          msg({ customerId: opts.customer.id, to: opts.customer.phone, direction: "out", trigger: "failed_payment", status: "delivered", at: job.completedAt!, body: `Hi ${first}, the card on file for invoice ${inv.number} didn't go through. Update it or pay securely here: reef.link/p/${inv.number}`, clicked: r.chance(0.4) });
          followUps.push({ id: `f${followUps.length + 1}`, customerId: opts.customer.id, ownerId: "e_dana", due: shiftDate(opts.date, 3), reason: "failed_payment", note: `Card declined for ${inv.number}. Call if not updated.`, done: false });
        }
      } else if (commercial) {
        method = r.chance(0.5) ? "check" : "online";
        if (daysAgo < 12 && r.chance(0.5)) paid = false;
      } else {
        method = r.chance(0.35) ? "tap_to_pay" : "online";
        if (recent && method === "online" && r.chance(0.35)) paid = false;
      }
      if (paid) {
        payN += 1;
        const payDay = method === "online" && !commercial ? shiftDate(opts.date, Math.min(daysAgo, r.int(0, 3))) : commercial ? shiftDate(opts.date, Math.min(daysAgo, r.int(3, 14))) : opts.date;
        const p: Payment = { id: `pay${payN}`, invoiceId: inv.id, customerId: opts.customer.id, amount: inv.total, method, status: "succeeded", at: instant(payDay, method === "card_on_file" || method === "tap_to_pay" ? job.completedAt!.slice(11) : "19:42"), kind: "payment" };
        if (method === "card_on_file" || method === "online" || method === "tap_to_pay") {
          p.brand = opts.customer.cardOnFile?.brand ?? r.pick(["Visa", "Mastercard", "Amex"]);
          p.last4 = opts.customer.cardOnFile?.last4 ?? String(r.int(1000, 9999));
        }
        payments.push(p);
        inv.paid = inv.total;
        inv.status = "paid";
        if (chatty) msg({ customerId: opts.customer.id, to: opts.customer.phone, direction: "out", trigger: "receipt", status: "delivered", at: p.at, body: `Thanks ${first}! We received $${(inv.total / 100).toFixed(2)} for invoice ${inv.number}.`, clicked: r.chance(0.2) });
      }
      if (chatty) {
        msg({ customerId: opts.customer.id, to: opts.customer.phone, direction: "out", trigger: "completed", status: "delivered", at: job.completedAt!, body: `All done at ${opts.property.street}! Your before-and-after photos are in your Reef account.`, clicked: r.chance(0.45) });
      }
      // review request + review
      if (!commercial && daysAgo >= 1 && r.chance(0.8)) {
        const reqAt = instant(shiftDate(opts.date, 1), "10:00");
        if (chatty) msg({ customerId: opts.customer.id, to: opts.customer.phone, direction: "out", trigger: "review", status: "delivered", at: reqAt, body: `Hi ${first}, how did your windows turn out? A quick Google review helps a small local team a lot.`, clicked: r.chance(0.5) });
        if (r.chance(0.36)) {
          const rating = r.weighted({ "5": 86, "4": 11, "3": 3 });
          reviews.push({ id: `rv${reviews.length + 1}`, customerId: opts.customer.id, jobId: job.id, rating: Number(rating), body: r.pick(REVIEW_LINES), source: r.weighted({ Google: 80, Yelp: 14, Nextdoor: 6 }) as Review["source"], at: instant(shiftDate(opts.date, Math.min(daysAgo, r.int(1, 4))), "20:15"), requested: true });
        }
      }
      // sales commission on first job sold by a rep
      if (opts.soldById) {
        const emp = EMPLOYEES.find((e) => e.id === opts.soldById);
        if (emp?.commissionPct) {
          commissions.push({ id: `cm${commissions.length + 1}`, employeeId: emp.id, jobId: job.id, basis: inv.total, amount: Math.round(inv.total * emp.commissionPct), status: inv.status === "paid" ? (daysAgo > 14 ? "paid" : "earned") : "pending", on: opts.date });
        }
      }
    } else if (opts.soldById) {
      const emp = EMPLOYEES.find((e) => e.id === opts.soldById);
      if (emp?.commissionPct) commissions.push({ id: `cm${commissions.length + 1}`, employeeId: emp.id, jobId: job.id, basis: job.total, amount: Math.round(job.total * emp.commissionPct), status: "pending", on: opts.date });
    }
    return job;
  };

  // ---------------------------------------------------------------- residential
  const nbWeights = Object.fromEntries(NEIGHBORHOODS.map((n) => [n.name, n.w])) as Record<string, number>;
  const cardBrands = ["Visa", "Visa", "Mastercard", "Amex", "Discover"];

  for (let i = 0; i < 128; i++) {
    const nbName = r.weighted(nbWeights);
    const nb = NEIGHBORHOODS.find((n) => n.name === nbName)!;
    const name = personName();
    const kind = r.chance(0.86) ? "house" : "condo";
    const firstOffset = -Math.round(Math.pow(r.next(), 0.8) * 420) - 4;
    const firstDate = d(firstOffset);
    const source = r.weighted<LeadSource>({ website: 26, referral: 18, google: 22, nextdoor: 10, yelp: 9, instagram: 7, repeat: 0, door_to_door: 0 });
    const planRoll = r.next();
    const cadence: PlanCadence | null = planRoll < 0.17 ? "quarterly" : planRoll < 0.38 ? "semiannual" : planRoll < 0.47 ? "annual" : null;
    const card = { brand: r.pick(cardBrands), last4: String(r.int(1000, 9999)), exp: `${String(r.int(1, 12)).padStart(2, "0")}/${r.int(27, 30)}` };
    const cust = addCustomer(
      {
        name,
        kind: "residential",
        contactName: name,
        phone: phone(r),
        email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        source,
        createdAt: instant(shiftDate(firstDate, -r.int(2, 9)), "11:20"),
        cardOnFile: cadence || r.chance(0.3) ? card : undefined,
      },
      {
        street: `${r.int(12, 79) * 100 + r.int(0, 98)} ${r.pick(nb.streets)}`,
        city: nb.city,
        zip: nb.zip,
        neighborhood: nb.name,
        lat: nb.box[0] + r.next() * (nb.box[1] - nb.box[0]),
        lng: nb.box[2] + r.next() * (nb.box[3] - nb.box[2]),
        kind,
        stories: kind === "condo" ? 1 : r.pick([1, 1, 2, 2, 2, 3]),
        inventory: inventory(kind),
        accessNotes: r.chance(0.4) ? r.pick(["Side gate on the left, dog is friendly", "Park on street, driveway is shared", "Back slider stays locked; text when done", "Ring doorbell, owner works from home", "Ladder needed for the bay window", "Sprinklers run Tue/Fri mornings"]) : undefined,
        gateCode: r.chance(0.2) ? String(r.int(1000, 9999)) : undefined,
      },
      kind === "condo" ? ["HOA"] : [],
    );
    const prop = properties[properties.length - 1]!;
    const crewId = crewFor(nb.zone);
    const baseLines = residentialLines(prop.inventory, r);

    if (cadence) {
      const months = cadence === "quarterly" ? 3 : cadence === "semiannual" ? 6 : 12;
      const statusRoll = r.next();
      const status: ServicePlan["status"] = statusRoll < 0.86 ? "active" : statusRoll < 0.93 ? "paused" : "cancelled";
      const plan: ServicePlan = {
        id: `pl${plans.length + 1}`,
        customerId: cust.id,
        propertyId: prop.id,
        cadence,
        status,
        lines: baseLines,
        pricePerVisit: Math.round(subtotal(baseLines) * (1 - PLAN_DISCOUNT[cadence])),
        discountPct: PLAN_DISCOUNT[cadence],
        anchorDate: firstDate,
        nextDate: firstDate,
        startedAt: instant(firstDate, "15:30"),
        soldById: r.chance(0.5) ? r.pick(["e_brianna", "e_theo", "e_dana"]) : "e_dana",
        autopay: true,
        events: [{ at: instant(firstDate, "15:30"), kind: "created", note: `Enrolled in ${cadence} plan after first cleaning` }],
        skippedOccurrences: [],
      };
      plans.push(plan);
      planOffers.push({ id: `po${planOffers.length + 1}`, customerId: cust.id, at: instant(firstDate, "15:20"), cadence, outcome: "accepted", byId: plan.soldById! });
      let occ = 0;
      let date = firstDate;
      let stopDate: DateStr | null = null;
      if (status !== "active") {
        stopDate = d(-r.int(10, 80));
      }
      while (daysBetween(today, date) <= 45) {
        if (stopDate && daysBetween(stopDate, date) > 0) break;
        const past = daysBetween(date, today) > 0;
        if (past && occ > 0 && r.chance(0.04)) {
          plan.skippedOccurrences.push(occ);
          plan.events.push({ at: instant(shiftDate(date, -5), "09:00"), kind: "skipped", note: "Customer out of town" });
        } else if (past || daysBetween(today, date) <= 21) {
          addJob({ customer: cust, property: prop, date: occ === 0 ? date : shiftDate(date, r.int(-3, 3)), lines: baseLines, discountPct: occ === 0 ? 0 : PLAN_DISCOUNT[cadence], planId: plan.id, occurrence: occ, crewId, autopay: true });
        }
        occ += 1;
        date = shiftMonths(firstDate, months * occ);
      }
      plan.nextDate = date;
      // next date = first future occurrence
      for (let k = 0; k < 40; k++) {
        const cand = shiftMonths(firstDate, months * k);
        if (daysBetween(today, cand) >= 0) {
          plan.nextDate = cand;
          break;
        }
      }
      const booked = jobs.filter((j) => j.planId === plan.id && j.status === "scheduled" && daysBetween(today, j.date) >= 0).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
      if (booked) plan.nextDate = booked.date;
      if (status === "paused") {
        plan.pausedUntil = d(r.int(20, 90));
        plan.events.push({ at: instant(stopDate!, "12:00"), kind: "paused", note: r.pick(["Home remodel, resume after construction", "Selling the house, pausing for now", "Budget, wants to revisit in spring"]) });
        followUps.push({ id: `f${followUps.length + 1}`, customerId: cust.id, ownerId: "e_dana", due: plan.pausedUntil, reason: "due_again", note: "Paused plan review date", done: false });
      }
      if (status === "cancelled") {
        plan.cancelReason = r.pick(["Moving out of the area", "Switched to HOA vendor", "Price", "Did not give a reason"]);
        plan.events.push({ at: instant(stopDate!, "12:00"), kind: "cancelled", note: plan.cancelReason });
        followUps.push({ id: `f${followUps.length + 1}`, customerId: cust.id, ownerId: "e_dana", due: d(r.int(-10, 60)), reason: "due_again", note: "Plan cancelled. Check in before next season.", done: false });
      }
    } else {
      const j1 = addJob({ customer: cust, property: prop, date: firstDate, lines: baseLines, crewId });
      let last = j1.date;
      if (firstOffset < -200 && r.chance(0.3)) {
        const j2 = addJob({ customer: cust, property: prop, date: shiftDate(firstDate, r.int(170, 200)), lines: residentialLines(prop.inventory, r), crewId });
        last = j2.date;
      }
      const declined = r.chance(0.62);
      if (declined) {
        const fu = shiftDate(last, r.pick([60, 90, 120]));
        planOffers.push({ id: `po${planOffers.length + 1}`, customerId: cust.id, at: instant(last, "15:20"), cadence: r.pick<PlanCadence>(["quarterly", "semiannual", "semiannual", "annual"]), outcome: "declined", reason: r.pick(["Wants to see results first", "Price", "Only needs it before selling", "Will think about it", "Does it themselves between visits"]), byId: r.pick(["e_dana", "e_brianna", "e_theo"]), followUpOn: fu });
        followUps.push({ id: `f${followUps.length + 1}`, customerId: cust.id, ownerId: "e_dana", due: fu, reason: "declined_plan", note: "Declined plan at first visit. Offer 6-month plan again.", done: daysBetween(fu, today) > 25 });
      }
      const dueAgain = shiftDate(last, 180);
      // older overdue follow-ups were mostly worked already (texted or called)
      followUps.push({ id: `f${followUps.length + 1}`, customerId: cust.id, ownerId: r.pick(["e_dana", "e_dana", "e_brianna", "e_theo"]), due: dueAgain, reason: "due_again", note: "Recommended cleaning interval reached (6 months)", done: daysBetween(dueAgain, today) > 10 && r.chance(0.88) });
      if (daysBetween(dueAgain, today) > 0 && daysBetween(dueAgain, today) < 40 && !cust.doNotText) {
        msg({ customerId: cust.id, to: cust.phone, direction: "out", trigger: "win_back", status: "delivered", at: instant(dueAgain, "10:30"), body: `Hi ${cust.name.split(" ")[0]}, it's been about 6 months since Reef cleaned your windows. Want us to get you on the schedule?`, clicked: r.chance(0.3), replied: r.chance(0.15) });
      }
    }
  }

  // ---------------------------------------------------------------- door-to-door (Clairemont)
  const reps = ["e_brianna", "e_theo", "e_jalen"] as const;
  const canvassDays: DateStr[] = [];
  for (let k = 70; k >= 1; k--) {
    const dd = d(-k);
    const wd = weekdayName(dd);
    if (wd !== "Sunday" && wd !== "Monday") canvassDays.push(dd);
  }
  let visitN = 0;
  const bookedDoors: { door: Door; rep: string; date: DateStr; leadValue: number }[] = [];
  for (const door of DOORS) {
    const terr = territoryOfDoor(door);
    const rep = terr.salespersonId;
    // Jalen started later, so his territory is less worked
    const coverage = rep === "e_jalen" ? 0.5 : 0.74;
    if (!r.chance(coverage)) continue;
    const nVisits = r.weighted({ "1": 68, "2": 23, "3": 9 });
    const days = r.shuffle(canvassDays.filter((x) => rep !== "e_jalen" || daysBetween(x, today) < 34)).slice(0, Number(nVisits)).sort();
    days.forEach((day, idx) => {
      const final = idx === days.length - 1;
      const outcome: DoorOutcome = final
        ? r.weighted<DoorOutcome>({ no_answer: 41, not_interested: 19, interested: 10, follow_up: 10, estimate_given: 8, booked: 7, do_not_knock: 5 })
        : r.weighted<DoorOutcome>({ no_answer: 70, follow_up: 20, interested: 10, not_interested: 0, estimate_given: 0, booked: 0, do_not_knock: 0 });
      visitN += 1;
      const hh = r.int(15, 18);
      const v: DoorVisit = {
        id: `dv${visitN}`,
        doorId: door.id,
        at: instant(day, `${hh}:${String(r.int(0, 59)).padStart(2, "0")}`),
        salespersonId: rep,
        outcome,
        conversation: outcome !== "no_answer" && (outcome !== "do_not_knock" || r.chance(0.5)),
        note:
          outcome === "follow_up"
            ? r.pick(["Spouse decides, come back Saturday", "Asked to text a quote", "Renting, will ask landlord", "Come back after 5pm"])
            : outcome === "interested"
              ? r.pick(["Wants screens + tracks too", "Neighbor uses us, liked the photos", "Has hard-water spots on back slider"])
              : outcome === "not_interested"
                ? r.pick(["Does it himself", "Just had them cleaned", "Not right now"])
                : undefined,
      };
      doorVisits.push(v);
      if (final && outcome === "booked") bookedDoors.push({ door, rep, date: day, leadValue: 0 });
    });
  }

  // customers created from booked doors
  for (const b of bookedDoors) {
    const name = personName();
    const cust = addCustomer(
      {
        name,
        kind: "residential",
        contactName: name,
        phone: phone(r),
        email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        source: "door_to_door",
        createdAt: instant(b.date, "17:05"),
        salespersonId: b.rep,
        cardOnFile: r.chance(0.5) ? { brand: r.pick(cardBrands), last4: String(r.int(1000, 9999)), exp: "08/29" } : undefined,
      },
      {
        street: `${b.door.number} ${b.door.street}`,
        city: "San Diego",
        zip: "92117",
        neighborhood: "Clairemont",
        lat: b.door.lat,
        lng: b.door.lng,
        kind: "house",
        stories: r.pick([1, 1, 2]),
        inventory: inventory("house"),
      },
      ["Door-to-door"],
    );
    const prop = properties[properties.length - 1]!;
    const jobDate = shiftDate(b.date, r.int(3, 16));
    const lines = residentialLines(prop.inventory, r);
    // door-to-door bookings are split across both residential crews
    const job = addJob({ customer: cust, property: prop, date: jobDate, lines, crewId: r.chance(0.45) ? "c_coral" : "c_kelp", soldById: b.rep });
    const v = doorVisits.find((x) => x.doorId === b.door.id && x.outcome === "booked");
    if (v) v.bookedValue = job.total;
    if (job.status === "completed" && r.chance(0.42)) {
      const cadence = r.pick<PlanCadence>(["semiannual", "semiannual", "quarterly", "annual"]);
      const months = cadence === "quarterly" ? 3 : cadence === "semiannual" ? 6 : 12;
      plans.push({
        id: `pl${plans.length + 1}`,
        customerId: cust.id,
        propertyId: prop.id,
        cadence,
        status: "active",
        lines,
        pricePerVisit: Math.round(subtotal(lines) * (1 - PLAN_DISCOUNT[cadence])),
        discountPct: PLAN_DISCOUNT[cadence],
        anchorDate: jobDate,
        nextDate: shiftMonths(jobDate, months),
        startedAt: instant(jobDate, "15:00"),
        soldById: b.rep,
        autopay: true,
        events: [{ at: instant(jobDate, "15:00"), kind: "created", note: "Signed up at first cleaning" }],
        skippedOccurrences: [],
      });
      planOffers.push({ id: `po${planOffers.length + 1}`, customerId: cust.id, at: instant(jobDate, "15:00"), cadence, outcome: "accepted", byId: b.rep });
    } else if (job.status === "completed") {
      followUps.push({ id: `f${followUps.length + 1}`, customerId: cust.id, ownerId: b.rep, due: shiftDate(jobDate, 180), reason: "due_again", note: "First cleaning done, no plan yet", done: false });
    }
  }

  // ---------------------------------------------------------------- commercial routes
  const routeDays = [weekdayName(today), weekdayName(d(2)), weekdayName(d(4))];
  const storefrontRoutes: StorefrontRoute[] = [
    { id: "sr_downtown", name: "Downtown & Little Italy", cadence: "weekly", day: routeDays[0]!, crewMemberId: "e_devon", customerIds: [] },
    { id: "sr_beach", name: "Beach storefronts", cadence: "weekly", day: routeDays[1]!, crewMemberId: "e_devon", customerIds: [] },
    { id: "sr_monthly", name: "Monthly storefronts", cadence: "monthly", day: routeDays[2]!, crewMemberId: "e_devon", customerIds: [] },
  ];
  const todayStorefront: Job[] = [];
  BUSINESSES.forEach((biz, i) => {
    const route = i < 7 ? storefrontRoutes[0]! : i < 12 ? storefrontRoutes[1]! : storefrontRoutes[2]!;
    const area = route.id === "sr_downtown" ? COMMERCIAL_AREAS[i % 2]! : route.id === "sr_beach" ? COMMERCIAL_AREAS[3 + (i % 2)]! : COMMERCIAL_AREAS[2]!;
    const contact = personName();
    const startOffset = -r.int(60, 330);
    const cust = addCustomer(
      {
        name: biz,
        kind: "commercial",
        contactName: contact,
        phone: phone(r),
        email: `${contact.split(" ")[0]!.toLowerCase()}@${biz.toLowerCase().replace(/[^a-z]+/g, "")}.example`,
        source: r.weighted<LeadSource>({ door_to_door: 40, google: 25, referral: 20, website: 15, nextdoor: 0, yelp: 0, instagram: 0, repeat: 0 }),
        createdAt: instant(d(startOffset - 5), "10:00"),
        cardOnFile: r.chance(0.5) ? { brand: "Visa", last4: String(r.int(1000, 9999)), exp: "11/28" } : undefined,
      },
      {
        street: `${r.int(3, 19) * 100 + r.int(0, 60)} ${r.pick(area.streets)}`,
        city: area.city,
        zip: area.zip,
        neighborhood: area.name,
        lat: area.box[0] + r.next() * (area.box[1] - area.box[0]),
        lng: area.box[2] + r.next() * (area.box[3] - area.box[2]),
        kind: "storefront",
        stories: 1,
        inventory: { exterior: r.int(4, 12), interior: r.int(4, 12), screens: 0, tracks: 0, skylights: 0, hardWaterPanes: 0 },
        accessNotes: r.pick(["Clean before 10am opening", "Back door code on file", "Ask for manager on duty", "Inside glass Sundays only"]),
      },
      ["Storefront route"],
    );
    route.customerIds.push(cust.id);
    const prop = properties[properties.length - 1]!;
    const price = r.pick([4500, 5500, 6500, 7500, 9500]);
    const lines: Line[] = [{ serviceId: "storefront", qty: 1, unitPrice: price }];
    const cadence: PlanCadence = route.cadence;
    const plan: ServicePlan = {
      id: `pl${plans.length + 1}`,
      customerId: cust.id,
      propertyId: prop.id,
      cadence,
      status: "active",
      lines,
      pricePerVisit: price,
      discountPct: 0,
      anchorDate: d(startOffset),
      nextDate: today,
      startedAt: instant(d(startOffset), "09:00"),
      soldById: "e_dana",
      autopay: !!cust.cardOnFile,
      events: [{ at: instant(d(startOffset), "09:00"), kind: "created", note: `${route.name} (${route.day}s)` }],
      skippedOccurrences: [],
    };
    plans.push(plan);
    // visits on the route day: weekly for the last 10 weeks, monthly for 6 months
    const anchorOffset = route.id === "sr_downtown" ? 0 : route.id === "sr_beach" ? 2 : 4;
    const step = cadence === "weekly" ? 7 : 28;
    const count = cadence === "weekly" ? 10 : 6;
    let occ = 0;
    for (let k = count; k >= -1; k--) {
      const date = d(anchorOffset - k * step);
      if (daysBetween(plan.anchorDate, date) < 0) continue;
      const isToday = date === today;
      // the storefront route runs 6-10 AM, so by mid-morning today's stops are done
      const status = isToday ? (nowMinutes >= 10 * 60 + 30 ? "completed" : "scheduled") : undefined;
      const job = addJob({ customer: cust, property: prop, date, lines, planId: plan.id, occurrence: occ, crewId: "c_tide", slot: 0, status, autopay: plan.autopay, storefrontRouteId: route.id });
      if (isToday && status === "completed") todayStorefront.push(job);
      occ += 1;
    }
    plan.nextDate = d(anchorOffset + (anchorOffset === 0 ? 0 : 0));
  });
  // storefront stop order + times for today/upcoming
  for (const route of storefrontRoutes) {
    const routeJobs = jobs.filter((j) => j.storefrontRouteId === route.id && (j.status !== "completed" || j.date === today));
    const byDate = new Map<string, Job[]>();
    routeJobs.forEach((j) => byDate.set(j.date, [...(byDate.get(j.date) ?? []), j]));
    byDate.forEach((list) => {
      list.forEach((j, idx) => {
        const start = 6 * 60 + idx * 40;
        const s = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
        const e2 = start + 60;
        j.arrivalStart = s;
        j.arrivalEnd = `${String(Math.floor(e2 / 60)).padStart(2, "0")}:${String(e2 % 60).padStart(2, "0")}`;
        j.routeOrder = idx;
      });
    });
  }
  // completed storefront stops today: times follow the route order
  todayStorefront.forEach((j) => {
    const [h, m] = j.arrivalStart.split(":").map(Number);
    j.startedAt = instant(today, j.arrivalStart);
    const end = h! * 60 + m! + 30;
    j.completedAt = instant(today, `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`);
  });

  // ---------------------------------------------------------------- today's residential routes
  // Re-time the residential jobs already scheduled today, and top up each crew to a full day.
  for (const crewId of ["c_coral", "c_kelp"]) {
    const target = crewId === "c_coral" ? 6 : 5;
    let todays = jobs.filter((j) => j.date === today && j.crewId === crewId && !j.storefrontRouteId);
    const pool = customers.filter(
      (c) =>
        c.kind === "residential" &&
        !jobs.some((j) => j.customerId === c.id && daysBetween(today, j.date) >= 0) &&
        (crewId === "c_coral"
          ? ["Pacific Beach", "La Jolla", "Bird Rock"].includes(properties.find((p) => p.customerId === c.id)!.neighborhood)
          : ["Clairemont", "University City", "Point Loma", "Mission Hills"].includes(properties.find((p) => p.customerId === c.id)!.neighborhood)),
    );
    const extra = r.shuffle(pool).slice(0, Math.max(0, target - todays.length));
    for (const c of extra) {
      const prop = properties.find((p) => p.customerId === c.id)!;
      const plan = plans.find((p) => p.customerId === c.id && p.status === "active");
      addJob({ customer: c, property: prop, date: today, lines: plan?.lines ?? residentialLines(prop.inventory, r), discountPct: plan?.discountPct, planId: plan?.id, crewId, autopay: !!plan });
    }
    todays = jobs.filter((j) => j.date === today && j.crewId === crewId && !j.storefrontRouteId);
    // order geographically west -> east and assign sequential arrival windows
    todays.sort((a, b) => properties.find((p) => p.id === a.propertyId)!.lng - properties.find((p) => p.id === b.propertyId)!.lng);
    todays.forEach((j, idx) => {
      const slot = ARRIVAL_SLOTS[Math.min(idx, ARRIVAL_SLOTS.length - 1)]!;
      j.arrivalStart = slot[0];
      j.arrivalEnd = slot[1];
      j.routeOrder = idx;
      j.status = idx < 2 ? "completed" : idx === 2 ? (crewId === "c_coral" ? "in_progress" : "en_route") : "scheduled";
      j.checklist = checklistFor(j.lines, j.status === "completed");
      if (j.status === "in_progress") {
        j.startedAt = instant(today, slot[0]);
        j.checklist = j.checklist.map((c, ci) => ({ ...c, done: ci < 3 }));
        j.photos = [{ id: `ph${j.id}b`, kind: "before", src: PHOTO(JOB_PHOTO_SETS[0]!, 800), takenAt: instant(today, slot[0]), byId: j.assigneeIds[0]!, caption: "Front bay window" }];
      }
      if (j.status === "completed") {
        j.startedAt = instant(today, slot[0]);
        j.completedAt = instant(today, slot[1]);
        j.photos = [
          { id: `ph${j.id}b`, kind: "before", src: PHOTO(JOB_PHOTO_SETS[(idx + 1) % 6]!, 800), takenAt: instant(today, slot[0]), byId: j.assigneeIds[0]!, caption: "Before" },
          { id: `ph${j.id}a`, kind: "after", src: PHOTO(JOB_PHOTO_SETS[(idx + 1) % 6]!, 800), takenAt: instant(today, slot[1]), byId: j.assigneeIds[0]!, caption: "After" },
        ];
        if (!j.invoiceId) {
          invSeq += 1;
          const cust = customers.find((c) => c.id === j.customerId)!;
          const inv: Invoice = { id: `i${invSeq}`, number: `INV-${invSeq}`, customerId: j.customerId, jobId: j.id, issuedOn: today, dueOn: today, lines: j.lines, subtotal: subtotal(j.lines), discount: j.discount, credit: 0, tax: 0, total: j.total, paid: 0, status: "open" };
          invoices.push(inv);
          j.invoiceId = inv.id;
          if (cust.cardOnFile) {
            payN += 1;
            payments.push({ id: `pay${payN}`, invoiceId: inv.id, customerId: cust.id, amount: inv.total, method: "card_on_file", status: "succeeded", at: j.completedAt!, brand: cust.cardOnFile.brand, last4: cust.cardOnFile.last4, kind: "payment" });
            inv.paid = inv.total;
            inv.status = "paid";
          }
        }
      }
    });
  }
  // Add a few notes/issues for flavour
  const todayJobs = jobs.filter((j) => j.date === today && !j.storefrontRouteId);
  todayJobs.forEach((j, i) => {
    if (i % 3 === 0)
      j.notes.push({ id: `n${j.id}`, at: instant(shiftDate(today, -2), "14:10"), byId: "e_dana", visibility: "crew", body: r.pick(["Customer asked us to skip the garage windows this time.", "Park on the street. Driveway was resealed.", "Two-story in back, bring the 28' pole.", "Customer works from home. Knock on arrival."]) });
  });

  // ---------------------------------------------------------------- unscheduled queue
  // ---------------------------------------------------------------- leads + estimates
  const stageCounts: [LeadStage, number][] = [
    ["new", 7],
    ["contacted", 6],
    ["qualified", 5],
    ["estimate_sent", 8],
    ["won", 6],
    ["lost", 4],
    ["nurture", 4],
  ];
  const leadActions: Record<LeadStage, string[]> = {
    new: ["Call or text back", "Send quote"],
    contacted: ["Schedule walkthrough", "Get window count"],
    qualified: ["Build estimate", "Send estimate"],
    estimate_sent: ["Follow up on estimate", "Answer question about screens"],
    won: ["Book first cleaning"],
    lost: ["None"],
    nurture: ["Check back in spring", "Check back after move-in"],
  };
  for (const [stage, n] of stageCounts) {
    for (let k = 0; k < n; k++) {
      const nb = NEIGHBORHOODS[r.int(0, NEIGHBORHOODS.length - 1)]!;
      const name = personName();
      const source = r.weighted<LeadSource>({ website: 30, google: 20, referral: 15, door_to_door: 15, nextdoor: 8, yelp: 7, instagram: 5, repeat: 0 });
      const createdOffset = stage === "new" ? -r.int(0, 2) : stage === "contacted" ? -r.int(1, 6) : -r.int(3, 40);
      const inv = inventory("house");
      const services = (["ext", "int", "screen", "track", "skylight", "hardwater"] as const).filter((s, idx) => idx < 2 || r.chance(0.4));
      const lines = residentialLines(inv, r, services.includes("int"));
      const lead: Lead = {
        id: `l${leads.length + 1}`,
        name,
        phone: phone(r),
        email: r.chance(0.7) ? `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com` : undefined,
        street: `${r.int(12, 79) * 100 + r.int(0, 98)} ${r.pick(nb.streets)}`,
        neighborhood: nb.name,
        source,
        stage,
        ownerId: source === "door_to_door" ? r.pick(reps) : r.pick(["e_dana", "e_dana", "e_brianna", "e_theo"]),
        createdAt: instant(d(createdOffset), `${String(r.int(8, 20)).padStart(2, "0")}:${String(r.int(0, 59)).padStart(2, "0")}`),
        nextAction: r.pick(leadActions[stage]),
        nextActionDue: stage === "lost" ? d(createdOffset) : d(r.int(-2, 6)),
        estimateValue: subtotal(lines),
        services: [...services],
        message:
          source === "website"
            ? r.pick(["Two-story home, about 25 windows. Inside and out please.", "Looking for a quote on hard-water spots on our back sliders.", "Can you do skylights? We have three.", "Moving out end of month, need windows done for the walkthrough."])
            : undefined,
        lostReason: stage === "lost" ? r.pick(["Went with a cheaper quote", "No response after 3 tries", "Outside service area"]) : undefined,
        referralCode: source === "referral" ? customers[r.int(0, 60)]!.referralCode : undefined,
      };
      leads.push(lead);
      if (stage === "estimate_sent" || stage === "won" || stage === "lost") {
        estSeq += 1;
        const status: Estimate["status"] = stage === "won" ? "accepted" : stage === "lost" ? "declined" : r.chance(0.15) ? "expired" : "sent";
        const sentOn = shiftDate(lead.createdAt.slice(0, 10), r.int(0, 3));
        estimates.push({
          id: `es${estSeq}`,
          number: `EST-${estSeq}`,
          leadId: lead.id,
          name: lead.name,
          propertyLabel: `${lead.street}, ${lead.neighborhood}`,
          status,
          lines,
          total: subtotal(lines),
          createdAt: instant(sentOn, "11:00"),
          sentAt: instant(sentOn, "11:05"),
          expiresOn: shiftDate(sentOn, 30),
          revision: r.chance(0.2) ? 2 : 1,
          planOffer: r.chance(0.6) ? "semiannual" : undefined,
          createdById: lead.ownerId,
        });
        if (status === "sent") {
          msg({ leadId: lead.id, to: lead.phone, direction: "out", trigger: "estimate_followup", status: "delivered", at: instant(shiftDate(sentOn, 2), "10:00"), body: `Hi ${name.split(" ")[0]}, just checking in on your Reef estimate. You can approve it and pick a day online.`, clicked: r.chance(0.5) });
        }
      }
      msg({ leadId: lead.id, to: lead.phone, direction: "out", trigger: "new_lead", status: "delivered", at: lead.createdAt, body: `Hi ${name.split(" ")[0]}, thanks for reaching out to Reef Window Cleaning. We got your request and will text you a quote shortly.` });
      if (stage !== "new" && r.chance(0.5)) {
        msg({ leadId: lead.id, to: lead.phone, direction: "in", status: "received", at: instant(d(createdOffset), "18:20"), body: r.pick(["Thanks! Do you also clean solar panels?", "Is Saturday possible?", "How long does it usually take?", "Great, the side gate code is on the front of the box.", "Can you include the garage windows?"]) });
      }
    }
  }
  // a few estimates for existing customers (add-on work)
  for (let k = 0; k < 5; k++) {
    const c = customers[r.int(0, 100)]!;
    const prop = properties.find((p) => p.customerId === c.id)!;
    estSeq += 1;
    const lines: Line[] = withMinimum([{ serviceId: "hardwater", qty: r.int(3, 9), unitPrice: rate("hardwater") }, { serviceId: "track", qty: prop.inventory.tracks, unitPrice: rate("track") }]);
    estimates.push({ id: `es${estSeq}`, number: `EST-${estSeq}`, customerId: c.id, name: c.name, propertyLabel: `${prop.street}, ${prop.neighborhood}`, status: k < 2 ? "accepted" : "sent", lines, total: subtotal(lines), createdAt: instant(d(-r.int(2, 12)), "13:00"), sentAt: instant(d(-r.int(1, 2)), "13:05"), expiresOn: d(r.int(14, 28)), revision: 1, createdById: "e_dana" });
  }
  // ready-to-schedule jobs from accepted estimates on won leads
  leads
    .filter((l) => l.stage === "won")
    .forEach((l, idx) => {
      const nb = NEIGHBORHOODS.find((n) => n.name === l.neighborhood)!;
      const cust = addCustomer(
        { name: l.name, kind: "residential", contactName: l.name, phone: l.phone, email: l.email ?? "", source: l.source, createdAt: l.createdAt, salespersonId: l.source === "door_to_door" ? l.ownerId : undefined },
        { street: l.street, city: nb.city, zip: nb.zip, neighborhood: nb.name, lat: nb.box[0] + r.next() * (nb.box[1] - nb.box[0]), lng: nb.box[2] + r.next() * (nb.box[3] - nb.box[2]), kind: "house", stories: 2, inventory: inventory("house") },
        ["New"],
      );
      l.customerId = cust.id;
      const prop = properties[properties.length - 1]!;
      const est = estimates.find((e) => e.leadId === l.id);
      const lines = est?.lines ?? residentialLines(prop.inventory, r);
      if (idx < 3) {
        addJob({ customer: cust, property: prop, date: d(r.int(2, 9)), lines, crewId: crewFor(nb.zone), soldById: l.ownerId !== "e_dana" ? l.ownerId : undefined });
      } else {
        jobSeq += 1;
        jobs.push({ id: `j${jobSeq}`, number: `J-${jobSeq}`, customerId: cust.id, propertyId: prop.id, status: "ready_to_schedule", date: "", arrivalStart: "", arrivalEnd: "", durationMin: estimateMinutes(lines, SERVICES), assigneeIds: [], routeOrder: 0, lines, discount: 0, total: subtotal(lines), checklist: checklistFor(lines), photos: [], notes: [], issues: [], soldById: l.ownerId !== "e_dana" ? l.ownerId : undefined });
      }
    });

  // ---------------------------------------------------------------- referrals + Reef Credit ledger
  // The portal's sample login: a plan customer with a visit coming up soon.
  // They get the first two referrals so Reef Credit has something to show.
  const hero = customers.find(
    (c) =>
      c.kind === "residential" &&
      plans.some((p) => p.customerId === c.id && p.status === "active" && p.cadence === "quarterly") &&
      jobs.some((j) => j.customerId === c.id && j.status === "scheduled" && daysBetween(today, j.date) >= 3 && daysBetween(today, j.date) <= 14) &&
      jobs.filter((j) => j.customerId === c.id && j.status === "completed").length >= 2,
  );
  const referredCustomers = customers.filter((c) => c.source === "referral" && c.kind === "residential");
  let heroRefs = 0;
  referredCustomers.forEach((rc) => {
    const candidates = customers.filter((c) => c.id !== rc.id && c.createdAt < rc.createdAt && c.kind === "residential");
    if (!candidates.length) return;
    const toHero = !!hero && heroRefs < 2 && hero.id !== rc.id && hero.createdAt < rc.createdAt && jobs.some((j) => j.customerId === rc.id && j.status === "completed");
    if (toHero) heroRefs += 1;
    const referrer = toHero ? hero! : r.pick(candidates);
    rc.referredById = referrer.id;
    const firstJob = jobs.filter((j) => j.customerId === rc.id).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
    const inv = firstJob?.invoiceId ? invoices.find((i) => i.id === firstJob.invoiceId) : undefined;
    const ref: Referral = {
      id: `rf${referrals.length + 1}`,
      referrerId: referrer.id,
      referredName: rc.name,
      referredCustomerId: rc.id,
      createdAt: rc.createdAt,
      status: inv?.status === "paid" ? "qualified" : "booked",
      reward: REFERRAL_POLICY.reward,
      newCustomerDiscount: REFERRAL_POLICY.newCustomerDiscount,
    };
    referrals.push(ref);
    // new customer discount on first invoice
    if (inv) {
      inv.discount += ref.newCustomerDiscount;
      inv.total = Math.max(0, inv.subtotal - inv.discount);
      if (inv.status === "paid") inv.paid = inv.total;
      const pay = payments.find((p) => p.invoiceId === inv.id && p.status === "succeeded");
      if (pay) pay.amount = inv.total;
      if (firstJob) {
        firstJob.discount = inv.discount;
        firstJob.total = inv.total;
      }
    }
    const bookAt = rc.createdAt;
    credit.push({ id: `cr${credit.length + 1}`, customerId: referrer.id, at: bookAt, from: "program", to: "pending", amount: ref.reward, memo: `${rc.name.split(" ")[0]} ${rc.name.split(" ")[1]![0]}. booked`, referralId: ref.id });
    if (ref.status === "qualified" && firstJob?.completedAt) {
      const qAt = payments.find((p) => p.invoiceId === inv!.id && p.status === "succeeded")?.at ?? firstJob.completedAt;
      const expires = shiftMonths(qAt.slice(0, 10), REFERRAL_POLICY.expiryMonths);
      credit.push({ id: `cr${credit.length + 1}`, customerId: referrer.id, at: qAt, from: "pending", to: "available", amount: ref.reward, memo: `${rc.name.split(" ")[0]}'s first cleaning was paid`, referralId: ref.id, expiresOn: expires });
      // redeem on a later paid invoice of the referrer, if any
      const later = invoices
        .filter((i) => i.customerId === referrer.id && i.issuedOn > qAt.slice(0, 10) && i.status === "paid" && i.credit === 0)
        .sort((a, b) => (a.issuedOn < b.issuedOn ? -1 : 1))[0];
      if (later && referrer.id !== hero?.id && r.chance(0.8)) {
        const amt = Math.min(ref.reward, later.total);
        credit.push({ id: `cr${credit.length + 1}`, customerId: referrer.id, at: instant(later.issuedOn, "08:00"), from: "available", to: "reserved", amount: amt, memo: `Held for ${later.number}`, invoiceId: later.id });
        credit.push({ id: `cr${credit.length + 1}`, customerId: referrer.id, at: instant(later.issuedOn, "16:00"), from: "reserved", to: "redeemed", amount: amt, memo: `Applied to ${later.number}`, invoiceId: later.id });
        later.credit = amt;
        later.total -= amt;
        later.paid = later.total;
        const pay = payments.find((p) => p.invoiceId === later.id && p.status === "succeeded");
        if (pay) pay.amount = later.total;
      } else if (daysBetween(expires, today) > 0 && referrer.id !== hero?.id) {
        credit.push({ id: `cr${credit.length + 1}`, customerId: referrer.id, at: instant(expires, "00:00"), from: "available", to: "expired", amount: ref.reward, memo: "Expired unused" });
      }
      if (daysBetween(qAt.slice(0, 10), today) < 45) {
        msg({ customerId: referrer.id, to: referrer.phone, direction: "out", trigger: "credit", status: "delivered", at: qAt, body: `Good news ${referrer.name.split(" ")[0]}! ${rc.name.split(" ")[0]} booked with Reef, so $25 in Reef Credit is now in your account.` });
      }
    }
  });
  if (hero) {
    const friend = customers.find((c) => c.kind === "residential" && c.id !== hero.id && !c.referredById && c.createdAt > hero.createdAt && jobs.some((j) => j.customerId === c.id && j.status === "scheduled") && !jobs.some((j) => j.customerId === c.id && j.status === "completed"));
    if (friend) {
      friend.referredById = hero.id;
      friend.source = "referral";
      const ref: Referral = { id: `rf${referrals.length + 1}`, referrerId: hero.id, referredName: friend.name, referredCustomerId: friend.id, createdAt: friend.createdAt, status: "booked", reward: REFERRAL_POLICY.reward, newCustomerDiscount: REFERRAL_POLICY.newCustomerDiscount };
      referrals.push(ref);
      credit.push({ id: `cr${credit.length + 1}`, customerId: hero.id, at: friend.createdAt, from: "program", to: "pending", amount: ref.reward, memo: `${friend.name.split(" ")[0]} ${friend.name.split(" ")[1]![0]}. booked`, referralId: ref.id });
    }
  }
  // a few referral leads still open
  leads
    .filter((l) => l.source === "referral" && l.referralCode && l.stage !== "won")
    .forEach((l) => {
      const referrer = customers.find((c) => c.referralCode === l.referralCode);
      if (!referrer) return;
      referrals.push({ id: `rf${referrals.length + 1}`, referrerId: referrer.id, referredName: l.name, createdAt: l.createdAt, status: l.stage === "lost" ? "declined" : "lead", reward: REFERRAL_POLICY.reward, newCustomerDiscount: REFERRAL_POLICY.newCustomerDiscount });
    });

  // ---------------------------------------------------------------- time entries (last 14 days)
  const timeEntries: TimeEntry[] = [];
  for (const emp of EMPLOYEES.filter((e) => e.role === "worker")) {
    for (let k = 13; k >= 0; k--) {
      const day = d(-k);
      const wd = weekdayName(day);
      if (wd === "Sunday" || (wd === "Saturday" && emp.id !== "e_devon")) continue;
      const startH = emp.id === "e_devon" ? "06:00" : "07:40";
      const approved = k > weekdayIndex(today);
      const id = (s: string) => `te_${emp.id}_${day}_${s}`;
      if (k === 0) {
        // still on the clock today (Devon's early storefront route is finished)
        timeEntries.push({ id: id("a"), employeeId: emp.id, date: day, start: startH, end: emp.id === "e_devon" ? "10:40" : undefined, kind: "field", approved: false });
        continue;
      }
      timeEntries.push({ id: id("a"), employeeId: emp.id, date: day, start: startH, end: "12:00", kind: "field", approved });
      timeEntries.push({ id: id("b"), employeeId: emp.id, date: day, start: "12:00", end: "12:30", kind: "break", approved });
      timeEntries.push({ id: id("c"), employeeId: emp.id, date: day, start: "12:30", end: r.pick(["15:45", "16:10", "16:30", "17:05"]), kind: "field", approved });
    }
  }

  // ---------------------------------------------------------------- marketing spend (paid channels only)
  const marketingSpend: MarketingSpend[] = [];
  for (let m = 11; m >= 0; m--) {
    const month = shiftMonths(today, -m).slice(0, 7);
    marketingSpend.push({ source: "google", month, amount: r.int(110, 170) * 1000 });
    marketingSpend.push({ source: "yelp", month, amount: 30000 });
    marketingSpend.push({ source: "instagram", month, amount: r.int(15, 45) * 1000 });
    marketingSpend.push({ source: "nextdoor", month, amount: 20000 });
  }

  // a couple of inbound customer replies
  customers.slice(0, 40).forEach((c, i) => {
    if (i % 9 === 0) msg({ customerId: c.id, to: c.phone, direction: "in", status: "received", at: instant(d(-r.int(1, 6)), `${String(r.int(9, 19)).padStart(2, "0")}:${String(r.int(10, 59))}`), body: r.pick(["Can we move next week's visit to Friday?", "Thank you! They look amazing.", "Is the gate code still needed?", "Please add the sliding door tracks this time.", "STOP"]) });
  });
  const stopper = messages.find((m) => m.body === "STOP");
  if (stopper?.customerId) customers.find((c) => c.id === stopper.customerId)!.doNotText = true;

  // ---------------------------------------------------------------- activity feed
  const activity: Activity[] = [];
  const recentCut = d(-3);
  payments
    .filter((p) => p.at.slice(0, 10) >= recentCut)
    .forEach((p) => {
      const c = customers.find((x) => x.id === p.customerId)!;
      activity.push({ id: `a_${p.id}`, at: p.at, kind: "payment", text: p.status === "failed" ? `Card declined for ${c.name}` : `${c.name} paid ${(p.amount / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}`, href: `/admin/customer?id=${c.id}` });
    });
  leads
    .filter((l) => l.createdAt.slice(0, 10) >= recentCut)
    .forEach((l) => activity.push({ id: `a_${l.id}`, at: l.createdAt, kind: "lead", text: `New lead from ${l.name} (${l.source.replace(/_/g, " ")})`, href: `/admin/leads` }));
  reviews
    .filter((rv) => rv.at.slice(0, 10) >= d(-7))
    .forEach((rv) => activity.push({ id: `a_${rv.id}`, at: rv.at, kind: "review", text: `${rv.rating}-star ${rv.source} review from ${customers.find((c) => c.id === rv.customerId)!.name}` }));
  doorVisits
    .filter((v) => v.outcome === "booked" && v.at.slice(0, 10) >= d(-6))
    .forEach((v) => activity.push({ id: `a_${v.id}`, at: v.at, kind: "door", byId: v.salespersonId, text: `${EMPLOYEES.find((e) => e.id === v.salespersonId)!.name.split(" ")[0]} booked a door in Clairemont`, href: "/admin/canvassing" }));
  jobs
    .filter((j) => j.date === today && j.status === "completed" && j.completedAt)
    .forEach((j) => activity.push({ id: `a_${j.id}`, at: j.completedAt!, kind: "job", text: `${CREWS.find((c) => c.id === j.crewId)!.name} finished ${customers.find((c) => c.id === j.customerId)!.name}`, href: `/admin/job?id=${j.id}` }));
  activity.sort((a, b) => (a.at < b.at ? 1 : -1));

  messages.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    today,
    employees: EMPLOYEES,
    crews: CREWS,
    services: SERVICES,
    customers,
    properties,
    leads,
    estimates,
    jobs,
    plans,
    planOffers,
    followUps,
    invoices,
    payments,
    referrals,
    credit,
    messages,
    automations: AUTOMATIONS,
    reviews,
    timeEntries,
    commissions,
    doorVisits,
    territories: TERRITORIES,
    storefrontRoutes,
    marketingSpend,
    activity,
  };
}

function weekdayIndex(date: DateStr): number {
  // days since Monday
  const wd = weekdayName(date);
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(wd);
}
