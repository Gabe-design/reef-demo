"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/shell";
import { ListTable } from "@/components/admin/list";
import { Badge, Segmented } from "@/components/ui";
import { useData } from "@/lib/demo/hooks";
import { CADENCE, LEAD_SOURCES } from "@/lib/demo/types";
import { fmtDate, money } from "@/lib/demo/util";

type F = "all" | "plan" | "no_plan" | "commercial";

export default function Customers() {
  const { d, ix } = useData()!;
  const [f, setF] = useState<F>("all");
  const rows = useMemo(
    () =>
      d.customers.map((c) => {
        const jobs = ix.jobsByCustomer.get(c.id) ?? [];
        const done = jobs.filter((j) => j.status === "completed").sort((a, b) => (a.date < b.date ? 1 : -1));
        const upcoming = jobs.filter((j) => j.status === "scheduled" && j.date >= d.today).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
        const plan = (ix.plansByCustomer.get(c.id) ?? []).find((p) => p.status === "active" || p.status === "paused");
        const fu = d.followUps.filter((x) => x.customerId === c.id && !x.done).sort((a, b) => (a.due < b.due ? -1 : 1))[0];
        const prop = (ix.propertiesByCustomer.get(c.id) ?? [])[0];
        return {
          c,
          prop,
          plan,
          last: done[0]?.date,
          next: upcoming?.date ?? plan?.nextDate,
          followUp: fu?.due,
          ltv: (ix.paymentsByCustomer.get(c.id) ?? []).filter((p) => p.status === "succeeded").reduce((s, p) => s + p.amount, 0),
        };
      }),
    [d, ix],
  );
  const filtered = rows.filter((r) => (f === "plan" ? r.plan : f === "no_plan" ? !r.plan && r.c.kind === "residential" : f === "commercial" ? r.c.kind === "commercial" : true));

  return (
    <>
      <PageHeader title="Customers" sub={`${d.customers.length} accounts · ${rows.filter((r) => r.plan).length} on a plan`} />
      <ListTable
        rows={filtered}
        search={(r) => `${r.c.name} ${r.c.phone} ${r.prop?.street} ${r.prop?.neighborhood}`}
        href={(r) => `/admin/customer/?id=${r.c.id}`}
        exportName="reef-customers"
        initialSort={{ key: "ltv", dir: -1 }}
        toolbar={<Segmented size="sm" value={f} onChange={setF} options={[{ value: "all", label: "All" }, { value: "plan", label: "On a plan" }, { value: "no_plan", label: "No plan" }, { value: "commercial", label: "Commercial" }]} />}
        cols={[
          { key: "name", label: "Customer", render: (r) => r.c.name, sort: (r) => r.c.name, csv: (r) => r.c.name },
          { key: "hood", label: "Neighborhood", render: (r) => r.prop?.neighborhood, sort: (r) => r.prop?.neighborhood ?? "" },
          {
            key: "plan",
            label: "Plan",
            render: (r) => (r.plan ? <Badge tone={r.plan.status === "active" ? "ok" : "warn"}>{CADENCE[r.plan.cadence].short}{r.plan.status === "paused" ? " · paused" : ""}</Badge> : <span className="text-subtle">None</span>),
            csv: (r) => r.plan?.cadence ?? "",
          },
          { key: "last", label: "Last service", render: (r) => (r.last ? fmtDate(r.last, "MMM d, yyyy") : "-"), sort: (r) => r.last ?? "", hideOnMobile: true },
          {
            key: "next",
            label: "Next",
            render: (r) => (r.next ? fmtDate(r.next, "MMM d") : r.followUp ? <span className={r.followUp < d.today ? "text-bad" : "text-muted"}>Follow up {fmtDate(r.followUp, "MMM d")}</span> : <span className="text-bad">No follow-up</span>),
            sort: (r) => r.next ?? r.followUp ?? "",
          },
          { key: "source", label: "Source", render: (r) => LEAD_SOURCES[r.c.source], sort: (r) => r.c.source, hideOnMobile: true },
          { key: "ltv", label: "Lifetime", render: (r) => money(r.ltv, { whole: true }), sort: (r) => r.ltv, csv: (r) => (r.ltv / 100).toFixed(2), align: "right" },
        ]}
      />
    </>
  );
}
