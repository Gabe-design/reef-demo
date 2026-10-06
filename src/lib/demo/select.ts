import type {
  CreditBucket,
  CreditEntry,
  DateStr,
  DemoData,
  ID,
  Job,
  LeadSource,
  ServiceId,
} from "./types";
import { CADENCE } from "./types";
import { daysBetween, shiftDate } from "./util";

export type Balances = Record<CreditBucket, number> & { earned: number };

/** Derives a customer's Reef Credit buckets from ledger rows (never stored). */
export function creditBalances(entries: CreditEntry[], customerId?: ID): Balances {
  const b: Balances = { pending: 0, available: 0, reserved: 0, redeemed: 0, expired: 0, revoked: 0, earned: 0 };
  for (const e of entries) {
    if (customerId && e.customerId !== customerId) continue;
    b[e.to] += e.amount;
    if (e.from !== "program") b[e.from] -= e.amount;
    if (e.from === "pending" && e.to === "available") b.earned += e.amount;
  }
  return b;
}

export function buildIndex(d: DemoData) {
  const map = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
  const group = <T,>(xs: T[], key: (x: T) => string | undefined) => {
    const m = new Map<string, T[]>();
    for (const x of xs) {
      const k = key(x);
      if (!k) continue;
      const arr = m.get(k);
      if (arr) arr.push(x);
      else m.set(k, [x]);
    }
    return m;
  };
  return {
    customer: map(d.customers),
    property: map(d.properties),
    employee: map(d.employees),
    crew: map(d.crews),
    job: map(d.jobs),
    invoice: map(d.invoices),
    plan: map(d.plans),
    lead: map(d.leads),
    propertiesByCustomer: group(d.properties, (p) => p.customerId),
    jobsByCustomer: group(d.jobs, (j) => j.customerId),
    invoicesByCustomer: group(d.invoices, (i) => i.customerId),
    paymentsByCustomer: group(d.payments, (p) => p.customerId),
    plansByCustomer: group(d.plans, (p) => p.customerId),
    messagesByCustomer: group(d.messages, (m) => m.customerId),
    visitsByDoor: group(d.doorVisits, (v) => String(v.doorId)),
  };
}
export type Index = ReturnType<typeof buildIndex>;

export interface KpiFilters {
  from: DateStr;
  to: DateStr; // inclusive
  neighborhood?: string;
  employeeId?: ID;
  salespersonId?: ID;
  service?: ServiceId;
  source?: LeadSource;
}

const inRange = (date: string, f: KpiFilters) => date.slice(0, 10) >= f.from && date.slice(0, 10) <= f.to;
const ratio = (n: number, dnm: number) => (dnm > 0 ? n / dnm : null);

