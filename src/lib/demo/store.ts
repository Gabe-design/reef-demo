"use client";

import { create } from "zustand";
import { AUTOMATIONS, REFERRAL_POLICY } from "./catalog";
import { generate } from "./seed";
import type {
  Activity,
  Commission,
  CreditEntry,
  Customer,
  DemoData,
  DoorVisit,
  EstimateStatus,
  FollowUp,
  ID,
  Instant,
  Invoice,
  Job,
  JobIssue,
  JobStatus,
  Lead,
  LeadStage,
  Message,
  Note,
  Payment,
  Photo,
  Property,
  ServicePlan,
} from "./types";
import { businessNow, businessToday, firstName, money, shiftDate, shiftMonths, subtotal } from "./util";
import { creditBalances } from "./select";

/**
 * Every change made while clicking around the demo is an Action. Actions are
 * appended to a log in localStorage and replayed on top of freshly generated
 * seed data, so the demo survives reloads and "Reset demo" is just clearing
 * the log. Each action carries its own id and timestamp, so replay is
 * deterministic.
 */
export type Action = { id: string; at: Instant; by?: ID } & (
  | { t: "lead.create"; lead: Lead }
  | { t: "lead.stage"; leadId: ID; stage: LeadStage }
  | { t: "booking.create"; customer: Customer; property: Property; job: Job; leadId?: ID; referralCode?: string }
  | { t: "job.status"; jobId: ID; status: JobStatus }
  | { t: "job.check"; jobId: ID; index: number; done: boolean }
  | { t: "job.photo"; jobId: ID; photo: Photo }
  | { t: "job.note"; jobId: ID; note: Note }
  | { t: "job.issue"; jobId: ID; issue: JobIssue }
  | { t: "job.schedule"; jobId: ID; date: string; crewId: ID; arrivalStart: string; arrivalEnd: string }
  | { t: "door.visit"; visit: DoorVisit }
  | { t: "plan.create"; plan: ServicePlan }
  | { t: "plan.pause"; planId: ID; until: string; reason: string }
  | { t: "plan.resume"; planId: ID }
  | { t: "plan.skip"; planId: ID; reason: string }
  | { t: "plan.cancel"; planId: ID; reason: string }
  | { t: "invoice.pay"; invoiceId: ID; method: Payment["method"]; useCredit: boolean }
  | { t: "message.send"; message: Message }
  | { t: "automation.toggle"; automationId: string }
  | { t: "followup.done"; followUpId: ID }
  | { t: "estimate.status"; estimateId: ID; status: EstimateStatus }
  | { t: "customer.card"; customerId: ID; card: Customer["cardOnFile"] }
  | { t: "time.clock"; employeeId: ID; clockIn: boolean }
);

type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
export type ActionInput = DistributiveOmit<Action, "id" | "at">;

const STORAGE_KEY = "reef-demo-log-v1";

export interface Toast {
  id: string;
  title: string;
  body: string;
  kind: "sms" | "info" | "success";
}

interface DemoStore {
  ready: boolean;
  data: DemoData | null;
  log: Action[];
  toasts: Toast[];
  init: () => void;
  dispatch: (a: ActionInput, opts?: { silent?: boolean }) => Action;
  reset: () => void;
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

let actionSeq = 0;
const newActionId = () => `x${Date.now().toString(36)}${(actionSeq++).toString(36)}`;

function readLog(today: string): Action[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date: string; log: Action[] };
    return parsed.date === today ? parsed.log : [];
  } catch {
    return [];
  }
}

function writeLog(today: string, log: Action[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, log }));
  } catch {
    // storage full or blocked; the demo keeps working in memory
  }
}

