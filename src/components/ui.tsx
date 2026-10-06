"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import clsx from "clsx";
import { X } from "@phosphor-icons/react";
import { initials } from "@/lib/demo/util";

type Variant = "primary" | "sky" | "outline" | "ghost" | "danger" | "white";
type Size = "sm" | "md" | "lg";

const btn = (variant: Variant, size: Size, full?: boolean) =>
  clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "h-8 px-3.5 text-[13px]",
    size === "md" && "h-10 px-5 text-sm",
    size === "lg" && "h-12 px-6 text-[15px]",
    variant === "primary" && "bg-navy-900 text-white hover:bg-navy-800 shadow-[0_1px_0_rgb(255_255_255/0.12)_inset]",
    variant === "sky" && "bg-sky-500 text-navy-950 hover:bg-sky-300",
    variant === "outline" && "border border-line bg-white text-ink hover:border-navy-100 hover:bg-navy-50",
    variant === "ghost" && "text-ink hover:bg-navy-50",
    variant === "danger" && "bg-bad text-white hover:opacity-90",
    variant === "white" && "bg-white text-navy-900 hover:bg-sky-50",
    full && "w-full",
  );

export function Button({
  variant = "primary",
  size = "md",
  full,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <button className={clsx(btn(variant, size, full), className)} {...rest} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  full,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={clsx(btn(variant, size, full), className)}>
      {children}
    </Link>
  );
}

export type Tone = "neutral" | "navy" | "sky" | "ok" | "warn" | "bad" | "violet";

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap",
        tone === "neutral" && "bg-navy-50 text-muted",
        tone === "navy" && "bg-navy-900 text-white",
        tone === "sky" && "bg-sky-100 text-sky-700",
        tone === "ok" && "bg-ok-bg text-ok",
        tone === "warn" && "bg-warn-bg text-warn",
        tone === "bad" && "bg-bad-bg text-bad",
        tone === "violet" && "bg-violet-100 text-violet-700",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-2xl border border-line bg-white", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, sub }: { title: React.ReactNode; action?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
      <div className="min-w-0">
        <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-[12.5px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, color = "#032541", size = 32 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-xl bg-navy-50", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function Empty({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 grid size-11 place-items-center rounded-2xl bg-sky-50 text-sky-700">{icon}</div>}
      <p className="font-display font-semibold text-ink">{title}</p>
      {body && <p className="max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && !error && <span className="text-[12px] text-muted">{hint}</span>}
      {error && <span className="text-[12px] font-medium text-bad">{error}</span>}
    </label>
  );
}

export const inputCls =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-subtle outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100";

export function Input(props: React.ComponentProps<"input">) {
  return <input {...props} className={clsx(inputCls, props.className)} />;
}

export function Textarea(props: React.ComponentProps<"textarea">) {
  return <textarea {...props} className={clsx(inputCls, "h-auto min-h-24 py-2.5", props.className)} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={clsx(inputCls, "appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9", props.className)} style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%234b5e71' stroke-width='1.6' fill='none'/></svg>\")" }}>
      {children}
    </select>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-full bg-navy-50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-full font-medium transition",
            size === "sm" ? "px-3 py-1 text-[12.5px]" : "px-4 py-1.5 text-[13px]",
            value === o.value ? "bg-white text-ink shadow-soft" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Modal on desktop, bottom sheet on phones. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label={title}>
      <button className="absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <div
        ref={ref}
        tabIndex={-1}
        className={clsx(
          "relative max-h-[92dvh] w-full animate-rise overflow-y-auto rounded-t-3xl bg-white shadow-lift outline-none sm:rounded-3xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-5 py-3.5 backdrop-blur">
          <h2 className="font-display text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-navy-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "ok" | "bad" | "neutral";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-medium text-muted">{label}</p>
        {icon && <span className="text-subtle">{icon}</span>}
      </div>
      <p className="num mt-2 font-display text-[26px] leading-none font-semibold tracking-tight text-ink">{value}</p>
      {sub && (
        <p className={clsx("mt-2 text-[12px]", tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : "text-muted")}>{sub}</p>
      )}
    </div>
  );
}

export function ProgressRing({ value, size = 44, stroke = 5 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-navy-50)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-sky-600)"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}
