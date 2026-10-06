import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarCheck, Camera, CreditCard, Gift, Phone, Receipt } from "@phosphor-icons/react/ssr";
import { ExpandOnScroll, KenBurns, Marquee, Reveal, WordReveal } from "@/components/site/motion";
import { PlansRhythm } from "@/components/site/plans-rhythm";
import { REEF_PHONE, REEF_PHONE_HREF } from "@/components/site/chrome";
import { PHOTO_IDS } from "@/lib/demo/catalog";
import { PHOTO } from "@/lib/demo/util";

const AREAS = ["Pacific Beach", "La Jolla", "Bird Rock", "Clairemont", "University City", "Point Loma", "Mission Hills", "North Park", "Coronado", "Del Mar", "Encinitas", "Carlsbad"];

const SERVICES = [
  { id: "exterior", name: "Exterior windows", body: "Outside glass, frames and sills. Pure-water pole for second stories.", img: PHOTO_IDS.pole },
  { id: "interior", name: "Interior windows", body: "Inside glass and sills with drop cloths and shoe covers.", img: PHOTO_IDS.interior },
  { id: "screens", name: "Screens & tracks", body: "Screens washed and reinstalled. Tracks vacuumed so sliders glide.", img: PHOTO_IDS.sill },
  { id: "skylights", name: "Skylights", body: "Inside and out, with roof access handled safely.", img: PHOTO_IDS.skylight },
  { id: "hard-water", name: "Hard-water removal", body: "Sprinkler and mineral spots lifted after a test spot you approve.", img: PHOTO_IDS.glassDoors },
  { id: "storefront", name: "Storefront routes", body: "Weekly or monthly glass on a set day, before you open.", img: PHOTO_IDS.storefront },
];

