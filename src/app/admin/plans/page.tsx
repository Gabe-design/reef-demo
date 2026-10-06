"use client";

import { useMemo, useState } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/admin/shell";
import { ListTable } from "@/components/admin/list";
import { Badge, Card, CardHeader, Segmented, StatTile } from "@/components/ui";
import { useData, useDispatch } from "@/lib/demo/hooks";
import { PLAN_TONE } from "@/lib/demo/labels";
import { CADENCE, type PlanCadence, type PlanStatus } from "@/lib/demo/types";
import { fmtDate, money, pct } from "@/lib/demo/util";

export default function Plans() {
  const { d, ix } = useData()!;
  const dispatch = useDispatch();
  const [f, setF] = useState<PlanStatus | "all">("active");
  const active = d.plans.filter((p) => p.status === "active");
  const mrr = active.reduce((s, p) => s + p.pricePerVisit * CADENCE[p.cadence].perMonth, 0);
  const offers = d.planOffers.filter((o) => o.outcome !== "open");
  const declined = d.planOffers.filter((o) => o.outcome === "declined").sort((a, b) => ((a.followUpOn ?? "") < (b.followUpOn ?? "") ? -1 : 1));

  // spec 1 operating principle: every active residential customer has a plan or an owned, dated follow-up
  const coverage = useMemo(() => {
    const gaps = d.customers.filter((c) => {
      if (c.kind !== "residential" || c.doNotText) return false;
      const hasJobs = (ix.jobsByCustomer.get(c.id) ?? []).some((j) => j.status === "completed");
      if (!hasJobs) return false;
      const plan = (ix.plansByCustomer.get(c.id) ?? []).some((p) => p.status === "active");
      const upcoming = (ix.jobsByCustomer.get(c.id) ?? []).some((j) => j.status === "scheduled");
      const fu = d.followUps.some((x) => x.customerId === c.id && !x.done);
      return !plan && !upcoming && !fu;
    });
    return gaps;
  }, [d, ix]);
  const due = d.followUps.filter((x) => !x.done && x.due <= d.today).sort((a, b) => (a.due < b.due ? -1 : 1));

  return (
    <>
      <PageHeader title="Recurring plans" sub="Plans, declines, and who's due for a cleaning" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Active plans" value={active.length} sub={(["quarterly", "semiannual", "annual"] as PlanCadence[]).map((c) => `${active.filter((p) => p.cadence === c).length} ${CADENCE[c].short}`).join(" · ")} />
        <StatTile label="Expected monthly value" value={money(mrr, { whole: true })} sub="Forecast, billed after each visit" />
        <StatTile label="Offer acceptance" value={pct(offers.length ? offers.filter((o) => o.outcome === "accepted").length / offers.length : null)} sub={`${declined.length} declined with a follow-up date`} />
        <StatTile label="Paused" value={d.plans.filter((p) => p.status === "paused").length} sub={`${d.plans.filter((p) => p.status === "cancelled").length} cancelled all-time`} />
      </div>

      <Card className={`mb-5 flex items-start gap-3 p-4 ${coverage.length ? "border-warn/40" : ""}`}>
        {coverage.length ? <WarningCircle size={22} className="shrink-0 text-warn" /> : <CheckCircle size={22} weight="fill" className="shrink-0 text-ok" />}
        <div className="text-[13.5px]">
          <p className="font-medium text-ink">{coverage.length ? `${coverage.length} customers have no plan and no follow-up` : "Every customer has a plan, a booking, or a dated follow-up"}</p>
          <p className="text-muted">Checked nightly. Gaps get assigned to Dana with a date so nobody falls through.</p>
        </div>
      </Card>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Due for follow-up" sub={`${due.length} due today or overdue`} />
          <ul className="max-h-80 divide-y divide-line overflow-y-auto border-t border-line">
            {due.slice(0, 30).map((x) => {
              const c = x.customerId ? ix.customer.get(x.customerId) : undefined;
              return (
                <li key={x.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13.5px]">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{c?.name}</span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {fmtDate(x.due, "MMM d")} · {x.note} · {ix.employee.get(x.ownerId)?.name.split(" ")[0]}
                    </span>
                  </span>
                  <button onClick={() => dispatch({ t: "followup.done", followUpId: x.id }, { silent: true })} className="shrink-0 text-[12.5px] font-medium text-sky-700">
                    Done
                  </button>
                </li>
              );
            })}
            {!due.length && <li className="px-5 py-6 text-center text-[13px] text-muted">Nothing due.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Declined plans" sub="Reason and when to ask again" />
          <ul className="max-h-80 divide-y divide-line overflow-y-auto border-t border-line">
            {declined.slice(0, 40).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13.5px]">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{ix.customer.get(o.customerId)?.name}</span>
                  <span className="block truncate text-[12.5px] text-muted">
                    {CADENCE[o.cadence].short} offered {fmtDate(o.at, "MMM d")} · {o.reason}
                  </span>
                </span>
                <span className={`shrink-0 text-[12.5px] ${o.followUpOn && o.followUpOn < d.today ? "text-bad" : "text-muted"}`}>{o.followUpOn ? fmtDate(o.followUpOn, "MMM d") : "-"}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ListTable
        rows={d.plans.filter((p) => f === "all" || p.status === f)}
        search={(p) => `${ix.customer.get(p.customerId)?.name} ${p.cadence}`}
        href={(p) => `/admin/customer/?id=${p.customerId}`}
        exportName="reef-plans"
        initialSort={{ key: "next", dir: 1 }}
        toolbar={<Segmented size="sm" value={f} onChange={setF} options={[{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "cancelled", label: "Cancelled" }, { value: "all", label: "All" }]} />}
        cols={[
          { key: "cust", label: "Customer", render: (p) => ix.customer.get(p.customerId)?.name, sort: (p) => ix.customer.get(p.customerId)?.name ?? "" },
          { key: "cad", label: "Cadence", render: (p) => CADENCE[p.cadence].label, sort: (p) => p.cadence },
          { key: "next", label: "Next visit", render: (p) => (p.status === "paused" ? `Paused to ${fmtDate(p.pausedUntil ?? p.nextDate, "MMM d")}` : p.status === "cancelled" ? p.cancelReason : fmtDate(p.nextDate, "MMM d, yyyy")), sort: (p) => p.nextDate },
          { key: "status", label: "Status", render: (p) => <Badge tone={PLAN_TONE[p.status].tone}>{PLAN_TONE[p.status].label}</Badge>, sort: (p) => p.status, hideOnMobile: true },
          { key: "auto", label: "Autopay", render: (p) => (p.autopay ? "Card on file" : "Pay link"), hideOnMobile: true },
          { key: "price", label: "Per visit", render: (p) => money(p.pricePerVisit), sort: (p) => p.pricePerVisit, csv: (p) => (p.pricePerVisit / 100).toFixed(2), align: "right" },
        ]}
      />
    </>
  );
}
