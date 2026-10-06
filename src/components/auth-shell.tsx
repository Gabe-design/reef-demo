import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { PHOTO_IDS } from "@/lib/demo/catalog";
import { PHOTO } from "@/lib/demo/util";

export function AuthShell({ children, photo = PHOTO_IDS.oceanRoom }: { children: React.ReactNode; photo?: string }) {
  return (
    <div className="grid min-h-[100dvh] bg-[#eef3f7] lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-5 py-6 md:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Reef home">
            <Image src="/brand/reef-logo.png" alt="Reef Window Cleaning" width={128} height={54} className="h-11 w-auto" priority />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-navy-900">
            <ArrowLeft size={14} /> Website
          </Link>
        </div>
        <div className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-sm animate-rise">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <Image src={PHOTO(photo, 1600)} alt="" fill sizes="55vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
        <Image src="/brand/reef-mark-white.png" alt="" width={220} height={128} className="absolute bottom-10 left-10 w-44 opacity-90" />
      </div>
    </div>
  );
}