export default function Home() {
  return (
    <>
      {/* Hero: photo melts into the page colour, like a film still */}
      <section className="relative isolate flex min-h-[100dvh] items-end overflow-hidden pt-[68px]">
        <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent_98%)] md:[mask-image:radial-gradient(120%_95%_at_75%_30%,black_45%,transparent_85%)]">
          {/* oversized so the right edge of the stock photo (a menu board) stays out of frame */}
          <div className="absolute inset-y-0 left-0 w-[135%] md:w-[132%]">
            <KenBurns src={PHOTO(PHOTO_IDS.hero, 2400)} alt="A squeegee on a clean window looking out to the ocean" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#eef3f7] via-[#eef3f7]/55 to-transparent md:via-[#eef3f7]/30" />
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-8 md:pb-20">
          <Reveal>
            <p className="text-[12.5px] font-medium tracking-[0.24em] text-navy-900/70 uppercase">San Diego window cleaning</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 max-w-3xl font-display text-[15vw] leading-[0.92] font-light tracking-tight text-navy-900 uppercase sm:text-7xl md:text-8xl">
              Windows,
              <br />
              kept clear.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-navy-900/80">
              Window cleaning for San Diego homes and storefronts, on a schedule that keeps salt air and spots off the glass.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/quote/" className="inline-flex h-12 items-center gap-2 rounded-full bg-navy-900 px-6 text-[15px] font-medium text-white transition hover:bg-navy-800 active:scale-[0.98]">
                Get a quote <ArrowRight size={16} />
              </Link>
              <Link href="/book/" className="inline-flex h-12 items-center rounded-full border border-navy-900/15 bg-white/70 px-6 text-[15px] font-medium text-navy-900 backdrop-blur transition hover:bg-white">
                Book online
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Marquee items={AREAS} />

      {/* Statement */}
      <section className="mx-auto max-w-7xl px-4 py-28 md:px-8 md:py-40">
        <WordReveal
          className="max-w-5xl font-display text-[28px] leading-[1.25] font-light text-navy-900 md:text-[46px]"
          text="Salt air, sprinklers and coastal fog leave a film on San Diego glass. Reef cleans it by hand, then keeps you on a schedule so it never builds back up."
        />
      </section>

      {/* Services list */}
      <section className="mx-auto max-w-7xl px-4 pb-28 md:px-8">
        <div className="flex items-end justify-between gap-6 border-b border-navy-900/15 pb-6">
          <h2 className="font-display text-4xl font-light text-navy-900 uppercase md:text-6xl">Services</h2>
          <Link href="/services/" className="hidden items-center gap-1.5 text-[14px] font-medium text-sky-700 hover:text-navy-900 sm:flex">
            Pricing and details <ArrowRight size={14} />
          </Link>
        </div>
        <ul>
          {SERVICES.map((s, i) => (
            <Reveal as="li" key={s.id} delay={i * 0.04}>
              <Link href={`/services/#${s.id}`} className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-navy-900/10 py-6 md:grid-cols-[5rem_1.2fr_1fr_8rem_auto] md:py-8">
                <span className="num font-display text-[15px] text-subtle">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-2xl font-light text-navy-900 transition group-hover:translate-x-1 md:text-4xl">{s.name}</span>
                <span className="col-span-3 col-start-2 row-start-2 text-[15px] text-muted md:col-span-1 md:col-start-auto md:row-start-auto">{s.body}</span>
                <span className="relative hidden h-20 w-32 overflow-hidden rounded-xl opacity-0 transition duration-500 group-hover:opacity-100 md:block">
                  <Image src={PHOTO(s.img, 400)} alt="" fill sizes="128px" className="object-cover transition duration-700 group-hover:scale-105" />
                </span>
                <span className="grid size-10 place-items-center rounded-full border border-navy-900/15 text-navy-900 transition group-hover:bg-navy-900 group-hover:text-white">
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <ExpandOnScroll
        src={PHOTO(PHOTO_IDS.coastView, 2200)}
        alt="Looking through clean windows at the coastline"
        left="The view"
        right="you paid for"
        caption="Clean glass is the difference between looking at your window and looking through it."
      />

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 py-28 md:px-8 md:py-36">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <h2 className="font-display text-4xl leading-[1.05] font-light text-navy-900 md:text-6xl">Pick a rhythm. We keep it.</h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
              Plan customers save on every visit, get a reminder text a week ahead, and pay automatically after each cleaning. Pause, skip or reschedule from your account.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <PlansRhythm />
          </Reveal>
        </div>
      </section>

      {/* How a visit works: the real texts customers receive */}
      <section className="bg-white py-28 md:py-36">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 md:px-8 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-4xl leading-[1.05] font-light text-navy-900 md:text-6xl">You always know where things stand.</h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
              Every visit comes with texts at the moments that matter, and your photos, invoices and next cleaning live in your Reef account.
            </p>
            <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 text-[15px] text-navy-900">
              {[
                [CalendarCheck, "Book and reschedule online"],
                [Camera, "Before-and-after photos"],
                [Receipt, "Invoices and receipts"],
                [CreditCard, "Card on file, billed after"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof CalendarCheck;
                return (
                  <li key={label as string} className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700">
                      <I size={18} weight="duotone" />
                    </span>
                    {label as string}
                  </li>
                );
              })}
            </ul>
          </Reveal>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[36px] border border-line bg-[#f6f8fa] p-4 shadow-lift">
              <div className="mb-4 flex items-center gap-3 border-b border-line px-2 pb-3">
                <Image src="/brand/reef-icon.png" alt="" width={36} height={36} className="rounded-full" />
                <div>
                  <p className="text-[14px] font-semibold text-ink">Reef Window Cleaning</p>
                  <p className="text-[12px] text-muted">Text message</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  ["Mon 5:00 PM", "Reminder: Reef Window Cleaning is coming tomorrow, arriving 9:30-11:30 AM. Please unlock gates and side yards."],
                  ["Tue 9:41 AM", "Marco from Reef is on the way and should arrive in about 20 minutes."],
                  ["Tue 11:58 AM", "All done! Your before-and-after photos are in your Reef account."],
                  ["Tue 11:58 AM", "Thanks! We received your payment. Your next plan cleaning is in April."],
                ].map(([t, body], i) => (
                  <Reveal key={i} delay={i * 0.12}>
                    <p className="px-1 text-[11px] text-subtle">{t}</p>
                    <div className="mt-1 max-w-[88%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[14px] leading-snug text-ink shadow-[0_1px_2px_rgb(3_37_65/0.08)]">{body}</div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refer & earn */}
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-navy-900 px-6 py-14 text-white md:px-14 md:py-20">
            <Image src="/brand/reef-mark-white.png" alt="" width={440} height={255} className="pointer-events-none absolute -right-10 -bottom-6 w-[340px] opacity-[0.08] md:w-[520px]" />
            <Gift size={36} weight="duotone" className="text-sky-300" />
            <h2 className="mt-6 max-w-2xl font-display text-4xl leading-[1.05] font-light md:text-6xl">Give $25. Get $25 in Reef Credit.</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/75">
              Every customer gets a personal link. When a friend books and pays for their first cleaning, they save $25 and you get $25 off your next one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/refer/" className="inline-flex h-12 items-center gap-2 rounded-full bg-sky-500 px-6 text-[15px] font-medium text-navy-950 transition hover:bg-sky-300">
                How Reef Credit works <ArrowRight size={16} />
              </Link>
              <Link href="/login/" className="inline-flex h-12 items-center rounded-full border border-white/25 px-6 text-[15px] font-medium text-white transition hover:bg-white/10">
                Find my link
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Closing CTA */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={PHOTO(PHOTO_IDS.house, 2000)} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#eef3f7] via-[#eef3f7]/85 to-[#eef3f7]/20" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-28 md:px-8 md:py-40">
          <Reveal>
            <h2 className="max-w-2xl font-display text-5xl leading-[0.95] font-light text-navy-900 uppercase md:text-7xl">Ready when you are.</h2>
            <p className="mt-6 max-w-md text-[17px] text-navy-900/80">Tell us about your home and we&apos;ll text you a quote, usually the same day.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/quote/" className="inline-flex h-12 items-center gap-2 rounded-full bg-navy-900 px-6 text-[15px] font-medium text-white transition hover:bg-navy-800">
                Get a quote <ArrowRight size={16} />
              </Link>
              <a href={REEF_PHONE_HREF} className="inline-flex h-12 items-center gap-2 rounded-full bg-white/80 px-6 text-[15px] font-medium text-navy-900 backdrop-blur hover:bg-white">
                <Phone size={16} /> {REEF_PHONE}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
