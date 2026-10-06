"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CaretLeft, CaretRight, CloudRain, Warning } from "@phosphor-icons/react";
import { PageHeader } from "@/components/admin/shell";
import { Badge, Button, Card, Field, Segmented, Select, Sheet } from "@/components/ui";
import { ReefMap } from "@/components/map";
import { SlotPicker } from "@/components/booking-form";
import { useData, useDispatch } from "@/lib/demo/hooks";
import { JOB_TONE } from "@/lib/demo/labels";
import type { Job } from "@/lib/demo/types";
import { fmtDate, fmtTime, money, relDay, shiftDate } from "@/lib/demo/util";

type View = "day" | "week" | "map";

export default function Schedule() {
  const { d, ix } = useData()!;
  const dispatch = useDispatch();
  const router = useRouter();
  const [date, setDate] = useState(d.today);
  const [view, setView] = useState<View>("day");
  const [assign, setAssign] = useState<Job | null>(null);
  const [weather, setWeather] = useState(false);

  const dayJobs = useMemo(() => d.jobs.filter((j) => j.date === date && j.status !== "cancelled"), [d.jobs, date]);
  const queue = d.jobs.filter((j) => j.status === "ready_to_schedule");
  const issues = dayJobs.flatMap((j) => j.issues.filter((i) => !i.resolved).map((i) => ({ i, j })));

  return (
    <>
      <PageHeader
        title="Schedule"
        sub="Dispatch crews, publish routes and handle changes"
        actions={<Segmented value={view} onChange={setView} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "map", label: "Map" }]} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setDate(shiftDate(date, view === "week" ? -7 : -1))} aria-label="Previous">
          <CaretLeft size={14} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDate(d.today)}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDate(shiftDate(date, view === "week" ? 7 : 1))} aria-label="Next">
          <CaretRight size={14} />
        </Button>
        <p className="ml-1 font-display text-lg font-semibold text-ink">{view === "week" ? `Week of ${fmtDate(date, "MMM d")}` : `${relDay(date, d.today)}${date !== d.today ? "" : ""}, ${fmtDate(date, "EEE MMM d")}`}</p>
        <span className="text-[13px] text-muted">
          {dayJobs.length} jobs · {money(dayJobs.reduce((s, j) => s + j.total, 0), { whole: true })}
        </span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setWeather(true)}>
          <CloudRain size={15} /> Weather delay
        </Button>
      </div>

      {issues.length > 0 && (
        <div className="mb-4 rounded-2xl border border-warn/30 bg-warn-bg p-3 text-[13.5px] text-ink">
          {issues.map(({ i, j }) => (
            <p key={i.id} className="flex items-start gap-2">
              <Warning size={16} className="mt-0.5 shrink-0 text-warn" />
              <Link href={`/admin/job/?id=${j.id}`} className="font-medium hover:underline">
                {j.number}
              </Link>
              <span className="capitalize">{i.kind}:</span> {i.body}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        {view === "day" && (
          <div className="grid gap-3 md:grid-cols-3">
            {d.crews.map((crew) => {
              const js = dayJobs.filter((j) => j.crewId === crew.id).sort((a, b) => a.arrivalStart.localeCompare(b.arrivalStart));
              const mins = js.reduce((s, j) => s + j.durationMin, 0);
              return (
                <div key={crew.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 ring-1 ring-line">
                    <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
                      <span className="size-2.5 rounded-full" style={{ background: crew.color }} /> {crew.name}
                    </span>
                    <span className="num text-[12px] text-muted">
                      {js.length} stops · {(mins / 60).toFixed(1)}h
                    </span>
                  </div>
                  <p className="px-1 text-[12px] text-muted">{crew.memberIds.map((m) => ix.employee.get(m)?.name.split(" ")[0]).join(", ")} · {crew.vehicle}</p>
                  {js.map((j) => {
                    const c = ix.customer.get(j.customerId)!;
                    const p = ix.property.get(j.propertyId)!;
                    return (
                      <Link
                        key={j.id}
                        href={`/admin/job/?id=${j.id}`}
                        className={clsx("rounded-xl border-l-4 bg-white p-3 shadow-[0_1px_2px_rgb(3_37_65/0.06)] transition hover:shadow-soft", j.status === "completed" && "opacity-65")}
                        style={{ borderLeftColor: crew.color }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="num text-[12.5px] font-medium text-muted">
                            {fmtTime(j.arrivalStart)}-{fmtTime(j.arrivalEnd)}
                          </span>
                          <Badge tone={JOB_TONE[j.status].tone}>{JOB_TONE[j.status].label}</Badge>
                        </div>
                        <p className="mt-1 truncate text-[14px] font-medium text-ink">{c.name}</p>
                        <p className="truncate text-[12.5px] text-muted">
                          {p.street} · {p.neighborhood}
                        </p>
                        <p className="num mt-1 text-[12px] text-subtle">
                          ~{j.durationMin} min · {money(j.total, { whole: true })}
                          {j.planId ? " · plan" : ""}
                        </p>
                      </Link>
                    );
                  })}
                  {!js.length && <p className="rounded-xl border border-dashed border-line p-4 text-center text-[13px] text-subtle">Nothing scheduled</p>}
                </div>
              );
            })}
          </div>
        )}

        {view === "week" && (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th className="px-3 py-2.5 text-left font-medium">Crew</th>
                  {[...Array(7).keys()].map((k) => {
                    const day = shiftDate(date, k);
                    return (
                      <th key={k} className={clsx("px-2 py-2.5 text-center font-medium", day === d.today && "text-navy-900")}>
                        {fmtDate(day, "EEE d")}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {d.crews.map((crew) => (
                  <tr key={crew.id} className="border-t border-line">
                    <td className="px-3 py-3 font-medium whitespace-nowrap text-ink">
                      <span className="mr-2 inline-block size-2.5 rounded-full" style={{ background: crew.color }} />
                      {crew.name}
                    </td>
                    {[...Array(7).keys()].map((k) => {
                      const day = shiftDate(date, k);
                      const js = d.jobs.filter((j) => j.date === day && j.crewId === crew.id && j.status !== "cancelled");
                      const hrs = js.reduce((s, j) => s + j.durationMin, 0) / 60;
                      return (
                        <td key={k} className="px-2 py-2 text-center">
                          <button
                            onClick={() => {
                              setDate(day);
                              setView("day");
                            }}
                            className={clsx("w-full rounded-lg px-1 py-2", js.length ? "bg-sky-50 hover:bg-sky-100" : "text-subtle")}
                          >
                            <span className="num block font-medium text-ink">{js.length || "-"}</span>
                            {js.length > 0 && <span className="num block text-[11px] text-muted">{hrs.toFixed(1)}h</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {view === "map" && (
          <Card className="overflow-hidden">
            <ReefMap
              className="h-[560px] w-full"
              points={dayJobs.map((j) => {
                const p = ix.property.get(j.propertyId)!;
                return { id: j.id, lng: p.lng, lat: p.lat, color: ix.crew.get(j.crewId ?? "")?.color ?? "#032541" };
              })}
              onPointClick={(id) => router.push(`/admin/job/?id=${id}`)}
            />
            <div className="flex flex-wrap gap-4 border-t border-line px-4 py-3 text-[12.5px] text-muted">
              {d.crews.map((c) => (
                <span key={c.id} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ background: c.color }} /> {c.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          <Card>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="font-display text-[15px] font-semibold text-ink">Unscheduled</p>
              <Badge tone={queue.length ? "warn" : "ok"}>{queue.length}</Badge>
            </div>
            <div className="flex flex-col gap-2 px-3 pb-3">
              {queue.map((j) => {
                const c = ix.customer.get(j.customerId)!;
                const p = ix.property.get(j.propertyId)!;
                return (
                  <div key={j.id} className="rounded-xl bg-canvas p-3">
                    <p className="text-[13.5px] font-medium text-ink">{c.name}</p>
                    <p className="text-[12.5px] text-muted">
                      {p.neighborhood} · ~{j.durationMin} min · {money(j.total, { whole: true })}
                    </p>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => setAssign(j)}>
                      Schedule
                    </Button>
                  </div>
                );
              })}
              {!queue.length && <p className="px-1 pb-2 text-[13px] text-muted">Everything accepted is on the calendar.</p>}
            </div>
          </Card>
          <Card className="p-4 text-[12.5px] text-muted">
            Customers see a 2-hour arrival window. Crew time is booked by job length plus travel, and a crew can&apos;t be double-booked.
          </Card>
        </div>
      </div>

      {assign && <AssignSheet job={assign} onClose={() => setAssign(null)} onSave={(dt, crewId, slot) => dispatch({ t: "job.schedule", jobId: assign.id, date: dt, crewId, arrivalStart: slot[0], arrivalEnd: slot[1] })} />}
      {weather && (
        <Sheet open onClose={() => setWeather(false)} title="Weather delay">
          <p className="text-[14px] text-ink">
            Move every unstarted job on {fmtDate(date, "EEE MMM d")} to the next open day and text each customer the new time? Customers can reply to pick a different day.
          </p>
          <p className="mt-2 text-[13px] text-muted">{dayJobs.filter((j) => j.status === "scheduled").length} jobs would move. Completed and in-progress jobs stay put.</p>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                const next = shiftDate(date, fmtDate(date, "EEEE") === "Saturday" ? 2 : 1);
                dayJobs.filter((j) => j.status === "scheduled").forEach((j) => dispatch({ t: "job.schedule", jobId: j.id, date: next, crewId: j.crewId ?? "c_kelp", arrivalStart: j.arrivalStart, arrivalEnd: j.arrivalEnd }, { silent: true }));
                setWeather(false);
              }}
            >
              Move and notify
            </Button>
            <Button variant="ghost" onClick={() => setWeather(false)}>
              Cancel
            </Button>
          </div>
        </Sheet>
      )}
    </>
  );
}

function AssignSheet({ job, onClose, onSave }: { job: Job; onClose: () => void; onSave: (date: string, crewId: string, slot: [string, string]) => void }) {
  const { d, ix } = useData()!;
  const [crewId, setCrewId] = useState("c_kelp");
  const [when, setWhen] = useState<{ date: string; slot: [string, string] | null }>({ date: "", slot: null });
  return (
    <Sheet open onClose={onClose} title={`Schedule ${ix.customer.get(job.customerId)?.name}`}>
      <div className="flex flex-col gap-4">
        <Field label="Crew">
          <Select value={crewId} onChange={(e) => setCrewId(e.target.value)}>
            {d.crews.filter((c) => c.id !== "c_tide").map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <SlotPicker d={d} crewId={crewId} value={when.date ? when : { date: d.today, slot: null }} onChange={setWhen} />
        <Button
          full
          disabled={!when.date || !when.slot}
          onClick={() => {
            onSave(when.date, crewId, when.slot!);
            onClose();
          }}
        >
          Book and text customer
        </Button>
      </div>
    </Sheet>
  );
}
