'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import { THINK_BIG_HOME } from '@/lib/brand/links';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
];

const contactFormUrl =
  'https://thinkbigdigital.co/contact?utm_source=seo-tool&utm_medium=referral&utm_campaign=seo-snapshot#contact-form';

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
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="public-header sticky top-0 z-50">
        <nav className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="public-header-inner flex justify-between items-center gap-2 lg:gap-3">
            {/* Brand lockup: stacked dark logo + product name */}
            <div className="public-header-brand flex items-center shrink-0">
              <BrandLogo size="header" />
              <Link href="/" className="public-product-lockup">
                <span className="block public-product-name">Search &amp; Growth Report</span>
                <span className="block public-product-descriptor">A Think Big Digital Tool</span>
              </Link>
            </div>

            {/* Desktop nav at xl+ */}
            <div className="public-header-desktop-nav hidden xl:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`public-nav-link ${isActive ? 'public-nav-link-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a
                href={THINK_BIG_HOME}
                target="_blank"
                rel="noopener noreferrer"
                className="public-nav-link public-nav-link-external"
              >
                Think Big Digital
                <span className="sr-only"> (opens in new tab)</span>
              </a>
              <a
                href={contactFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="public-nav-link public-nav-link-external"
              >
                Discuss SEO Support
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden xl:flex items-center shrink-0">
              <Link href="/tool" className="btn btn-primary public-header-cta">
                Review My Website
              </Link>
            </div>

            {/* Compact menu below xl */}
            <div className="flex xl:hidden items-center shrink-0">
              <button
                type="button"
                className="public-mobile-menu-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-panel"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                <span className="public-mobile-menu-icon" data-open={mobileOpen}>
                  <span />
                  <span />
                  <span />
                </span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Compact Nav Overlay */}
      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          className="public-mobile-nav xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <nav className="flex flex-col items-stretch gap-1 p-6 pt-24 max-w-md mx-auto w-full">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`public-mobile-nav-link ${isActive ? 'public-mobile-nav-link-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href={THINK_BIG_HOME}
              target="_blank"
              rel="noopener noreferrer"
              className="public-mobile-nav-link public-mobile-nav-link-external"
              onClick={() => setMobileOpen(false)}
            >
              Think Big Digital
            </a>
            <a
              href={contactFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="public-mobile-nav-link public-mobile-nav-link-external"
              onClick={() => setMobileOpen(false)}
            >
              Discuss SEO Support
            </a>
            <div className="mt-6 pt-6 public-mobile-nav-divider">
              <Link
                href="/tool"
                onClick={() => setMobileOpen(false)}
                className="btn btn-primary btn-lg w-full justify-center"
              >
                Review My Website
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
