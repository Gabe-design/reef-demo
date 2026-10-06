"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, CheckCircle, Gift } from "@phosphor-icons/react";
import { Button, Field, Input, Select } from "@/components/ui";
import { PriceSummary, ServicePicker, SlotPicker, buildBooking, quoteLines, type BookingInput } from "@/components/booking-form";
import { useData, useDispatch } from "@/lib/demo/hooks";
import { useSession } from "@/lib/demo/session";
import { NEIGHBORHOODS, REFERRAL_POLICY } from "@/lib/demo/catalog";
import { fmtDate, fmtWindow, money } from "@/lib/demo/util";

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <Book />
    </Suspense>
  );
}

const STEPS = ["Your home", "Services", "Day and time", "Your details"];

function Book() {
  const ref = useSearchParams().get("ref")?.toUpperCase() ?? "";
  const data = useData();
  const dispatch = useDispatch();
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const [step, setStep] = useState(0);
  const [home, setHome] = useState({ street: "", hood: "Pacific Beach", stories: 2 });
  const [input, setInput] = useState<BookingInput>({ windows: 24, stories: 2, services: ["ext", "int", "screen"], skylights: 1 });
  const [when, setWhen] = useState<{ date: string; slot: [string, string] | null }>({ date: "", slot: null });
  const [who, setWho] = useState({ name: "", phone: "", email: "", code: ref, consent: true });
  const [booked, setBooked] = useState<{ customerId: string; total: number } | null>(null);
  if (!data) return <section className="min-h-[80dvh]" />;
  const { d } = data;
  const nb = NEIGHBORHOODS.find((n) => n.name === home.hood)!;
  const crewId = nb.zone === "coast" ? "c_coral" : "c_kelp";
  const lines = quoteLines({ ...input, stories: home.stories });
  const referrer = who.code ? d.customers.find((c) => c.referralCode === who.code.toUpperCase()) : undefined;
  const discount = referrer ? REFERRAL_POLICY.newCustomerDiscount : 0;
  const canNext = [home.street.trim().length > 3, lines.length > 0, !!when.date && !!when.slot, who.name.trim().length > 1 && who.phone.replace(/\D/g, "").length === 10 && who.consent][step];

  const confirm = () => {
    const { customer, property, job } = buildBooking({
      d,
      name: who.name.trim(),
      phone: who.phone,
      email: who.email,
      street: home.street.trim(),
      neighborhood: nb.name,
      city: nb.city,
      zip: nb.zip,
      lat: nb.box[0] + (nb.box[1] - nb.box[0]) * 0.5,
      lng: nb.box[2] + (nb.box[3] - nb.box[2]) * 0.5,
      stories: home.stories,
      windows: input.windows,
      lines,
      date: when.date,
      slot: when.slot!,
      crewId,
      source: referrer ? "referral" : "website",
    });
    dispatch({ t: "booking.create", customer, property, job, referralCode: referrer ? who.code : undefined });
    setBooked({ customerId: customer.id, total: job.total - discount });
  };

  if (booked) {
    return (
      <section className="mx-auto max-w-xl px-4 pt-40 pb-32 text-center">
        <CheckCircle size={52} weight="fill" className="mx-auto text-ok" />
        <h1 className="mt-6 font-display text-4xl font-light text-navy-900">You&apos;re booked.</h1>
        <p className="mt-4 text-[17px] text-muted">
          {fmtDate(when.date, "EEEE, MMMM d")}, arriving {fmtWindow(when.slot![0], when.slot![1])}. We texted a confirmation to {who.phone}. You&apos;ll pay {money(booked.total)} after the cleaning.
        </p>
        <Button
          size="lg"
          className="mt-8"
          onClick={() => {
            signIn({ kind: "customer", id: booked.customerId });
            router.push("/account/");
          }}
        >
          Go to my Reef account
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-32 pb-28 md:px-8 md:pt-40 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <h1 className="font-display text-4xl font-light text-navy-900 uppercase md:text-6xl">Book online</h1>
        <ol className="mt-6 flex flex-wrap gap-2" aria-label="Booking steps">
          {STEPS.map((s, i) => (
            <li key={s} className={clsx("rounded-full px-3 py-1 text-[12.5px] font-medium", i === step ? "bg-navy-900 text-white" : i < step ? "bg-sky-100 text-sky-700" : "bg-white text-subtle")}>
              {s}
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-[28px] bg-white p-6 shadow-soft md:p-8">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <Field label="Street address">
                <Input value={home.street} onChange={(e) => setHome({ ...home, street: e.target.value })} autoComplete="street-address" placeholder="4417 Diamond St" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Area">
                  <Select value={home.hood} onChange={(e) => setHome({ ...home, hood: e.target.value })}>
                    {NEIGHBORHOODS.map((n) => (
                      <option key={n.name}>{n.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Stories">
                  <Select value={home.stories} onChange={(e) => setHome({ ...home, stories: Number(e.target.value) })}>
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <p className="text-[13px] text-muted">Commercial or something unusual? Request a quote and we&apos;ll price it by hand.</p>
            </div>
          )}
          {step === 1 && <ServicePicker value={input} onChange={setInput} />}
          {step === 2 && <SlotPicker d={d} crewId={crewId} value={when.date ? when : { date: d.today, slot: null }} onChange={setWhen} />}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} autoComplete="name" />
                </Field>
                <Field label="Mobile" hint="This is also how you'll sign in to your account.">
                  <Input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} inputMode="tel" autoComplete="tel" />
                </Field>
              </div>
              <Field label="Email (optional)">
                <Input value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} type="email" />
              </Field>
              <Field label="Referral code (optional)" error={who.code && !referrer ? "We couldn't find that code." : undefined}>
                <Input value={who.code} onChange={(e) => setWho({ ...who, code: e.target.value })} className="uppercase" />
              </Field>
              <label className="flex items-start gap-2.5 text-[13px] text-muted">
                <input type="checkbox" checked={who.consent} onChange={(e) => setWho({ ...who, consent: e.target.checked })} className="mt-0.5 size-4 accent-[#032541]" />
                Text me appointment confirmations, reminders and receipts. Reply STOP to opt out.
              </label>
            </div>
          )}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16} /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button size="lg" disabled={!canNext} onClick={() => setStep(step + 1)}>
                Continue
              </Button>
            ) : (
              <Button size="lg" disabled={!canNext} onClick={confirm}>
                Confirm booking
              </Button>
            )}
          </div>
        </div>
      </div>
      <aside className="lg:pt-28">
        <div className="sticky top-24 flex flex-col gap-3">
          <PriceSummary lines={lines} />
          {referrer && (
            <p className="flex items-center gap-2 rounded-2xl bg-ok-bg px-4 py-3 text-[13.5px] text-ok">
              <Gift size={18} weight="fill" /> {money(discount, { whole: true })} referral discount from {referrer.contactName.split(" ")[0]} applied at checkout
            </p>
          )}
          {when.date && when.slot && (
            <p className="rounded-2xl bg-white px-4 py-3 text-[13.5px] text-ink shadow-soft">
              {fmtDate(when.date, "EEE, MMM d")} · arriving {fmtWindow(when.slot[0], when.slot[1])}
            </p>
          )}
          <p className="px-1 text-[12.5px] text-muted">You don&apos;t pay anything now. We confirm the window count on arrival and bill after the cleaning.</p>
        </div>
      </aside>
    </section>
  );
}
