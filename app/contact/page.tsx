import Link from 'next/link';
import {
  THINK_BIG_CONTACT_FORM,
  THINK_BIG_SERVICES,
  SEO_SUPPORT_EMAIL,
  SEO_SUPPORT_PHONE_DISPLAY,
  SEO_SUPPORT_PHONE_LINK,
} from '@/lib/brand/links';

export default function ContactPage() {
  return (
    <div className="public-page-content max-w-3xl mx-auto px-6 py-16">
      <p className="public-eyebrow mb-4" style={{ color: '#2E6BFF' }}>
        GET IN TOUCH
      </p>
      <h1 className="public-heading-section mb-4">Contact &amp; SEO Support</h1>
      <p className="public-body-lg mb-12">
        Have questions about your report, implementation priorities or broader SEO requirements?
        Think Big Digital can help you discuss next steps—without promising guaranteed rankings or
        outcomes.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="public-card text-center">
          <div className="public-card-icon mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="public-heading-card mb-2">Think Big Digital Contact Form</h2>
          <p className="public-body-sm mb-4">
            Discuss your Snapshot findings, implementation help or broader SEO requirements.
          </p>
          <a
            href={THINK_BIG_CONTACT_FORM}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Open Contact Form
          </a>
        </div>

        <div className="public-card text-center">
          <div className="public-card-icon mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <h2 className="public-heading-card mb-2">Direct SEO Support</h2>
          <p className="public-body-sm mb-4">Reach the Think Big Digital team directly.</p>
          <div className="flex flex-col gap-2">
            <a href={SEO_SUPPORT_EMAIL} className="public-link">
              grow@thinkbigdigital.in
            </a>
            <a href={SEO_SUPPORT_PHONE_LINK} className="public-link">
              {SEO_SUPPORT_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      <div className="public-card p-8 text-center">
        <h2 className="public-heading-card mb-3">Explore Services</h2>
        <p className="public-body-md mb-6">
          Learn how Think Big Digital can help with website, SEO and content improvements based on
          your business goals.
        </p>
        <a
          href={THINK_BIG_SERVICES}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-lg"
        >
          View Think Big Services
        </a>
      </div>

      <p className="public-body-sm text-center mt-8">
        Prefer to generate a report first?{' '}
        <Link href="/tool" className="public-link">
          Generate a free Snapshot
        </Link>
      </p>
    </div>
  );
}
