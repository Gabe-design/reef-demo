"use client";

import { useState } from "react";
import { ArrowCounterClockwise, Check, DownloadSimple, Minus } from "@phosphor-icons/react";
import { PageHeader } from "@/components/admin/shell";
import { Button, Card, CardHeader, Segmented } from "@/components/ui";
import { useData, useMe } from "@/lib/demo/hooks";
import { useDemo } from "@/lib/demo/store";
import { MINIMUM_VISIT, PLAN_DISCOUNT, REFERRAL_POLICY } from "@/lib/demo/catalog";
import { download } from "@/lib/demo/csv";
import { CADENCE, type PlanCadence } from "@/lib/demo/types";
import { money, businessNow } from "@/lib/demo/util";

const PERMS: [string, string, string, string, string, string][] = [
  ["CRM records", "All", "All operational", "Assigned leads", "Assigned job contact only", "Own account"],
  ["Prices and estimates", "All", "Manage", "Within discount limits", "Scope only, no prices", "Own estimates"],
  ["Schedule and routes", "All", "Dispatch", "Book for own prospects", "Own route", "Own bookings"],
  ["Invoices and payments", "All", "Collect", "Send payment link", "None", "Own invoices"],
  ["Refunds and credit changes", "All", "Delegated limit", "None", "None", "Request only"],
  ["Territories and door map", "All", "Assign", "Own territory", "None", "None"],
  ["Hours and commissions", "All", "Approve", "Own", "Own", "None"],
  ["Company KPIs, exports, settings", "All", "Scoped reports", "Own stats", "Own stats", "Own data export"],
];

export default function Settings() {
  const { d } = useData()!;
  const me = useMe();
  const reset = useDemo((s) => s.reset);
  const toast = useDemo((s) => s.toast);
  const [reward, setReward] = useState(String(REFERRAL_POLICY.reward));
  const owner = me?.kind === "staff" && me.employee.role === "owner";

  return (
    <>
      <PageHeader title="Settings" sub="Prices, policies, permissions and data" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Price book" sub="Version 1 · changes never rewrite past invoices" />
          <table className="w-full text-[13.5px]">
            <tbody>
              {d.services
                .filter((s) => s.id !== "callout")
                .map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-5 py-2.5">
                      <p className="text-ink">{s.name}</p>
                      <p className="text-[12px] text-muted">{s.description}</p>
                    </td>
                    <td className="num px-5 py-2.5 text-right whitespace-nowrap text-ink">
                      {money(s.rate)} <span className="text-muted">/ {s.unit}</span>
                    </td>
                  </tr>
                ))}
              <tr className="border-t border-line">
                <td className="px-5 py-2.5 text-ink">Minimum visit</td>
                <td className="num px-5 py-2.5 text-right text-ink">{money(MINIMUM_VISIT)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Plan discounts" />
            <div className="grid grid-cols-3 gap-2 border-t border-line p-4">
              {(["quarterly", "semiannual", "annual"] as PlanCadence[]).map((c) => (
                <div key={c} className="rounded-xl bg-canvas p-3 text-center">
                  <p className="text-[12.5px] text-muted">{CADENCE[c].label}</p>
                  <p className="num font-display text-xl font-semibold text-ink">{Math.round(PLAN_DISCOUNT[c] * 100)}%</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Reef Credit policy" sub="Saved as a new policy version. Earlier credit keeps its original terms." />
            <div className="flex flex-wrap items-center gap-3 border-t border-line p-4 text-[13.5px]">
              <span className="text-muted">Reward per referral</span>
              <Segmented size="sm" value={reward} onChange={setReward} options={REFERRAL_POLICY.options.map((o) => ({ value: String(o), label: money(o, { whole: true }) }))} />
              <span className="text-muted">· expires after {REFERRAL_POLICY.expiryMonths} months</span>
            </div>
          </Card>
          <Card>
            <CardHeader title="Business" />
            <dl className="grid grid-cols-2 gap-y-2 border-t border-line p-4 text-[13.5px]">
              <dt className="text-muted">Timezone</dt>
              <dd className="text-ink">America/Los_Angeles</dd>
              <dt className="text-muted">Currency</dt>
              <dd className="text-ink">USD</dd>
              <dt className="text-muted">Payments</dt>
              <dd className="text-ink">Stripe</dd>
              <dt className="text-muted">Texting</dt>
              <dd className="text-ink">Twilio</dd>
              <dt className="text-muted">Backups</dt>
              <dd className="text-ink">Nightly + point-in-time, 35 days</dd>
            </dl>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader title="Who can see what" sub="Checked on the server for every request, not just hidden in the app" />
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="text-[12px] text-muted">
                {["", "Owner", "Manager", "Sales", "Crew", "Customer"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMS.map((row) => (
                <tr key={row[0]} className="border-t border-line">
                  {row.map((cell, i) => (
                    <td key={i} className={i === 0 ? "px-4 py-2.5 font-medium text-ink" : "px-4 py-2.5 text-muted"}>
                      {i > 0 && cell === "None" ? (
                        <Minus size={14} className="text-subtle" />
                      ) : i > 0 && cell === "All" ? (
                        <span className="inline-flex items-center gap-1 text-ok">
                          <Check size={14} weight="bold" /> All
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader title="Data" sub="Everything Reef owns, exportable any time" />
        <div className="flex flex-wrap gap-2 border-t border-line p-4">
          <Button
            variant="outline"
            disabled={!owner}
            onClick={() => {
              const { automations: _a, ...rest } = d;
              void _a;
              download(`reef-export-${d.today}.json`, JSON.stringify({ exportedAt: businessNow(), schemaVersion: 1, ...rest }, null, 2), "application/json");
            }}
          >
            <DownloadSimple size={16} /> Full export (JSON)
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              toast({ kind: "info", title: "Demo reset", body: "All sample data is back to its starting state." });
            }}
          >
            <ArrowCounterClockwise size={16} /> Reset demo data
          </Button>
          {!owner && <p className="w-full text-[12.5px] text-muted">Full exports are owner-only.</p>}
        </div>
      </Card>
    </>
  );
}
