"use client";

import { useState } from "react";
import clsx from "clsx";
import { CreditCard, LockSimple } from "@phosphor-icons/react";
import { Button, Sheet } from "@/components/ui";
import type { Invoice, Photo } from "@/lib/demo/types";
import { money } from "@/lib/demo/util";

/** Drag-to-compare before/after slider. */
export function BeforeAfter({ before, after, className }: { before: Photo; after: Photo; className?: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className={clsx("relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-50 select-none", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after.src} alt="After cleaning" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before.src} alt="Before cleaning" className={clsx("absolute inset-0 size-full object-cover", !before.local && "photo-before")} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgb(0_0_0/0.3)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[11px] font-semibold text-navy-900 shadow-lift">⇆</span>
      </div>
      <span className="absolute top-3 left-3 rounded-full bg-navy-950/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">Before</span>
      <span className="absolute top-3 right-3 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-navy-900 backdrop-blur">After</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="absolute inset-0 cursor-ew-resize opacity-0" aria-label="Compare before and after" />
    </div>
  );
}

/**
 * Stand-in for Stripe's hosted payment page. The real platform redirects to
 * Stripe Checkout and confirms payment from a verified webhook (spec 6).
 */
export function CheckoutSheet({
  invoice,
  credit,
  card,
  open,
  onClose,
  onPay,
}: {
  invoice: Invoice | null;
  credit: number;
  card?: { brand: string; last4: string };
  open: boolean;
  onClose: () => void;
  onPay: (useCredit: boolean) => void;
}) {
  const [useCredit, setUseCredit] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"saved" | "new">(card ? "saved" : "new");
  if (!invoice) return null;
  const due = invoice.total - invoice.paid;
  const applied = useCredit ? Math.min(credit, due) : 0;
  return (
    <Sheet open={open} onClose={onClose} title={`Pay ${invoice.number}`}>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-canvas p-4 text-[14px]">
          <div className="flex justify-between">
            <span className="text-muted">Amount due</span>
            <span className="num text-ink">{money(due)}</span>
          </div>
          {credit > 0 && (
            <label className="mt-2 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink">
                <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="size-4 accent-[#032541]" />
                Use Reef Credit ({money(credit)} available)
              </span>
              <span className="num text-ok">-{money(applied)}</span>
            </label>
          )}
          <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-medium text-ink">You pay</span>
            <span className="num font-display text-2xl font-semibold text-ink">{money(due - applied)}</span>
          </div>
        </div>
        {due - applied > 0 && (
          <div className="flex flex-col gap-2">
            {card && (
              <button onClick={() => setMode("saved")} className={clsx("flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-[14px]", mode === "saved" ? "border-navy-900 ring-2 ring-sky-100" : "border-line")}>
                <CreditCard size={20} className="text-navy-900" /> {card.brand} ending {card.last4}
              </button>
            )}
            <button onClick={() => setMode("new")} className={clsx("flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-[14px]", mode === "new" ? "border-navy-900 ring-2 ring-sky-100" : "border-line")}>
              <CreditCard size={20} className="text-muted" /> New card
            </button>
            {mode === "new" && <p className="px-1 text-[12.5px] text-muted">You&apos;ll enter your card on Stripe&apos;s secure page. Reef never sees or stores your full card number.</p>}
          </div>
        )}
        <Button
          size="lg"
          full
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setTimeout(() => {
              onPay(useCredit && credit > 0);
              setBusy(false);
              onClose();
            }, 900);
          }}
        >
          {busy ? "Processing…" : due - applied > 0 ? `Pay ${money(due - applied)}` : "Apply credit"}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted">
          <LockSimple size={13} /> Secured by Stripe
        </p>
      </div>
    </Sheet>
  );
}
