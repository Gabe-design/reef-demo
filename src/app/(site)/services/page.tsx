import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react/ssr";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/motion";
import { PHOTO_IDS } from "@/lib/demo/catalog";
import { PHOTO } from "@/lib/demo/util";

export const metadata = { title: "Services" };

const SERVICES = [
  {
    id: "exterior",
    name: "Exterior windows",
    img: PHOTO_IDS.pole,
    body: "Glass, frames and sills on the outside of your home. Second-story and hard-to-reach glass is cleaned from the ground with a pure-water pole, so there are no ladders on your landscaping.",
    includes: ["Glass scrubbed and squeegeed or pure-water rinsed", "Frames and sills wiped", "Spot check from inside when we're done"],
  },
  {
    id: "interior",
    name: "Interior windows",
    img: PHOTO_IDS.interior,
    body: "The inside of every window we clean, with drop cloths under each one and shoe covers on in the house.",
    includes: ["Drop cloths and shoe covers", "Glass, sills and ledges", "Furniture moved back the way it was"],
  },
  {
    id: "screens",
    name: "Screens & tracks",
    img: PHOTO_IDS.sill,
    body: "Screens come off, get washed and go back on. Tracks are vacuumed and wiped so sliders and windows open smoothly again.",
    includes: ["Screens washed and dried", "Tracks vacuumed and detailed", "Bent or torn screens flagged for you"],
  },
  {
    id: "skylights",
    name: "Skylights",
    img: PHOTO_IDS.skylight,
    body: "Inside and outside of skylights, with roof access handled safely and logged on every visit.",
    includes: ["Interior from a ladder or pole", "Exterior with safe roof access", "Seal and flashing check"],
  },
  {
    id: "hard-water",
    name: "Hard-water removal",
    img: PHOTO_IDS.glassDoors,
    body: "Sprinkler spotting and mineral buildup don't come off with a normal clean. We test a small spot first and show you before treating the rest.",
    includes: ["Test spot you approve", "Mineral removal by pane", "Advice on sprinkler adjustments"],
  },
  {
    id: "storefront",
    name: "Storefront routes",
    img: PHOTO_IDS.storefront,
    body: "Doors, display glass and entry frames on a set day every week or month, done before you open. One monthly invoice.",
    includes: ["Same day every visit", "Before opening hours", "Monthly consolidated invoice"],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero title="Services" sub="Everything we clean, how it's priced, and what's included. Every quote is itemized, so you know what you're paying for." />
      <section className="mx-auto flex max-w-7xl flex-col gap-24 px-4 pb-28 md:px-8">
        {SERVICES.map((s, i) => (
          <Reveal key={s.id}>
            <article id={s.id} className="grid scroll-mt-28 items-center gap-8 md:grid-cols-2 md:gap-14">
              <div className={`relative aspect-[4/3] overflow-hidden rounded-[28px] ${i % 2 ? "md:order-2" : ""}`}>
                <Image src={PHOTO(s.img, 1200)} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
              <div>
                <p className="num font-display text-[15px] text-subtle">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="mt-2 font-display text-4xl font-light text-navy-900 md:text-5xl">{s.name}</h2>
                <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">{s.body}</p>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {s.includes.map((x) => (
                    <li key={x} className="flex items-center gap-3 text-[15px] text-navy-900">
                      <span className="grid size-6 place-items-center rounded-full bg-sky-100 text-sky-700">
                        <Check size={13} weight="bold" />
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-2 md:px-8">
          <Reveal>
            <h2 className="font-display text-4xl font-light text-navy-900 md:text-5xl">How pricing works</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="flex flex-col gap-5 text-[16px] leading-relaxed text-muted">
              <p>Most work is priced per window, per screen or per track, so a quote scales with your home instead of a guess. Inside and outside are priced separately unless you pick a package that includes both.</p>
              <p>There&apos;s a minimum visit charge for small jobs. Plan customers save on every visit, and plan prices are locked in until we give you notice.</p>
              <Link href="/quote/" className="inline-flex items-center gap-2 font-medium text-sky-700 hover:text-navy-900">
                Get your quote <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
