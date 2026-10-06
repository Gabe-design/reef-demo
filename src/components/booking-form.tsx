"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { Button, Field, Input } from "@/components/ui";
import { MINIMUM_VISIT, SERVICES } from "@/lib/demo/catalog";
import { withMinimum, checklistFor } from "@/lib/demo/seed";
import type { Customer, DemoData, Job, Line, Property, ServiceId } from "@/lib/demo/types";
import { estimateMinutes, fmtDate, fmtWindow, money, newId, shiftDate, subtotal, businessNow } from "@/lib/demo/util";

export const SLOTS: [string, string][] = [
  ["08:00", "10:00"],
  ["10:00", "12:00"],
  ["12:00", "14:00"],
  ["14:00", "16:00"],
];

const rate = (id: ServiceId) => SERVICES.find((s) => s.id === id)!.rate;

export interface BookingInput {
  windows: number;
  stories: number;
  services: ServiceId[];
  skylights: number;
}

export function quoteLines(b: BookingInput): Line[] {
  const lines: Line[] = [];
  const screens = Math.round(b.windows * 0.6);
  const tracks = Math.round(b.windows * 0.35);
  if (b.services.includes("ext")) lines.push({ serviceId: "ext", qty: b.windows, unitPrice: rate("ext") });
  if (b.services.includes("int")) lines.push({ serviceId: "int", qty: b.windows, unitPrice: rate("int") });
  if (b.services.includes("screen")) lines.push({ serviceId: "screen", qty: screens, unitPrice: rate("screen") });
  if (b.services.includes("track")) lines.push({ serviceId: "track", qty: tracks, unitPrice: rate("track") });
  if (b.services.includes("skylight") && b.skylights) lines.push({ serviceId: "skylight", qty: b.skylights, unitPrice: rate("skylight") });
  return withMinimum(lines);
}

/** Which arrival windows each crew has free on a day (capacity check stand-in). */
export function availability(d: DemoData, date: string, crewId: string) {
  const taken = d.jobs.filter((j) => j.date === date && j.crewId === crewId && j.status !== "cancelled").length;
  const sunday = fmtDate(date, "EEEE") === "Sunday";
  return SLOTS.map((s, i) => ({ slot: s, open: !sunday && date > d.today && taken + i < 7 && (i + date.charCodeAt(9)) % 5 !== 0 }));
}

/** Builds the customer/property/job records for a confirmed booking. */
export function buildBooking(opts: {
  d: DemoData;
  name: string;
  phone: string;
  email?: string;
  street: string;
  neighborhood: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  stories: number;
  windows: number;
  lines: Line[];
  date: string;
  slot: [string, string];
  crewId: string;
  source: Customer["source"];
  soldById?: string;
  existing?: { customer: Customer; property: Property };
}) {
  const cid = opts.existing?.customer.id ?? newId("c");
  const customer: Customer = opts.existing?.customer ?? {
    id: cid,
    name: opts.name,
    kind: "residential",
    contactName: opts.name,
    phone: opts.phone,
    email: opts.email ?? "",
    source: opts.source,
    createdAt: businessNow(),
    referralCode: `REEF-${opts.name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}${String(Math.floor(Math.random() * 90) + 10)}`,
    salespersonId: opts.soldById,
    tags: ["New"],
  };
  const property: Property = opts.existing?.property ?? {
    id: newId("p"),
    customerId: cid,
    street: opts.street,
    city: opts.city,
    zip: opts.zip,
    neighborhood: opts.neighborhood,
    lat: opts.lat,
    lng: opts.lng,
    kind: "house",
    stories: opts.stories,
    inventory: { exterior: opts.windows, interior: opts.windows, screens: Math.round(opts.windows * 0.6), tracks: Math.round(opts.windows * 0.35), skylights: 0, hardWaterPanes: 0 },
  };
  const crew = opts.d.crews.find((c) => c.id === opts.crewId)!;
  const jobNum = Math.max(...opts.d.jobs.map((j) => Number(j.number.replace(/\D/g, "")) || 0)) + 1;
  const job: Job = {
    id: newId("j"),
    number: `J-${jobNum}`,
    customerId: cid,
    propertyId: property.id,
    status: "scheduled",
    date: opts.date,
    arrivalStart: opts.slot[0],
    arrivalEnd: opts.slot[1],
    durationMin: estimateMinutes(opts.lines, opts.d.services),
    crewId: crew.id,
    assigneeIds: crew.memberIds,
    routeOrder: 9,
    lines: opts.lines,
    discount: 0,
    total: subtotal(opts.lines),
    checklist: checklistFor(opts.lines),
    photos: [],
    notes: [],
    issues: [],
    soldById: opts.soldById,
  };
  return { customer, property, job };
}

