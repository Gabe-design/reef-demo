"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Plus } from "@phosphor-icons/react";
import { PageHeader } from "@/components/admin/shell";
import { Avatar, Badge, Button, Field, Input, Select, Sheet, Textarea } from "@/components/ui";
import { useData, useDispatch } from "@/lib/demo/hooks";
import { ESTIMATE_TONE } from "@/lib/demo/labels";
import { LEAD_SOURCES, LEAD_STAGES, type Lead, type LeadSource, type LeadStage } from "@/lib/demo/types";
import { fmtAgo, fmtDate, money, newId, businessNow } from "@/lib/demo/util";
import { NEIGHBORHOODS } from "@/lib/demo/catalog";

export default function Leads() {
  const { d, ix } = useData()!;
  const dispatch = useDispatch();
  const [open, setOpen] = useState<Lead | null>(null);
  const [adding, setAdding] = useState(false);
  const [owner, setOwner] = useState("");
  const now = businessNow();
  const leads = useMemo(() => d.leads.filter((l) => !owner || l.ownerId === owner), [d.leads, owner]);
  const stages = LEAD_STAGES.filter((s) => s.id !== "lost" && s.id !== "nurture");

  return (
    <>
      <PageHeader
        title="Leads"
        sub={`${d.leads.filter((l) => !["won", "lost"].includes(l.stage)).length} open · ${money(d.leads.filter((l) => !["won", "lost"].includes(l.stage)).reduce((s, l) => s + l.estimateValue, 0), { whole: true })} in the pipeline`}
        actions={
          <>
            <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-9 !w-auto rounded-full !text-[13px]" aria-label="Owner">
              <option value="">Everyone</option>
              {d.employees
                .filter((e) => e.role !== "worker")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </Select>
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus size={14} /> New lead
            </Button>
          </>
        }
      />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
        {stages.map((s) => {
          const list = leads.filter((l) => l.stage === s.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
          return (
            <div key={s.id} className="flex w-72 shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[13px] font-medium text-ink">{s.label}</p>
                <span className="num text-[12px] text-muted">
                  {list.length} · {money(list.reduce((x, l) => x + l.estimateValue, 0), { whole: true })}
                </span>
              </div>
              {list.map((l) => {
                const owner = ix.employee.get(l.ownerId);
                const overdue = l.nextActionDue < d.today && s.id !== "won";
                return (
                  <button key={l.id} onClick={() => setOpen(l)} className="rounded-xl bg-white p-3 text-left shadow-[0_1px_2px_rgb(3_37_65/0.08)] ring-1 ring-line transition hover:ring-sky-300">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-medium text-ink">{l.name}</p>
                      {owner && <Avatar name={owner.name} color={owner.color} size={22} />}
                    </div>
                    <p className="text-[12.5px] text-muted">
                      {l.neighborhood} · {LEAD_SOURCES[l.source]} · {fmtAgo(l.createdAt, now)}
                    </p>
                    <p className={clsx("mt-2 text-[12.5px]", overdue ? "font-medium text-bad" : "text-ink")}>
                      {s.id === "won" ? "Booked" : `${l.nextAction} · ${fmtDate(l.nextActionDue, "MMM d")}`}
                    </p>
                    <p className="num mt-1 text-[12px] text-subtle">{money(l.estimateValue, { whole: true })} est.</p>
                  </button>
                );
              })}
            </div>
          );
        })}
        <div className="flex w-60 shrink-0 flex-col gap-2 opacity-80">
          <p className="px-1 text-[13px] font-medium text-ink">Lost / nurture</p>
          {leads
            .filter((l) => l.stage === "lost" || l.stage === "nurture")
            .map((l) => (
              <button key={l.id} onClick={() => setOpen(l)} className="rounded-xl bg-white/70 p-3 text-left ring-1 ring-line">
                <p className="text-[13.5px] font-medium text-ink">{l.name}</p>
                <p className="text-[12px] text-muted">{l.stage === "lost" ? l.lostReason : l.nextAction}</p>
              </button>
            ))}
        </div>
      </div>

      {open && <LeadSheet lead={d.leads.find((x) => x.id === open.id) ?? open} onClose={() => setOpen(null)} onStage={(stage) => dispatch({ t: "lead.stage", leadId: open.id, stage }, { silent: true })} />}
      {adding && (
        <NewLead
          onClose={() => setAdding(false)}
          onSave={(l) => {
            dispatch({ t: "lead.create", lead: l });
            setAdding(false);
          }}
        />
      )}
    </>
  );
}

function LeadSheet({ lead, onClose, onStage }: { lead: Lead; onClose: () => void; onStage: (s: LeadStage) => void }) {
  const { d, ix } = useData()!;
  const dispatch = useDispatch();
  const est = d.estimates.filter((e) => e.leadId === lead.id);
  const msgs = d.messages.filter((m) => m.leadId === lead.id).sort((a, b) => (a.at < b.at ? -1 : 1));
  return (
    <Sheet open onClose={onClose} title={lead.name} wide>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-3 text-[13.5px]">
          <p className="text-muted">
            {lead.phone}
            {lead.email ? ` · ${lead.email}` : ""}
          </p>
          <p className="text-ink">
            {lead.street}, {lead.neighborhood}
          </p>
          <p className="text-muted">
            {LEAD_SOURCES[lead.source]}
            {lead.referralCode ? ` · code ${lead.referralCode}` : ""} · owner {ix.employee.get(lead.ownerId)?.name}
          </p>
          {lead.message && <p className="rounded-xl bg-canvas p-3 text-ink">&ldquo;{lead.message}&rdquo;</p>}
          <Field label="Stage">
            <Select value={lead.stage} onChange={(e) => onStage(e.target.value as LeadStage)}>
              {LEAD_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          {est.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border border-line p-3">
              <div>
                <p className="font-medium text-ink">
                  {e.number} · rev {e.revision}
                </p>
                <p className="text-[12.5px] text-muted">
                  {money(e.total)} · expires {fmtDate(e.expiresOn, "MMM d")}
                  {e.planOffer ? " · plan offered" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={ESTIMATE_TONE[e.status].tone}>{ESTIMATE_TONE[e.status].label}</Badge>
                {e.status === "draft" && (
                  <Button size="sm" onClick={() => dispatch({ t: "estimate.status", estimateId: e.id, status: "sent" })}>
                    Send
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-canvas p-3">
          <p className="text-[12px] font-medium text-muted">Conversation</p>
          {msgs.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.direction === "out" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-[13px] ${m.direction === "out" ? "rounded-br-md bg-navy-900 text-white" : "rounded-bl-md bg-white text-ink"}`}>{m.body}</div>
              <span className="mt-0.5 text-[10.5px] text-subtle">{fmtDate(m.at, "MMM d, h:mm a")}</span>
            </div>
          ))}
          {!msgs.length && <p className="py-4 text-center text-[13px] text-muted">No texts yet.</p>}
        </div>
      </div>
    </Sheet>
  );
}

function NewLead({ onClose, onSave }: { onClose: () => void; onSave: (l: Lead) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hood, setHood] = useState("Pacific Beach");
  const [source, setSource] = useState<LeadSource>("google");
  const [note, setNote] = useState("");
  return (
    <Sheet open onClose={onClose} title="New lead">
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Mobile">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Neighborhood">
            <Select value={hood} onChange={(e) => setHood(e.target.value)}>
              {NEIGHBORHOODS.map((n) => (
                <option key={n.name}>{n.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Source">
            <Select value={source} onChange={(e) => setSource(e.target.value as LeadSource)}>
              {Object.entries(LEAD_SOURCES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button
          full
          disabled={name.trim().length < 2 || phone.replace(/\D/g, "").length < 10}
          onClick={() =>
            onSave({
              id: newId("l"),
              name: name.trim(),
              phone,
              street: "",
              neighborhood: hood,
              source,
              stage: "new",
              ownerId: "e_dana",
              createdAt: businessNow(),
              nextAction: "Call or text back",
              nextActionDue: businessNow().slice(0, 10),
              estimateValue: 0,
              services: ["ext", "int"],
              message: note || undefined,
            })
          }
        >
          Add lead and send auto-reply
        </Button>
      </div>
    </Sheet>
  );
}
