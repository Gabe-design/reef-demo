"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  ArrowCounterClockwise,
  CalendarDots,
  ChartLineUp,
  ChatsCircle,
  Coins,
  Gear,
  Globe,
  HouseLine,
  ListChecks,
  MapTrifold,
  Notepad,
  Receipt,
  Repeat,
  SignOut,
  UserSwitch,
  UsersThree,
  Funnel,
  DotsThreeOutline,
  X,
} from "@phosphor-icons/react";
import { useGuard, useData } from "@/lib/demo/hooks";
import { useSession } from "@/lib/demo/session";
import { useDemo } from "@/lib/demo/store";
import { Avatar, PageSkeleton } from "@/components/ui";
import { fmtDate } from "@/lib/demo/util";
import { ROLE_LABEL } from "@/lib/demo/roles";

const NAV = [
  { href: "/admin/", label: "Dashboard", icon: ChartLineUp, exact: true },
  { href: "/admin/schedule/", label: "Schedule", icon: CalendarDots },
  { href: "/admin/jobs/", label: "Jobs", icon: ListChecks },
  { href: "/admin/leads/", label: "Leads", icon: Funnel },
  { href: "/admin/customers/", label: "Customers", icon: HouseLine },
  { href: "/admin/estimates/", label: "Estimates", icon: Notepad },
  { href: "/admin/plans/", label: "Plans", icon: Repeat },
  { href: "/admin/billing/", label: "Billing", icon: Receipt },
  { href: "/admin/referrals/", label: "Reef Credit", icon: Coins },
  { href: "/admin/messages/", label: "Messages", icon: ChatsCircle },
  { href: "/admin/canvassing/", label: "Canvassing", icon: MapTrifold },
  { href: "/admin/team/", label: "Team", icon: UsersThree },
  { href: "/admin/settings/", label: "Settings", icon: Gear },
];

const MOBILE = ["/admin/", "/admin/schedule/", "/admin/leads/", "/admin/customers/"];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const me = useGuard(["owner", "manager"]);
  const data = useData();
  const pathname = usePathname() ?? "";
  const [more, setMore] = useState(false);
  const inbox = data?.d.messages.filter((m) => m.direction === "in" && m.at.slice(0, 10) >= data.d.today.slice(0, 8) + "01").length ?? 0;

  const active = (href: string, exact?: boolean) => (exact ? pathname === href || pathname === href.slice(0, -1) : pathname.startsWith(href.slice(0, -1)));

  return (
    <div className="min-h-[100dvh] bg-canvas">
      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/admin/">
            <Image src="/brand/reef-logo.png" alt="Reef" width={110} height={46} className="h-10 w-auto" />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] transition",
                active(href, exact) ? "bg-navy-900 font-medium text-white" : "text-muted hover:bg-navy-50 hover:text-ink",
              )}
            >
              <Icon size={18} weight={active(href, exact) ? "fill" : "regular"} />
              {label}
              {label === "Messages" && inbox > 0 && (
                <span className={clsx("ml-auto rounded-full px-1.5 text-[11px] font-semibold", active(href) ? "bg-white/20" : "bg-sky-100 text-sky-700")}>{inbox}</span>
              )}
            </Link>
          ))}
        </nav>
        {me && <UserMenu />}
      </aside>

      {/* top bar (mobile) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link href="/admin/">
          <Image src="/brand/reef-logo.png" alt="Reef" width={90} height={38} className="h-8 w-auto" />
        </Link>
        {me && <Avatar name={me.employee.name} color={me.employee.color} size={30} />}
      </header>

      <div className="lg:pl-60">
        <main className="mx-auto max-w-[1400px] px-4 pt-5 pb-28 md:px-8 md:pt-8 lg:pb-12">{me && data ? children : <PageSkeleton />}</main>
      </div>

      {/* bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Admin mobile">
        {NAV.filter((n) => MOBILE.includes(n.href)).map(({ href, label, icon: Icon, exact }) => (
          <Link key={href} href={href} className={clsx("flex flex-col items-center gap-0.5 py-2 text-[11px]", active(href, exact) ? "text-navy-900" : "text-subtle")}>
            <Icon size={22} weight={active(href, exact) ? "fill" : "regular"} />
            {label}
          </Link>
        ))}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-subtle">
          <DotsThreeOutline size={22} />
          More
        </button>
      </nav>
      {more && (
        <div className="fixed inset-0 z-[60] bg-navy-950/40 lg:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-x-0 bottom-0 animate-rise rounded-t-3xl bg-white p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="font-display font-semibold">More</p>
              <button onClick={() => setMore(false)} aria-label="Close" className="rounded-full p-1.5 hover:bg-navy-50">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {NAV.filter((n) => !MOBILE.includes(n.href)).map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMore(false)} className="flex flex-col items-center gap-1.5 rounded-2xl bg-canvas px-2 py-4 text-[12.5px] text-ink">
                  <Icon size={22} className="text-navy-900" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <UserMenu inline />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ inline }: { inline?: boolean }) {
  const data = useData();
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);
  const reset = useDemo((s) => s.reset);
  const toast = useDemo((s) => s.toast);
  const router = useRouter();
  const [open, setOpen] = useState(!!inline);
  const me = data?.d.employees.find((e) => user?.kind === "staff" && e.id === user.id);
  if (!me) return null;
  return (
    <div className={clsx(!inline && "relative border-t border-line p-3")}>
      {!inline && (
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-navy-50">
          <Avatar name={me.name} color={me.color} size={34} />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium text-ink">{me.name}</span>
            <span className="block text-[12px] text-muted">
              {ROLE_LABEL[me.role]} · {fmtDate(data!.d.today, "EEE, MMM d")}
            </span>
          </span>
        </button>
      )}
      {open && (
        <div className={clsx("flex flex-col gap-0.5", !inline && "absolute inset-x-3 bottom-[72px] rounded-2xl border border-line bg-white p-1.5 shadow-lift")}>
          <MenuItem icon={<Globe size={16} />} label="View website" onClick={() => router.push("/")} />
          <MenuItem icon={<UserSwitch size={16} />} label="Switch account" onClick={() => router.push("/team/")} />
          <MenuItem
            icon={<ArrowCounterClockwise size={16} />}
            label="Reset demo data"
            onClick={() => {
              reset();
              setOpen(!!inline);
              toast({ kind: "info", title: "Demo reset", body: "All sample data is back to its starting state." });
            }}
          />
          <MenuItem
            icon={<SignOut size={16} />}
            label="Sign out"
            onClick={() => {
              signOut();
              router.push("/team/");
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] text-ink hover:bg-navy-50">
      <span className="text-muted">{icon}</span>
      {label}
    </button>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h1 className="font-display text-[28px] leading-tight font-semibold tracking-tight text-ink md:text-[32px]">{title}</h1>
        {sub && <p className="mt-1 text-[14px] text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
