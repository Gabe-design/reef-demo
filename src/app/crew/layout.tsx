"use client";

import { Clock, Path } from "@phosphor-icons/react";
import { MobileShell } from "@/components/mobile-shell";
import { useGuard, useData } from "@/lib/demo/hooks";

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  const me = useGuard(["worker"]);
  const data = useData();
  return (
    <MobileShell
      me={me && data ? me.employee : null}
      tabs={[
        { href: "/crew/", label: "Today", icon: Path },
        { href: "/crew/hours/", label: "Hours", icon: Clock },
      ]}
    >
      {children}
    </MobileShell>
  );
}
