"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChatCircleDots, Info } from "@phosphor-icons/react";
import { PageHeader } from "@/components/admin/shell";
import { ListTable } from "@/components/admin/list";
import { Badge, Button, Card, Segmented, StatTile, Textarea } from "@/components/ui";
import { useData, useDispatch } from "@/lib/demo/hooks";
import { fmtAgo, fmtDate, newId, pct, shiftDate, businessNow } from "@/lib/demo/util";

type Tab = "inbox" | "log" | "automations";

export default function Messages() {
  const { d, ix } = useData()!;
  const dispatch = useDispatch();
  const [tab, setTab] = useState<Tab>("inbox");
  const [sel, setSel] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const now = businessNow();
  const since = shiftDate(d.today, -30);
  const out = d.messages.filter((m) => m.direction === "out" && m.at >= since);
  const delivered = out.filter((m) => m.status === "delivered").length;
  const failed = out.filter((m) => m.status === "failed" || m.status === "undelivered").length;

  const threads = useMemo(() => {
    const m = new Map<string, typeof d.messages>();
    d.messages.forEach((x) => {
      const k = x.customerId ?? x.leadId;
      if (!k) return;
      m.set(k, [...(m.get(k) ?? []), x]);
    });
    return [...m.entries()]
      .filter(([, list]) => list.some((x) => x.direction === "in"))
      .map(([k, list]) => ({ k, list: list.sort((a, b) => (a.at < b.at ? -1 : 1)), last: list.reduce((a, b) => (a.at > b.at ? a : b)) }))
      .sort((a, b) => (a.last.at < b.last.at ? 1 : -1));
  }, [d]);
  const name = (k: string) => ix.customer.get(k)?.name ?? ix.lead.get(k)?.name ?? k;
  const thread = threads.find((t) => t.k === (sel ?? threads[0]?.k));

  return (
    <>
      <PageHeader title="Messages" sub="Two-way texting, delivery tracking and automations" actions={<Segmented value={tab} onChange={setTab} options={[{ value: "inbox", label: "Inbox" }, { value: "log", label: "Sent log" }, { value: "automations", label: "Automations" }]} />} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Texts sent (30 days)" value={out.length} />
        <StatTile label="Delivered" value={pct(out.length ? delivered / out.length : null)} sub={`${failed} failed or undelivered`} />
        <StatTile label="Link clicks" value={pct(out.length ? out.filter((m) => m.clicked).length / out.length : null)} sub="Some clicks are link scanners" />
        <StatTile label="Opened" value="N/A" sub="SMS has no read receipts" />
      </div>

      {tab === "inbox" && (
        <Card className="grid min-h-[520px] overflow-hidden md:grid-cols-[300px_1fr]">
          <ul className="max-h-[560px] divide-y divide-line overflow-y-auto border-b border-line md:border-r md:border-b-0">
            {threads.map((t) => (
              <li key={t.k}>
                <button onClick={() => setSel(t.k)} className={clsx("w-full px-4 py-3 text-left", thread?.k === t.k ? "bg-sky-50" : "hover:bg-canvas")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13.5px] font-medium text-ink">{name(t.k)}</span>
                    <span className="shrink-0 text-[11.5px] text-subtle">{fmtAgo(t.last.at, now)}</span>
                  </div>
                  <p className="truncate text-[12.5px] text-muted">{t.last.body}</p>
                </button>
              </li>
            ))}
          </ul>
          {thread ? (
            <div className="flex flex-col">
              <div className="border-b border-line px-5 py-3">
                <p className="font-medium text-ink">{name(thread.k)}</p>
                <p className="text-[12.5px] text-muted">{thread.last.to}</p>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-5">
                {thread.list.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.direction === "out" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13.5px] ${m.direction === "out" ? "rounded-br-md bg-navy-900 text-white" : "rounded-bl-md bg-canvas text-ink"}`}>{m.body}</div>
                    <span className="mt-0.5 text-[11px] text-subtle">
                      {fmtDate(m.at, "MMM d, h:mm a")}
                      {m.direction === "out" ? ` · ${m.trigger ? m.trigger.replace(/_/g, " ") : "manual"} · ${m.status}` : ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-line p-3">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" className="!min-h-11 flex-1" />
                <Button
                  disabled={!reply.trim()}
                  onClick={() => {
                    dispatch({ t: "message.send", message: { id: newId("m"), customerId: ix.customer.has(thread.k) ? thread.k : undefined, leadId: ix.lead.has(thread.k) ? thread.k : undefined, to: thread.last.to, direction: "out", body: reply.trim(), status: "delivered", at: businessNow() } }, { silent: true });
                    setReply("");
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid place-items-center text-muted">
              <ChatCircleDots size={28} />
            </div>
          )}
        </Card>
      )}

      {tab === "log" && (
        <ListTable
          rows={d.messages.filter((m) => m.at >= since)}
          search={(m) => `${m.body} ${m.trigger ?? ""} ${m.customerId ? ix.customer.get(m.customerId)?.name : ""}`}
          exportName="reef-messages"
          initialSort={{ key: "at", dir: -1 }}
          cols={[
            { key: "to", label: "Recipient", render: (m) => (m.customerId ? ix.customer.get(m.customerId)?.name : m.leadId ? ix.lead.get(m.leadId)?.name : m.to), sort: (m) => m.to },
            { key: "at", label: "Time", render: (m) => fmtDate(m.at, "MMM d, h:mm a"), sort: (m) => m.at },
            { key: "trig", label: "Type", render: (m) => (m.direction === "in" ? "Reply" : m.trigger ? (d.automations.find((a) => a.id === m.trigger)?.name ?? m.trigger) : "Manual"), sort: (m) => m.trigger ?? "" },
            { key: "body", label: "Message", render: (m) => <span className="line-clamp-1 max-w-md">{m.body}</span>, hideOnMobile: true },
            {
              key: "st",
              label: "Status",
              render: (m) => <Badge tone={m.status === "delivered" ? "ok" : m.status === "received" ? "sky" : m.status === "sent" ? "neutral" : "bad"}>{m.status}{m.clicked ? " · clicked" : ""}</Badge>,
              sort: (m) => m.status,
              csv: (m) => m.status,
            },
          ]}
        />
      )}

      {tab === "automations" && (
        <div className="grid gap-3 lg:grid-cols-2">
          {d.automations.map((a) => {
            const sent = out.filter((m) => m.trigger === a.id).length;
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{a.name}</p>
                    <p className="text-[12.5px] text-muted">
                      {a.trigger} · {a.timing} · {sent} sent in 30 days
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={a.enabled}
                    aria-label={`${a.name} automation`}
                    onClick={() => dispatch({ t: "automation.toggle", automationId: a.id }, { silent: true })}
                    className={clsx("relative h-6 w-11 shrink-0 rounded-full transition", a.enabled ? "bg-ok" : "bg-navy-100")}
                  >
                    <span className={clsx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", a.enabled ? "left-[22px]" : "left-0.5")} />
                  </button>
                </div>
                <p className="mt-3 rounded-xl bg-canvas p-3 text-[13px] leading-relaxed text-ink">{a.template}</p>
              </Card>
            );
          })}
          <Card className="flex items-start gap-2 p-4 text-[12.5px] text-muted lg:col-span-2">
            <Info size={16} className="mt-0.5 shrink-0" /> Every send re-checks the customer&apos;s consent, quiet hours (8 PM - 8 AM) and whether the appointment changed. Replies pause the sequence and land in the inbox. STOP opts the number out.
          </Card>
        </div>
      )}
    </>
  );
}
