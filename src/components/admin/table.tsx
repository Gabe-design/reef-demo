"use client";

import clsx from "clsx";

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto px-2 pb-3">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="text-[12px] text-muted">
            {head.map((h, i) => (
              <th key={h} className={clsx("px-3 py-2 font-medium whitespace-nowrap", i > 0 && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, j) => (
                <td key={j} className={clsx("num px-3 py-2.5 whitespace-nowrap text-ink", j > 0 && "text-right")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

