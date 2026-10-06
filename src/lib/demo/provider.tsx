"use client";

import { useEffect } from "react";
import { ChatCircleText, CheckCircle, Info, X } from "@phosphor-icons/react";
import { useDemo } from "./store";
import { useSession } from "./session";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useSession.getState().hydrate();
    // Generating ~200 customers' history takes a moment; let the page paint first.
    const t = setTimeout(() => useDemo.getState().init(), 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

function Toaster() {
  const toasts = useDemo((s) => s.toasts);
  const dismiss = useDemo((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-sm animate-toast items-start gap-3 rounded-2xl border border-white/60 bg-white/90 p-3 pr-2 shadow-lift backdrop-blur-md"
        >
          <span
            className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${
              t.kind === "sms" ? "bg-ok text-white" : t.kind === "success" ? "bg-navy-900 text-white" : "bg-sky-100 text-navy-900"
            }`}
          >
            {t.kind === "sms" ? <ChatCircleText size={18} weight="fill" /> : t.kind === "success" ? <CheckCircle size={18} weight="fill" /> : <Info size={18} weight="fill" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{t.title}</p>
            <p className="mt-0.5 line-clamp-3 text-[13px] leading-snug text-muted">{t.body}</p>
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="rounded-full p-1 text-subtle hover:bg-navy-50 hover:text-ink"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
