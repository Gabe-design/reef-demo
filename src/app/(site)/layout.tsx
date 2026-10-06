import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Preloader } from "@/components/site/motion";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#eef3f7]">
      <Preloader />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
