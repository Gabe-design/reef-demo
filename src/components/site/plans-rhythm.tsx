"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

const PLANS = [
  { id: "quarterly", label: "Every 3 months", visits: [0, 3, 6, 9], save: "15%", best: "Oceanfront homes and anything near the sand" },
  { id: "semiannual", label: "Every 6 months", visits: [0, 6], save: "10%", best: "Most San Diego homes. Spring and fall." },
  { id: "annual", label: "Once a year", visits: [0], save: "5%", best: "Inland homes and low-traffic glass" },
] as const;

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Interactive 12-month strip showing when each plan visits. */
export function PlansRhythm() {
  const [id, setId] = useState<(typeof PLANS)[number]["id"]>("semiannual");
  const plan = PLANS.find((p) => p.id === id)!;
  const start = 2; // March
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-soft md:p-8">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Plan frequency">
        {PLANS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === id}
            onClick={() => setId(p.id)}
            className={clsx(
              "rounded-full px-4 py-2 text-[14px] font-medium transition",
              p.id === id ? "bg-navy-900 text-white" : "bg-navy-50 text-muted hover:text-navy-900",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-12 gap-1.5 md:gap-2">
        {MONTHS.map((m, i) => {
          const on = plan.visits.some((v) => (start + v) % 12 === i);
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="relative h-24 w-full overflow-hidden rounded-xl bg-navy-50 md:h-32">
                <AnimatePresence>
                  {on && (
                    <motion.div
                      key={id + i}
                      initial={{ y: "100%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", stiffness: 140, damping: 20 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-t from-navy-900 to-sky-600"
                    />
                  )}
                </AnimatePresence>
              </div>
              <span className={clsx("text-[12px]", on ? "font-semibold text-navy-900" : "text-subtle")}>{m}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="font-display text-4xl font-light text-navy-900">
            Save {plan.save} <span className="text-muted">on every visit</span>
          </p>
          <p className="mt-2 text-[15px] text-muted">Best for: {plan.best}</p>
        </div>
        <Link href="/plans/" className="inline-flex items-center gap-2 text-[15px] font-medium text-sky-700 hover:text-navy-900">
          How plans work <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
