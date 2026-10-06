"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/shell";
import { ListTable } from "@/components/admin/list";
import { Badge, Card, CardHeader, Segmented, StatTile } from "@/components/ui";
import { useData } from "@/lib/demo/hooks";
import { creditBalances } from "@/lib/demo/select";
import { REFERRAL_POLICY } from "@/lib/demo/catalog";
import { fmtDate, money } from "@/lib/demo/util";

export default function Referrals() {
  const { d, ix } = useData()!;
  const [tab, setTab] = useState<"referrals" | "ledger">("referrals");
  const all = creditBalances(d.credit);
  const top = useMemo(() => {
    const m = new Map<string, number>();
    d.referrals.filter((r) => r.status === "qualified").forEach((r) => m.set(r.referrerId, (m.get(r.referrerId) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [d.referrals]);
  const referredRevenue = d.jobs.filter((j) => j.status === "completed" && ix.customer.get(j.customerId)?.source === "referral").reduce((s, j) => s + j.total, 0);
  const balanced = d.credit.every((e) => e.amount > 0);

  return (
    <>
      <PageHeader title="Reef Credit" sub="Referral program and the credit ledger behind every balance" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Credit owed" value={money(all.available + all.reserved)} sub="Available + held on open invoices" />
        <StatTile label="Pending" value={money(all.pending)} sub="Friend booked, not yet cleaned and paid" />
        <StatTile label="Redeemed" value={money(all.redeemed)} sub={`${money(all.expired)} expired unused`} />
        <StatTile label="Referral revenue" value={money(referredRevenue, { whole: true })} sub={`${d.referrals.filter((r) => r.status === "qualified").length} qualified referrals`} />
      </div>
      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader title="Program rules" sub="Version 1 · editable in Settings" />
          <ul className="space-y-2 border-t border-line px-5 py-4 text-[13.5px] text-ink">
            <li>Referrer earns {money(REFERRAL_POLICY.reward, { whole: true })} when the friend&apos;s first cleaning is completed and fully paid.</li>
            <li>New customer gets {money(REFERRAL_POLICY.newCustomerDiscount, { whole: true })} off their first cleaning.</li>
            <li>Credit expires {REFERRAL_POLICY.expiryMonths} months after it&apos;s earned. Oldest credit is used first.</li>
            <li>Credit is a discount, never cash. Self-referrals and duplicate rewards are blocked.</li>
          </ul>
        </Card>
        <Card>
          <CardHeader title="Top referrers" />
          <ul className="divide-y divide-line border-t border-line">
            {top.map(([id, n]) => {
              const c = ix.customer.get(id)!;
              const b = creditBalances(d.credit, id);
              return (
                <li key={id} className="flex items-center justify-between px-5 py-2.5 text-[13.5px]">
                  <span className="text-ink">{c.name}</span>
                  <span className="num text-muted">
                    {n} referral{n > 1 ? "s" : ""} · {money(b.earned, { whole: true })} earned
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <div className="mb-3 flex items-center gap-3">
        <Segmented value={tab} onChange={setTab} options={[{ value: "referrals", label: "Referrals" }, { value: "ledger", label: "Ledger" }]} />
        {tab === "ledger" && <span className="text-[12.5px] text-muted">{balanced ? "Append-only. Every entry moves credit between buckets; balances are computed from these rows." : ""}</span>}
      </div>
      {tab === "referrals" ? (
        <ListTable
          rows={d.referrals}
          search={(r) => `${ix.customer.get(r.referrerId)?.name} ${r.referredName}`}
          exportName="reef-referrals"
          initialSort={{ key: "at", dir: -1 }}
          cols={[
            { key: "ref", label: "Referrer", render: (r) => ix.customer.get(r.referrerId)?.name, sort: (r) => ix.customer.get(r.referrerId)?.name ?? "" },
            { key: "friend", label: "Friend", render: (r) => r.referredName, sort: (r) => r.referredName },
            { key: "at", label: "Date", render: (r) => fmtDate(r.createdAt, "MMM d, yyyy"), sort: (r) => r.createdAt },
            {
              key: "status",
              label: "Status",
              render: (r) => <Badge tone={r.status === "qualified" ? "ok" : r.status === "booked" ? "sky" : r.status === "lead" ? "neutral" : "warn"}>{r.status === "qualified" ? "Credit earned" : r.status === "booked" ? "Booked, pending" : r.status === "lead" ? "Quote requested" : "Didn't book"}</Badge>,
              sort: (r) => r.status,
              csv: (r) => r.status,
            },
            { key: "reward", label: "Reward", render: (r) => money(r.reward, { whole: true }), sort: (r) => r.reward, align: "right" },
          ]}
        />
      ) : (
        <ListTable
          rows={d.credit}
          search={(e) => `${ix.customer.get(e.customerId)?.name} ${e.memo}`}
          exportName="reef-credit-ledger"
          initialSort={{ key: "at", dir: -1 }}
          cols={[
            { key: "at", label: "Date", render: (e) => fmtDate(e.at, "MMM d, yyyy"), sort: (e) => e.at },
            { key: "cust", label: "Customer", render: (e) => ix.customer.get(e.customerId)?.name, sort: (e) => ix.customer.get(e.customerId)?.name ?? "" },
            { key: "move", label: "Movement", render: (e) => `${e.from} → ${e.to}`, sort: (e) => e.to },
            { key: "memo", label: "Memo", render: (e) => e.memo, hideOnMobile: true },
            { key: "exp", label: "Expires", render: (e) => (e.expiresOn ? fmtDate(e.expiresOn, "MMM d, yyyy") : "-"), hideOnMobile: true },
            { key: "amt", label: "Amount", render: (e) => money(e.amount), sort: (e) => e.amount, csv: (e) => (e.amount / 100).toFixed(2), align: "right" },
          ]}
        />
      )}
    </>
  );
}
