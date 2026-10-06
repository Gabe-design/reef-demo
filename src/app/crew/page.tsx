"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import clsx from "clsx";
import { CaretRight, CheckCircle, NavigationArrow, Play, Stop, Timer } from "@phosphor-icons/react";
import { ReefMap } from "@/components/map";
import { Badge, Card } from "@/components/ui";
import { useData, useDispatch, useMe } from "@/lib/demo/hooks";
import { toMin } from "@/lib/demo/select";
import { fmtDate, fmtTime, fmtWindow, firstName, businessNow } from "@/lib/demo/util";
import { JOB_TONE } from "@/lib/demo/labels";

export default function CrewToday() {
  const data = useData();
  const me = useMe();
  const dispatch = useDispatch();
  const router = useRouter();
  const empId = me?.kind === "staff" ? me.employee.id : "";

  const jobs = useMemo(
    () =>
      data
        ? data.d.jobs
            .filter((j) => j.date === data.d.today && j.assigneeIds.includes(empId) && j.status !== "cancelled")
            .sort((a, b) => a.routeOrder - b.routeOrder || a.arrivalStart.localeCompare(b.arrivalStart))
        : [],
    [data, empId],
  );
  if (!data || !me || me.kind !== "staff") return null;
  const { d, ix } = data;
  const crew = d.crews.find((c) => c.id === me.employee.crewId);
  const done = jobs.filter((j) => j.status === "completed").length;
  const next = jobs.find((j) => j.status !== "completed");
  const open = d.timeEntries.find((t) => t.employeeId === empId && t.date === d.today && !t.end);
  const todayMins = d.timeEntries
    .filter((t) => t.employeeId === empId && t.date === d.today && t.kind === "field")
    .reduce((s, t) => s + (toMin(t.end ?? businessNow().slice(11, 16)) - toMin(t.start)), 0);

  const points = jobs.map((j, i) => {
    const p = ix.property.get(j.propertyId)!;
    return { id: j.id, lng: p.lng, lat: p.lat, color: j.status === "completed" ? "#0f8a5f" : j.status === "scheduled" ? "#032541" : "#2a78d6", label: String(i + 1) };
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[13px] text-muted">{fmtDate(d.today, "EEEE, MMMM d")}</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Hi {firstName(me.employee.name)}</h1>
        <p className="mt-0.5 text-[14px] text-muted">
          {crew?.name} · {crew?.vehicle} · {done} of {jobs.length} stops done
        </p>
      </div>

      <Card className="flex items-center justify-between gap-3 p-3.5">
        <div className="flex items-center gap-3">
          <span className={clsx("grid size-10 place-items-center rounded-xl", open ? "bg-ok-bg text-ok" : "bg-navy-50 text-muted")}>
            <Timer size={20} weight="duotone" />
          </span>
          <div>
            <p className="text-[14px] font-medium text-ink">{open ? `Clocked in since ${fmtTime(open.start)}` : "Not clocked in"}</p>
            <p className="num text-[12.5px] text-muted">
              {Math.floor(todayMins / 60)}h {todayMins % 60}m field time today
            </p>
          </div>
        </div>
        <button
          onClick={() => dispatch({ t: "time.clock", employeeId: empId, clockIn: !open }, { silent: true })}
          className={clsx("inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium", open ? "bg-white text-ink ring-1 ring-line" : "bg-navy-900 text-white")}
        >
          {open ? <Stop size={14} weight="fill" /> : <Play size={14} weight="fill" />}
          {open ? "Clock out" : "Clock in"}
        </button>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <ReefMap className="h-56 w-full" points={points} numbered route={points.map((p) => [p.lng, p.lat])} onPointClick={(id) => router.push(`/crew/job/?id=${id}`)} />
      </div>

      {next && (
        <Link href={`/crew/job/?id=${next.id}`} className="flex items-center gap-3 rounded-2xl bg-navy-900 p-4 text-white shadow-lift">
          <NavigationArrow size={22} weight="fill" className="text-sky-300" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] tracking-wide text-white/60 uppercase">{next.status === "scheduled" ? "Up next" : next.status === "en_route" ? "Heading to" : "Working at"}</p>
            <p className="truncate font-medium">{ix.property.get(next.propertyId)?.street}</p>
            <p className="text-[13px] text-white/70">Arrive {fmtWindow(next.arrivalStart, next.arrivalEnd)}</p>
          </div>
          <CaretRight size={18} />
        </Link>
      )}

      <div>
        <h2 className="mb-2 text-[13px] font-medium text-muted">Route</h2>
        <ol className="flex flex-col gap-2">
          {jobs.map((j, i) => {
            const p = ix.property.get(j.propertyId)!;
            const c = ix.customer.get(j.customerId)!;
            const st = JOB_TONE[j.status];
            return (
              <li key={j.id}>
                <Link href={`/crew/job/?id=${j.id}`} className={clsx("flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 transition active:scale-[0.99]", j.status === "completed" && "opacity-70")}>
                  <span className={clsx("grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold", j.status === "completed" ? "bg-ok text-white" : "bg-navy-900 text-white")}>
                    {j.status === "completed" ? <CheckCircle size={18} weight="fill" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium text-ink">{p.street}</p>
                    <p className="truncate text-[12.5px] text-muted">
                      {c.kind === "commercial" ? c.name : `${firstName(c.contactName)} ${c.contactName.split(" ")[1]?.[0] ?? ""}.`} · {fmtWindow(j.arrivalStart, j.arrivalEnd)}
                    </p>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </Link>
              </li>
            );
          })}
          {!jobs.length && <p className="rounded-2xl bg-white p-6 text-center text-[14px] text-muted">No stops assigned today.</p>}
        </ol>
      </div>
    </div>
  );
}
