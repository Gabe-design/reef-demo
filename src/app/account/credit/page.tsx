"use client";

import { useState } from "react";
import { Copy, Gift, ShareNetwork } from "@phosphor-icons/react";
import { Badge, Button, Card } from "@/components/ui";
import { useData, useMe } from "@/lib/demo/hooks";
import { creditBalances } from "@/lib/demo/select";
import { REFERRAL_POLICY } from "@/lib/demo/catalog";
import { fmtDate, money } from "@/lib/demo/util";

const BUCKET_LABEL: Record<string, string> = {
  pending: "Pending",
  available: "Available",
  reserved: "Held",
  redeemed: "Used",
  expired: "Expired",
  revoked: "Reversed",
};

export default function Credit() {
  const data = useData()!;
  const me = useMe();
  const [copied, setCopied] = useState(false);
  if (me?.kind !== "customer") return null;
  const { d } = data;
  const c = me.customer;
  const bal = creditBalances(d.credit, c.id);
  const ledger = d.credit.filter((e) => e.customerId === c.id).sort((a, b) => (a.at < b.at ? 1 : -1));
  const refs = d.referrals.filter((r) => r.referrerId === c.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const link = `${typeof window === "undefined" ? "" : window.location.origin}/r/${c.referralCode}`;
  const expiring = ledger.filter((e) => e.to === "available" && e.expiresOn).sort((a, b) => (a.expiresOn! < b.expiresOn! ? -1 : 1))[0];

  const share = async () => {
    const text = `I use Reef for my windows. Book with my link and get ${money(REFERRAL_POLICY.newCustomerDiscount, { whole: true })} off your first cleaning: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {}
    }
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-light text-navy-900">Reef Credit</h1>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="relative overflow-hidden bg-navy-900 p-6 text-white">
          <Gift size={28} weight="duotone" className="text-sky-300" />
          <p className="mt-4 text-[13px] text-white/70">Available to use</p>
          <p className="num font-display text-5xl font-light">{money(bal.available)}</p>
          <p className="mt-2 text-[13.5px] text-white/70">
            {bal.pending ? `${money(bal.pending)} pending · ` : ""}
            {money(bal.redeemed)} used so far
            {expiring && bal.available > 0 ? ` · oldest credit expires ${fmtDate(expiring.expiresOn!, "MMM d, yyyy")}` : ""}
          </p>
          <p className="mt-4 text-[13px] text-white/60">Applied automatically to your next cleaning. Credit can&apos;t be cashed out.</p>
        </Card>
        <Card className="flex flex-col p-6">
          <p className="font-display text-lg font-semibold text-ink">
            Give {money(REFERRAL_POLICY.newCustomerDiscount, { whole: true })}, get {money(REFERRAL_POLICY.reward, { whole: true })}
          </p>
          <p className="mt-1 text-[14px] text-muted">Friends save on their first cleaning. You earn credit once they&apos;ve been cleaned and paid.</p>
          <div className="mt-4 rounded-xl bg-canvas px-3 py-2.5 font-mono text-[13px] break-all text-ink">{link}</div>
          <p className="mt-1.5 text-[12.5px] text-muted">
            Or share your code: <span className="font-mono font-medium text-ink">{c.referralCode}</span>
          </p>
          <div className="mt-auto flex gap-2 pt-4">
            <Button full onClick={share}>
              <ShareNetwork size={16} /> Share link
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(link).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
            >
              <Copy size={16} /> {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </Card>
      </div>

      <section>
        <h2 className="mb-2 text-[13px] font-medium text-muted">Your referrals</h2>
        <Card className="divide-y divide-line">
          {refs.length ? (
            refs.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
                <div>
                  <p className="text-ink">{r.referredName.split(" ")[0]} {r.referredName.split(" ")[1]?.[0]}.</p>
                  <p className="text-[12.5px] text-muted">Referred {fmtDate(r.createdAt, "MMM d, yyyy")}</p>
                </div>
                <Badge tone={r.status === "qualified" ? "ok" : r.status === "booked" ? "sky" : r.status === "lead" ? "neutral" : "warn"}>
                  {r.status === "qualified" ? `Earned ${money(r.reward, { whole: true })}` : r.status === "booked" ? "Booked, pending" : r.status === "lead" ? "Requested a quote" : "Didn't book"}
                </Badge>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-center text-[14px] text-muted">No referrals yet. Share your link to start earning.</p>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-medium text-muted">Credit activity</h2>
        <Card className="divide-y divide-line">
          {ledger.length ? (
            ledger.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
                <div>
                  <p className="text-ink">{e.memo}</p>
                  <p className="text-[12.5px] text-muted">
                    {fmtDate(e.at, "MMM d, yyyy")} · {e.from === "program" ? "Added" : BUCKET_LABEL[e.from]} → {BUCKET_LABEL[e.to]}
                    {e.expiresOn ? ` · expires ${fmtDate(e.expiresOn, "MMM d, yyyy")}` : ""}
                  </p>
                </div>
                <span className={`num font-medium ${e.to === "available" ? "text-ok" : e.to === "redeemed" ? "text-ink" : "text-muted"}`}>
                  {e.to === "redeemed" || e.to === "expired" ? "-" : "+"}
                  {money(e.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-center text-[14px] text-muted">No credit activity yet.</p>
          )}
        </Card>
      </section>
    </div>
  );
}