/** Service picker + live price used by public booking and door-to-door booking. */
export function ServicePicker({ value, onChange }: { value: BookingInput; onChange: (v: BookingInput) => void }) {
  const toggle = (id: ServiceId) => onChange({ ...value, services: value.services.includes(id) ? value.services.filter((s) => s !== id) : [...value.services, id] });
  const opts: { id: ServiceId; label: string }[] = [
    { id: "ext", label: "Outside" },
    { id: "int", label: "Inside" },
    { id: "screen", label: "Screens" },
    { id: "track", label: "Tracks" },
    { id: "skylight", label: "Skylights" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <Field label="About how many windows?" hint="Count each window or slider once. We'll confirm on site.">
        <div className="flex items-center gap-3">
          <input type="range" min={6} max={60} value={value.windows} onChange={(e) => onChange({ ...value, windows: Number(e.target.value) })} className="flex-1 accent-[#032541]" />
          <span className="num w-10 text-right font-display text-xl font-semibold text-ink">{value.windows}</span>
        </div>
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink">Services</span>
        <div className="flex flex-wrap gap-2">
          {opts.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              aria-pressed={value.services.includes(o.id)}
              className={clsx(
                "rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition",
                value.services.includes(o.id) ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-ink hover:border-navy-100",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {value.services.includes("skylight") && (
        <Field label="Skylights">
          <Input type="number" min={1} max={8} value={value.skylights} onChange={(e) => onChange({ ...value, skylights: Number(e.target.value) })} />
        </Field>
      )}
    </div>
  );
}

export function PriceSummary({ lines }: { lines: Line[] }) {
  const total = subtotal(lines);
  return (
    <div className="rounded-2xl bg-canvas p-4">
      {lines.map((l) => (
        <div key={l.serviceId} className="flex justify-between py-0.5 text-[13.5px]">
          <span className="text-muted">
            {SERVICES.find((s) => s.id === l.serviceId)?.name}
            {l.serviceId !== "callout" && ` × ${l.qty}`}
          </span>
          <span className="num text-ink">{money(l.qty * l.unitPrice)}</span>
        </div>
      ))}
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
        <span className="text-[14px] font-medium text-ink">Estimated total</span>
        <span className="num font-display text-2xl font-semibold text-ink">{money(total)}</span>
      </div>
      {lines.some((l) => l.serviceId === "callout") && <p className="mt-1 text-[12px] text-muted">Includes the {money(MINIMUM_VISIT, { whole: true })} minimum visit.</p>}
    </div>
  );
}

export function SlotPicker({ d, crewId, value, onChange }: { d: DemoData; crewId: string; value: { date: string; slot: [string, string] | null }; onChange: (v: { date: string; slot: [string, string] | null }) => void }) {
  const days = useMemo(() => [...Array(14).keys()].map((k) => shiftDate(d.today, k + 1)), [d.today]);
  const avail = availability(d, value.date, crewId);
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((day) => {
          const sunday = fmtDate(day, "EEEE") === "Sunday";
          return (
            <button
              key={day}
              type="button"
              disabled={sunday}
              onClick={() => onChange({ date: day, slot: null })}
              className={clsx(
                "flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2 transition disabled:opacity-35",
                value.date === day ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-ink",
              )}
            >
              <span className="text-[11px] uppercase opacity-70">{fmtDate(day, "EEE")}</span>
              <span className="num font-display text-lg font-semibold">{fmtDate(day, "d")}</span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {avail.map(({ slot, open }) => (
          <button
            key={slot[0]}
            type="button"
            disabled={!open}
            onClick={() => onChange({ ...value, slot })}
            className={clsx(
              "rounded-xl border px-3 py-2.5 text-[13.5px] font-medium transition disabled:border-dashed disabled:text-subtle",
              value.slot?.[0] === slot[0] ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-ink",
            )}
          >
            {open ? fmtWindow(slot[0], slot[1]) : "Full"}
          </button>
        ))}
      </div>
      <p className="text-[12px] text-muted">Times are arrival windows. We text you when the crew is on the way.</p>
    </div>
  );
}

export function BookingSubmit({ disabled, children, onClick }: { disabled?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <Button size="lg" full disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}
