"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, Segmented, StatTile } from "@/components/ui";
import { useData, useMe } from "@/lib/demo/hooks";
import { fmtDate, money, pct, shiftDate } from "@/lib/demo/util";

type R = "today" | "week" | "30d";

export default function SalesStats() {
  const data = useData();
  const me = useMe();
  const [range, setRange] = useState<R>("week");
  const id = me?.kind === "staff" ? me.employee.id : "";
  const stats = useMemo(() => {
    if (!data) return null;
    const { d } = data;
    const from = range === "today" ? d.today : range === "week" ? shiftDate(d.today, -6) : shiftDate(d.today, -29);
    const visits = d.doorVisits.filter((v) => v.salespersonId === id && v.at.slice(0, 10) >= from);
    const conv = visits.filter((v) => v.conversation).length;
    const booked = visits.filter((v) => v.outcome === "booked");
    const comm = d.commissions.filter((c) => c.employeeId === id);
    const days = [...Array(14).keys()].reverse().map((k) => {
      const day = shiftDate(d.today, -k);
      const vs = d.doorVisits.filter((v) => v.salespersonId === id && v.at.startsWith(day));
      return { day, doors: vs.length, booked: vs.filter((v) => v.outcome === "booked").length };
    });
    return {
      doors: visits.length,
      conv,
      estimates: visits.filter((v) => v.outcome === "estimate_given").length,
      booked: booked.length,
      bookedValue: booked.reduce((s, v) => s + (v.bookedValue ?? 0), 0),
      close: conv ? booked.length / conv : null,
      pending: comm.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0),
      earned: comm.filter((c) => c.status === "earned").reduce((s, c) => s + c.amount, 0),
      paid: comm.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0),
      days,
    };
  }, [data, id, range]);
  if (!stats || me?.kind !== "staff") return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">My stats</h1>
        <Segmented size="sm" value={range} onChange={setRange} options={[{ value: "today", label: "Today" }, { value: "week", label: "7 days" }, { value: "30d", label: "30 days" }]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Doors knocked" value={stats.doors} />
        <StatTile label="Conversations" value={stats.conv} sub={pct(stats.doors ? stats.conv / stats.doors : null) + " of doors"} />
        <StatTile label="Booked" value={stats.booked} sub={`${stats.estimates} estimates given`} />
        <StatTile label="Close rate" value={pct(stats.close)} sub="Booked ÷ conversations" />
        <StatTile label="Revenue booked" value={money(stats.bookedValue, { whole: true })} />
        <StatTile label="Commission" value={money(stats.pending + stats.earned, { whole: true })} sub={`${money(stats.pending, { whole: true })} pending · ${money(stats.earned, { whole: true })} earned`} />
      </div>
      <Card>
        <CardHeader title="Doors per day" sub="Last 14 days" />
        <div className="h-44 px-2 pb-3">
          <ResponsiveContainer>
            <BarChart data={stats.days} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="day" tickFormatter={(v) => fmtDate(v, "d")} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--color-navy-50)" }}
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div className="rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] shadow-soft">
                      <p className="font-medium text-ink">{fmtDate(String(payload[0].payload.day), "EEE, MMM d")}</p>
                      <p className="num text-muted">
                        {payload[0].payload.doors} doors · {payload[0].payload.booked} booked
                      </p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="doors" name="Doors" fill="#1e7aa6" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-4 text-[13.5px] text-muted">
        Commission is {pct(me.employee.commissionPct ?? 0)} of a customer&apos;s first paid cleaning. It&apos;s pending until the job is done and paid, then earned, then paid out every two weeks. {money(stats.paid, { whole: true })} paid out so far.
      </Card>
    </div>
  );
}
