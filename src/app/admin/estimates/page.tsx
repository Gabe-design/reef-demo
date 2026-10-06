"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/shell";
import { ListTable } from "@/components/admin/list";
import { Badge, Button, Segmented, Sheet, StatTile } from "@/components/ui";
import { useData, useDispatch } from "@/lib/demo/hooks";
import { ESTIMATE_TONE } from "@/lib/demo/labels";
import { CADENCE, type Estimate, type EstimateStatus } from "@/lib/demo/types";
import { fmtDate, lineTotal, money, pct } from "@/lib/demo/util";

export default function Estimates() {
  const { d, ix } = useData()!;
  const dispatch = useDispatch();
  const [f, setF] = useState<EstimateStatus | "all">("all");
  const [open, setOpen] = useState<Estimate | null>(null);
  const sent = d.estimates.filter((e) => e.sentAt);
  const accepted = sent.filter((e) => e.status === "accepted");
  const rows = d.estimates.filter((e) => f === "all" || e.status === f);
  const current = open ? d.estimates.find((e) => e.id === open.id)! : null;

  return (
    <>
      <PageHeader title="Estimates" sub="Versioned quotes. Prices are locked in once accepted." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Open" value={d.estimates.filter((e) => e.status === "sent").length} sub={money(d.estimates.filter((e) => e.status === "sent").reduce((s, e) => s + e.total, 0), { whole: true })} />
        <StatTile label="Close rate" value={pct(sent.length ? accepted.length / sent.length : null)} sub={`${accepted.length} of ${sent.length} sent`} />
        <StatTile label="Average estimate" value={money(sent.length ? sent.reduce((s, e) => s + e.total, 0) / sent.length : 0, { whole: true })} />
        <StatTile label="With a plan offer" value={pct(sent.length ? sent.filter((e) => e.planOffer).length / sent.length : null)} />
      </div>
      <ListTable
        rows={rows}
        search={(e) => `${e.number} ${e.name} ${e.propertyLabel}`}
        exportName="reef-estimates"
        initialSort={{ key: "sent", dir: -1 }}
        toolbar={<Segmented size="sm" value={f} onChange={setF} options={[{ value: "all", label: "All" }, { value: "sent", label: "Open" }, { value: "accepted", label: "Accepted" }, { value: "declined", label: "Declined" }, { value: "expired", label: "Expired" }]} />}
        cols={[
          {
            key: "num",
            label: "Estimate",
            render: (e) => (
              <button onClick={() => setOpen(e)} className="text-left font-medium text-ink hover:text-sky-700">
                {e.number} · {e.name}
              </button>
            ),
            sort: (e) => e.number,
            csv: (e) => e.number,
          },
          { key: "prop", label: "Property", render: (e) => e.propertyLabel, hideOnMobile: true },
          { key: "sent", label: "Sent", render: (e) => (e.sentAt ? fmtDate(e.sentAt, "MMM d") : "-"), sort: (e) => e.sentAt ?? "" },
          { key: "by", label: "By", render: (e) => ix.employee.get(e.createdById)?.name.split(" ")[0], hideOnMobile: true },
          { key: "status", label: "Status", render: (e) => <Badge tone={ESTIMATE_TONE[e.status].tone}>{ESTIMATE_TONE[e.status].label}</Badge>, sort: (e) => e.status, csv: (e) => e.status },
          { key: "total", label: "Total", render: (e) => money(e.total), sort: (e) => e.total, csv: (e) => (e.total / 100).toFixed(2), align: "right" },
        ]}
      />
      {current && (
        <Sheet open onClose={() => setOpen(null)} title={`${current.number} · revision ${current.revision}`}>
          <p className="text-[14px] text-ink">{current.name}</p>
          <p className="text-[13px] text-muted">{current.propertyLabel}</p>
          <div className="mt-4 rounded-2xl bg-canvas p-4 text-[13.5px]">
            {current.lines.map((l) => (
              <div key={l.serviceId} className="flex justify-between py-0.5">
                <span className="text-muted">
                  {d.services.find((s) => s.id === l.serviceId)?.name}
                  {l.serviceId !== "callout" ? ` × ${l.qty}` : ""}
                </span>
                <span className="num">{money(lineTotal(l))}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-medium">
              <span>Total</span>
              <span className="num">{money(current.total)}</span>
            </div>
            {current.planOffer && <p className="mt-2 text-[12.5px] text-sky-700">Includes an offer for a {CADENCE[current.planOffer].label.toLowerCase()} plan.</p>}
          </div>
          <p className="mt-3 text-[12.5px] text-muted">Expires {fmtDate(current.expiresOn, "MMM d, yyyy")}. Changes after acceptance need a new revision.</p>
          {current.status === "sent" && (
            <div className="mt-4 flex gap-2">
              <Button onClick={() => dispatch({ t: "estimate.status", estimateId: current.id, status: "accepted" }, { silent: true })}>Mark accepted</Button>
              <Button variant="ghost" onClick={() => dispatch({ t: "estimate.status", estimateId: current.id, status: "declined" }, { silent: true })}>
                Mark declined
              </Button>
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}
