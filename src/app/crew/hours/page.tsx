"use client";

import { useMemo } from "react";
import { CheckCircle, HourglassMedium } from "@phosphor-icons/react";
import { Card, StatTile } from "@/components/ui";
import { useData, useMe } from "@/lib/demo/hooks";
import { toMin } from "@/lib/demo/select";
import { fmtDate, fmtTime, money, shiftDate, businessNow } from "@/lib/demo/util";

export default function CrewHours() {
  const data = useData();
  const me = useMe();
  const empId = me?.kind === "staff" ? me.employee.id : "";
  const entries = useMemo(() => (data ? data.d.timeEntries.filter((t) => t.employeeId === empId) : []), [data, empId]);
  if (!data || me?.kind !== "staff") return null;
  const { d } = data;
  const now = businessNow().slice(11, 16);
  const mins = (t: (typeof entries)[number]) => (t.kind === "break" ? 0 : toMin(t.end ?? now) - toMin(t.start));

  const days = [...Array(14).keys()].map((k) => shiftDate(d.today, -k)).filter((day) => entries.some((t) => t.date === day));
  const weekStart = (() => {
    let x = d.today;
    while (fmtDate(x, "EEEE") !== "Monday") x = shiftDate(x, -1);
    return x;
  })();
  const thisWeek = entries.filter((t) => t.date >= weekStart).reduce((s, t) => s + mins(t), 0);
  const lastWeek = entries.filter((t) => t.date < weekStart && t.date >= shiftDate(weekStart, -7)).reduce((s, t) => s + mins(t), 0);
  const rate = me.employee.hourlyRate ?? 0;
  const jobsDone = d.jobs.filter((j) => j.assigneeIds.includes(empId) && j.status === "completed" && j.date >= weekStart).length;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold text-ink">Hours</h1>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="This week" value={`${(thisWeek / 60).toFixed(1)}h`} sub={`${jobsDone} jobs completed`} />
        <StatTile label="Est. pay this week" value={money((thisWeek / 60) * rate, { whole: true })} sub={`${money(rate)}/hr · before taxes`} />
        <StatTile label="Last week" value={`${(lastWeek / 60).toFixed(1)}h`} sub="Approved by Dana" tone="ok" />
        <StatTile label="Commission" value="$0" sub="No crew commission rule set" />
      </div>
      <Card>
        <ul className="divide-y divide-line">
          {days.map((day) => {
            const list = entries.filter((t) => t.date === day).sort((a, b) => a.start.localeCompare(b.start));
            const total = list.reduce((s, t) => s + mins(t), 0);
            const approved = list.every((t) => t.approved);
            return (
              <li key={day} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-medium text-ink">{day === d.today ? "Today" : fmtDate(day, "EEE, MMM d")}</p>
                  <p className="num text-[14px] font-medium text-ink">{(total / 60).toFixed(2)}h</p>
                </div>
                <div className="mt-1 flex items-center justify-between text-[12.5px] text-muted">
                  <span className="num">
                    {list
                      .filter((t) => t.kind !== "break")
                      .map((t) => `${fmtTime(t.start)}-${t.end ? fmtTime(t.end) : "now"}`)
                      .join(", ")}
                  </span>
                  <span className={`inline-flex items-center gap-1 ${approved ? "text-ok" : "text-warn"}`}>
                    {approved ? <CheckCircle size={13} weight="fill" /> : <HourglassMedium size={13} />} {approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      <p className="px-1 text-[12px] text-subtle">Edits to past days need a reason and manager approval.</p>
    </div>
  );
}
