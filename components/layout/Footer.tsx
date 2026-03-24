import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-24" style={{ borderTop: '1px solid var(--glass-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-0.5 mb-4">
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--t-100)', fontWeight: 700, fontSize: '18px' }}>
                SEO
              </span>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mx-0.5"
                style={{ background: 'var(--em-500)', boxShadow: 'var(--em-glow-sm)' }}
              />
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--t-300)', fontWeight: 500, fontSize: '18px' }}>
                AI
              </span>
            </Link>
            <p style={{ color: 'var(--t-400)', fontSize: '14px', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              AI-powered SEO advisory reports for business owners and founders.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="mb-4"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: 'var(--t-400)',
              }}
            >
              Product
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/tool', label: 'Generate Report' },
                { href: '/how-it-works', label: 'How It Works' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200 hover:text-emerald-400"
                    style={{ color: 'var(--t-300)', fontFamily: 'var(--font-body)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="mb-4"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: 'var(--t-400)',
              }}
            >
              Company
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200 hover:text-emerald-400"
                    style={{ color: 'var(--t-300)', fontFamily: 'var(--font-body)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4
              className="mb-4"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: 'var(--t-400)',
              }}
            >
              Support
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/faq"
                  className="text-sm transition-colors duration-200 hover:text-emerald-400"
                  style={{ color: 'var(--t-300)', fontFamily: 'var(--font-body)' }}
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="divider mt-10 mb-8" />
        <p className="text-center" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--t-400)' }}>
          &copy; {new Date().getFullYear()} SEO AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
