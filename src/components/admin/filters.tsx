"use client";

import { Select } from "@/components/ui";
import type { DemoData, LeadSource, ServiceId } from "@/lib/demo/types";
import { LEAD_SOURCES } from "@/lib/demo/types";
import type { KpiFilters } from "@/lib/demo/select";
import { shiftDate } from "@/lib/demo/util";

export type RangeKey = "today" | "7d" | "30d" | "90d" | "ytd" | "12m";

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "ytd", label: "Year to date" },
  { key: "12m", label: "Last 12 months" },
];

export function rangeDates(key: RangeKey, today: string): { from: string; to: string } {
  switch (key) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: shiftDate(today, -6), to: today };
    case "30d":
      return { from: shiftDate(today, -29), to: today };
    case "90d":
      return { from: shiftDate(today, -89), to: today };
    case "ytd":
      return { from: today.slice(0, 4) + "-01-01", to: today };
    case "12m":
      return { from: shiftDate(today, -364), to: today };
  }
}

/** Previous window of the same length, for comparisons. */
export function previousWindow(f: { from: string; to: string }) {
  const len = Math.round((Date.parse(f.to) - Date.parse(f.from)) / 86400000) + 1;
  return { from: shiftDate(f.from, -len), to: shiftDate(f.from, -1) };
}

export interface FilterState {
  range: RangeKey;
  neighborhood: string;
  employeeId: string;
  salespersonId: string;
  service: string;
  source: string;
}

export const defaultFilters: FilterState = { range: "30d", neighborhood: "", employeeId: "", salespersonId: "", service: "", source: "" };

export function toKpiFilters(s: FilterState, today: string): KpiFilters {
  return {
    ...rangeDates(s.range, today),
    neighborhood: s.neighborhood || undefined,
    employeeId: s.employeeId || undefined,
    salespersonId: s.salespersonId || undefined,
    service: (s.service || undefined) as ServiceId | undefined,
    source: (s.source || undefined) as LeadSource | undefined,
  };
}

export function FilterBar({ value, onChange, d }: { value: FilterState; onChange: (v: FilterState) => void; d: DemoData }) {
  const set = (k: keyof FilterState) => (e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  const hoods = [...new Set(d.properties.map((p) => p.neighborhood))].sort();
  const cls = "h-9 !w-auto min-w-0 rounded-full !text-[13px] !pl-3.5";
  const active = Object.entries(value).filter(([k, v]) => k !== "range" && v).length;
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Dashboard filters">
      <Select aria-label="Date range" value={value.range} onChange={set("range")} className={cls}>
        {RANGES.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </Select>
      <Select aria-label="Neighborhood" value={value.neighborhood} onChange={set("neighborhood")} className={cls}>
        <option value="">All neighborhoods</option>
        {hoods.map((h) => (
          <option key={h}>{h}</option>
        ))}
      </Select>
      <Select aria-label="Crew member" value={value.employeeId} onChange={set("employeeId")} className={cls}>
        <option value="">All crew</option>
        {d.employees
          .filter((e) => e.role === "worker")
          .map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
      </Select>
      <Select aria-label="Salesperson" value={value.salespersonId} onChange={set("salespersonId")} className={cls}>
        <option value="">All sales</option>
        {d.employees
          .filter((e) => e.role === "sales")
          .map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
      </Select>
      <Select aria-label="Service" value={value.service} onChange={set("service")} className={cls}>
        <option value="">All services</option>
        {d.services
          .filter((s) => s.id !== "callout")
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
      </Select>
      <Select aria-label="Lead source" value={value.source} onChange={set("source")} className={cls}>
        <option value="">All sources</option>
        {Object.entries(LEAD_SOURCES).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
      {active > 0 && (
        <button onClick={() => onChange({ ...defaultFilters, range: value.range })} className="px-2 text-[13px] font-medium text-sky-700 hover:text-navy-900">
          Clear {active}
        </button>
      )}
    </div>
  );
}
