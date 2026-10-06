"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/shell";
import { ListTable } from "@/components/admin/list";
import { Badge, Segmented } from "@/components/ui";
import { useData } from "@/lib/demo/hooks";
import { JOB_TONE } from "@/lib/demo/labels";
import { fmtDate, money, shiftDate } from "@/lib/demo/util";

type F = "upcoming" | "today" | "completed" | "all";

export default function Jobs() {
  const { d, ix } = useData()!;
  const [f, setF] = useState<F>("upcoming");
  const rows = useMemo(() => {
    const list = d.jobs.filter((j) =>
      f === "today" ? j.date === d.today : f === "upcoming" ? j.status !== "completed" && j.status !== "cancelled" : f === "completed" ? j.status === "completed" && j.date >= shiftDate(d.today, -90) : true,
    );
    return list.map((j) => ({ j, c: ix.customer.get(j.customerId)!, p: ix.property.get(j.propertyId)! }));
  }, [d, ix, f]);
  return (
    <>
      <PageHeader title="Jobs" sub="Every cleaning, from booked to paid" />
      <ListTable
        rows={rows}
        search={(r) => `${r.j.number} ${r.c.name} ${r.p.street} ${r.p.neighborhood}`}
        href={(r) => `/admin/job/?id=${r.j.id}`}
        exportName="reef-jobs"
        initialSort={{ key: "date", dir: f === "completed" ? -1 : 1 }}
        toolbar={<Segmented size="sm" value={f} onChange={setF} options={[{ value: "upcoming", label: "Open" }, { value: "today", label: "Today" }, { value: "completed", label: "Done (90d)" }, { value: "all", label: "All" }]} />}
        cols={[
          { key: "num", label: "Job", render: (r) => `${r.j.number} · ${r.c.name}`, sort: (r) => r.j.number, csv: (r) => r.j.number },
          { key: "date", label: "Date", render: (r) => (r.j.date ? fmtDate(r.j.date, "EEE MMM d") : "Unscheduled"), sort: (r) => r.j.date || "0000", csv: (r) => r.j.date },
          { key: "hood", label: "Neighborhood", render: (r) => r.p.neighborhood, sort: (r) => r.p.neighborhood, hideOnMobile: true },
          { key: "crew", label: "Crew", render: (r) => (r.j.crewId ? ix.crew.get(r.j.crewId)?.name : "-"), sort: (r) => r.j.crewId ?? "" },
          { key: "status", label: "Status", render: (r) => <Badge tone={JOB_TONE[r.j.status].tone}>{JOB_TONE[r.j.status].label}</Badge>, sort: (r) => r.j.status, csv: (r) => r.j.status },
          { key: "total", label: "Total", render: (r) => money(r.j.total), sort: (r) => r.j.total, csv: (r) => (r.j.total / 100).toFixed(2), align: "right" },
        ]}
      />
    </>
  );
}
