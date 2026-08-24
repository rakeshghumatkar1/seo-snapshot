import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="public-page-content max-w-3xl mx-auto px-6 py-16">
      <p className="public-eyebrow mb-4" style={{ color: '#2E6BFF' }}>
        ABOUT
      </p>
      <h1 className="public-heading-section mb-4">
        About SEO &amp; Business Visibility Snapshot
      </h1>
      <p className="public-body-lg mb-10">
        A business-friendly SEO visibility tool from{' '}
        <a
          href="https://thinkbigdigital.co"
          target="_blank"
          rel="noopener noreferrer"
          className="public-link"
        >
          Think Big Digital
        </a>
        . We believe SEO guidance should be accessible, actionable and focused on what business
        owners can understand—not buried in technical jargon.
      </p>

      <div className="public-card mb-4">
        <div className="accent-bar">
          <p className="public-eyebrow" style={{ fontSize: '11px', marginBottom: '4px', color: '#6B7280' }}>
            MISSION
          </p>
          <h2 className="public-heading-card">Our Mission</h2>
        </div>
        <p className="public-body-md mt-5">
          Most SEO tools overwhelm business owners with data they don&apos;t understand. This tool
          takes a different approach: AI-powered advisory reports that review publicly visible pages
          and explain opportunities in plain language—without numeric scores or technical error
          dumps.
        </p>
      </div>

      <div className="public-card mb-4">
        <div className="accent-bar">
          <p className="public-eyebrow" style={{ fontSize: '11px', marginBottom: '4px', color: '#6B7280' }}>
            DIFFERENTIATORS
          </p>
          <h2 className="public-heading-card">Why We&apos;re Different</h2>
        </div>
        <ul className="mt-5 space-y-4">
          {[
            {
              title: 'Business-first thinking:',
              desc: 'We focus on clarity, trust and visible positioning—not vanity metrics.',
            },
            {
              title: 'Plain language:',
              desc: 'No technical jargon—just clear, actionable guidance.',
            },
            {
              title: 'Honest scope:',
              desc: 'The tool reviews selected publicly visible pages; it is not a complete technical crawl.',
            },
            {
              title: 'Prioritised direction:',
              desc: 'Know which opportunities are worth addressing first.',
            },
          ].map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <svg
                className="w-4 h-4 mt-1 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#2E6BFF' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="public-body-md">
                <strong style={{ color: '#0A0F1C' }}>{item.title}</strong> {item.desc}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="public-card mb-4">
        <div className="accent-bar">
          <p className="public-eyebrow" style={{ fontSize: '11px', marginBottom: '4px', color: '#6B7280' }}>
            AUDIENCE
          </p>
          <h2 className="public-heading-card">Who It&apos;s For</h2>
        </div>
        <p className="public-body-md mt-5">
          Built for founders, business owners and marketing leaders who need strategic SEO guidance
          without complexity. Start with a free Snapshot—no registration required—and unlock the
          Detailed Report with your email when you need deeper analysis.
        </p>
      </div>

      <div className="public-card p-10 text-center mt-12">
        <h2 className="public-heading-section" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
          Ready to Understand Your Website?
        </h2>
        <p className="public-body-md mb-6">
          Get your free Snapshot and see the difference for yourself.
        </p>
        <Link href="/tool" className="btn btn-primary btn-lg">
          Generate Free Snapshot
        </Link>
      </div>
    </div>
  );
}
