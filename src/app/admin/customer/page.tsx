"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChatText, EnvelopeSimple, MapPin, Phone, Repeat } from "@phosphor-icons/react";
import { PageHeader } from "@/components/admin/shell";
import { Badge, Button, Card, CardHeader, Empty, Field, Segmented, Select, Sheet } from "@/components/ui";
import { TextSheet } from "@/components/admin/text-sheet";
import { useData, useDispatch, useMe } from "@/lib/demo/hooks";
import { INVOICE_TONE, JOB_TONE, PLAN_TONE, invoiceState } from "@/lib/demo/labels";
import { creditBalances } from "@/lib/demo/select";
import { PLAN_DISCOUNT } from "@/lib/demo/catalog";
import { CADENCE, LEAD_SOURCES, type PlanCadence, type ServicePlan } from "@/lib/demo/types";
import { fmtDate, fmtWindow, money, newId, shiftMonths, subtotal, businessNow } from "@/lib/demo/util";

export default function CustomerPage() {
  return (
    <Suspense fallback={null}>
      <CustomerDetail />
    </Suspense>
  );
}

type Tab = "overview" | "jobs" | "billing" | "messages" | "credit";

function CustomerDetail() {
  const id = useSearchParams().get("id") ?? "";
  const { d, ix } = useData()!;
  const me = useMe();
  const dispatch = useDispatch();
  const [tab, setTab] = useState<Tab>("overview");
  const [textOpen, setTextOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const c = ix.customer.get(id);
  if (!c) return <Empty title="Customer not found" action={<Link href="/admin/customers/" className="text-sky-700">Back to customers</Link>} />;
  const props = ix.propertiesByCustomer.get(c.id) ?? [];
  const jobs = [...(ix.jobsByCustomer.get(c.id) ?? [])].sort((a, b) => ((a.date || "9") < (b.date || "9") ? 1 : -1));
  const invoices = [...(ix.invoicesByCustomer.get(c.id) ?? [])].sort((a, b) => (a.issuedOn < b.issuedOn ? 1 : -1));
  const payments = ix.paymentsByCustomer.get(c.id) ?? [];
  const plans = ix.plansByCustomer.get(c.id) ?? [];
  const activePlan = plans.find((p) => p.status === "active" || p.status === "paused");
  const offers = d.planOffers.filter((o) => o.customerId === c.id);
  const fus = d.followUps.filter((f) => f.customerId === c.id).sort((a, b) => (a.due < b.due ? 1 : -1));
  const msgs = (ix.messagesByCustomer.get(c.id) ?? []).slice().sort((a, b) => (a.at < b.at ? -1 : 1));
  const credit = creditBalances(d.credit, c.id);
  const ledger = d.credit.filter((e) => e.customerId === c.id).sort((a, b) => (a.at < b.at ? 1 : -1));
  const ltv = payments.filter((p) => p.status === "succeeded").reduce((s, p) => s + p.amount, 0);
  const referrer = c.referredById ? ix.customer.get(c.referredById) : null;
  const reviews = d.reviews.filter((r) => r.customerId === c.id);
  const lastLines = jobs.find((j) => j.status === "completed")?.lines ?? jobs[0]?.lines ?? [];

  return (
    <>
      <Link href="/admin/customers/" className="mb-3 inline-flex items-center gap-1 text-[13.5px] text-muted hover:text-ink">
        <ArrowLeft size={14} /> Customers
      </Link>
      <PageHeader
        title={c.name}
        sub={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {c.kind === "commercial" && <span>Contact: {c.contactName}</span>}
            <span className="inline-flex items-center gap-1">
              <Phone size={13} /> {c.phone}
            </span>
            {c.email && (
              <span className="inline-flex items-center gap-1">
                <EnvelopeSimple size={13} /> {c.email}
              </span>
            )}
            <span>Customer since {fmtDate(c.createdAt, "MMM yyyy")}</span>
            {c.doNotText && <Badge tone="bad">Opted out of texts</Badge>}
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setTextOpen(true)} disabled={c.doNotText}>
              <ChatText size={14} /> Text
            </Button>
            {!activePlan && c.kind === "residential" && (
              <Button size="sm" onClick={() => setPlanOpen(true)}>
                <Repeat size={14} /> Offer plan
              </Button>
            )}
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Mini label="Lifetime value" value={money(ltv, { whole: true })} />
        <Mini label="Cleanings" value={String(jobs.filter((j) => j.status === "completed").length)} />
        <Mini label="Reef Credit" value={money(credit.available)} sub={credit.pending ? `${money(credit.pending)} pending` : undefined} />
        <Mini label="Source" value={LEAD_SOURCES[c.source]} sub={referrer ? `Referred by ${referrer.name}` : c.salespersonId ? `Sold by ${ix.employee.get(c.salespersonId)?.name}` : undefined} />
      </div>

      <div className="mb-4 overflow-x-auto">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "jobs", label: `Jobs (${jobs.length})` },
            { value: "billing", label: "Billing" },
            { value: "messages", label: `Texts (${msgs.length})` },
            { value: "credit", label: "Reef Credit" },
          ]}
        />
      </div>

      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Properties" />
            {props.map((p) => (
              <div key={p.id} className="border-t border-line px-5 py-4 text-[13.5px]">
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  <MapPin size={15} /> {p.street}, {p.city} {p.zip}
                </p>
                <p className="mt-1 text-muted">
                  {p.neighborhood} · {p.stories}-story {p.kind} · {p.inventory.exterior} windows · {p.inventory.screens} screens · {p.inventory.tracks} tracks
                  {p.inventory.skylights ? ` · ${p.inventory.skylights} skylights` : ""}
                </p>
                {p.accessNotes && <p className="mt-1 text-ink">Access: {p.accessNotes}</p>}
                {p.gateCode && <p className="mt-1 text-muted">Gate code on file (hidden from exports)</p>}
              </div>
            ))}
          </Card>
          <Card>
            <CardHeader title="Plan and follow-up" />
            <div className="border-t border-line px-5 py-4 text-[13.5px]">
              {activePlan ? (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{CADENCE[activePlan.cadence].label}</p>
                    <p className="text-muted">
                      {money(activePlan.pricePerVisit)} per visit · next {fmtDate(activePlan.nextDate, "MMM d")} · {activePlan.autopay ? "autopay" : "pay by link"}
                    </p>
                  </div>
                  <Badge tone={PLAN_TONE[activePlan.status].tone}>{PLAN_TONE[activePlan.status].label}</Badge>
                </div>
              ) : (
                <p className="text-muted">No active plan.</p>
              )}
              {offers.filter((o) => o.outcome === "declined").map((o) => (
                <p key={o.id} className="mt-2 text-muted">
                  Declined {CADENCE[o.cadence].short} plan on {fmtDate(o.at, "MMM d")} ({o.reason}). Follow up {o.followUpOn ? fmtDate(o.followUpOn, "MMM d") : "-"}.
                </p>
              ))}
            </div>
            <div className="border-t border-line px-5 py-3">
              <p className="mb-1 text-[12px] font-medium text-muted">Follow-ups</p>
              {fus.length ? (
                fus.slice(0, 5).map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 py-1.5 text-[13.5px]">
                    <span className={f.done ? "text-subtle line-through" : "text-ink"}>
                      {fmtDate(f.due, "MMM d")} · {f.note}
                    </span>
                    {!f.done && (
                      <button onClick={() => dispatch({ t: "followup.done", followUpId: f.id }, { silent: true })} className="shrink-0 text-[12.5px] font-medium text-sky-700">
                        Mark done
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-muted">None</p>
              )}
            </div>
          </Card>
          {reviews.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader title="Reviews" />
              {reviews.map((r) => (
                <div key={r.id} className="border-t border-line px-5 py-3 text-[13.5px]">
                  <p className="text-ink">
                    {"★".repeat(r.rating)}
                    <span className="text-subtle">{"★".repeat(5 - r.rating)}</span> <span className="text-muted">· {r.source} · {fmtDate(r.at, "MMM d, yyyy")}</span>
                  </p>
                  <p className="mt-0.5 text-ink">{r.body}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {tab === "jobs" && (
        <Card className="divide-y divide-line">
          {jobs.map((j) => (
            <Link key={j.id} href={`/admin/job/?id=${j.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-[13.5px] hover:bg-canvas">
              <div>
                <p className="font-medium text-ink">
                  {j.number} · {j.date ? fmtDate(j.date, "MMM d, yyyy") : "Not scheduled"}
                </p>
                <p className="text-muted">
                  {j.date ? fmtWindow(j.arrivalStart, j.arrivalEnd) : ""} {j.crewId ? `· ${ix.crew.get(j.crewId)?.name}` : ""} {j.planId ? "· plan visit" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="num text-ink">{money(j.total)}</span>
                <Badge tone={JOB_TONE[j.status].tone}>{JOB_TONE[j.status].label}</Badge>
              </div>
            </Link>
          ))}
        </Card>
      )}

      {tab === "billing" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Invoices" sub={c.cardOnFile ? `${c.cardOnFile.brand} ${c.cardOnFile.last4} on file` : "No card on file"} />
            {invoices.map((i) => {
              const st = invoiceState(i, d.today);
              return (
                <div key={i.id} className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13.5px]">
                  <span className="text-ink">
                    {i.number} · {fmtDate(i.issuedOn, "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="num">{money(i.total)}</span>
                    <Badge tone={INVOICE_TONE[st].tone}>{INVOICE_TONE[st].label}</Badge>
                  </span>
                </div>
              );
            })}
          </Card>
          <Card>
            <CardHeader title="Payments" />
            {[...payments].sort((a, b) => (a.at < b.at ? 1 : -1)).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13.5px]">
                <span className="text-ink capitalize">
                  {fmtDate(p.at, "MMM d")} · {p.method.replace(/_/g, " ")}
                  {p.failureReason ? <span className="text-bad"> · {p.failureReason}</span> : ""}
                </span>
                <span className={`num ${p.status === "failed" ? "text-bad line-through" : ""}`}>{money(p.amount)}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "messages" && (
        <Card className="p-4">
          <div className="mx-auto flex max-w-xl flex-col gap-2">
            {msgs.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.direction === "out" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] ${m.direction === "out" ? "rounded-br-md bg-navy-900 text-white" : "rounded-bl-md bg-canvas text-ink"}`}>{m.body}</div>
                <span className="mt-0.5 text-[11px] text-subtle">
                  {fmtDate(m.at, "MMM d, h:mm a")} · {m.direction === "out" ? `${m.trigger ? m.trigger.replace(/_/g, " ") + " · " : ""}${m.status}` : "reply"}
                </span>
              </div>
            ))}
            {!msgs.length && <p className="py-6 text-center text-[13.5px] text-muted">No texts yet.</p>}
          </div>
        </Card>
      )}

      {tab === "credit" && (
        <Card>
          <CardHeader title={`Referral code ${c.referralCode}`} sub={`${money(credit.available)} available · ${money(credit.pending)} pending · ${money(credit.redeemed)} redeemed · ${money(credit.expired)} expired`} />
          {ledger.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13.5px]">
              <span className="text-ink">
                {fmtDate(e.at, "MMM d, yyyy")} · {e.memo}{" "}
                <span className="text-muted">
                  ({e.from} → {e.to})
                </span>
              </span>
              <span className="num">{money(e.amount)}</span>
            </div>
          ))}
          {!ledger.length && <p className="border-t border-line px-5 py-6 text-center text-[13.5px] text-muted">No credit activity.</p>}
        </Card>
      )}

      <TextSheet
        open={textOpen}
        onClose={() => setTextOpen(false)}
        name={c.contactName.split(" ")[0]!}
        onSend={(body) => dispatch({ t: "message.send", message: { id: newId("m"), customerId: c.id, to: c.phone, direction: "out", body, status: "delivered", at: businessNow() } })}
      />
      {planOpen && (
        <OfferPlan
          base={subtotal(lastLines)}
          onClose={() => setPlanOpen(false)}
          onCreate={(cad) => {
            const prop = props[0]!;
            const months = cad === "quarterly" ? 3 : cad === "semiannual" ? 6 : 12;
            const lastDone = jobs.find((j) => j.status === "completed");
            const plan: ServicePlan = {
              id: newId("pl"),
              customerId: c.id,
              propertyId: prop.id,
              cadence: cad,
              status: "active",
              lines: lastLines,
              pricePerVisit: Math.round(subtotal(lastLines) * (1 - PLAN_DISCOUNT[cad])),
              discountPct: PLAN_DISCOUNT[cad],
              anchorDate: lastDone?.date ?? d.today,
              nextDate: shiftMonths(lastDone?.date ?? d.today, months) > d.today ? shiftMonths(lastDone?.date ?? d.today, months) : shiftMonths(d.today, 1),
              startedAt: businessNow(),
              autopay: !!c.cardOnFile,
              soldById: me?.kind === "staff" ? me.employee.id : undefined,
              events: [{ at: businessNow(), kind: "created", note: "Enrolled by office" }],
              skippedOccurrences: [],
            };
            dispatch({ t: "plan.create", plan, by: me?.kind === "staff" ? me.employee.id : undefined });
            setPlanOpen(false);
          }}
        />
      )}
    </>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className="num mt-1 truncate font-display text-xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[12px] text-muted">{sub}</p>}
    </div>
  );
}

function OfferPlan({ base, onClose, onCreate }: { base: number; onClose: () => void; onCreate: (c: PlanCadence) => void }) {
  const [cad, setCad] = useState<PlanCadence>("semiannual");
  return (
    <Sheet open onClose={onClose} title="Enroll in a plan">
      <div className="flex flex-col gap-4">
        <Field label="How often">
          <Select value={cad} onChange={(e) => setCad(e.target.value as PlanCadence)}>
            {(["quarterly", "semiannual", "annual"] as PlanCadence[]).map((x) => (
              <option key={x} value={x}>
                {CADENCE[x].label} · {money(Math.round(base * (1 - PLAN_DISCOUNT[x])))} per visit
              </option>
            ))}
          </Select>
        </Field>
        <p className="text-[13px] text-muted">Uses the scope and price of their last cleaning. The plan terms and card authorization go to the customer by text.</p>
        <Button full onClick={() => onCreate(cad)}>
          Start plan
        </Button>
      </div>
    </Sheet>
  );
}
