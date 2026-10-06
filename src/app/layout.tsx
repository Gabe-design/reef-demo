import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { DemoProvider } from "@/lib/demo/provider";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Reef Window Cleaning | San Diego",
    template: "%s | Reef Window Cleaning",
  },
  description:
    "Interior and exterior window cleaning, screens, tracks, skylights and hard-water removal for San Diego homes and storefronts.",
  // Pitch demo: keep it out of search engines until Reef approves launch.
  robots: { index: false, follow: false },
  icons: { icon: "/brand/reef-icon.png", apple: "/brand/reef-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#032541",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
