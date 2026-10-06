"use client";

import { useState } from "react";
import clsx from "clsx";
import { CheckCircle, Pause, Play, SkipForward, XCircle } from "@phosphor-icons/react";
import { Badge, Button, Card, Field, Select, Sheet } from "@/components/ui";
import { useData, useDispatch, useMe } from "@/lib/demo/hooks";
import { PLAN_TONE } from "@/lib/demo/labels";
import { PLAN_DISCOUNT } from "@/lib/demo/catalog";
import { CADENCE, type PlanCadence, type ServicePlan } from "@/lib/demo/types";
import { fmtDate, money, newId, shiftDate, shiftMonths, subtotal, businessNow } from "@/lib/demo/util";

export default function PlanPage() {
  const data = useData()!;
  const me = useMe();
  const dispatch = useDispatch();
  const [action, setAction] = useState<"pause" | "skip" | "cancel" | null>(null);
  const [enroll, setEnroll] = useState<PlanCadence | null>(null);
  if (me?.kind !== "customer") return null;
  const { d, ix } = data;
  const c = me.customer;
  const plan = (ix.plansByCustomer.get(c.id) ?? []).find((p) => p.status !== "cancelled");
  const prop = (ix.propertiesByCustomer.get(c.id) ?? [])[0];
  const lastJob = (ix.jobsByCustomer.get(c.id) ?? []).filter((j) => j.status === "completed").sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const base = lastJob ? subtotal(lastJob.lines) : 30000;

  if (!plan) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-light text-navy-900">Service plans</h1>
          <p className="mt-1 max-w-xl text-[15px] text-muted">Pick how often you want Reef back. You&apos;re billed after each cleaning, and you can pause, skip or cancel any time from here.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(["quarterly", "semiannual", "annual"] as PlanCadence[]).map((cad) => (
            <Card key={cad} className={clsx("flex flex-col p-5", cad === "semiannual" && "ring-2 ring-sky-500")}>
              {cad === "semiannual" && <Badge tone="sky" className="mb-2 self-start">Most popular</Badge>}
              <p className="font-display text-xl font-semibold text-ink">{CADENCE[cad].label}</p>
              <p className="num mt-2 font-display text-3xl font-semibold text-ink">{money(Math.round(base * (1 - PLAN_DISCOUNT[cad])), { whole: true })}</p>
              <p className="text-[13px] text-muted">
                per visit for your home · save {Math.round(PLAN_DISCOUNT[cad] * 100)}%
              </p>
              <Button className="mt-5" variant={cad === "semiannual" ? "primary" : "outline"} onClick={() => setEnroll(cad)}>
                Choose
              </Button>
            </Card>
          ))}
        </div>
        {enroll && prop && lastJob && (
          <Sheet open onClose={() => setEnroll(null)} title="Start your plan">
            <div className="flex flex-col gap-4 text-[14px] text-ink">
              <p>
                <strong>{CADENCE[enroll].label}</strong> at {prop.street}, same scope as your last cleaning, for {money(Math.round(base * (1 - PLAN_DISCOUNT[enroll])))} per visit.
              </p>
              <ul className="flex flex-col gap-1.5 text-muted">
                <li className="flex gap-2">
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-ok" /> Billed to your card after each completed visit
                </li>
                <li className="flex gap-2">
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-ok" /> Reminder text a week before every visit
                </li>
                <li className="flex gap-2">
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-ok" /> Pause, skip or cancel online, no fee
                </li>
              </ul>
              <Button
                size="lg"
                full
                onClick={() => {
                  const months = enroll === "quarterly" ? 3 : enroll === "semiannual" ? 6 : 12;
                  const plan: ServicePlan = {
                    id: newId("pl"),
                    customerId: c.id,
                    propertyId: prop.id,
                    cadence: enroll,
                    status: "active",
                    lines: lastJob.lines,
                    pricePerVisit: Math.round(base * (1 - PLAN_DISCOUNT[enroll])),
                    discountPct: PLAN_DISCOUNT[enroll],
                    anchorDate: lastJob.date,
                    nextDate: shiftMonths(lastJob.date, months) > d.today ? shiftMonths(lastJob.date, months) : shiftDate(d.today, 14),
                    startedAt: businessNow(),
                    autopay: !!c.cardOnFile,
                    events: [{ at: businessNow(), kind: "created", note: "Enrolled from customer account" }],
                    skippedOccurrences: [],
                  };
                  dispatch({ t: "plan.create", plan, by: c.id }, { silent: true });
                  setEnroll(null);
                }}
              >
                Agree and start plan
              </Button>
              <p className="text-[12px] text-muted">Plan terms v1. Prices for future visits only change with 30 days&apos; notice.</p>
            </div>
          </Sheet>
        )}
      </div>
    );
  }

  const st = PLAN_TONE[plan.status];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-light text-navy-900">Your plan</h1>
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-start md:p-6">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-2xl font-semibold text-ink">{CADENCE[plan.cadence].label}</p>
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
            <p className="mt-1 text-[14px] text-muted">
              {prop?.street} · {money(plan.pricePerVisit)} per visit · saves {Math.round(plan.discountPct * 100)}% · {plan.autopay ? "autopay on" : "pay by link"}
            </p>
          </div>
          <div className="rounded-2xl bg-canvas px-4 py-3">
            <p className="text-[12.5px] text-muted">{plan.status === "paused" ? "Paused until" : "Next visit"}</p>
            <p className="font-display text-xl font-semibold text-ink">{fmtDate(plan.status === "paused" ? plan.pausedUntil ?? plan.nextDate : plan.nextDate, "MMM d, yyyy")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line p-4">
          {plan.status === "active" ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setAction("skip")}>
                <SkipForward size={14} /> Skip next visit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAction("pause")}>
                <Pause size={14} /> Pause
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => dispatch({ t: "plan.resume", planId: plan.id, by: c.id }, { silent: true })}>
              <Play size={14} /> Resume plan
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-bad" onClick={() => setAction("cancel")}>
            <XCircle size={14} /> Cancel plan
          </Button>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 text-[13px] font-medium text-muted">What&apos;s included each visit</h2>
        <Card className="divide-y divide-line">
          {plan.lines
            .filter((l) => l.serviceId !== "callout")
            .map((l) => (
              <div key={l.serviceId} className="flex justify-between px-4 py-3 text-[14px]">
                <span className="text-ink">{d.services.find((s) => s.id === l.serviceId)?.name}</span>
                <span className="num text-muted">× {l.qty}</span>
              </div>
            ))}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-medium text-muted">Plan history</h2>
        <Card className="divide-y divide-line">
          {[...plan.events].reverse().map((e, i) => (
            <div key={i} className="flex justify-between gap-3 px-4 py-3 text-[14px]">
              <span className="text-ink capitalize">
                {e.kind} <span className="text-muted normal-case">· {e.note}</span>
              </span>
              <span className="shrink-0 text-[12.5px] text-muted">{fmtDate(e.at, "MMM d, yyyy")}</span>
            </div>
          ))}
        </Card>
      </section>

      {action && <PlanAction kind={action} plan={plan} onClose={() => setAction(null)} />}
    </div>
  );
}

