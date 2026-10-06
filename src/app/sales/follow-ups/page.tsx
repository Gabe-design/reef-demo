"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CaretRight, Funnel } from "@phosphor-icons/react";
import { Badge, Card } from "@/components/ui";
import { useData, useMe } from "@/lib/demo/hooks";
import { DOORS } from "@/lib/demo/seed";
import { DOOR_OUTCOMES, LEAD_STAGES } from "@/lib/demo/types";
import { STAGE_TONE } from "@/lib/demo/labels";
import { fmtAgo, money, businessNow } from "@/lib/demo/util";

export default function SalesFollowUps() {
  const data = useData();
  const me = useMe();
  const id = me?.kind === "staff" ? me.employee.id : "";
  const doors = useMemo(() => {
    if (!data) return [];
    const latest = new Map<number, (typeof data.d.doorVisits)[number]>();
    data.d.doorVisits.forEach((v) => {
      const cur = latest.get(v.doorId);
      if (!cur || v.at > cur.at) latest.set(v.doorId, v);
    });
    return [...latest.values()]
      .filter((v) => v.salespersonId === id && ["follow_up", "interested", "estimate_given"].includes(v.outcome))
      .sort((a, b) => (a.at < b.at ? -1 : 1));
  }, [data, id]);
  if (!data || me?.kind !== "staff") return null;
  const leads = data.d.leads.filter((l) => l.ownerId === id && !["won", "lost"].includes(l.stage));
  const now = businessNow();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-ink">Follow-ups</h1>
      {leads.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-muted">
            <Funnel size={14} /> My leads
          </h2>
          <Card className="divide-y divide-line">
            {leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{l.name}</p>
                  <p className="truncate text-[12.5px] text-muted">
                    {l.nextAction} · {money(l.estimateValue, { whole: true })}
                  </p>
                </div>
                <Badge tone={STAGE_TONE[l.stage]}>{LEAD_STAGES.find((s) => s.id === l.stage)?.label}</Badge>
              </div>
            ))}
          </Card>
        </section>
      )}
      <section>
        <h2 className="mb-2 text-[13px] font-medium text-muted">Doors to revisit ({doors.length})</h2>
        <Card className="divide-y divide-line">
          {doors.slice(0, 60).map((v) => {
            const door = DOORS[v.doorId]!;
            return (
              <Link key={v.id} href={`/sales/?door=${v.doorId}`} className="flex items-center gap-3 px-4 py-3">
                <span className="size-3 shrink-0 rounded-full" style={{ background: DOOR_OUTCOMES[v.outcome].color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">
                    {door.number} {door.street}
                  </p>
                  <p className="truncate text-[12.5px] text-muted">
                    {DOOR_OUTCOMES[v.outcome].label} {fmtAgo(v.at, now)}
                    {v.note ? ` · ${v.note}` : ""}
                  </p>
                </div>
                <CaretRight size={16} className="text-subtle" />
              </Link>
            );
          })}
        </Card>
      </section>
    </div>
  );
}
