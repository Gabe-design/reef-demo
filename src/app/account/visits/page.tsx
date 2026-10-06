"use client";

import { useState } from "react";
import { Badge, Button, Card, Empty } from "@/components/ui";
import { BeforeAfter } from "@/components/portal";
import { RescheduleSheet } from "@/components/reschedule";
import { useData, useMe } from "@/lib/demo/hooks";
import { JOB_TONE } from "@/lib/demo/labels";
import { fmtDate, fmtWindow, money } from "@/lib/demo/util";
import { CalendarBlank } from "@phosphor-icons/react";

export default function Visits() {
  const data = useData()!;
  const me = useMe();
  const [reschedule, setReschedule] = useState<string | null>(null);
  if (me?.kind !== "customer") return null;
  const { d, ix } = data;
  const jobs = (ix.jobsByCustomer.get(me.customer.id) ?? []).filter((j) => j.date && j.status !== "cancelled");
  const upcoming = jobs.filter((j) => j.status !== "completed").sort((a, b) => (a.date < b.date ? -1 : 1));
  const past = jobs.filter((j) => j.status === "completed").sort((a, b) => (a.date < b.date ? 1 : -1));
  const svc = (id: string) => d.services.find((s) => s.id === id)?.short ?? id;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-light text-navy-900">Visits</h1>
      <section>
        <h2 className="mb-2 text-[13px] font-medium text-muted">Upcoming</h2>
        {upcoming.length ? (
          <div className="flex flex-col gap-2">
            {upcoming.map((j) => (
              <Card key={j.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-ink">
                    {fmtDate(j.date, "EEEE, MMMM d")} <span className="font-normal text-muted">· arriving {fmtWindow(j.arrivalStart, j.arrivalEnd)}</span>
                  </p>
                  <p className="text-[13.5px] text-muted">
                    {j.lines
                      .filter((l) => l.serviceId !== "callout")
                      .map((l) => svc(l.serviceId))
                      .join(", ")}{" "}
                    · {money(j.total)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={JOB_TONE[j.status].tone}>{j.status === "scheduled" ? "Confirmed" : JOB_TONE[j.status].label}</Badge>
                  {j.status === "scheduled" && (
                    <Button size="sm" variant="outline" onClick={() => setReschedule(j.id)}>
                      Reschedule
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Empty icon={<CalendarBlank size={22} />} title="No upcoming visits" body="Book online or reply to any Reef text to get on the schedule." />
          </Card>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-[13px] font-medium text-muted">History</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {past.map((j) => {
            const b = j.photos.find((p) => p.kind === "before");
            const a = j.photos.find((p) => p.kind === "after");
            const crew = j.assigneeIds.map((id) => d.employees.find((e) => e.id === id)?.name.split(" ")[0]).join(" & ");
            return (
              <Card key={j.id} className="overflow-hidden">
                {b && a && <BeforeAfter before={b} after={a} className="rounded-none" />}
                <div className="p-4">
                  <p className="font-medium text-ink">{fmtDate(j.date, "MMMM d, yyyy")}</p>
                  <p className="text-[13.5px] text-muted">
                    {crew} ·{" "}
                    {j.lines
                      .filter((l) => l.serviceId !== "callout")
                      .map((l) => `${svc(l.serviceId)} ${l.qty}`)
                      .join(", ")}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
      {reschedule && <RescheduleSheet jobId={reschedule} onClose={() => setReschedule(null)} />}
    </div>
  );
}
