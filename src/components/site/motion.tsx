"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fades content up as it enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/** Large statement whose words brighten as you scroll through it. */
export function WordReveal({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} reduce={!!reduce}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range, reduce }: { children: string; progress: MotionValue<number>; range: [number, number]; reduce: boolean }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity: reduce ? 1 : opacity }} className="inline-block whitespace-pre">
      {children}{" "}
    </motion.span>
  );
}

/**
 * Landon-style "scroll to expand": a framed photo grows to full bleed while
 * the two title words slide apart. Pinned with CSS sticky, driven by useScroll.
 */
export function ExpandOnScroll({
  src,
  alt,
  left,
  right,
  caption,
}: {
  src: string;
  alt: string;
  left: string;
  right: string;
  caption: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const clip = useTransform(scrollYProgress, [0, 0.7], ["inset(18% 24% 18% 24% round 28px)", "inset(0% 0% 0% 0% round 0px)"]);
  const scale = useTransform(scrollYProgress, [0, 0.7], [1.18, 1]);
  const xl = useTransform(scrollYProgress, [0, 0.7], ["0vw", "-34vw"]);
  const xr = useTransform(scrollYProgress, [0, 0.7], ["0vw", "34vw"]);
  const words = useTransform(scrollYProgress, [0.45, 0.72], [1, 0]);
  const cap = useTransform(scrollYProgress, [0.7, 0.9], [0, 1]);
  const capY = useTransform(scrollYProgress, [0.7, 0.9], [24, 0]);

  if (reduce) {
    return (
      <section className="relative h-[80dvh] overflow-hidden">
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />
        <p className="absolute bottom-10 left-6 max-w-md font-display text-2xl font-light text-white md:left-12 md:text-3xl">{caption}</p>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[260dvh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
          <motion.div className="absolute inset-0" style={{ scale }}>
            <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" />
          </motion.div>
          <div className="absolute inset-0 bg-navy-950/25" />
        </motion.div>
        <motion.div style={{ opacity: words }} className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-[18vh] px-6 md:px-12">
          <motion.span style={{ x: xl }} className="self-start font-display text-[13vw] leading-none font-light tracking-tight text-white uppercase drop-shadow-[0_2px_24px_rgb(1_24_43/0.45)] md:text-[9vw]">
            {left}
          </motion.span>
          <motion.span style={{ x: xr }} className="self-end font-display text-[13vw] leading-none font-light tracking-tight text-white uppercase drop-shadow-[0_2px_24px_rgb(1_24_43/0.45)] md:text-[9vw]">
            {right}
          </motion.span>
        </motion.div>
        <motion.div style={{ opacity: cap, y: capY }} className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/80 via-navy-950/30 to-transparent px-6 pt-32 pb-12 md:px-12">
          <p className="max-w-xl font-display text-2xl leading-snug font-light text-white md:text-4xl">{caption}</p>
        </motion.div>
      </div>
    </section>
  );
}

/** Slow push-in on the hero photo, standing in for Landon's hero video. */
export function KenBurns({ src, alt }: { src: string; alt: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute inset-0"
      initial={reduce ? false : { scale: 1.12 }}
      animate={{ scale: 1 }}
      transition={{ duration: 9, ease: "easeOut" }}
    >
      <Image src={src} alt={alt} fill priority sizes="100vw" className="object-cover object-center" />
    </motion.div>
  );
}

/** One-time navy intro with the logo, once per browser session. */
export function Preloader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem("reef-intro") === "1";
      sessionStorage.setItem("reef-intro", "1");
    } catch {}
    if (seen || reduce) return;
    const raf = requestAnimationFrame(() => setShow(true));
    const t = setTimeout(() => setShow(false), 1500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [reduce]);
  if (!show) return null;
  return (
    <motion.div
      className="fixed inset-0 z-[90] grid place-items-center bg-navy-900"
      initial={{ clipPath: "inset(0 0 0% 0)" }}
      animate={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.7, delay: 0.85, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <Image src="/brand/reef-logo-white.png" alt="Reef Window Cleaning" width={260} height={110} priority />
      </motion.div>
    </motion.div>
  );
}

/** Single marquee for the page: service-area towns. */
export function Marquee({ items }: { items: string[] }) {
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((t) => (
        <span key={t} className="flex items-center gap-8 font-display text-[15px] font-light tracking-[0.2em] text-navy-900/80 uppercase">
          {t}
          <span className="inline-block size-1.5 rotate-45 rounded-[2px] bg-sky-500" aria-hidden />
        </span>
      ))}
    </div>
  );
  return (
    <div className="group relative flex overflow-hidden border-y border-navy-900/10 py-5 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="flex animate-[marquee_48s_linear_infinite] motion-reduce:animate-none">
        {row}
        {row}
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}
