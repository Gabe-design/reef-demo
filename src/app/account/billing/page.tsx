"use client";

import { useState } from "react";
import { CreditCard, DownloadSimple } from "@phosphor-icons/react";
import { Badge, Button, Card, Sheet } from "@/components/ui";
import { CheckoutSheet } from "@/components/portal";
import { useData, useDispatch, useMe } from "@/lib/demo/hooks";
import { INVOICE_TONE, invoiceState } from "@/lib/demo/labels";
import { creditBalances } from "@/lib/demo/select";
import { fmtDate, money } from "@/lib/demo/util";
import { download } from "@/lib/demo/csv";
import type { Invoice } from "@/lib/demo/types";

export default function Billing() {
  const data = useData()!;
  const me = useMe();
  const dispatch = useDispatch();
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  if (me?.kind !== "customer") return null;
  const { d, ix } = data;
  const c = me.customer;
  const invoices = [...(ix.invoicesByCustomer.get(c.id) ?? [])].sort((a, b) => (a.issuedOn < b.issuedOn ? 1 : -1));
  const payments = [...(ix.paymentsByCustomer.get(c.id) ?? [])].sort((a, b) => (a.at < b.at ? 1 : -1));
  const credit = creditBalances(d.credit, c.id);

  const receipt = (i: Invoice) => {
    const lines = i.lines.map((l) => `${d.services.find((s) => s.id === l.serviceId)?.name} x${l.qty}  ${money(l.qty * l.unitPrice)}`).join("\n");
    download(
      `${i.number}.txt`,
      `Reef Window Cleaning\nInvoice ${i.number}  ${i.issuedOn}\n${c.name}\n\n${lines}\n\nDiscount -${money(i.discount)}\nReef Credit -${money(i.credit)}\nTotal ${money(i.total)}\nPaid ${money(i.paid)}\n`,
      "text/plain",
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-light text-navy-900">Billing</h1>

      <Card className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-700">
            <CreditCard size={22} weight="duotone" />
          </span>
          <div>
            <p className="font-medium text-ink">{c.cardOnFile ? `${c.cardOnFile.brand} ending ${c.cardOnFile.last4}` : "No card on file"}</p>
            <p className="text-[13px] text-muted">{c.cardOnFile ? `Expires ${c.cardOnFile.exp} · charged after each completed cleaning` : "Add one to be billed automatically after each visit"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCardOpen(true)}>
          {c.cardOnFile ? "Update card" : "Add card"}
        </Button>
      </Card>

      <section>
        <h2 className="mb-2 text-[13px] font-medium text-muted">Invoices</h2>
        <Card className="divide-y divide-line">
          {invoices.map((i) => {
            const st = invoiceState(i, d.today);
            return (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[14.5px] font-medium text-ink">
                    {i.number} <span className="font-normal text-muted">· {fmtDate(i.issuedOn, "MMM d, yyyy")}</span>
                  </p>
                  <p className="text-[12.5px] text-muted">
                    {i.discount > 0 && `${money(i.discount)} discount · `}
                    {i.credit > 0 && `${money(i.credit)} Reef Credit · `}
                    Total {money(i.total)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={INVOICE_TONE[st].tone}>{INVOICE_TONE[st].label}</Badge>
                  {i.status === "open" ? (
                    <Button size="sm" onClick={() => setPaying(i)}>
                      Pay {money(i.total - i.paid)}
                    </Button>
                  ) : (
                    <button onClick={() => receipt(i)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-navy-50" aria-label={`Download ${i.number}`}>
                      <DownloadSimple size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-medium text-muted">Payments</h2>
        <Card className="divide-y divide-line">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
              <div>
                <p className="text-ink">{fmtDate(p.at, "MMM d, yyyy")}</p>
                <p className="text-[12.5px] text-muted capitalize">
                  {p.method.replace(/_/g, " ")}
                  {p.last4 ? ` · ${p.brand} ${p.last4}` : ""}
                  {p.failureReason ? ` · ${p.failureReason}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className={`num ${p.status === "failed" ? "text-bad line-through" : "text-ink"}`}>{money(p.amount)}</p>
                {p.status === "failed" && <p className="text-[12px] text-bad">Declined</p>}
              </div>
            </div>
          ))}
        </Card>
      </section>

      <CheckoutSheet
        open={!!paying}
        invoice={paying}
        credit={credit.available}
        card={c.cardOnFile}
        onClose={() => setPaying(null)}
        onPay={(useCredit) => paying && dispatch({ t: "invoice.pay", invoiceId: paying.id, method: "online", useCredit })}
      />
      <CardSheet
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        onSave={(last4) => dispatch({ t: "customer.card", customerId: c.id, card: { brand: "Visa", last4, exp: "09/30" } }, { silent: true })}
      />
    </div>
  );
}

/** Stand-in for Stripe's hosted card setup (SetupIntent); no card data touches Reef. */
function CardSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (last4: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title="Card on file">
      <div className="flex flex-col gap-4">
        <p className="text-[14.5px] text-ink">You&apos;ll add your card on Stripe&apos;s secure page, then come right back here.</p>
        <p className="text-[12.5px] text-muted">By saving a card, you authorize Reef to charge it after each completed cleaning under your plan terms. Reef never sees or stores your full card number.</p>
        <Button
          full
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setTimeout(() => {
              onSave("4242");
              setBusy(false);
              onClose();
            }, 900);
          }}
        >
          {busy ? "Opening Stripe…" : "Continue to Stripe"}
        </Button>
      </div>
    </Sheet>
  );
}
