"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Gift, Handshake, Sparkle } from "@phosphor-icons/react";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/motion";
import { useData } from "@/lib/demo/hooks";
import { REFERRAL_POLICY } from "@/lib/demo/catalog";
import { money } from "@/lib/demo/util";

export default function ReferPage() {
  return (
    <Suspense fallback={null}>
      <Refer />
    </Suspense>
  );
}

function Refer() {
  const code = useSearchParams().get("code")?.toUpperCase() ?? "";
  const data = useData();
  const referrer = code && data ? data.d.customers.find((c) => c.referralCode === code) : null;
  const give = money(REFERRAL_POLICY.newCustomerDiscount, { whole: true });
  const get = money(REFERRAL_POLICY.reward, { whole: true });

  if (code) {
    return (
      <section className="mx-auto max-w-3xl px-4 pt-36 pb-28 text-center md:pt-48">
        <Reveal>
          <Gift size={44} weight="duotone" className="mx-auto text-sky-600" />
          <h1 className="mt-6 font-display text-5xl leading-[0.95] font-light text-navy-900 uppercase md:text-7xl">{give} off your first cleaning</h1>
          <p className="mx-auto mt-6 max-w-md text-[17px] text-navy-900/75">
            {referrer ? `${referrer.contactName.split(" ")[0]} sent you.` : "A friend sent you."} Book with this link and the discount is applied to your first visit automatically.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={`/book/?ref=${code}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-navy-900 px-6 text-[15px] font-medium text-white hover:bg-navy-800">
              Book online <ArrowRight size={16} />
            </Link>
            <Link href={`/quote/?ref=${code}`} className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[15px] font-medium text-navy-900 shadow-soft">
              Get a quote first
            </Link>
          </div>
          <p className="mt-6 text-[13px] text-muted">Code {code} · new customers only</p>
        </Reveal>
      </section>
    );
  }

  return (
    <>
      <PageHero title="Refer & earn" sub={`Every Reef customer has a personal link. Friends get ${give} off their first cleaning, and you get ${get} in Reef Credit once they're cleaned and paid.`} />
      <section className="mx-auto max-w-7xl px-4 pb-28 md:px-8">
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
          {[
            { icon: Handshake, title: "Share your link", body: "Find it in your Reef account, or ask the crew. Text it, post it on Nextdoor, whatever works.", tone: "bg-navy-900 text-white" },
            { icon: Sparkle, title: `They save ${give}`, body: "Their discount is applied to their first cleaning automatically. No codes to remember.", tone: "bg-white" },
            { icon: Gift, title: `You get ${get}`, body: "Credit shows as pending when they book and becomes yours when their first cleaning is paid.", tone: "bg-sky-100" },
          ].map(({ icon: Icon, title, body, tone }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className={`flex h-full flex-col rounded-[28px] p-7 ${tone}`}>
                <Icon size={30} weight="duotone" className={i === 0 ? "text-sky-300" : "text-sky-700"} />
                <h2 className={`mt-10 font-display text-3xl font-light ${i === 0 ? "text-white" : "text-navy-900"}`}>{title}</h2>
                <p className={`mt-3 text-[15.5px] leading-relaxed ${i === 0 ? "text-white/75" : "text-muted"}`}>{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-navy-900/10 pt-10 md:flex-row md:items-center">
            <p className="max-w-xl text-[15px] leading-relaxed text-muted">
              Credit is applied to your next cleaning automatically and expires {REFERRAL_POLICY.expiryMonths} months after it&apos;s earned. It can&apos;t be exchanged for cash. One reward per new customer.
            </p>
            <Link href="/login/" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-navy-900 px-6 text-[15px] font-medium text-white hover:bg-navy-800">
              Find my link <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
