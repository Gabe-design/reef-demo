"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { List, Phone, UserCircle, X } from "@phosphor-icons/react";
import { useSession } from "@/lib/demo/session";
import { useMe } from "@/lib/demo/hooks";

export const REEF_PHONE = "(619) 555-0100";
export const REEF_PHONE_HREF = "tel:+16195550100";

const NAV = [
  { href: "/services/", label: "Services" },
  { href: "/plans/", label: "Plans" },
  { href: "/service-area/", label: "Service area" },
  { href: "/refer/", label: "Refer & earn" },
];

export function SiteHeader() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const me = useMe();
  const hydrated = useSession((s) => s.hydrated);
  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > 24));

  const accountHref = me?.kind === "customer" ? "/account/" : me?.kind === "staff" ? (me.employee.role === "worker" ? "/crew/" : me.employee.role === "sales" ? "/sales/" : "/admin/") : "/login/";
  const accountLabel = me ? "My account" : "Log in";

  return (
    <>
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,backdrop-filter] duration-300",
          solid || open ? "bg-white/85 shadow-[0_1px_0_rgb(3_37_65/0.08)] backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
          <Link href="/" className="shrink-0" aria-label="Reef Window Cleaning home">
            <Image src="/brand/reef-logo.png" alt="Reef Window Cleaning" width={128} height={54} priority className="h-11 w-auto" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "rounded-full px-3.5 py-2 text-[14px] transition",
                  pathname?.startsWith(n.href) ? "font-medium text-navy-900" : "text-muted hover:text-navy-900",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href={REEF_PHONE_HREF} className="hidden items-center gap-1.5 px-2 text-[14px] text-navy-900 xl:flex">
              <Phone size={16} weight="duotone" /> {REEF_PHONE}
            </a>
            <Link
              href={accountHref}
              className={clsx("hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] text-navy-900 hover:bg-navy-50 sm:flex", !hydrated && "invisible")}
            >
              <UserCircle size={18} weight="duotone" /> {accountLabel}
            </Link>
            <Link href="/quote/" className="hidden h-10 items-center rounded-full bg-navy-900 px-5 text-[14px] font-medium text-white transition hover:bg-navy-800 active:scale-[0.98] sm:inline-flex">
              Get a quote
            </Link>
            <button onClick={() => setOpen((o) => !o)} className="grid size-10 place-items-center rounded-full text-navy-900 hover:bg-navy-50 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
              {open ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-x-0 top-[68px] bottom-0 z-40 overflow-y-auto bg-white/95 px-6 pt-6 pb-10 backdrop-blur-xl lg:hidden"
        >
          <nav className="flex flex-col" aria-label="Mobile">
            {[...NAV, { href: "/book/", label: "Book online" }, { href: accountHref, label: accountLabel }].map((n, i) => (
              <motion.div key={n.href + n.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block border-b border-line py-4 font-display text-2xl font-light text-navy-900">
                  {n.label}
                </Link>
              </motion.div>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/quote/" onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-full bg-navy-900 font-medium text-white">
              Get a quote
            </Link>
            <a href={REEF_PHONE_HREF} className="flex h-12 items-center justify-center gap-2 rounded-full border border-line font-medium text-navy-900">
              <Phone size={18} /> {REEF_PHONE}
            </a>
          </div>
        </motion.div>
      )}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Image src="/brand/reef-logo-white.png" alt="Reef Window Cleaning" width={180} height={76} className="h-16 w-auto" />
          <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-white/70">
            Window cleaning for San Diego homes and storefronts. One-time cleanings and plans every 3, 6 or 12 months.
          </p>
        </div>
        <FooterCol
          title="Services"
          links={[
            ["/services/#exterior", "Exterior windows"],
            ["/services/#interior", "Interior windows"],
            ["/services/#screens", "Screens & tracks"],
            ["/services/#hard-water", "Hard-water removal"],
            ["/services/#storefront", "Storefront routes"],
          ]}
        />
        <FooterCol
          title="Reef"
          links={[
            ["/plans/", "Service plans"],
            ["/service-area/", "Service area"],
            ["/refer/", "Refer & earn"],
            ["/quote/", "Get a quote"],
            ["/book/", "Book online"],
          ]}
        />
        <div>
          <p className="text-[12px] font-medium tracking-[0.18em] text-sky-300 uppercase">Contact</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-white/80">
            <li>
              <a href={REEF_PHONE_HREF} className="hover:text-white">
                {REEF_PHONE}
              </a>
            </li>
            <li>San Diego County, CA</li>
            <li>Mon-Sat, 7 AM - 6 PM</li>
            <li className="pt-2">
              <Link href="/login/" className="hover:text-white">
                Customer login
              </Link>
            </li>
            <li>
              <Link href="/team/" className="hover:text-white">
                Team login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-white/10 px-4 py-6 text-[12.5px] text-white/50 md:flex-row md:px-8">
        <p>© {new Date().getFullYear()} Reef Window Cleaning</p>
        <p>Site by MRD Studios</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-[0.18em] text-sky-300 uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5 text-[14px] text-white/80">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
