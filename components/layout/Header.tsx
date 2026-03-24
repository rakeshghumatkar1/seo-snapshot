'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 header-glass">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0.5 group">
              <span
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--t-100)', fontWeight: 700 }}
              >
                SEO
              </span>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mx-0.5"
                style={{
                  background: 'var(--em-500)',
                  boxShadow: 'var(--em-glow-sm)',
                }}
              />
              <span
                className="text-xl font-medium"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--t-300)', fontWeight: 500 }}
              >
                AI
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: isActive ? 'var(--em-400)' : 'var(--t-300)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.target as HTMLElement).style.color = 'var(--t-100)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.target as HTMLElement).style.color = 'var(--t-300)';
                    }}
                  >
                    {link.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: 'var(--em-400)', boxShadow: '0 0 6px var(--em-400)' }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/tool"
                className="btn btn-secondary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Try Free
                <span aria-hidden="true"> →</span>
              </Link>
            </div>

            {/* Mobile Right */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                className="relative w-10 h-10 flex items-center justify-center rounded-lg"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)' }}
              >
                <div className="w-5 h-4 relative flex flex-col justify-between">
                  <span
                    className="block h-[1.5px] w-full rounded-full transition-all duration-300"
                    style={{
                      background: 'var(--t-200)',
                      transform: mobileOpen ? 'translateY(7.25px) rotate(45deg)' : 'none',
                    }}
                  />
                  <span
                    className="block h-[1.5px] w-full rounded-full transition-all duration-300"
                    style={{
                      background: 'var(--t-200)',
                      opacity: mobileOpen ? 0 : 1,
                    }}
                  />
                  <span
                    className="block h-[1.5px] w-full rounded-full transition-all duration-300"
                    style={{
                      background: 'var(--t-200)',
                      transform: mobileOpen ? 'translateY(-7.25px) rotate(-45deg)' : 'none',
                    }}
                  />
                </div>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center mobile-nav-overlay mobile-nav-bg md:hidden"
        >
          <nav className="flex flex-col items-center gap-2">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-6 py-3 text-2xl font-semibold transition-colors duration-200 fade-up"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: isActive ? 'var(--em-400)' : 'var(--t-200)',
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-6 fade-up" style={{ animationDelay: '240ms' }}>
              <Link
                href="/tool"
                onClick={() => setMobileOpen(false)}
                className="btn btn-primary btn-lg"
              >
                Try Free →
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
