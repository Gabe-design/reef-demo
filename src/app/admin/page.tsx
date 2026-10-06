"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Info, Star, Truck } from "@phosphor-icons/react";
import { PageHeader } from "@/components/admin/shell";
import { FilterBar, defaultFilters, previousWindow, toKpiFilters, RANGES, type FilterState } from "@/components/admin/filters";
import { DrillSheet, type DrillRow } from "@/components/admin/drill";
import { Avatar, Card, CardHeader, Segmented } from "@/components/ui";
import { Table } from "@/components/admin/table";
import { useData, useMe } from "@/lib/demo/hooks";
import { computeKpis, weeklySeries, type Kpis } from "@/lib/demo/select";
import { LEAD_SOURCES, type DemoData } from "@/lib/demo/types";
import { compactMoney, fmtAgo, fmtDate, money, pct, businessNow } from "@/lib/demo/util";
import type { Index } from "@/lib/demo/select";

const C_PLAN = "#2a78d6";
const C_ONE = "#1baf7a";

export default function Dashboard() {
  const data = useData()!;
  const me = useMe();
  const { d, ix } = data;
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [drill, setDrill] = useState<{ title: string; rows: DrillRow[] } | null>(null);
  const [srcView, setSrcView] = useState<"chart" | "table">("chart");

  const f = useMemo(() => toKpiFilters(filters, d.today), [filters, d.today]);
  const k = useMemo(() => computeKpis(d, ix, f), [d, ix, f]);
  const prev = useMemo(() => computeKpis(d, ix, { ...f, ...previousWindow(f) }), [d, ix, f]);
  const series = useMemo(() => weeklySeries(d, f, k), [d, f, k]);
  const isOwner = me?.kind === "staff" && me.employee.role === "owner";
  const rangeLabel = RANGES.find((r) => r.key === filters.range)!.label.toLowerCase();
  const hour = Number(businessNow().slice(11, 13));

  const open = (title: string, rows: DrillRow[]) => setDrill({ title, rows });
  const rows = useMemo(() => drillers(d, ix, k, f), [d, ix, k, f]);

  return (
    <>
      <PageHeader
        title={`Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}`}
        sub={`${fmtDate(d.today, "EEEE, MMMM d")} · Reef at a glance`}
      />

      <TodayStrip d={d} ix={ix} />

      <div className="sticky top-14 z-20 -mx-4 mt-8 mb-5 bg-canvas/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:top-0">
        <FilterBar value={filters} onChange={setFilters} d={d} />
      </div>

      <Section title="Revenue and cash">
        <Kpi label="Revenue" value={money(k.revenue, { whole: true })} delta={delta(k.revenue, prev.revenue)} hint="Completed work after discounts, excluding tax" onClick={() => open("Revenue", rows.revenue())} />
        <Kpi label="Cash collected" value={money(k.cashCollected, { whole: true })} delta={delta(k.cashCollected, prev.cashCollected)} hint={k.failedPayments ? `${k.failedPayments} failed card payment${k.failedPayments > 1 ? "s" : ""}` : "Payments received less refunds"} onClick={() => open("Cash collected", rows.cash())} />
        <Kpi label="Average job" value={k.avgJobValue === null ? "N/A" : money(k.avgJobValue, { whole: true })} delta={k.avgJobValue && prev.avgJobValue ? delta(k.avgJobValue, prev.avgJobValue) : undefined} hint={`${k.completedJobs} completed jobs`} onClick={() => open("Completed jobs", rows.revenue())} />
        <Kpi label="Jobs booked" value={k.jobsBooked} delta={delta(k.jobsBooked, prev.jobsBooked)} hint={`${money(k.bookedValue, { whole: true })} booked value`} onClick={() => open("Jobs booked", rows.booked())} />
      </Section>

      <Section title="Sales">
        <Kpi label="Total leads" value={k.totalLeads} delta={delta(k.totalLeads, prev.totalLeads)} hint="Quote requests, calls, referrals and doors" onClick={() => open("Leads", rows.leads())} />
        <Kpi label="Doors knocked" value={k.doorsKnocked.toLocaleString()} delta={delta(k.doorsKnocked, prev.doorsKnocked)} hint={`${k.distinctDoors.toLocaleString()} different addresses`} onClick={() => open("Door visits", rows.doors())} />
        <Kpi label="Conversations" value={k.conversations.toLocaleString()} hint={`${pct(k.doorsKnocked ? k.conversations / k.doorsKnocked : null)} of knocks`} onClick={() => open("Conversations", rows.doors(true))} />
        <Kpi label="Estimate close rate" value={pct(k.estimateCloseRate)} hint={`${k.estimatesSent} sent · ${k.estimatesOpen} still open`} onClick={() => open("Estimates", rows.estimates())} />
      </Section>

      <Section title="Recurring revenue">
        <Kpi label="Plan revenue" value={money(k.recurringRevenue, { whole: true })} hint={`${pct(k.revenue ? k.recurringRevenue / k.revenue : null)} of revenue came from plans`} onClick={() => open("Plan revenue", rows.revenue(true))} />
        <Kpi label="Expected monthly plan value" value={money(k.expectedMonthly, { whole: true })} hint="Forecast from active plans, not collected" onClick={() => open("Active plans", rows.plans())} />
        <Kpi label="Recurring customers" value={k.recurringCustomers} hint="Customers on an active plan today" onClick={() => open("Active plans", rows.plans())} />
        <Kpi label="Plan conversion" value={pct(k.planConversion)} hint={`First cleanings 30-120 days ago (${k.planCohort})`} />
      </Section>

      <Section title="Loyalty">
        <Kpi label="Customer retention" value={pct(k.retention)} hint={`Repeat cleaning within 7-14 months (${k.retentionCohort} customers)`} />
        <Kpi label="Referral revenue" value={money(k.referralRevenue, { whole: true })} hint="Completed work from referred customers" />
        <Kpi label="Reef Credit owed" value={money(k.creditOwed, { whole: true })} hint={`${money(k.credit.pending, { whole: true })} pending · ${money(k.credit.redeemed, { whole: true })} redeemed`} href="/admin/referrals/" />
        <Kpi label="Reviews" value={k.avgRating ? `${k.avgRating.toFixed(1)}` : "N/A"} icon={<Star size={16} weight="fill" className="text-[#eda100]" />} hint={`${k.reviews} reviews · ${pct(k.reviewConversion)} of requests`} onClick={() => open("Reviews", rows.reviews())} />
      </Section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title={filters.range === "today" || filters.range === "7d" ? "Revenue by day" : filters.range === "30d" || filters.range === "90d" ? "Revenue by week" : "Revenue every two weeks"} sub={`Completed work, ${rangeLabel}`} />
          <div className="flex gap-4 px-5 text-[12.5px] text-muted">
            <Legend color={C_PLAN} label="Plan visits" />
            <Legend color={C_ONE} label="One-time" />
          </div>
          <div className="h-64 px-2 pt-2 pb-4">
            <ResponsiveContainer>
              <AreaChart data={series.map((s) => ({ ...s, oneTime: s.revenue - s.recurring }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-line)" strokeDasharray="0" vertical={false} />
                <XAxis dataKey="week" tickFormatter={(v) => fmtDate(v, "MMM d")} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => compactMoney(v * 100)} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: "var(--color-navy-100)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="recurring" name="Plan visits" stackId="1" stroke={C_PLAN} strokeWidth={2} fill={C_PLAN} fillOpacity={0.22} />
                <Area type="monotone" dataKey="oneTime" name="One-time" stackId="1" stroke={C_ONE} strokeWidth={2} fill={C_ONE} fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Where customers come from"
            sub={`New customers, ${rangeLabel}`}
            action={<Segmented size="sm" value={srcView} onChange={setSrcView} options={[{ value: "chart", label: "Chart" }, { value: "table", label: "Table" }]} />}
          />
          {srcView === "chart" ? (
            <div className="h-64 px-2 pb-4">
              <ResponsiveContainer>
                <BarChart data={[...k.sources].sort((a, b) => b.customers - a.customers).map((s) => ({ name: LEAD_SOURCES[s.source], customers: s.customers }))} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-line)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={104} tick={{ fontSize: 12, fill: "var(--color-ink)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip plain />} cursor={{ fill: "var(--color-navy-50)" }} />
                  <Bar dataKey="customers" name="New customers" fill="#1e7aa6" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <SourceTable k={k} />
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Sales team" sub="Door-to-door, close rate = booked ÷ conversations" action={<Link href="/admin/canvassing/" className="text-[13px] font-medium text-sky-700">Map</Link>} />
          <Table
            head={["Rep", "Doors", "Talks", "Booked", "Close", "Booked $", "Commission"]}
            rows={k.sales.map((s) => [
              <span key="n" className="flex items-center gap-2">
                <Avatar name={s.employee.name} color={s.employee.color} size={24} /> {s.employee.name}
              </span>,
              s.visits,
              s.conversations,
              s.booked,
              pct(s.closeRate),
              money(s.bookedValue, { whole: true }),
              money(s.commission, { whole: true }),
            ])}
          />
        </Card>
        <Card>
          <CardHeader title="Crew productivity" sub="Revenue split across the crew on each job" action={<Link href="/admin/team/" className="text-[13px] font-medium text-sky-700">Team</Link>} />
          <Table
            head={["Tech", "Jobs", "Field hrs", "Revenue", "$ / hr"]}
            rows={k.workers.map((w) => [
              <span key="n" className="flex items-center gap-2">
                <Avatar name={w.employee.name} color={w.employee.color} size={24} /> {w.employee.name}
              </span>,
              w.jobs,
              w.hours.toFixed(1),
              money(w.revenue, { whole: true }),
              w.perHour === null ? "N/A" : money(w.perHour, { whole: true }),
            ])}
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Card>
          <CardHeader title="Marketing" sub="Spend is entered monthly; blank means not tracked" />
          <Table
            head={["Source", "Leads", "Cust.", "Spend", "Cost / lead", "Revenue"]}
            rows={[...k.sources]
              .sort((a, b) => b.revenue - a.revenue)
              .map((s) => [
                LEAD_SOURCES[s.source],
                s.leads,
                s.customers,
                s.spend ? money(s.spend, { whole: true }) : "-",
                s.spend && s.leads ? money(s.spend / s.leads, { whole: true }) : "N/A",
                money(s.revenue, { whole: true }),
              ])}
          />
        </Card>
        <Card>
          <CardHeader title="Job profitability" sub={isOwner ? "Operational view, not accounting" : "Owner only"} />
          {isOwner ? (
            <div className="px-5 pb-5">
              <ProfitRow label="Revenue" value={k.revenue} strong />
              <ProfitRow label="Field labor" value={-k.laborCost} />
              <ProfitRow label="Commissions" value={-k.commissionCost} />
              <ProfitRow label="Card fees (2.9% + 30¢)" value={-k.cardFees} />
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-[14px] font-medium text-ink">Margin before overhead</span>
                <span className="num font-display text-xl font-semibold text-ink">
                  {money(k.margin, { whole: true })} <span className="text-[13px] font-normal text-muted">{pct(k.marginPct)}</span>
                </span>
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[12px] text-muted">
                <Info size={14} className="mt-0.5 shrink-0" /> Materials, fuel and insurance aren&apos;t entered yet, so they aren&apos;t counted.
              </p>
            </div>
          ) : (
            <p className="px-5 pb-6 text-[13px] text-muted">Profitability is visible to the owner account.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Live activity" />
          <ul className="max-h-[320px] divide-y divide-line overflow-y-auto px-5 pb-3">
            {d.activity.slice(0, 18).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
                {a.href ? (
                  <Link href={a.href} className="text-ink hover:text-sky-700">
                    {a.text}
                  </Link>
                ) : (
                  <span className="text-ink">{a.text}</span>
                )}
                <span className="shrink-0 text-[12px] text-subtle">{fmtAgo(a.at, businessNow())}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <DrillSheet open={!!drill} onClose={() => setDrill(null)} title={drill?.title ?? ""} rows={drill?.rows ?? []} />
    </>
  );
}

function delta(cur: number, prev: number) {
  if (!prev) return undefined;
  return (cur - prev) / prev;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2.5 text-[13px] font-medium text-muted">{title}</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function Kpi({
  label,
  value,
  hint,
  delta,
  onClick,
  href,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  delta?: number;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-medium text-muted">{label}</p>
        {delta !== undefined && isFinite(delta) && (
          <span className={clsx("num inline-flex items-center gap-0.5 text-[12px] font-medium", delta >= 0 ? "text-ok" : "text-bad")}>
            {delta >= 0 ? <ArrowUpRight size={12} weight="bold" /> : <ArrowDownRight size={12} weight="bold" />}
            {Math.abs(delta * 100).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="num mt-2 flex items-center gap-1.5 font-display text-[26px] leading-none font-semibold tracking-tight text-ink">
        {value}
        {icon}
      </p>
      {hint && <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-muted">{hint}</p>}
    </>
  );
  const cls = "rounded-2xl border border-line bg-white p-4 text-left transition";
  if (href)
    return (
      <Link href={href} className={clsx(cls, "hover:border-sky-300 hover:shadow-soft")}>
        {inner}
      </Link>
    );
  if (onClick)
    return (
      <button onClick={onClick} className={clsx(cls, "hover:border-sky-300 hover:shadow-soft active:scale-[0.99]")} title="Show the records behind this number">
        {inner}
      </button>
    );
  return <div className={cls}>{inner}</div>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-[3px]" style={{ background: color }} />
      {label}
    </span>
  );
}

function ChartTip({ active, payload, label, plain }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; plain?: boolean }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] shadow-soft">
      <p className="mb-1 font-medium text-ink">{plain ? label : `From ${fmtDate(String(label), "MMM d")}`}</p>
      {payload.map((p) => (
        <p key={p.name} className="num flex items-center justify-between gap-4 text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ background: p.color }} /> {p.name}
          </span>
          <span className="text-ink">{plain ? p.value : money(p.value * 100, { whole: true })}</span>
        </p>
      ))}
      {!plain && payload.length > 1 && (
        <p className="num mt-1 flex justify-between gap-4 border-t border-line pt-1 font-medium text-ink">
          <span>Total</span>
          {money(total * 100, { whole: true })}
        </p>
      )}
    </div>
  );
}

function SourceTable({ k }: { k: Kpis }) {
  return (
    <Table
      head={["Source", "New customers", "Revenue"]}
      rows={[...k.sources].sort((a, b) => b.customers - a.customers).map((s) => [LEAD_SOURCES[s.source], s.customers, money(s.revenue, { whole: true })])}
    />
  );
}

function ProfitRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 text-[13.5px]">
      <span className={strong ? "font-medium text-ink" : "text-muted"}>{label}</span>
      <span className={clsx("num", strong ? "font-medium text-ink" : "text-ink")}>{money(value, { whole: true })}</span>
    </div>
  );
}

function TodayStrip({ d, ix }: { d: DemoData; ix: Index }) {
  const todays = d.jobs.filter((j) => j.date === d.today && j.status !== "cancelled");
  const done = todays.filter((j) => j.status === "completed").length;
  const cashToday = d.payments.filter((p) => p.status === "succeeded" && p.at.startsWith(d.today)).reduce((s, p) => s + p.amount, 0);
  const leadsToday = d.leads.filter((l) => l.createdAt.startsWith(d.today)).length;
  const issues = todays.flatMap((j) => j.issues).filter((i) => !i.resolved).length;
  const overdue = d.followUps.filter((f) => !f.done && f.due < d.today).length;
  const crews = d.crews.map((c) => {
    const js = todays.filter((j) => j.crewId === c.id).sort((a, b) => a.routeOrder - b.routeOrder);
    const current = js.find((j) => j.status === "in_progress" || j.status === "en_route");
    return { crew: c, total: js.length, done: js.filter((j) => j.status === "completed").length, current };
  });
  return (
    <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
            <Truck size={16} /> Crews today
          </p>
          <Link href="/admin/schedule/" className="inline-flex items-center gap-1 text-[13px] font-medium text-sky-700">
            Dispatch <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {crews.map(({ crew, total, done, current }) => (
            <div key={crew.id} className="rounded-xl bg-canvas p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                  <span className="size-2.5 rounded-full" style={{ background: crew.color }} /> {crew.name}
                </span>
                <span className="num text-[12.5px] text-muted">
                  {done}/{total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%`, background: crew.color }} />
              </div>
              <p className="mt-2 truncate text-[12px] text-muted">
                {current ? (
                  <>
                    {current.status === "en_route" ? "On the way to " : "At "}
                    <Link href={`/admin/job/?id=${current.id}`} className="text-ink hover:text-sky-700">
                      {ix.customer.get(current.customerId)?.name}
                    </Link>
                  </>
                ) : done === total && total > 0 ? (
                  "Route finished"
                ) : (
                  "Not started"
                )}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="Jobs done today" value={`${done} of ${todays.length}`} />
        <MiniStat label="Cash today" value={money(cashToday, { whole: true })} />
        <MiniStat label="New leads today" value={String(leadsToday)} href="/admin/leads/" />
        <MiniStat label="Needs attention" value={String(issues + overdue)} sub={`${issues} job issue${issues === 1 ? "" : "s"} · ${overdue} overdue follow-ups`} href="/admin/plans/" warn={issues + overdue > 0} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, href, warn }: { label: string; value: string; sub?: string; href?: string; warn?: boolean }) {
  const body = (
    <>
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className={clsx("num mt-1 font-display text-[22px] font-semibold", warn ? "text-warn" : "text-ink")}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-[11.5px] text-muted">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="rounded-2xl border border-line bg-white p-4 hover:border-sky-300">
      {body}
    </Link>
  ) : (
    <div className="rounded-2xl border border-line bg-white p-4">{body}</div>
  );
}

function drillers(d: DemoData, ix: Index, k: Kpis, f: { from: string; to: string }) {
  const inR = (x: string) => x.slice(0, 10) >= f.from && x.slice(0, 10) <= f.to;
  const cname = (id: string) => ix.customer.get(id)?.name ?? "";
  return {
    revenue: (planOnly?: boolean): DrillRow[] =>
      k.completed
        .filter((j) => !planOnly || j.planId)
        .map((j) => ({ Job: j.number, Completed: j.completedAt!.slice(0, 10), Customer: cname(j.customerId), Neighborhood: ix.property.get(j.propertyId)?.neighborhood ?? "", Plan: j.planId ? "Yes" : "No", Discount: (j.discount / 100).toFixed(2), Net: (j.total / 100).toFixed(2) })),
    cash: (): DrillRow[] =>
      d.payments
        .filter((p) => inR(p.at) && p.status === "succeeded")
        .map((p) => ({ Date: p.at.slice(0, 10), Customer: cname(p.customerId), Method: p.method.replace(/_/g, " "), Invoice: ix.invoice.get(p.invoiceId ?? "")?.number ?? "", Amount: (p.amount / 100).toFixed(2) })),
    booked: (): DrillRow[] =>
      d.jobs
        .filter((j) => j.date && inR(j.date) && j.status !== "cancelled")
        .map((j) => ({ Job: j.number, Date: j.date, Customer: cname(j.customerId), Status: j.status.replace(/_/g, " "), Value: (j.total / 100).toFixed(2) })),
    leads: (): DrillRow[] => [
      ...d.leads.filter((l) => inR(l.createdAt)).map((l) => ({ Created: l.createdAt.slice(0, 10), Name: l.name, Source: LEAD_SOURCES[l.source], Stage: l.stage.replace(/_/g, " "), Owner: ix.employee.get(l.ownerId)?.name ?? "" })),
      ...d.customers.filter((c) => inR(c.createdAt) && !d.leads.some((l) => l.customerId === c.id)).map((c) => ({ Created: c.createdAt.slice(0, 10), Name: c.name, Source: LEAD_SOURCES[c.source], Stage: "customer", Owner: ix.employee.get(c.salespersonId ?? "")?.name ?? "" })),
    ],
    doors: (convOnly?: boolean): DrillRow[] =>
      d.doorVisits
        .filter((v) => inR(v.at) && (!convOnly || v.conversation))
        .map((v) => ({ Time: v.at.replace("T", " ").slice(0, 16), Rep: ix.employee.get(v.salespersonId)?.name ?? "", Door: v.doorId, Outcome: v.outcome.replace(/_/g, " "), Conversation: v.conversation ? "Yes" : "No" })),
    estimates: (): DrillRow[] =>
      d.estimates.filter((e) => e.sentAt && inR(e.sentAt)).map((e) => ({ Estimate: e.number, Sent: e.sentAt!.slice(0, 10), For: e.name, Status: e.status, Total: (e.total / 100).toFixed(2) })),
    plans: (): DrillRow[] =>
      d.plans.filter((p) => p.status === "active").map((p) => ({ Customer: cname(p.customerId), Cadence: p.cadence, "Per visit": (p.pricePerVisit / 100).toFixed(2), "Next visit": p.nextDate, Autopay: p.autopay ? "Yes" : "No" })),
    reviews: (): DrillRow[] =>
      d.reviews.filter((r) => inR(r.at)).map((r) => ({ Date: r.at.slice(0, 10), Customer: cname(r.customerId), Rating: r.rating, Source: r.source, Review: r.body })),
  };
}

