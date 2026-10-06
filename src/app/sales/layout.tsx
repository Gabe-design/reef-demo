"use client";

import { usePathname } from "next/navigation";
import { ChartBar, ListChecks, MapTrifold } from "@phosphor-icons/react";
import { MobileShell } from "@/components/mobile-shell";
import { useGuard, useData } from "@/lib/demo/hooks";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const me = useGuard(["sales"]);
  const data = useData();
  const pathname = usePathname() ?? "";
  return (
    <MobileShell
      me={me && data ? me.employee : null}
      fullBleed={pathname === "/sales/" || pathname === "/sales"}
      tabs={[
        { href: "/sales/", label: "Map", icon: MapTrifold },
        { href: "/sales/follow-ups/", label: "Follow-ups", icon: ListChecks },
        { href: "/sales/stats/", label: "My stats", icon: ChartBar },
      ]}
    >
      {children}
    </MobileShell>
  );
}
