import { Reveal } from "@/components/site/motion";

export function PageHero({ title, sub }: { title: string; sub: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-36 pb-14 md:px-8 md:pt-44 md:pb-20">
      <Reveal>
        <h1 className="max-w-4xl font-display text-5xl leading-[0.95] font-light tracking-tight text-navy-900 uppercase md:text-7xl">{title}</h1>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-navy-900/75">{sub}</p>
      </Reveal>
    </section>
  );
}
