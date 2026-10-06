import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/motion";
import { PlansRhythm } from "@/components/site/plans-rhythm";

export const metadata = { title: "Service plans" };

const FAQ = [
  ["When am I charged?", "After each cleaning is finished, to the card you saved. Nothing is charged ahead of time, and you get a receipt by text."],
  ["Can I skip or pause?", "Yes. Skip a single visit or pause for a few months from your Reef account. Your schedule picks back up where it left off."],
  ["What if I need to reschedule?", "Pick a new day online up to 24 hours before your visit. Inside 24 hours, just text us."],
  ["Can I cancel?", "Any time, from your account. There's no cancellation fee. Your photos and invoices stay in your account."],
  ["Does the price change?", "Your per-visit price is locked in. If it ever changes, you'll get notice before any future visit is affected."],
];

export default function PlansPage() {
  return (
    <>
      <PageHero title="Service plans" sub="Clean windows all year without having to remember to book. Choose how often, and we handle the rest." />
      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <Reveal>
          <PlansRhythm />
        </Reveal>
      </section>
      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <h2 className="font-display text-4xl font-light text-navy-900 md:text-5xl">How plans work</h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted">Plans are booked around your first cleaning. A week before each visit you get a reminder text with a link to change the day.</p>
            <Link href="/book/" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-navy-900 px-6 text-[15px] font-medium text-white hover:bg-navy-800">
              Book your first cleaning <ArrowRight size={16} />
            </Link>
          </Reveal>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map(([q, a], i) => (
              <Reveal key={q} delay={i * 0.05}>
                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl text-navy-900">
                    {q}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-lg transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-muted">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
