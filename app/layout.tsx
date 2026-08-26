import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import PublicShell from "@/components/layout/PublicShell";
import { CANONICAL_ORIGIN } from "@/lib/brand/links";
import { FAVICON_SYMBOL_SRC } from "@/lib/brand/assets";

const geistSans = localFont({
  src: [
    { path: "../public/fonts/geist-sans-Geist-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/geist-sans-Geist-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/geist-sans-Geist-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/geist-sans-Geist-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "../public/fonts/geist-mono-GeistMono-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Search & Growth Report | Think Big Digital",
  description:
    "Get a free, business-focused review of your website’s search visibility, trust, AI discovery and enquiry readiness — with clear priorities on what to improve first.",
  metadataBase: new URL(CANONICAL_ORIGIN),
  alternates: {
    canonical: CANONICAL_ORIGIN,
  },
  icons: {
    icon: FAVICON_SYMBOL_SRC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' }}>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <div className="mesh" aria-hidden="true" />
          <div className="mesh-orb-3" aria-hidden="true" />
          <div className="noise-overlay" aria-hidden="true" />
          <div className="relative z-10">
            <PublicShell>
              {children}
            </PublicShell>
          </div>
        </Providers>
      </body>
    </html>
  );
}
