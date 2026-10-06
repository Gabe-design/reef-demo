"use client";

import { ReefMap } from "@/components/map";

export function AreaMap({ points }: { points: { name: string; lat: number; lng: number }[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] shadow-soft">
      <ReefMap className="h-[460px] w-full md:h-[560px]" points={points.map((p) => ({ id: p.name, lat: p.lat, lng: p.lng, color: "#032541" }))} />
    </div>
  );
}