function PlanAction({ kind, plan, onClose }: { kind: "pause" | "skip" | "cancel"; plan: ServicePlan; onClose: () => void }) {
  const data = useData()!;
  const dispatch = useDispatch();
  const [reason, setReason] = useState(kind === "skip" ? "Out of town" : kind === "pause" ? "Traveling" : "Moving");
  const [months, setMonths] = useState(2);
  const title = kind === "skip" ? "Skip next visit" : kind === "pause" ? "Pause plan" : "Cancel plan";
  return (
    <Sheet open onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {kind === "skip" && <p className="text-[14px] text-ink">We&apos;ll skip {fmtDate(plan.nextDate, "MMMM d")} and keep the rest of your schedule the same.</p>}
        {kind === "pause" && (
          <Field label="Pause for">
            <Select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {[1, 2, 3, 6].map((m) => (
                <option key={m} value={m}>
                  {m} month{m > 1 ? "s" : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {kind === "cancel" && <p className="text-[14px] text-ink">Your plan ends today. Past invoices and photos stay in your account. We&apos;ll check in before next season unless you tell us not to.</p>}
        <Field label="Reason">
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {["Out of town", "Traveling", "Budget", "Moving", "Not happy with service", "Other"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Button
          full
          variant={kind === "cancel" ? "danger" : "primary"}
          onClick={() => {
            if (kind === "skip") dispatch({ t: "plan.skip", planId: plan.id, reason }, { silent: true });
            if (kind === "pause") dispatch({ t: "plan.pause", planId: plan.id, until: shiftMonths(data.d.today, months), reason }, { silent: true });
            if (kind === "cancel") dispatch({ t: "plan.cancel", planId: plan.id, reason }, { silent: true });
            onClose();
          }}
        >
          {title}
        </Button>
      </div>
    </Sheet>
  );
}
