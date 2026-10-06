"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { Button, Sheet } from "@/components/ui";
import { download, toCsv } from "@/lib/demo/csv";

export type DrillRow = Record<string, string | number>;

/** Drill-down: the records behind a KPI, with the same rows exportable as CSV. */
export function DrillSheet({ open, onClose, title, rows }: { open: boolean; onClose: () => void; title: string; rows: DrillRow[] }) {
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  return (
    <Sheet open={open} onClose={onClose} title={title} wide>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          {rows.length} record{rows.length === 1 ? "" : "s"} behind this number
        </p>
        <Button size="sm" variant="outline" onClick={() => download(`reef-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, toCsv(rows))} disabled={!rows.length}>
          <DownloadSimple size={14} /> Export CSV
        </Button>
      </div>
      <div className="max-h-[60dvh] overflow-auto rounded-xl border border-line">
        <table className="w-full text-left text-[13px]">
          <thead className="sticky top-0 bg-canvas text-[12px] text-muted">
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-3 py-2 font-medium whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.slice(0, 300).map((r, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c} className="num px-3 py-2 whitespace-nowrap text-ink">
                    {r[c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 300 && <p className="mt-2 text-[12px] text-muted">Showing the first 300. The CSV has all {rows.length}.</p>}
    </Sheet>
  );
}
