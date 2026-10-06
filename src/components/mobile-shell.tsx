"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { SignOut, UserSwitch } from "@phosphor-icons/react";
import { useState } from "react";
import { Avatar, Skeleton } from "@/components/ui";
import { useSession } from "@/lib/demo/session";
import type { Employee } from "@/lib/demo/types";

/** Phone-first app frame used by the crew and sales apps. */
export function MobileShell({
  me,
  tabs,
  children,
  fullBleed,
}: {
  me: Employee | null;
  tabs: { href: string; label: string; icon: React.ComponentType<{ size?: number; weight?: "fill" | "regular" }> }[];
  children: React.ReactNode;
  fullBleed?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const signOut = useSession((s) => s.signOut);
  const [menu, setMenu] = useState(false);
  const active = (href: string) => (href.split("/").filter(Boolean).length === 1 ? pathname.replace(/\/$/, "") === href.replace(/\/$/, "") : pathname.startsWith(href.replace(/\/$/, "")));

  return (
    <div className="min-h-[100dvh] bg-[#dfe7ee] md:py-6">
      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col overflow-hidden bg-canvas md:min-h-[calc(100dvh-3rem)] md:rounded-[32px] md:shadow-lift">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur">
          <Image src="/brand/reef-logo.png" alt="Reef" width={84} height={36} className="h-8 w-auto" />
          {me && (
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full py-1 pr-1 pl-3 hover:bg-navy-50" aria-label="Account menu">
              <span className="text-[13px] font-medium text-ink">{me.name.split(" ")[0]}</span>
              <Avatar name={me.name} color={me.color} size={30} />
            </button>
          )}
          {menu && (
            <div className="absolute top-14 right-3 z-40 flex w-52 flex-col rounded-2xl border border-line bg-white p-1.5 shadow-lift">
              <button onClick={() => router.push("/team/")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] hover:bg-navy-50">
                <UserSwitch size={16} /> Switch account
              </button>
              <button
                onClick={() => {
                  signOut();
                  router.push("/team/");
                }}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] hover:bg-navy-50"
              >
                <SignOut size={16} /> Sign out
              </button>
            </div>
          )}
        </header>
        <main className={clsx("flex-1 pb-24", !fullBleed && "px-4 pt-4")}>
          {me ? (
            children
          ) : (
            <div className="space-y-3 p-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-56" />
              <Skeleton className="h-20" />
            </div>
          )}
        </main>
        <nav className="absolute inset-x-0 bottom-0 z-30 grid border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:rounded-b-[32px]" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={clsx("flex flex-col items-center gap-0.5 py-2.5 text-[11px]", active(href) ? "text-navy-900" : "text-subtle")}>
              <Icon size={23} weight={active(href) ? "fill" : "regular"} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
