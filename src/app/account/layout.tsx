"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { CalendarBlank, Coins, House, Receipt, Repeat, SignOut } from "@phosphor-icons/react";
import { PageSkeleton } from "@/components/ui";
import { useGuard, useData } from "@/lib/demo/hooks";
import { useSession } from "@/lib/demo/session";
import { firstName } from "@/lib/demo/util";

const TABS = [
  { href: "/account/", label: "Home", icon: House },
  { href: "/account/visits/", label: "Visits", icon: CalendarBlank },
  { href: "/account/billing/", label: "Billing", icon: Receipt },
  { href: "/account/plan/", label: "Plan", icon: Repeat },
  { href: "/account/credit/", label: "Reef Credit", icon: Coins },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const me = useGuard("customer");
  const data = useData();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const signOut = useSession((s) => s.signOut);
  const active = (href: string) => (href === "/account/" ? pathname === "/account/" || pathname === "/account" : pathname.startsWith(href.slice(0, -1)));

  return (
    <div className="min-h-[100dvh] bg-[#eef3f7]">
      <header className="sticky top-0 z-30 border-b border-navy-900/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-6">
          <Link href="/">
            <Image src="/brand/reef-logo.png" alt="Reef Window Cleaning" width={110} height={46} className="h-10 w-auto" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Account">
            {TABS.map(({ href, label }) => (
              <Link key={href} href={href} className={clsx("rounded-full px-3.5 py-2 text-[14px] transition", active(href) ? "bg-navy-900 font-medium text-white" : "text-muted hover:text-navy-900")}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {me && <span className="hidden text-[14px] text-muted sm:block">Hi, {firstName(me.customer.contactName)}</span>}
            <button
              onClick={() => {
                signOut();
                router.push("/login/");
              }}
              className="grid size-9 place-items-center rounded-full text-muted hover:bg-navy-50 hover:text-navy-900"
              aria-label="Sign out"
            >
              <SignOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:px-6 md:pt-10">{me && data ? children : <PageSkeleton />}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Account mobile">
        {TABS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={clsx("flex flex-col items-center gap-0.5 py-2 text-[10.5px]", active(href) ? "text-navy-900" : "text-subtle")}>
            <Icon size={22} weight={active(href) ? "fill" : "regular"} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
