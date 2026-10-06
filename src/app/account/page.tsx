"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarCheck, Coins, Copy, Repeat, Sparkle, Truck, Warning } from "@phosphor-icons/react";
import { Badge, Button, Card, Field, Select, Sheet, Textarea } from "@/components/ui";
import { BeforeAfter } from "@/components/portal";
import { useData, useDispatch, useMe } from "@/lib/demo/hooks";
import { creditBalances } from "@/lib/demo/select";
import { CADENCE } from "@/lib/demo/types";
import { daysBetween, fmtDate, fmtWindow, firstName, money, relDay, shiftMonths, businessNow, newId } from "@/lib/demo/util";
import { RescheduleSheet } from "@/components/reschedule";

export default function AccountHome() {
  const data = useData()!;
  const me = useMe();
  const dispatch = useDispatch();
  const [reschedule, setReschedule] = useState<string | null>(null);
  const [report, setReport] = useState(false);
  const [copied, setCopied] = useState(false);
  if (me?.kind !== "customer") return null;
  const { d, ix } = data;
  const c = me.customer;
  const jobs = (ix.jobsByCustomer.get(c.id) ?? []).filter((j) => j.date);
  const upcoming = jobs.filter((j) => ["scheduled", "en_route", "in_progress"].includes(j.status)).sort((a, b) => (a.date < b.date ? -1 : 1));
  const past = jobs.filter((j) => j.status === "completed").sort((a, b) => (a.date < b.date ? 1 : -1));
  const plan = (ix.plansByCustomer.get(c.id) ?? []).find((p) => p.status !== "cancelled");
  const credit = creditBalances(d.credit, c.id);
  const open = (ix.invoicesByCustomer.get(c.id) ?? []).filter((i) => i.status === "open");
  const lastWithPhotos = past.find((j) => j.photos.some((p) => p.kind === "before") && j.photos.some((p) => p.kind === "after"));
  const next = upcoming[0];
  const recommended = !plan && past[0] ? shiftMonths(past[0].date, 6) : null;
  const link = `${typeof window === "undefined" ? "" : window.location.host}/r/${c.referralCode}`;
  const tech = next ? d.employees.find((e) => e.id === next.assigneeIds[0]) : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl font-light text-navy-900 md:text-4xl">Hi {firstName(c.contactName)}</h1>
        <p className="mt-1 text-[15px] text-muted">{(ix.propertiesByCustomer.get(c.id) ?? []).map((p) => `${p.street}, ${p.neighborhood}`).join(" · ")}</p>
      </div>

      {open.length > 0 && (
        <Link href="/account/billing/" className="flex items-center justify-between gap-3 rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-[14px] text-navy-900">
          <span>
            You have {open.length} open invoice{open.length > 1 ? "s" : ""} ({money(open.reduce((s, i) => s + i.total - i.paid, 0))})
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            Pay now <ArrowRight size={14} />
          </span>
        </Link>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Card className="overflow-hidden">
          <div className="bg-navy-900 p-5 text-white md:p-6">
            <p className="flex items-center gap-2 text-[13px] text-white/70">
              <CalendarCheck size={16} /> {next ? "Next visit" : "Next cleaning"}
            </p>
            {next ? (
              <>
                <p className="mt-2 font-display text-3xl font-light">
                  {daysBetween(d.today, next.date) <= 1 ? relDay(next.date, d.today) : fmtDate(next.date, "EEEE")}
                  {daysBetween(d.today, next.date) > 1 && <span className="text-white/60">, {fmtDate(next.date, "MMMM d")}</span>}
                </p>
                <p className="mt-1 text-[15px] text-white/80">Arriving {fmtWindow(next.arrivalStart, next.arrivalEnd)}</p>
                {next.status === "en_route" && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1 text-[13px] font-medium text-navy-950">
                    <Truck size={14} weight="fill" /> {tech ? firstName(tech.name) : "Your crew"} is on the way
                  </p>
                )}
              </>
            ) : recommended ? (
              <>
                <p className="mt-2 font-display text-3xl font-light">Around {fmtDate(recommended, "MMMM")}</p>
                <p className="mt-1 text-[14px] text-white/75">Recommended 6 months after your last cleaning. Not booked yet.</p>
              </>
            ) : (
              <p className="mt-2 font-display text-2xl font-light">Nothing booked</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {next ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setReschedule(next.id)}>
                  Reschedule
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setReport(true)}>
                  <Warning size={14} /> Report an issue
                </Button>
              </>
            ) : (
              <Link href="/book/" className="inline-flex h-8 items-center rounded-full bg-navy-900 px-3.5 text-[13px] font-medium text-white">
                Book a cleaning
              </Link>
            )}
          </div>
        </Card>

        <div className="grid gap-5">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <p className="flex items-center gap-2 text-[13px] text-muted">
                <Repeat size={16} /> Service plan
              </p>
              {plan && <Badge tone={plan.status === "active" ? "ok" : "warn"}>{plan.status === "active" ? "Active" : "Paused"}</Badge>}
            </div>
            {plan ? (
              <>
                <p className="mt-2 font-display text-xl font-semibold text-ink">{CADENCE[plan.cadence].label}</p>
                <p className="text-[14px] text-muted">
                  {money(plan.pricePerVisit)} per visit · saves {Math.round(plan.discountPct * 100)}% · next {fmtDate(plan.nextDate, "MMM d")}
                </p>
                <Link href="/account/plan/" className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-sky-700">
                  Manage plan <ArrowRight size={13} />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-[14px] text-ink">You&apos;re not on a plan. Plan customers save up to 15% and never have to remember to book.</p>
                <Link href="/account/plan/" className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-sky-700">
                  See plans <ArrowRight size={13} />
                </Link>
              </>
            )}
          </Card>
          <Card className="p-5">
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <Coins size={16} /> Reef Credit
            </p>
            <p className="num mt-2 font-display text-3xl font-semibold text-ink">{money(credit.available)}</p>
            <p className="text-[13px] text-muted">
              available{credit.pending ? ` · ${money(credit.pending)} pending` : ""} · applied automatically to your next cleaning
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2.5 text-left text-[13px] text-ink"
            >
              <span className="truncate font-mono">{link}</span>
              <span className="inline-flex shrink-0 items-center gap-1 font-medium text-sky-700">
                <Copy size={14} /> {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </Card>
        </div>
      </div>

      {lastWithPhotos && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <Sparkle size={16} /> Your last cleaning, {fmtDate(lastWithPhotos.date, "MMMM d")}
            </p>
            <Link href="/account/visits/" className="text-[13px] font-medium text-sky-700">
              All photos
            </Link>
          </div>
          <BeforeAfter before={lastWithPhotos.photos.find((p) => p.kind === "before")!} after={lastWithPhotos.photos.find((p) => p.kind === "after")!} className="max-h-[420px] w-full" />
        </Card>
      )}

      {reschedule && <RescheduleSheet jobId={reschedule} onClose={() => setReschedule(null)} />}
      <ReportSheet
        open={report}
        onClose={() => setReport(false)}
        onSend={(kind, body) => {
          if (!next) return;
          dispatch({ t: "job.issue", jobId: next.id, issue: { id: newId("is"), at: businessNow(), byId: c.id, kind: "customer", body: `${kind}: ${body}`, resolved: false } }, { silent: true });
        }}
      />
    </div>
  );
}

function ReportSheet({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (k: string, b: string) => void }) {
  const [kind, setKind] = useState("Missed a spot");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <Sheet
      open={open}
      onClose={() => {
        onClose();
        setSent(false);
      }}
      title="Report an issue"
    >
      {sent ? (
        <p className="text-[15px] text-ink">Thanks. The Reef office has your note and will text you back today.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="What's going on?">
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option>Missed a spot</option>
              <option>Something was damaged</option>
              <option>Question about my visit</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Details">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <Button
            full
            disabled={!body.trim()}
            onClick={() => {
              onSend(kind, body.trim());
              setBody("");
              setSent(true);
            }}
          >
            Send to Reef
          </Button>
        </div>
      )}
    </Sheet>
  );
}
