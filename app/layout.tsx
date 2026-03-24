import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SEO Snapshot - AI-Powered SEO Advisory Reports",
  description: "Get instant AI-powered SEO insights for your website. Free snapshot reports and detailed analysis for business owners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: 'var(--font-body), ui-sans-serif, system-ui, sans-serif' }}>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <div className="mesh" aria-hidden="true" />
          <div className="mesh-orb-3" aria-hidden="true" />
          <div className="noise-overlay" aria-hidden="true" />
          <div className="relative z-10">
            <Header />
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
