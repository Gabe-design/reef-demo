"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Circle, NoteBlank, WarningCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/admin/shell";
import { Avatar, Badge, Button, Card, CardHeader, Empty } from "@/components/ui";
import { BeforeAfter } from "@/components/portal";
import { useData, useDispatch, useMe } from "@/lib/demo/hooks";
import { INVOICE_TONE, JOB_TONE, invoiceState } from "@/lib/demo/labels";
import { fmtDate, fmtTime, fmtWindow, lineTotal, money } from "@/lib/demo/util";

export default function JobPage() {
  return (
    <Suspense fallback={null}>
      <JobDetail />
    </Suspense>
  );
}

function JobDetail() {
  const id = useSearchParams().get("id") ?? "";
  const { d, ix } = useData()!;
  const me = useMe();
  const dispatch = useDispatch();
  const j = ix.job.get(id);
  if (!j) return <Empty title="Job not found" action={<Link href="/admin/jobs/" className="text-sky-700">Back to jobs</Link>} />;
  const c = ix.customer.get(j.customerId)!;
  const p = ix.property.get(j.propertyId)!;
  const inv = j.invoiceId ? ix.invoice.get(j.invoiceId) : undefined;
  const plan = j.planId ? ix.plan.get(j.planId) : undefined;
  const before = j.photos.filter((x) => x.kind === "before");
  const after = j.photos.filter((x) => x.kind === "after");
  const msgs = d.messages.filter((m) => m.customerId === c.id && j.date && m.at.slice(0, 10) >= j.date.slice(0, 8) + "01").slice(0, 8);
  const by = me?.kind === "staff" ? me.employee.id : undefined;

  return (
    <>
      <Link href="/admin/jobs/" className="mb-3 inline-flex items-center gap-1 text-[13.5px] text-muted hover:text-ink">
        <ArrowLeft size={14} /> Jobs
      </Link>
      <PageHeader
        title={`${j.number} · ${c.name}`}
        sub={
          <span>
            {j.date ? `${fmtDate(j.date, "EEEE, MMM d")} · arrive ${fmtWindow(j.arrivalStart, j.arrivalEnd)}` : "Not scheduled yet"} · {p.street}, {p.neighborhood}
          </span>
        }
        actions={
          <>
            <Badge tone={JOB_TONE[j.status].tone} className="!px-3 !py-1 !text-[13px]">
              {JOB_TONE[j.status].label}
            </Badge>
            {j.status === "in_progress" && (
              <Button size="sm" onClick={() => dispatch({ t: "job.status", jobId: j.id, status: "completed", by })}>
                Complete (manager override)
              </Button>
            )}
            <Link href={`/admin/customer/?id=${c.id}`} className="inline-flex h-8 items-center rounded-full border border-line bg-white px-3.5 text-[13px] font-medium text-ink hover:bg-navy-50">
              Customer
            </Link>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Scope and price" sub={plan ? `Plan visit #${(j.occurrence ?? 0) + 1} · ${Math.round(plan.discountPct * 100)}% plan discount` : "One-time cleaning"} />
            <table className="w-full text-[13.5px]">
              <tbody>
                {j.lines.map((l) => (
                  <tr key={l.serviceId} className="border-t border-line">
                    <td className="px-5 py-2.5 text-ink">{d.services.find((s) => s.id === l.serviceId)?.name}</td>
                    <td className="num px-3 py-2.5 text-right text-muted">{l.serviceId === "callout" ? "" : `${l.qty} × ${money(l.unitPrice)}`}</td>
                    <td className="num px-5 py-2.5 text-right text-ink">{money(lineTotal(l))}</td>
                  </tr>
                ))}
                {j.discount > 0 && (
                  <tr className="border-t border-line">
                    <td className="px-5 py-2.5 text-muted" colSpan={2}>
                      Discounts
                    </td>
                    <td className="num px-5 py-2.5 text-right text-ok">-{money(j.discount)}</td>
                  </tr>
                )}
                <tr className="border-t border-line">
                  <td className="px-5 py-3 font-medium text-ink" colSpan={2}>
                    Total (tax not applied)
                  </td>
                  <td className="num px-5 py-3 text-right font-display text-lg font-semibold text-ink">{money(j.total)}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          <Card>
            <CardHeader title="Photos" sub={`${before.length} before · ${after.length} after`} />
            <div className="px-5 pb-5">
              {before[0] && after[0] ? (
                <BeforeAfter before={before[0]} after={after[0]} />
              ) : j.photos.length ? (
                <div className="flex gap-2">
                  {j.photos.map((ph) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={ph.id} src={ph.src} alt={ph.kind} className="size-28 rounded-xl object-cover" />
                  ))}
                </div>
              ) : (
                <p className="text-[13.5px] text-muted">Photos are added by the crew on site.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Texts around this visit" />
            {msgs.length ? (
              msgs.map((m) => (
                <div key={m.id} className="border-t border-line px-5 py-2.5 text-[13px]">
                  <p className="text-ink">{m.body}</p>
                  <p className="text-[11.5px] text-subtle">
                    {fmtDate(m.at, "MMM d, h:mm a")} · {m.direction === "in" ? "customer reply" : `${m.trigger?.replace(/_/g, " ") ?? "manual"} · ${m.status}`}
                  </p>
                </div>
              ))
            ) : (
              <p className="border-t border-line px-5 py-4 text-[13px] text-muted">No texts yet.</p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <p className="mb-3 text-[12.5px] text-muted">Crew</p>
            {j.assigneeIds.length ? (
              j.assigneeIds.map((a) => {
                const e = ix.employee.get(a)!;
                return (
                  <p key={a} className="mb-2 flex items-center gap-2 text-[14px] text-ink">
                    <Avatar name={e.name} color={e.color} size={26} /> {e.name}
                  </p>
                );
              })
            ) : (
              <p className="text-[13.5px] text-muted">Not assigned</p>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-muted">Started</p>
                <p className="font-medium text-ink">{j.startedAt ? fmtTime(j.startedAt.slice(11, 16)) : "-"}</p>
              </div>
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-muted">Finished</p>
                <p className="font-medium text-ink">{j.completedAt ? fmtTime(j.completedAt.slice(11, 16)) : "-"}</p>
              </div>
            </div>
            {j.soldById && <p className="mt-3 text-[12.5px] text-muted">Sold by {ix.employee.get(j.soldById)?.name}</p>}
          </Card>

          <Card className="p-5">
            <p className="mb-2 text-[12.5px] text-muted">
              Checklist · {j.checklist.filter((x) => x.done).length}/{j.checklist.length}
            </p>
            {j.checklist.map((x, i) => (
              <p key={i} className="flex items-center gap-2 py-1 text-[13.5px] text-ink">
                {x.done ? <CheckCircle size={18} weight="fill" className="text-ok" /> : <Circle size={18} className="text-subtle" />} {x.label}
              </p>
            ))}
          </Card>

          {(j.notes.length > 0 || j.issues.length > 0) && (
            <Card className="p-5">
              <p className="mb-2 text-[12.5px] text-muted">Notes and problems</p>
              {j.issues.map((i) => (
                <div key={i.id} className="flex items-start justify-between gap-2 py-1.5 text-[13.5px]">
                  <p className="flex gap-2 text-ink">
                    <WarningCircle size={17} className="mt-0.5 shrink-0 text-warn" /> <span className="capitalize">{i.kind}:</span> {i.body}
                  </p>
                </div>
              ))}
              {j.notes.map((n) => (
                <p key={n.id} className="flex gap-2 py-1.5 text-[13.5px] text-ink">
                  <NoteBlank size={17} className="mt-0.5 shrink-0 text-muted" /> {n.body}
                  <span className="ml-auto shrink-0 text-[11.5px] text-subtle">{ix.employee.get(n.byId)?.name.split(" ")[0]}</span>
                </p>
              ))}
            </Card>
          )}

          <Card className="p-5">
            <p className="mb-2 text-[12.5px] text-muted">Invoice</p>
            {inv ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{inv.number}</p>
                  <p className="text-[12.5px] text-muted">
                    Issued {fmtDate(inv.issuedOn, "MMM d")} · {money(inv.paid)} of {money(inv.total)} paid
                    {inv.credit ? ` · ${money(inv.credit)} Reef Credit` : ""}
                  </p>
                </div>
                <Badge tone={INVOICE_TONE[invoiceState(inv, d.today)].tone}>{INVOICE_TONE[invoiceState(inv, d.today)].label}</Badge>
              </div>
            ) : (
              <p className="text-[13.5px] text-muted">Created automatically when the job is completed.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
