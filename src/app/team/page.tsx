"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CaretDown, CaretRight, ShieldCheck } from "@phosphor-icons/react";
import { AuthShell } from "@/components/auth-shell";
import { Avatar, Skeleton } from "@/components/ui";
import { useData } from "@/lib/demo/hooks";
import { useSession } from "@/lib/demo/session";
import { PHOTO_IDS } from "@/lib/demo/catalog";
import type { Employee } from "@/lib/demo/types";
import { homeFor } from "@/lib/demo/roles";

const ROLE_LABEL = { owner: "Owner", manager: "Manager", worker: "Crew", sales: "Sales" } as const;

export default function TeamLogin() {
  const data = useData();
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const [more, setMore] = useState(false);

  const go = (e: Employee) => {
    signIn({ kind: "staff", id: e.id });
    router.push(homeFor(e));
  };

  const featured = ["e_owner", "e_dana", "e_marco", "e_brianna"];

  return (
    <AuthShell photo={PHOTO_IDS.pole}>
      <h1 className="font-display text-4xl font-light text-navy-900">Reef team</h1>
      <p className="mt-3 text-[15px] text-muted">Choose your account to continue.</p>
      <div className="mt-8 flex flex-col gap-2.5">
        {!data
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[68px]" />)
          : data.d.employees
              .filter((e) => featured.includes(e.id))
              .sort((a, b) => featured.indexOf(a.id) - featured.indexOf(b.id))
              .map((e) => <AccountRow key={e.id} e={e} onClick={() => go(e)} />)}
      </div>
      {data && (
        <>
          <button onClick={() => setMore((m) => !m)} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-sky-700 hover:text-navy-900">
            {more ? <CaretDown size={14} /> : <CaretRight size={14} />} Other team accounts
          </button>
          {more && (
            <div className="mt-3 flex flex-col gap-2">
              {data.d.employees
                .filter((e) => !featured.includes(e.id))
                .map((e) => (
                  <AccountRow key={e.id} e={e} onClick={() => go(e)} compact />
                ))}
            </div>
          )}
        </>
      )}
      <p className="mt-10 flex items-start gap-2 text-[12.5px] leading-relaxed text-subtle">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" /> Team accounts use single sign-on with two-step verification. Each person only sees what their role needs.
      </p>
      <p className="mt-6 text-[14px] text-muted">
        Customer?{" "}
        <Link href="/login/" className="font-medium text-sky-700 hover:text-navy-900">
          Sign in with your phone
        </Link>
      </p>
    </AuthShell>
  );
}

function AccountRow({ e, onClick, compact }: { e: Employee; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3.5 rounded-2xl border border-line bg-white text-left transition hover:border-sky-300 hover:shadow-soft active:scale-[0.99] ${compact ? "px-3.5 py-2.5" : "px-4 py-3.5"}`}
    >
      <Avatar name={e.name} color={e.color} size={compact ? 32 : 40} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-ink">{e.name}</span>
        <span className="block truncate text-[13px] text-muted">{e.title}</span>
      </span>
      <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[11.5px] font-medium text-muted">{ROLE_LABEL[e.role]}</span>
      <CaretRight size={16} className="text-subtle transition group-hover:translate-x-0.5 group-hover:text-navy-900" />
    </button>
  );
}
