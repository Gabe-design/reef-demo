"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/shell";
import { ListTable } from "@/components/admin/list";
import { Badge, Button, Segmented, StatTile } from "@/components/ui";
import { useData, useDispatch } from "@/lib/demo/hooks";
import { INVOICE_TONE, invoiceState } from "@/lib/demo/labels";
import { fmtDate, money, shiftDate } from "@/lib/demo/util";

type Tab = "invoices" | "payments" | "failed";

export default function Billing() {
  const { d, ix } = useData()!;
  const dispatch = useDispatch();
  const [tab, setTab] = useState<Tab>("invoices");
  const [f, setF] = useState<"open" | "overdue" | "paid" | "all">("open");
  const open = d.invoices.filter((i) => i.status === "open");
  const overdue = open.filter((i) => i.dueOn < d.today);
  const month = d.today.slice(0, 7);
  const collected = d.payments.filter((p) => p.status === "succeeded" && p.at.startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const failed = d.payments.filter((p) => p.status === "failed");
  const invRows = d.invoices.filter((i) => {
    const st = invoiceState(i, d.today);
    return f === "all" ? i.issuedOn >= shiftDate(d.today, -120) : f === "overdue" ? st === "overdue" : f === "open" ? i.status === "open" : st === "paid" && i.issuedOn >= shiftDate(d.today, -60);
  });

  return (
    <>
      <PageHeader title="Billing" sub="Invoices, payments and collections. Cards are stored by Stripe, never by Reef." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Collected this month" value={money(collected, { whole: true })} />
        <StatTile label="Open invoices" value={money(open.reduce((s, i) => s + i.total - i.paid, 0), { whole: true })} sub={`${open.length} invoices`} />
        <StatTile label="Overdue" value={money(overdue.reduce((s, i) => s + i.total - i.paid, 0), { whole: true })} sub={`${overdue.length} past due date`} tone={overdue.length ? "bad" : "neutral"} />
        <StatTile label="Failed card payments" value={failed.length} sub="Customer gets a secure update link" tone={failed.length ? "bad" : "neutral"} />
      </div>
      <div className="mb-3">
        <Segmented value={tab} onChange={setTab} options={[{ value: "invoices", label: "Invoices" }, { value: "payments", label: "Payments" }, { value: "failed", label: `Failed (${failed.length})` }]} />
      </div>
      {tab === "invoices" && (
        <ListTable
          rows={invRows}
          search={(i) => `${i.number} ${ix.customer.get(i.customerId)?.name}`}
          exportName="reef-invoices"
          initialSort={{ key: "issued", dir: -1 }}
          toolbar={<Segmented size="sm" value={f} onChange={setF} options={[{ value: "open", label: "Open" }, { value: "overdue", label: "Overdue" }, { value: "paid", label: "Paid" }, { value: "all", label: "All" }]} />}
          cols={[
            { key: "num", label: "Invoice", render: (i) => `${i.number} · ${ix.customer.get(i.customerId)?.name}`, sort: (i) => i.number, csv: (i) => i.number },
            { key: "issued", label: "Issued", render: (i) => fmtDate(i.issuedOn, "MMM d"), sort: (i) => i.issuedOn },
            { key: "due", label: "Due", render: (i) => fmtDate(i.dueOn, "MMM d"), sort: (i) => i.dueOn, hideOnMobile: true },
            { key: "adj", label: "Discount / credit", render: (i) => (i.discount || i.credit ? `${money(i.discount + i.credit)}` : "-"), hideOnMobile: true },
            {
              key: "status",
              label: "Status",
              render: (i) => {
                const st = invoiceState(i, d.today);
                return (
                  <span className="flex items-center gap-2">
                    <Badge tone={INVOICE_TONE[st].tone}>{INVOICE_TONE[st].label}</Badge>
                    {i.status === "open" && (
                      <Button size="sm" variant="ghost" onClick={() => dispatch({ t: "invoice.pay", invoiceId: i.id, method: "check", useCredit: false })}>
                        Record payment
                      </Button>
                    )}
                  </span>
                );
              },
              sort: (i) => invoiceState(i, d.today),
              csv: (i) => invoiceState(i, d.today),
            },
            { key: "total", label: "Total", render: (i) => money(i.total), sort: (i) => i.total, csv: (i) => (i.total / 100).toFixed(2), align: "right" },
          ]}
        />
      )}
      {tab !== "invoices" && (
        <ListTable
          rows={(tab === "failed" ? failed : d.payments.filter((p) => p.at >= shiftDate(d.today, -60))).slice()}
          search={(p) => `${ix.customer.get(p.customerId)?.name} ${p.method}`}
          exportName="reef-payments"
          initialSort={{ key: "at", dir: -1 }}
          cols={[
            { key: "cust", label: "Customer", render: (p) => ix.customer.get(p.customerId)?.name, sort: (p) => ix.customer.get(p.customerId)?.name ?? "" },
            { key: "at", label: "Date", render: (p) => fmtDate(p.at, "MMM d, h:mm a"), sort: (p) => p.at },
            { key: "method", label: "Method", render: (p) => `${p.method.replace(/_/g, " ")}${p.last4 ? ` · ${p.brand} ${p.last4}` : ""}`, sort: (p) => p.method },
            { key: "inv", label: "Invoice", render: (p) => ix.invoice.get(p.invoiceId ?? "")?.number ?? "-", hideOnMobile: true },
            { key: "status", label: "Result", render: (p) => (p.status === "failed" ? <Badge tone="bad">{p.failureReason ?? "Failed"}</Badge> : <Badge tone="ok">Succeeded</Badge>), sort: (p) => p.status, csv: (p) => p.status },
            { key: "amt", label: "Amount", render: (p) => money(p.amount), sort: (p) => p.amount, csv: (p) => (p.amount / 100).toFixed(2), align: "right" },
          ]}
        />
      )}
    </>
  );
}
