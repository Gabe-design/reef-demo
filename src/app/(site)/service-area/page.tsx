import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/motion";
import { AreaMap } from "@/components/site/area-map";
import { NEIGHBORHOODS } from "@/lib/demo/catalog";

export const metadata = { title: "Service area" };

const REGIONS = [
  { name: "Coast", hoods: ["Pacific Beach", "La Jolla", "Bird Rock", "Coronado"] },
  { name: "Central", hoods: ["Clairemont", "University City", "Point Loma", "Mission Hills", "North Park"] },
  { name: "North County", hoods: ["Del Mar", "Encinitas", "Carlsbad"] },
];

export default function ServiceArea() {
  return (
    <>
      <PageHero title="Service area" sub="Reef cleans homes and storefronts across San Diego, from Coronado up to Carlsbad. Not sure if you're covered? Ask for a quote and we'll tell you." />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-28 md:px-8 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <AreaMap points={NEIGHBORHOODS.map((n) => ({ name: n.name, lat: (n.box[0] + n.box[1]) / 2, lng: (n.box[2] + n.box[3]) / 2 }))} />
        </Reveal>
        <div className="flex flex-col gap-10">
          {REGIONS.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.06}>
              <h2 className="font-display text-3xl font-light text-navy-900">{r.name}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {r.hoods.map((h) => (
                  <li key={h} className="rounded-full bg-white px-4 py-2 text-[14.5px] text-navy-900 shadow-[0_1px_2px_rgb(3_37_65/0.08)]">
                    {h}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
          <Reveal>
            <Link href="/quote/" className="inline-flex items-center gap-2 text-[15px] font-medium text-sky-700 hover:text-navy-900">
              Somewhere else in the county? Ask us <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
