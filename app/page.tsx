'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sanitizeUrl } from '@/lib/url/sanitize';
import ServiceConversionSection from '@/components/public/ServiceConversionSection';

function isValidInput(url: string): boolean {
  const cleaned = url.trim();
  if (!cleaned) return false;
  const withProtocol = cleaned.startsWith('http') ? cleaned : 'https://' + cleaned;
  try {
    sanitizeUrl(withProtocol);
    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  const cleaned = url.trim();
  return cleaned.startsWith('http') ? cleaned : 'https://' + cleaned;
}

const SNAPSHOT_FEATURES = [
  'Visible business positioning',
  'Website and service clarity',
  'Content usefulness',
  'Trust and visibility opportunities',
  'Up to three priority areas',
  'Report visible without registration',
];

const DETAILED_FEATURES = [
  'Everything included in Snapshot',
  'Deeper positioning and content review',
  'Customer-search and topic directions',
  'Competitive-readiness observations',
  'Trust and authority signals',
  'Prioritised improvement roadmap',
  'Five or six sequenced priorities',
  'Downloadable report where currently supported',
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="public-journey-features">
      {items.map((item) => (
        <li key={item} className="public-journey-feature-item">
          <svg
            className="public-journey-check"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidInput(url)) return;
    const normalized = normalizeUrl(url);
    router.push(`/tool?url=${encodeURIComponent(normalized)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="public-section-hero public-section-hero-compact flex flex-col items-center justify-center text-center px-6 py-20 lg:py-24 relative">
        <p className="public-eyebrow public-eyebrow-hero fade-up delay-0">
          A THINK BIG DIGITAL SEO TOOL · FREE SNAPSHOT
        </p>

        <h1 className="public-heading-hero fade-up delay-1 public-hero-title">
          Your Website&apos;s SEO,{' '}
          <span className="public-accent-gradient">Explained for Business</span>
        </h1>

        <p className="fade-up delay-2 public-body-lg public-hero-sub">
          Get a free, business-friendly review of selected publicly visible pages on your website.
          No technical score, no jargon—just clear observations and priorities.
        </p>

        <form
          onSubmit={handleSubmit}
          className="fade-up delay-3 w-full public-hero-form"
          aria-label="Generate a free SEO Snapshot"
        >
          <label htmlFor="homepage-url" className="public-form-label">
            Website URL
          </label>
          <div className="flex gap-2.5 flex-col xs:flex-row">
            <input
              id="homepage-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourdomain.com"
              className="input input-hero flex-1"
              autoComplete="url"
            />
            <button type="submit" className="btn btn-primary btn-lg whitespace-nowrap">
              Generate Free Snapshot
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>

        <div className="fade-up delay-4 flex gap-2 mt-5 justify-center flex-wrap">
          {['Free Snapshot', 'No signup required', 'Business-first guidance'].map((t) => (
            <span key={t} className="public-trust-pill">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Product proof strip */}
      <section className="public-proof-strip py-5">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          {['Public-page review', 'Business-first language', 'Clear priorities'].map((item, i) => (
            <span key={item} className="public-proof-item">
              {item}
              {i < 2 && (
                <span className="mx-3 sm:mx-4 hidden sm:inline public-proof-sep" aria-hidden="true">
                  ·
                </span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="public-section-light public-section-compact">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10 lg:mb-12">
            <p className="public-eyebrow public-eyebrow-on-light mb-3">WHY IT MATTERS</p>
            <h2 className="public-heading-section public-section-title">
              Understand What Matters Before Investing in SEO
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
            {[
              {
                title: 'Clarity Before Complexity',
                body: 'See whether visitors can quickly understand what you offer, who it is for and why it matters.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                ),
              },
              {
                title: 'Business Impact, Not Error Lists',
                body: 'Understand how visible content, trust and website clarity may influence discoverability and customer confidence.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                ),
              },
              {
                title: 'Priorities You Can Act On',
                body: 'Receive a focused explanation of the opportunities worth addressing first—without a technical data dump.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ),
              },
            ].map((card) => (
              <div key={card.title} className="public-card public-card-balanced">
                <div className="public-card-icon">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="public-heading-card public-card-title">{card.title}</h3>
                <p className="public-body-md">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="public-section-process public-section-compact">
        <div className="max-w-4xl mx-auto px-6 text-center mb-10 lg:mb-12">
          <p className="public-eyebrow public-eyebrow-on-light mb-3">SIMPLE PROCESS</p>
          <h2 className="public-heading-section">How It Works</h2>
        </div>

        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-5 lg:gap-6">
          {[
            {
              num: '1',
              title: 'Enter Your Website',
              body: 'Paste your website URL. The Snapshot does not require registration or a credit card.',
            },
            {
              num: '2',
              title: 'AI Reviews Visible Pages',
              body: 'The tool reviews selected publicly visible pages for messaging, content usefulness, visible structure and trust signals. It does not perform a complete technical crawl.',
            },
            {
              num: '3',
              title: 'Receive Clear Direction',
              body: 'Get a business-friendly Snapshot explaining visible strengths, opportunities and the priorities worth considering first.',
            },
          ].map((step) => (
            <div key={step.num} className="public-card public-card-balanced public-step-card">
              <span className="public-step-number" aria-hidden="true">
                {step.num}
              </span>
              <div className="public-step-content">
                <h3 className="public-heading-card public-card-title">{step.title}</h3>
                <p className="public-body-md">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two-step report journey */}
      <section className="public-section-compare public-section-compact">
        <div className="max-w-4xl mx-auto px-6 text-center mb-10 lg:mb-12">
          <p className="public-eyebrow mb-3">YOUR FREE REPORT PATH</p>
          <h2 className="public-heading-section public-compare-heading">
            Start With a Free Snapshot. Go Deeper When Ready.
          </h2>
          <p className="public-body-lg public-compare-intro">
            Review the Snapshot first, then request the free Detailed Report if you want deeper
            guidance.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-5 lg:gap-6 public-journey-grid">
          {/* Step 1 — Snapshot */}
          <article className="public-journey-card public-journey-card-primary">
            <div className="public-journey-card-body">
              <span className="public-journey-badge public-journey-badge-step1">STEP 1 · FREE</span>
              <h3 className="public-journey-title">Snapshot Report</h3>
              <p className="public-journey-lead">
                Your starting point before deciding whether you want the Detailed Report.
              </p>
              <FeatureList items={SNAPSHOT_FEATURES} />
            </div>
            <div className="public-journey-card-footer">
              <Link href="/tool" className="btn btn-primary btn-lg public-journey-btn">
                Generate Free Snapshot
              </Link>
            </div>
          </article>

          {/* Step 2 — Detailed */}
          <article className="public-journey-card public-journey-card-secondary">
            <div className="public-journey-card-body">
              <span className="public-journey-badge public-journey-badge-step2">STEP 2 · FREE</span>
              <h3 className="public-journey-title">Detailed Report</h3>
              <p className="public-journey-lead">
                Available after you review your Snapshot. The Detailed Report is also free. Email
                required.
              </p>
              <FeatureList items={DETAILED_FEATURES} />
            </div>
            <div className="public-journey-card-footer">
              <Link href="/tool" className="btn btn-secondary btn-lg public-journey-btn">
                Start With the Free Snapshot
              </Link>
            </div>
          </article>
        </div>

        <p className="public-compare-reminder">
          Both reports are free. The Snapshot requires no signup; the Detailed Report requires your
          email.
        </p>
      </section>

      <ServiceConversionSection />
    </div>
  );
}
