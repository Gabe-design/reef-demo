"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "./store";
import { useSession } from "./session";
import { buildIndex } from "./select";
import type { Role } from "./types";

/** Seeded data plus lookup maps, or null until the browser has generated it. */
export function useData() {
  const data = useDemo((s) => s.data);
  const ix = useMemo(() => (data ? buildIndex(data) : null), [data]);
  return data && ix ? { d: data, ix } : null;
}

export function useDispatch() {
  return useDemo((s) => s.dispatch);
}

/** Current signed-in staff member or customer. */
export function useMe() {
  const user = useSession((s) => s.user);
  const data = useDemo((s) => s.data);
  if (!user || !data) return null;
  if (user.kind === "staff") {
    const employee = data.employees.find((e) => e.id === user.id);
    return employee ? { kind: "staff" as const, employee } : null;
  }
  const customer = data.customers.find((c) => c.id === user.id);
  return customer ? { kind: "customer" as const, customer } : null;
}

type Me = NonNullable<ReturnType<typeof useMe>>;
type StaffMe = Extract<Me, { kind: "staff" }>;
type CustomerMe = Extract<Me, { kind: "customer" }>;

/** Redirects to the right sign-in page if the visitor isn't allowed here. */
export function useGuard(allowed: Role[]): StaffMe | null;
export function useGuard(allowed: "customer"): CustomerMe | null;
export function useGuard(allowed: Role[] | "customer"): Me | null {
  const router = useRouter();
  const hydrated = useSession((s) => s.hydrated);
  const user = useSession((s) => s.user);
  const ready = useDemo((s) => s.ready);
  const me = useMe();
  const ok =
    !!me &&
    (allowed === "customer" ? me.kind === "customer" : me.kind === "staff" && allowed.includes(me.employee.role));
  useEffect(() => {
    if (!hydrated || !ready) return;
    if (!ok) router.replace(allowed === "customer" ? "/login/" : "/team/");
  }, [hydrated, ready, ok, allowed, router, user]);
  return ok ? me : null;
}