export const useDemo = create<DemoStore>((set, get) => ({
  ready: false,
  data: null,
  log: [],
  toasts: [],
  init: () => {
    if (get().ready) return;
    const today = businessToday();
    const now = businessNow();
    let data = generate(today, Number(now.slice(11, 13)) * 60 + Number(now.slice(14, 16)));
    const log = readLog(today);
    for (const a of log) data = apply(data, a);
    set({ ready: true, data, log });
  },
  dispatch: (input, opts) => {
    const action = { ...input, id: newActionId(), at: businessNow() } as Action;
    const before = get().data!;
    const after = apply(before, action);
    const log = [...get().log, action];
    writeLog(after.today, log);
    set({ data: after, log });
    if (!opts?.silent) {
      const known = new Set(before.messages.map((m) => m.id));
      const fresh = after.messages.filter((m) => !known.has(m.id) && m.direction === "out");
      fresh.slice(0, 2).forEach((m) => {
        const who = m.customerId
          ? after.customers.find((c) => c.id === m.customerId)?.contactName
          : after.leads.find((l) => l.id === m.leadId)?.name;
        get().toast({ kind: "sms", title: `Text sent to ${who ?? m.to}`, body: m.body });
      });
    }
    return action;
  },
  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    const now = businessNow();
    set({ data: generate(businessToday(), Number(now.slice(11, 13)) * 60 + Number(now.slice(14, 16))), log: [] });
  },
  toast: (t) => {
    const id = newActionId();
    set({ toasts: [...get().toasts, { ...t, id }].slice(-4) });
    setTimeout(() => get().dismiss(id), 6500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

// ------------------------------------------------------------------ reducer

function upd<T extends { id: string }>(list: T[], id: string, fn: (x: T) => T): T[] {
  return list.map((x) => (x.id === id ? fn(x) : x));
}

function addActivity(d: DemoData, a: Action, text: string, kind: Activity["kind"], href?: string): DemoData {
  return { ...d, activity: [{ id: `act_${a.id}_${d.activity.length}`, at: a.at, byId: a.by, text, kind, href }, ...d.activity] };
}

function sms(d: DemoData, a: Action, key: string, m: Omit<Message, "id" | "at" | "direction" | "status">): DemoData {
  const auto = d.automations.find((x) => x.id === m.trigger);
  if (m.trigger && auto && !auto.enabled) return d;
  if (m.customerId && d.customers.find((c) => c.id === m.customerId)?.doNotText) return d;
  return {
    ...d,
    messages: [{ ...m, id: `msg_${a.id}_${key}`, at: a.at, direction: "out", status: "delivered" }, ...d.messages],
  };
}

export function apply(d: DemoData, a: Action): DemoData {
  switch (a.t) {
    case "lead.create": {
      let n: DemoData = { ...d, leads: [a.lead, ...d.leads] };
      n = sms(n, a, "lead", {
        leadId: a.lead.id,
        to: a.lead.phone,
        trigger: "new_lead",
        body: `Hi ${firstName(a.lead.name)}, thanks for reaching out to Reef Window Cleaning. We got your request and will text you a quote shortly.`,
      });
      return addActivity(n, a, `New lead from ${a.lead.name} (${a.lead.source.replace(/_/g, " ")})`, "lead", "/admin/leads");
    }
    case "lead.stage":
      return { ...d, leads: upd(d.leads, a.leadId, (l) => ({ ...l, stage: a.stage })) };

    case "booking.create": {
      let n: DemoData = {
        ...d,
        customers: d.customers.some((c) => c.id === a.customer.id) ? d.customers : [...d.customers, a.customer],
        properties: d.properties.some((p) => p.id === a.property.id) ? d.properties : [...d.properties, a.property],
        jobs: [...d.jobs, a.job],
      };
      if (a.leadId) n = { ...n, leads: upd(n.leads, a.leadId, (l) => ({ ...l, stage: "won", customerId: a.customer.id })) };
      if (a.referralCode) {
        const referrer = n.customers.find((c) => c.referralCode.toUpperCase() === a.referralCode!.toUpperCase());
        if (referrer && referrer.id !== a.customer.id) {
          const refId = `ref_${a.id}`;
          n = {
            ...n,
            customers: upd(n.customers, a.customer.id, (c) => ({ ...c, referredById: referrer.id, source: "referral" })),
            referrals: [
              { id: refId, referrerId: referrer.id, referredName: a.customer.name, referredCustomerId: a.customer.id, createdAt: a.at, status: "booked", reward: REFERRAL_POLICY.reward, newCustomerDiscount: REFERRAL_POLICY.newCustomerDiscount },
              ...n.referrals,
            ],
            credit: [...n.credit, { id: `cr_${a.id}`, customerId: referrer.id, at: a.at, from: "program", to: "pending", amount: REFERRAL_POLICY.reward, memo: `${firstName(a.customer.name)} booked`, referralId: refId }],
            jobs: upd(n.jobs, a.job.id, (j) => ({ ...j, discount: j.discount + REFERRAL_POLICY.newCustomerDiscount, total: Math.max(0, j.total - REFERRAL_POLICY.newCustomerDiscount) })),
          };
          n = sms(n, a, "refpend", {
            customerId: referrer.id,
            to: referrer.phone,
            trigger: "credit",
            body: `${firstName(a.customer.name)} just booked with Reef using your link. ${money(REFERRAL_POLICY.reward, { whole: true })} in Reef Credit is pending until their first cleaning.`,
          });
        }
      }
      const prop = a.property;
      n = sms(n, a, "conf", {
        customerId: a.customer.id,
        to: a.customer.phone,
        trigger: "confirmation",
        body: a.job.date
          ? `You're booked! Reef will be at ${prop.street} on ${a.job.date.slice(5).replace("-", "/")}, arriving ${a.job.arrivalStart}-${a.job.arrivalEnd}. Manage your visit at reef.link/account`
          : `Thanks ${firstName(a.customer.name)}! Reef got your booking request and will confirm a time shortly.`,
      });
      return addActivity(n, a, `${a.customer.name} booked ${money(a.job.total, { whole: true })}`, "job", `/admin/job?id=${a.job.id}`);
    }

    case "job.status": {
      const job = d.jobs.find((j) => j.id === a.jobId);
      if (!job) return d;
      const cust = d.customers.find((c) => c.id === job.customerId)!;
      const prop = d.properties.find((p) => p.id === job.propertyId)!;
      let n: DemoData = {
        ...d,
        jobs: upd(d.jobs, job.id, (j) => ({
          ...j,
          status: a.status,
          startedAt: a.status === "in_progress" ? a.at : j.startedAt,
          completedAt: a.status === "completed" ? a.at : j.completedAt,
          checklist: a.status === "completed" ? j.checklist.map((c) => ({ ...c, done: c.required ? true : c.done })) : j.checklist,
        })),
      };
      const tech = d.employees.find((e) => e.id === (a.by ?? job.assigneeIds[0]));
      if (a.status === "en_route") {
        n = sms(n, a, "otw", { customerId: cust.id, to: cust.phone, trigger: "on_the_way", body: `${tech ? firstName(tech.name) : "Your tech"} from Reef is on the way and should arrive in about 20 minutes.` });
        return addActivity(n, a, `${tech?.name ?? "Crew"} is on the way to ${cust.name}`, "job", `/admin/job?id=${job.id}`);
      }
      if (a.status === "completed") {
        n = sms(n, a, "done", { customerId: cust.id, to: cust.phone, trigger: "completed", body: `All done at ${prop.street}! Your before-and-after photos are in your Reef account: reef.link/account` });
        n = finalizeInvoice(n, a, job.id);
        n = addActivity(n, a, `${tech?.name ?? "Crew"} completed ${cust.name}`, "job", `/admin/job?id=${job.id}`);
        // no plan -> make sure there's a dated follow-up (spec 5: coverage rule)
        const hasPlan = n.plans.some((p) => p.customerId === cust.id && p.status === "active");
        if (!hasPlan) {
          const fu: FollowUp = { id: `fu_${a.id}`, customerId: cust.id, ownerId: "e_dana", due: shiftDate(n.today, 180), reason: "due_again", note: "Recommended cleaning interval (6 months)", done: false };
          n = { ...n, followUps: [...n.followUps, fu] };
        }
        return n;
      }
      return n;
    }

    case "job.check":
      return {
        ...d,
        jobs: upd(d.jobs, a.jobId, (j) => ({ ...j, checklist: j.checklist.map((c, i) => (i === a.index ? { ...c, done: a.done } : c)) })),
      };
    case "job.photo":
      return { ...d, jobs: upd(d.jobs, a.jobId, (j) => ({ ...j, photos: [...j.photos, a.photo] })) };
    case "job.note":
      return { ...d, jobs: upd(d.jobs, a.jobId, (j) => ({ ...j, notes: [...j.notes, a.note] })) };
    case "job.issue": {
      const n = { ...d, jobs: upd(d.jobs, a.jobId, (j) => ({ ...j, issues: [...j.issues, a.issue] })) };
      return addActivity(n, a, `Problem reported on ${d.jobs.find((j) => j.id === a.jobId)?.number}: ${a.issue.body}`, "job", `/admin/job?id=${a.jobId}`);
    }
    case "job.schedule": {
      const crew = d.crews.find((c) => c.id === a.crewId);
      const job = d.jobs.find((j) => j.id === a.jobId)!;
      const cust = d.customers.find((c) => c.id === job.customerId)!;
      const prop = d.properties.find((p) => p.id === job.propertyId)!;
      let n: DemoData = {
        ...d,
        jobs: upd(d.jobs, a.jobId, (j) => ({ ...j, date: a.date, crewId: a.crewId, assigneeIds: crew?.memberIds ?? [], arrivalStart: a.arrivalStart, arrivalEnd: a.arrivalEnd, status: j.status === "ready_to_schedule" ? "scheduled" : j.status })),
      };
      n = sms(n, a, "sched", { customerId: cust.id, to: cust.phone, trigger: "confirmation", body: `You're booked! Reef will be at ${prop.street} on ${a.date.slice(5).replace("-", "/")}, arriving ${a.arrivalStart}-${a.arrivalEnd}.` });
      return n;
    }

    case "door.visit": {
      let n: DemoData = { ...d, doorVisits: [...d.doorVisits, a.visit] };
      if (a.visit.outcome === "booked") {
        const rep = d.employees.find((e) => e.id === a.visit.salespersonId);
        n = addActivity(n, a, `${rep ? firstName(rep.name) : "Sales"} booked a door in Clairemont`, "door", "/admin/canvassing");
      }
      return n;
    }

    case "plan.create": {
      let n: DemoData = {
        ...d,
        plans: [...d.plans, a.plan],
        planOffers: [...d.planOffers, { id: `po_${a.id}`, customerId: a.plan.customerId, at: a.at, cadence: a.plan.cadence, outcome: "accepted", byId: a.by ?? "e_dana" }],
      };
      const cust = d.customers.find((c) => c.id === a.plan.customerId)!;
      n = addActivity(n, a, `${cust.name} started a ${a.plan.cadence} plan`, "plan", `/admin/customer?id=${cust.id}`);
      return n;
    }
    case "plan.pause":
      return {
        ...d,
        plans: upd(d.plans, a.planId, (p) => ({ ...p, status: "paused", pausedUntil: a.until, events: [...p.events, { at: a.at, kind: "paused", note: a.reason, byId: a.by }] })),
      };
    case "plan.resume":
      return {
        ...d,
        plans: upd(d.plans, a.planId, (p) => ({ ...p, status: "active", pausedUntil: undefined, events: [...p.events, { at: a.at, kind: "resumed", note: "Plan resumed", byId: a.by }] })),
      };
    case "plan.skip":
      return {
        ...d,
        plans: upd(d.plans, a.planId, (p) => {
          const months = p.cadence === "quarterly" ? 3 : p.cadence === "semiannual" ? 6 : p.cadence === "annual" ? 12 : 1;
          return { ...p, nextDate: p.cadence === "weekly" ? shiftDate(p.nextDate, 7) : shiftMonths(p.nextDate, months), skippedOccurrences: [...p.skippedOccurrences, p.skippedOccurrences.length + 100], events: [...p.events, { at: a.at, kind: "skipped", note: a.reason, byId: a.by }] };
        }),
        jobs: d.jobs.map((j) => {
          const plan = d.plans.find((p) => p.id === a.planId);
          return plan && j.planId === plan.id && j.status === "scheduled" && j.date === plan.nextDate ? { ...j, status: "cancelled" } : j;
        }),
      };
    case "plan.cancel":
      return {
        ...d,
        plans: upd(d.plans, a.planId, (p) => ({ ...p, status: "cancelled", cancelReason: a.reason, events: [...p.events, { at: a.at, kind: "cancelled", note: a.reason, byId: a.by }] })),
      };

    case "invoice.pay": {
      const inv = d.invoices.find((i) => i.id === a.invoiceId);
      if (!inv || inv.status === "paid") return d;
      let n = d;
      if (a.useCredit) n = redeemCredit(n, a, inv.id);
      const fresh = n.invoices.find((i) => i.id === inv.id)!;
      const due = fresh.total - fresh.paid;
      return recordPayment(n, a, fresh, due, a.method);
    }

    case "message.send":
      return { ...d, messages: [a.message, ...d.messages] };
    case "automation.toggle":
      return { ...d, automations: d.automations.map((x) => (x.id === a.automationId ? { ...x, enabled: !x.enabled } : x)) };
    case "followup.done":
      return { ...d, followUps: upd(d.followUps, a.followUpId, (f) => ({ ...f, done: true })) };
    case "estimate.status": {
      let n: DemoData = { ...d, estimates: upd(d.estimates, a.estimateId, (e) => ({ ...e, status: a.status, sentAt: a.status === "sent" ? a.at : e.sentAt })) };
      const est = d.estimates.find((e) => e.id === a.estimateId);
      if (est?.leadId && a.status === "sent") n = { ...n, leads: upd(n.leads, est.leadId, (l) => ({ ...l, stage: "estimate_sent" })) };
      if (est?.leadId && a.status === "accepted") n = { ...n, leads: upd(n.leads, est.leadId, (l) => ({ ...l, stage: "won" })) };
      return n;
    }
    case "customer.card":
      return { ...d, customers: upd(d.customers, a.customerId, (c) => ({ ...c, cardOnFile: a.card })) };
    case "time.clock": {
      const open = d.timeEntries.find((t) => t.employeeId === a.employeeId && t.date === d.today && !t.end);
      const hhmm = a.at.slice(11, 16);
      if (a.clockIn && !open) {
        return { ...d, timeEntries: [...d.timeEntries, { id: `te_${a.id}`, employeeId: a.employeeId, date: d.today, start: hhmm, kind: "field", approved: false }] };
      }
      if (!a.clockIn && open) {
        return { ...d, timeEntries: upd(d.timeEntries, open.id, (t) => ({ ...t, end: hhmm })) };
      }
      return d;
    }
  }
}

/** Applies available Reef Credit to an invoice: available -> reserved -> redeemed. */
function redeemCredit(d: DemoData, a: Action, invoiceId: ID): DemoData {
  const inv = d.invoices.find((i) => i.id === invoiceId)!;
  const bal = creditBalances(d.credit, inv.customerId);
  const due = inv.total - inv.paid;
  const amt = Math.min(bal.available, due);
  if (amt <= 0) return d;
  const entries: CreditEntry[] = [
    { id: `cr_${a.id}_r`, customerId: inv.customerId, at: a.at, from: "available", to: "reserved", amount: amt, memo: `Held for ${inv.number}`, invoiceId },
    { id: `cr_${a.id}_x`, customerId: inv.customerId, at: a.at, from: "reserved", to: "redeemed", amount: amt, memo: `Applied to ${inv.number}`, invoiceId },
  ];
  return {
    ...d,
    credit: [...d.credit, ...entries],
    invoices: upd(d.invoices, invoiceId, (i) => ({ ...i, credit: i.credit + amt, total: i.total - amt })),
  };
}

function recordPayment(d: DemoData, a: Action, inv: Invoice, amount: number, method: Payment["method"]): DemoData {
  const cust = d.customers.find((c) => c.id === inv.customerId)!;
  let n: DemoData = d;
  if (amount > 0) {
    const pay: Payment = {
      id: `pay_${a.id}`,
      invoiceId: inv.id,
      customerId: cust.id,
      amount,
      method,
      status: "succeeded",
      at: a.at,
      brand: cust.cardOnFile?.brand ?? "Visa",
      last4: cust.cardOnFile?.last4 ?? "4242",
      kind: "payment",
    };
    n = { ...n, payments: [...n.payments, pay] };
    n = sms(n, a, "rcpt", { customerId: cust.id, to: cust.phone, trigger: "receipt", body: `Thanks ${firstName(cust.contactName)}! We received ${money(amount)} for invoice ${inv.number}.` });
    n = addActivity(n, a, `${cust.name} paid ${money(amount)}`, "payment", `/admin/customer?id=${cust.id}`);
  }
  n = { ...n, invoices: upd(n.invoices, inv.id, (i) => ({ ...i, paid: i.paid + amount, status: "paid" })) };
  return qualifyReferral(n, a, cust.id);
}

/** Creates the invoice for a completed job, applies credit, charges card on file if present. */
function finalizeInvoice(d: DemoData, a: Action, jobId: ID): DemoData {
  const job = d.jobs.find((j) => j.id === jobId)!;
  if (job.invoiceId) return d;
  const cust = d.customers.find((c) => c.id === job.customerId)!;
  const nextNum = Math.max(...d.invoices.map((i) => Number(i.number.replace(/\D/g, "")) || 0)) + 1;
  const inv: Invoice = {
    id: `inv_${a.id}`,
    number: `INV-${nextNum}`,
    customerId: cust.id,
    jobId,
    issuedOn: d.today,
    dueOn: cust.kind === "commercial" ? shiftDate(d.today, 15) : d.today,
    lines: job.lines,
    subtotal: subtotal(job.lines),
    discount: job.discount,
    credit: 0,
    tax: 0,
    total: job.total,
    paid: 0,
    status: "open",
  };
  let n: DemoData = { ...d, invoices: [...d.invoices, inv], jobs: upd(d.jobs, jobId, (j) => ({ ...j, invoiceId: inv.id })) };
  n = redeemCredit(n, a, inv.id);
  const fresh = n.invoices.find((i) => i.id === inv.id)!;
  if (cust.cardOnFile) {
    return recordPayment(n, a, fresh, fresh.total, "card_on_file");
  }
  return sms(n, a, "paylink", { customerId: cust.id, to: cust.phone, trigger: "receipt", body: `Your Reef invoice ${fresh.number} for ${money(fresh.total)} is ready. Pay securely here: reef.link/p/${fresh.number}` });
}

/** Spec 7: first eligible job completed and fully paid releases the referrer's pending reward. */
function qualifyReferral(d: DemoData, a: Action, customerId: ID): DemoData {
  const ref = d.referrals.find((r) => r.referredCustomerId === customerId && r.status === "booked");
  if (!ref) return d;
  const paidJob = d.jobs.some((j) => j.customerId === customerId && j.status === "completed" && d.invoices.find((i) => i.id === j.invoiceId)?.status === "paid");
  if (!paidJob) return d;
  const referrer = d.customers.find((c) => c.id === ref.referrerId)!;
  const referred = d.customers.find((c) => c.id === customerId)!;
  let n: DemoData = {
    ...d,
    referrals: upd(d.referrals, ref.id, (r) => ({ ...r, status: "qualified" })),
    credit: [
      ...d.credit,
      { id: `cr_${a.id}_q`, customerId: referrer.id, at: a.at, from: "pending", to: "available", amount: ref.reward, memo: `${firstName(referred.name)}'s first cleaning was paid`, referralId: ref.id, expiresOn: shiftMonths(d.today, REFERRAL_POLICY.expiryMonths) },
    ],
  };
  n = sms(n, a, "refq", { customerId: referrer.id, to: referrer.phone, trigger: "credit", body: `Good news ${firstName(referrer.contactName)}! ${firstName(referred.name)} booked with Reef, so ${money(ref.reward, { whole: true })} in Reef Credit is now in your account. It comes off your next cleaning.` });
  return addActivity(n, a, `${referrer.name} earned ${money(ref.reward, { whole: true })} Reef Credit`, "referral", `/admin/referrals`);
}

export const automationTemplates = AUTOMATIONS;
export type { Commission };
