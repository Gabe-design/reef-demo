"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/admin/shell";
import { Avatar, Badge, Card, CardHeader } from "@/components/ui";
import { Table } from "@/components/admin/table";
import { useData } from "@/lib/demo/hooks";
import { toMin } from "@/lib/demo/select";
import { ROLE_LABEL } from "@/lib/demo/roles";
import { fmtDate, money, shiftDate, businessNow } from "@/lib/demo/util";

export default function Team() {
  const { d, ix } = useData()!;
  const weekStart = useMemo(() => {
    let x = d.today;
    while (fmtDate(x, "EEEE") !== "Monday") x = shiftDate(x, -1);
    return x;
  }, [d.today]);
  const now = businessNow().slice(11, 16);
  const hours = (id: string, from: string) =>
    d.timeEntries.filter((t) => t.employeeId === id && t.date >= from && t.kind === "field").reduce((s, t) => s + toMin(t.end ?? now) - toMin(t.start), 0) / 60;
  const pending = d.timeEntries.filter((t) => !t.approved && t.date < d.today && t.kind === "field");

  return (
    <>
      <PageHeader title="Team" sub="People, crews, hours and commissions" />
      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {d.employees.map((e) => {
          const clocked = d.timeEntries.some((t) => t.employeeId === e.id && t.date === d.today && !t.end);
          return (
            <Card key={e.id} className="flex items-center gap-3 p-4">
              <Avatar name={e.name} color={e.color} size={42} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{e.name}</p>
                <p className="truncate text-[12.5px] text-muted">
                  {e.title}
                  {e.crewId ? ` · ${ix.crew.get(e.crewId)?.vehicle}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone={e.role === "owner" ? "navy" : e.role === "manager" ? "violet" : e.role === "sales" ? "sky" : "neutral"}>{ROLE_LABEL[e.role]}</Badge>
                {e.role === "worker" && <span className={`text-[11.5px] ${clocked ? "text-ok" : "text-subtle"}`}>{clocked ? "On the clock" : "Off"}</span>}
              </div>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Hours" sub={`${pending.length} past entries waiting for approval`} />
          <Table
            head={["Crew member", "This week", "Last week", "Rate", "Est. pay this week"]}
            rows={d.employees
              .filter((e) => e.role === "worker")
              .map((e) => {
                const tw = hours(e.id, weekStart);
                const lw = hours(e.id, shiftDate(weekStart, -7)) - tw;
                return [e.name, `${tw.toFixed(1)}h`, `${lw.toFixed(1)}h`, money(e.hourlyRate ?? 0), money(tw * (e.hourlyRate ?? 0), { whole: true })];
              })}
          />
        </Card>
        <Card>
          <CardHeader title="Commissions" sub="10% of a new customer's first paid cleaning" />
          <Table
            head={["Rep", "Pending", "Earned", "Paid out"]}
            rows={d.employees
              .filter((e) => e.role === "sales")
              .map((e) => {
                const c = d.commissions.filter((x) => x.employeeId === e.id);
                const sum = (s: string) => money(c.filter((x) => x.status === s).reduce((t, x) => t + x.amount, 0), { whole: true });
                return [e.name, sum("pending"), sum("earned"), sum("paid")];
              })}
          />
        </Card>
      </div>
    </>
  );
}