export function computeKpis(d: DemoData, ix: Index, f: KpiFilters) {
  const custOk = (customerId: ID) => {
    const c = ix.customer.get(customerId);
    if (!c) return false;
    if (f.source && c.source !== f.source) return false;
    if (f.neighborhood && !(ix.propertiesByCustomer.get(customerId) ?? []).some((p) => p.neighborhood === f.neighborhood)) return false;
    if (f.salespersonId && c.salespersonId !== f.salespersonId && !d.jobs.some((j) => j.customerId === customerId && j.soldById === f.salespersonId)) return false;
    return true;
  };
  const jobOk = (j: Job) =>
    custOk(j.customerId) &&
    (!f.employeeId || j.assigneeIds.includes(f.employeeId)) &&
    (!f.service || j.lines.some((l) => l.serviceId === f.service)) &&
    (!f.neighborhood || ix.property.get(j.propertyId)?.neighborhood === f.neighborhood);

  const completed = d.jobs.filter((j) => j.status === "completed" && j.completedAt && inRange(j.completedAt, f) && jobOk(j));
  const revenue = completed.reduce((s, j) => s + j.total, 0);
  const recurringRevenue = completed.filter((j) => j.planId).reduce((s, j) => s + j.total, 0);
  const referralRevenue = completed.filter((j) => ix.customer.get(j.customerId)?.source === "referral").reduce((s, j) => s + j.total, 0);

  const pays = d.payments.filter((p) => inRange(p.at, f) && custOk(p.customerId));
  const cashIn = pays.filter((p) => p.status === "succeeded" && p.kind !== "refund").reduce((s, p) => s + p.amount, 0);
  const refunds = pays.filter((p) => p.kind === "refund").reduce((s, p) => s + p.amount, 0);
  const failed = pays.filter((p) => p.status === "failed");

  const leadsIn = d.leads.filter((l) => inRange(l.createdAt, f) && (!f.source || l.source === f.source) && (!f.neighborhood || l.neighborhood === f.neighborhood) && (!f.salespersonId || l.ownerId === f.salespersonId));
  const newCustomers = d.customers.filter((c) => inRange(c.createdAt, f) && custOk(c.id));
  const leadLinked = new Set(d.leads.map((l) => l.customerId).filter(Boolean));
  const totalLeads = leadsIn.length + newCustomers.filter((c) => !leadLinked.has(c.id)).length;

  const visits = d.doorVisits.filter((v) => inRange(v.at, f) && (!f.salespersonId || v.salespersonId === f.salespersonId));
  const conversations = visits.filter((v) => v.conversation);

  const ests = d.estimates.filter((e) => e.sentAt && inRange(e.sentAt, f));
  const estAccepted = ests.filter((e) => e.status === "accepted");
  const estOpen = ests.filter((e) => e.status === "sent");

  const booked = d.jobs.filter((j) => j.date && inRange(j.date, f) && j.status !== "cancelled" && jobOk(j));

  const activePlans = d.plans.filter((p) => p.status === "active" && custOk(p.customerId));
  const expectedMonthly = activePlans.reduce((s, p) => s + p.pricePerVisit * CADENCE[p.cadence].perMonth, 0);
  const recurringCustomers = new Set(activePlans.map((p) => p.customerId)).size;

  // plan conversion: customers whose first completed job is in range (and 30+ days old) who started a plan within 30 days
  const firstJob = new Map<string, Job>();
  for (const j of d.jobs) {
    if (j.status !== "completed" || !j.completedAt) continue;
    const cur = firstJob.get(j.customerId);
    if (!cur || j.completedAt < cur.completedAt!) firstJob.set(j.customerId, j);
  }
  // Cohort = first cleanings 30-120 days before the end of the range, so every
  // customer in it has had the full 30 days to decide (spec 11).
  const cohortFrom = shiftDate(f.to, -120);
  const cohortTo = shiftDate(f.to, -30);
  const cohort = [...firstJob.values()].filter(
    (j) => j.date >= cohortFrom && j.date <= f.to && ix.customer.get(j.customerId)?.kind === "residential" && custOk(j.customerId),
  );
  const mature = cohort.filter((j) => j.date <= cohortTo);
  const converted = mature.filter((j) => d.plans.some((p) => p.customerId === j.customerId && daysBetween(j.date, p.startedAt.slice(0, 10)) <= 30 && p.cadence !== "weekly" && p.cadence !== "monthly"));

  // retention: customers whose first job was 7-14 months ago, share with a repeat cleaning
  const retentionCohort = [...firstJob.values()].filter((j) => {
    const age = daysBetween(j.date, d.today);
    return age >= 210 && age <= 420 && ix.customer.get(j.customerId)?.kind === "residential" && custOk(j.customerId);
  });
  const retained = retentionCohort.filter((j) => d.jobs.filter((x) => x.customerId === j.customerId && x.status === "completed").length >= 2);

  const credit = creditBalances(d.credit);

  const revs = d.reviews.filter((r) => inRange(r.at, f) && custOk(r.customerId));
  const avgRating = revs.length ? revs.reduce((s, r) => s + r.rating, 0) / revs.length : null;
  const reviewRequests = d.messages.filter((m) => m.trigger === "review" && inRange(m.at, f)).length;

  // sources
  const sources = new Map<LeadSource, { leads: number; customers: number; revenue: number; spend: number }>();
  const src = (s: LeadSource) => {
    let v = sources.get(s);
    if (!v) sources.set(s, (v = { leads: 0, customers: 0, revenue: 0, spend: 0 }));
    return v;
  };
  leadsIn.forEach((l) => src(l.source).leads++);
  newCustomers.forEach((c) => {
    src(c.source).customers++;
    if (!leadLinked.has(c.id)) src(c.source).leads++;
  });
  completed.forEach((j) => {
    const c = ix.customer.get(j.customerId);
    if (c) src(c.source).revenue += j.total;
  });
  const months = new Set<string>();
  for (let x = f.from; x <= f.to; x = shiftDate(x, 1)) months.add(x.slice(0, 7));
  d.marketingSpend.filter((m) => months.has(m.month)).forEach((m) => {
    const days = [...Array(31).keys()].map((k) => `${m.month}-${String(k + 1).padStart(2, "0")}`).filter((x) => x >= f.from && x <= f.to).length;
    src(m.source).spend += Math.round((m.amount * days) / 30);
  });

  // workers
  const workers = d.employees
    .filter((e) => e.role === "worker")
    .map((e) => {
      const jobs = completed.filter((j) => j.assigneeIds.includes(e.id));
      const rev = jobs.reduce((s, j) => s + j.total / Math.max(1, j.assigneeIds.length), 0);
      const mins = d.timeEntries
        .filter((t) => t.employeeId === e.id && inRange(t.date, f) && t.kind === "field" && t.end)
        .reduce((s, t) => s + toMin(t.end!) - toMin(t.start), 0);
      const hours = mins / 60;
      return { employee: e, jobs: jobs.length, revenue: rev, hours, perHour: hours > 0 ? rev / hours : null };
    });

  // sales
  const sales = d.employees
    .filter((e) => e.role === "sales")
    .map((e) => {
      const v = visits.filter((x) => x.salespersonId === e.id);
      const conv = v.filter((x) => x.conversation);
      const bookedV = v.filter((x) => x.outcome === "booked");
      const estimatesGiven = v.filter((x) => x.outcome === "estimate_given").length;
      const bookedValue = bookedV.reduce((s, x) => s + (x.bookedValue ?? 0), 0);
      const comm = d.commissions.filter((c) => c.employeeId === e.id && inRange(c.on, f));
      return {
        employee: e,
        visits: v.length,
        doors: new Set(v.map((x) => x.doorId)).size,
        conversations: conv.length,
        estimates: estimatesGiven,
        booked: bookedV.length,
        closeRate: ratio(bookedV.length, conv.length),
        bookedValue,
        commission: comm.reduce((s, c) => s + c.amount, 0),
      };
    });

  // profitability (simplified operational view)
  const laborCost = workers.reduce((s, w) => s + w.hours * (w.employee.hourlyRate ?? 0), 0);
  const commissionCost = d.commissions.filter((c) => inRange(c.on, f) && c.status !== "reversed").reduce((s, c) => s + c.amount, 0);
  const cardFees = pays.filter((p) => p.status === "succeeded" && ["card_on_file", "online", "tap_to_pay"].includes(p.method)).reduce((s, p) => s + Math.round(p.amount * 0.029 + 30), 0);
  const margin = revenue - laborCost - commissionCost - cardFees;

  return {
    revenue,
    recurringRevenue,
    referralRevenue,
    completedJobs: completed.length,
    avgJobValue: completed.length ? revenue / completed.length : null,
    cashIn,
    refunds,
    cashCollected: cashIn - refunds,
    failedPayments: failed.length,
    totalLeads,
    doorsKnocked: visits.length,
    distinctDoors: new Set(visits.map((v) => v.doorId)).size,
    conversations: conversations.length,
    estimatesSent: ests.length,
    estimateCloseRate: ratio(estAccepted.length, ests.length),
    estimatesOpen: estOpen.length,
    jobsBooked: booked.length,
    bookedValue: booked.reduce((s, j) => s + j.total, 0),
    expectedMonthly,
    recurringCustomers,
    planConversion: ratio(converted.length, mature.length),
    planCohort: mature.length,
    planImmature: cohort.length - mature.length,
    retention: ratio(retained.length, retentionCohort.length),
    retentionCohort: retentionCohort.length,
    creditOwed: credit.available + credit.reserved,
    credit,
    reviews: revs.length,
    avgRating,
    reviewConversion: ratio(revs.filter((r) => r.requested).length, reviewRequests),
    sources: [...sources.entries()].map(([source, v]) => ({ source, ...v })),
    workers,
    sales,
    laborCost,
    commissionCost,
    cardFees,
    margin,
    marginPct: ratio(margin, revenue),
    completed,
  };
}
export type Kpis = ReturnType<typeof computeKpis>;

