"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CheckCircle } from "@phosphor-icons/react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { Reveal } from "@/components/site/motion";
import { useData, useDispatch } from "@/lib/demo/hooks";
import { NEIGHBORHOODS } from "@/lib/demo/catalog";
import type { ServiceId } from "@/lib/demo/types";
import { newId, businessNow } from "@/lib/demo/util";

export default function QuotePage() {
  return (
    <Suspense fallback={null}>
      <Quote />
    </Suspense>
  );
}

const SERVICE_OPTS: { id: ServiceId; label: string }[] = [
  { id: "ext", label: "Outside windows" },
  { id: "int", label: "Inside windows" },
  { id: "screen", label: "Screens" },
  { id: "track", label: "Tracks" },
  { id: "skylight", label: "Skylights" },
  { id: "hardwater", label: "Hard-water spots" },
  { id: "storefront", label: "Storefront" },
];

function Quote() {
  const ref = useSearchParams().get("ref") ?? "";
  const data = useData();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: "", phone: "", email: "", street: "", hood: "Pacific Beach", windows: "20-30", message: "", code: ref, consent: true, marketing: false, website: "" });
  const [services, setServices] = useState<ServiceId[]>(["ext", "int"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Tell us your name.";
    if (form.phone.replace(/\D/g, "").length !== 10) errs.phone = "Enter a 10-digit mobile number so we can text your quote.";
    if (!services.length) errs.services = "Pick at least one service.";
    if (form.code && data && !data.d.customers.some((c) => c.referralCode === form.code.toUpperCase())) errs.code = "We couldn't find that code. Leave it blank or check with your friend.";
    setErrors(errs);
    if (Object.keys(errs).length || form.website) return; // honeypot
    dispatch({
      t: "lead.create",
      lead: {
        id: newId("l"),
        name: form.name.trim(),
        phone: form.phone,
        email: form.email || undefined,
        street: form.street,
        neighborhood: form.hood,
        source: form.code ? "referral" : "website",
        stage: "new",
        ownerId: "e_dana",
        createdAt: businessNow(),
        nextAction: "Send quote",
        nextActionDue: businessNow().slice(0, 10),
        estimateValue: 0,
        services,
        message: `${form.windows} windows. ${form.message}`.trim(),
        referralCode: form.code ? form.code.toUpperCase() : undefined,
      },
    });
    setDone(true);
  };

  if (done) {
    return (
      <section className="mx-auto max-w-xl px-4 pt-40 pb-32 text-center">
        <Reveal>
          <CheckCircle size={52} weight="fill" className="mx-auto text-ok" />
          <h1 className="mt-6 font-display text-4xl font-light text-navy-900">Got it, {form.name.split(" ")[0]}.</h1>
          <p className="mt-4 text-[17px] text-muted">We just texted {form.phone} to confirm. Expect your quote by text, usually the same day.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/" className="inline-flex h-12 items-center rounded-full bg-navy-900 px-6 text-[15px] font-medium text-white">
              Back home
            </Link>
            <Link href="/book/" className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[15px] font-medium text-navy-900 shadow-soft">
              Book online instead
            </Link>
          </div>
        </Reveal>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-36 pb-28 md:px-8 md:pt-44 lg:grid-cols-[0.9fr_1.1fr]">
      <Reveal>
        <h1 className="font-display text-5xl leading-[0.95] font-light text-navy-900 uppercase md:text-7xl">Get a quote</h1>
        <p className="mt-6 max-w-md text-[17px] leading-relaxed text-navy-900/75">Tell us a little about your home. We&apos;ll text you an itemized quote, usually the same day.</p>
        <p className="mt-8 max-w-md text-[14px] text-muted">
          Already know what you need?{" "}
          <Link href="/book/" className="font-medium text-sky-700">
            Book online
          </Link>{" "}
          and pick a time now.
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <form onSubmit={submit} className="flex flex-col gap-5 rounded-[28px] bg-white p-6 shadow-soft md:p-8" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}>
              <Input value={form.name} onChange={set("name")} autoComplete="name" />
            </Field>
            <Field label="Mobile" error={errors.phone}>
              <Input value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" />
            </Field>
          </div>
          <Field label="Email (optional)">
            <Input value={form.email} onChange={set("email")} type="email" autoComplete="email" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <Field label="Street address">
              <Input value={form.street} onChange={set("street")} autoComplete="street-address" />
            </Field>
            <Field label="Area">
              <Select value={form.hood} onChange={set("hood")}>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n.name}>{n.name}</option>
                ))}
                <option>Other</option>
              </Select>
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink">What do you need?</span>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTS.map((o) => (
                <button
                  type="button"
                  key={o.id}
                  aria-pressed={services.includes(o.id)}
                  onClick={() => setServices((s) => (s.includes(o.id) ? s.filter((x) => x !== o.id) : [...s, o.id]))}
                  className={clsx("rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition", services.includes(o.id) ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-ink hover:border-navy-100")}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {errors.services && <span className="text-[12px] font-medium text-bad">{errors.services}</span>}
          </div>
          <Field label="About how many windows?">
            <Select value={form.windows} onChange={set("windows")}>
              {["Under 10", "10-20", "20-30", "30-45", "45+", "Not sure"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="Anything else? (optional)">
            <Textarea value={form.message} onChange={set("message")} placeholder="Two stories in back, hard-water spots on the sliders…" />
          </Field>
          <Field label="Referral code (optional)" error={errors.code}>
            <Input value={form.code} onChange={set("code")} placeholder="REEF-XXXX00" className="uppercase" />
          </Field>
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} className="hidden" aria-hidden name="website" />
          <label className="flex items-start gap-2.5 text-[13px] text-muted">
            <input type="checkbox" checked={form.consent} onChange={set("consent")} className="mt-0.5 size-4 accent-[#032541]" />
            Text me about my quote and appointments. Msg &amp; data rates may apply. Reply STOP to opt out.
          </label>
          <label className="flex items-start gap-2.5 text-[13px] text-muted">
            <input type="checkbox" checked={form.marketing} onChange={set("marketing")} className="mt-0.5 size-4 accent-[#032541]" />
            Also send me occasional offers (optional).
          </label>
          <Button size="lg" full disabled={!form.consent}>
            Send my request
          </Button>
        </form>
      </Reveal>
    </section>
  );
}
