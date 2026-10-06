"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/shell";
import { Avatar, Card, CardHeader, Segmented } from "@/components/ui";
import { ReefMap, type MapPoint } from "@/components/map";
import { Table } from "@/components/admin/table";
import { useData } from "@/lib/demo/hooks";
import { DOORS, DOOR_SOURCE, territoryOfDoor } from "@/lib/demo/seed";
import { DOOR_OUTCOMES, type DoorOutcome } from "@/lib/demo/types";
import { money, pct, shiftDate } from "@/lib/demo/util";

type R = "7" | "30" | "all";

export default function Canvassing() {
  const { d, ix } = useData()!;
  const [rep, setRep] = useState("");
  const [range, setRange] = useState<R>("30");
  const since = range === "all" ? "0000" : shiftDate(d.today, -Number(range) + 1);
  const latest = useMemo(() => {
    const m = new Map<number, (typeof d.doorVisits)[number]>();
    d.doorVisits.forEach((v) => {
      const cur = m.get(v.doorId);
      if (!cur || v.at > cur.at) m.set(v.doorId, v);
    });
    return m;
  }, [d]);
  const points: MapPoint[] = useMemo(
    () =>
      DOORS.filter((door) => !rep || territoryOfDoor(door).salespersonId === rep).map((door) => {
        const v = latest.get(door.id);
        return { id: door.id, lng: door.lng, lat: door.lat, color: v ? DOOR_OUTCOMES[v.outcome].color : "#cbd5e1" };
      }),
    [latest, rep],
  );
  const reps = d.employees.filter((e) => e.role === "sales");
  const visits = d.doorVisits.filter((v) => v.at.slice(0, 10) >= since);

  return (
    <>
      <PageHeader
        title="Canvassing"
        sub="Every door, every knock, by territory"
        actions={
          <>
            <Segmented size="sm" value={rep} onChange={setRep} options={[{ value: "", label: "All reps" }, ...reps.map((r) => ({ value: r.id, label: r.name.split(" ")[0]! }))]} />
            <Segmented size="sm" value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "all", label: "All" }]} />
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <ReefMap className="h-[520px] w-full" points={points} polygons={d.territories.map((t) => ({ id: t.id, ring: t.polygon, color: t.color, dim: !!rep && t.salespersonId !== rep }))} />
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line px-4 py-3 text-[12px] text-muted">
            {(Object.keys(DOOR_OUTCOMES) as DoorOutcome[]).map((o) => (
              <span key={o} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: DOOR_OUTCOMES[o].color }} /> {DOOR_OUTCOMES[o].label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#cbd5e1]" /> Not knocked
            </span>
          </div>
          <p className="border-t border-line px-4 py-2 text-[11px] text-subtle">{DOOR_SOURCE}</p>
        </Card>
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Territories" />
            <Table
              head={["Territory", "Doors", "Knocked", "Coverage"]}
              rows={d.territories.map((t) => {
                const doors = DOORS.filter((dr) => territoryOfDoor(dr).id === t.id);
                const knocked = doors.filter((dr) => latest.has(dr.id)).length;
                const r = ix.employee.get(t.salespersonId)!;
                return [
                  <span key="t" className="flex items-center gap-2">
                    <Avatar name={r.name} color={r.color} size={22} /> {t.name}
                  </span>,
                  doors.length,
                  knocked,
                  pct(knocked / doors.length),
                ];
              })}
            />
          </Card>
          <Card>
            <CardHeader title="Rep performance" sub={range === "all" ? "All time" : `Last ${range} days`} />
            <Table
              head={["Rep", "Knocks", "Talks", "Booked", "Close", "Booked $"]}
              rows={reps.map((r) => {
                const v = visits.filter((x) => x.salespersonId === r.id);
                const conv = v.filter((x) => x.conversation).length;
                const b = v.filter((x) => x.outcome === "booked");
                return [r.name.split(" ")[0], v.length, conv, b.length, pct(conv ? b.length / conv : null), money(b.reduce((s, x) => s + (x.bookedValue ?? 0), 0), { whole: true })];
              })}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
