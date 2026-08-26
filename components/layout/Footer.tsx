import Link from 'next/link';
import BrandLogo from '@/components/brand/BrandLogo';
import {
  THINK_BIG_HOME,
  THINK_BIG_SERVICES,
  THINK_BIG_CASE_STUDIES,
  THINK_BIG_RECOMMENDATIONS,
  THINK_BIG_ABOUT,
  THINK_BIG_CONTACT,
  THINK_BIG_CONTACT_FORM,
  SEO_SUPPORT_EMAIL,
  SEO_SUPPORT_PHONE_DISPLAY,
  SEO_SUPPORT_PHONE_LINK,
} from '@/lib/brand/links';

export default function Footer() {
  return (
    <footer className="public-footer mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <BrandLogo size="footer" href={THINK_BIG_HOME} />
            <p className="public-footer-product-name mt-4">Search &amp; Growth Report</p>
            <p className="public-footer-tagline mt-2">
              A Think Big Digital tool for business-focused website, search and growth analysis.
            </p>
          </div>

          {/* Product */}
          <div>
            <h2 className="public-footer-heading">Product</h2>
            <ul className="space-y-2">
              {[
                { href: '/tool', label: 'Generate Report' },
                { href: '/how-it-works', label: 'How It Works' },
                { href: '/faq', label: 'FAQ' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="public-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Think Big Digital */}
          <div>
            <h2 className="public-footer-heading">Think Big Digital</h2>
            <ul className="space-y-2">
              {[
                { href: THINK_BIG_HOME, label: 'Home' },
                { href: THINK_BIG_SERVICES.split('?')[0], label: 'Services' },
                { href: THINK_BIG_CASE_STUDIES, label: 'Case Studies' },
                { href: THINK_BIG_RECOMMENDATIONS, label: 'Recommendations' },
                { href: THINK_BIG_ABOUT, label: 'About' },
                { href: THINK_BIG_CONTACT, label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-footer-link"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="public-footer-heading">Contact</h2>
            <ul className="space-y-2">
              <li>
                <a href={SEO_SUPPORT_EMAIL} className="public-footer-link public-footer-contact">
                  grow@thinkbigdigital.in
                </a>
              </li>
              <li>
                <a href={SEO_SUPPORT_PHONE_LINK} className="public-footer-link public-footer-contact">
                  {SEO_SUPPORT_PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={THINK_BIG_CONTACT_FORM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-footer-link"
                >
                  Discuss SEO Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="public-footer-divider mt-10 mb-6" />
        <p className="public-footer-copyright text-center">
          &copy; 2026 ThinkBig Digital Solutions Pvt Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