export function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Weekly buckets of completed revenue and cash for charts. */
export function weeklySeries(d: DemoData, f: KpiFilters, k: Kpis) {
  const weeks: { week: string; revenue: number; recurring: number; cash: number; leads: number }[] = [];
  const span = daysBetween(f.from, f.to);
  const step = span > 120 ? 14 : span > 20 ? 7 : 1;
  for (let start = f.from; start <= f.to; start = shiftDate(start, step)) {
    const end = shiftDate(start, step - 1);
    const within = (x: string) => x.slice(0, 10) >= start && x.slice(0, 10) <= end;
    const jobs = k.completed.filter((j) => within(j.completedAt!));
    weeks.push({
      week: start,
      revenue: jobs.reduce((s, j) => s + j.total, 0) / 100,
      recurring: jobs.filter((j) => j.planId).reduce((s, j) => s + j.total, 0) / 100,
      cash: d.payments.filter((p) => p.status === "succeeded" && within(p.at)).reduce((s, p) => s + p.amount, 0) / 100,
      leads: d.leads.filter((l) => within(l.createdAt)).length + d.customers.filter((c) => within(c.createdAt)).length,
    });
  }
  return weeks;
}

/**
 * The customer the login screen pre-fills: a plan customer with an upcoming
 * visit, past photos and Reef Credit, so the portal shows every feature.
 */
export function showcaseCustomer(d: DemoData) {
  let best: { id: ID; score: number } | null = null;
  for (const c of d.customers) {
    if (c.kind !== "residential" || c.doNotText) continue;
    const jobs = d.jobs.filter((j) => j.customerId === c.id);
    const upcoming = jobs.some((j) => j.status === "scheduled" && j.date > d.today && daysBetween(d.today, j.date) <= 21);
    const done = jobs.filter((j) => j.status === "completed").length;
    const plan = d.plans.some((p) => p.customerId === c.id && p.status === "active");
    const bal = creditBalances(d.credit, c.id);
    const refs = d.referrals.filter((r) => r.referrerId === c.id).length;
    const score = (upcoming ? 5 : 0) + Math.min(done, 4) + (plan ? 4 : 0) + (bal.available > 0 ? 6 : 0) + (bal.pending > 0 ? 3 : 0) + refs * 2 + (c.cardOnFile ? 1 : 0);
    if (!best || score > best.score) best = { id: c.id, score };
  }
  return d.customers.find((c) => c.id === best?.id)!;
}

export function doorStatus(visits: { outcome: string; at: string }[] | undefined) {
  if (!visits?.length) return null;
  return [...visits].sort((a, b) => (a.at < b.at ? 1 : -1))[0]!;
}
