"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { CaretDown, CaretUp, DownloadSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { Button, Card } from "@/components/ui";
import { download, toCsv } from "@/lib/demo/csv";

export interface Col<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sort?: (row: T) => string | number;
  csv?: (row: T) => string | number;
  align?: "right";
  hideOnMobile?: boolean;
  primary?: boolean;
}

/**
 * Searchable, sortable list. Desktop renders a table; phones get stacked
 * cards (spec 9: dense tables need mobile card views). Same filtered rows
 * export to CSV.
 */
export function ListTable<T>({
  rows,
  cols,
  search,
  href,
  pageSize = 25,
  exportName,
  toolbar,
  initialSort,
  empty,
}: {
  rows: T[];
  cols: Col<T>[];
  search?: (row: T) => string;
  href?: (row: T) => string;
  pageSize?: number;
  exportName?: string;
  toolbar?: React.ReactNode;
  initialSort?: { key: string; dir: 1 | -1 };
  empty?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    let out = q && search ? rows.filter((r) => search(r).toLowerCase().includes(q.toLowerCase())) : rows;
    const col = cols.find((c) => c.key === sort?.key);
    if (col?.sort && sort) {
      const f = col.sort;
      out = [...out].sort((a, b) => (f(a) > f(b) ? sort.dir : f(a) < f(b) ? -sort.dir : 0));
    }
    return out;
  }, [rows, q, search, sort, cols]);
  const shown = filtered.slice(0, page * pageSize);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        {search && (
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-canvas px-3.5 text-[14px] sm:max-w-xs">
            <MagnifyingGlass size={16} className="shrink-0 text-subtle" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle"
              aria-label="Search"
            />
          </label>
        )}
        {toolbar}
        <span className="ml-auto text-[12.5px] text-muted">{filtered.length.toLocaleString()} total</span>
        {exportName && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => download(`${exportName}.csv`, toCsv(filtered.map((r) => Object.fromEntries(cols.map((c) => [c.label, c.csv ? c.csv(r) : String(c.sort?.(r) ?? "")])))))}
          >
            <DownloadSimple size={14} /> CSV
          </Button>
        )}
      </div>
      {/* desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="text-[12px] text-muted">
              {cols.map((c) => (
                <th key={c.key} className={clsx("px-4 py-2.5 font-medium whitespace-nowrap", c.align === "right" && "text-right")}>
                  {c.sort ? (
                    <button
                      onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key ? (-s.dir as 1 | -1) : -1 }))}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      {c.label}
                      {sort?.key === c.key && (sort.dir === 1 ? <CaretUp size={11} /> : <CaretDown size={11} />)}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} className="group border-t border-line hover:bg-canvas">
                {cols.map((c, j) => (
                  <td key={c.key} className={clsx("px-4 py-3 align-middle text-ink", c.align === "right" && "num text-right whitespace-nowrap")}>
                    {href && j === 0 ? (
                      <Link href={href(r)} className="font-medium text-ink group-hover:text-sky-700">
                        {c.render(r)}
                      </Link>
                    ) : (
                      c.render(r)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* mobile */}
      <ul className="divide-y divide-line md:hidden">
        {shown.map((r, i) => {
          const body = (
            <div className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 font-medium text-ink">{cols[0]!.render(r)}</div>
                {cols.find((c) => c.align === "right" && !c.hideOnMobile) && <div className="num shrink-0 text-[13.5px] text-ink">{cols.find((c) => c.align === "right" && !c.hideOnMobile)!.render(r)}</div>}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted">
                {cols.slice(1).filter((c) => !c.hideOnMobile && c.align !== "right").map((c) => (
                  <span key={c.key}>{c.render(r)}</span>
                ))}
              </div>
            </div>
          );
          return <li key={i}>{href ? <Link href={href(r)}>{body}</Link> : body}</li>;
        })}
      </ul>
      {!filtered.length && <div className="p-8 text-center text-[14px] text-muted">{empty ?? "Nothing here yet."}</div>}
      {shown.length < filtered.length && (
        <div className="border-t border-line p-3 text-center">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)}>
            Show more
          </Button>
        </div>
      )}
    </Card>
  );
}
