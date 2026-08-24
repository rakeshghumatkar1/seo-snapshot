import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      q: 'Is the Snapshot report really free?',
      a: 'Yes. The Snapshot report is free and visible without registration or a credit card. Simply enter your website URL to receive a business-friendly review of selected publicly visible pages.',
    },
    {
      q: "What's the difference between Snapshot and Detailed reports?",
      a: 'The Snapshot gives you a concise review of visible business positioning, content clarity, trust signals and up to three priority areas—visible immediately without signup. The Detailed Report includes everything in the Snapshot plus deeper positioning review, customer-search directions, competitive-readiness observations, a prioritised improvement roadmap with five or six sequenced priorities, and a downloadable report where supported. Email is required for the Detailed Report.',
    },
    {
      q: 'How long does it take to generate a report?',
      a: 'Snapshot reports are typically ready within a short wait while the AI reviews visible pages. Detailed reports may take longer because they include more comprehensive analysis.',
    },
    {
      q: 'Do I need technical SEO knowledge to understand the reports?',
      a: 'Not at all. Reports are written in plain language for business owners and founders. We avoid technical jargon and focus on observations and priorities you can actually use.',
    },
    {
      q: 'Is this a technical SEO crawler?',
      a: 'No. This is an AI-powered advisory tool that reviews selected publicly visible pages for messaging, content usefulness, visible structure and trust signals. It does not perform a complete technical crawl, rank tracking or competitive data analysis.',
    },
    {
      q: 'Can I generate reports for multiple websites?',
      a: 'You can analyze different websites over time. Usage may be subject to reasonable rate limits to keep the service available for everyone.',
    },
  ];

  return (
    <div className="public-page-content max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <p className="public-eyebrow mb-4" style={{ color: '#2E6BFF' }}>
          SUPPORT
        </p>
        <h1 className="public-heading-section mb-3">Frequently Asked Questions</h1>
        <p className="public-body-lg">
          Everything you need to know about the SEO &amp; Business Visibility Snapshot
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.q} className="public-card">
            <h2 className="public-heading-card" style={{ marginBottom: '8px' }}>
              {faq.q}
            </h2>
            <p className="public-body-md">{faq.a}</p>
          </div>
        ))}

        <div className="public-card">
          <h2 className="public-heading-card" style={{ marginBottom: '8px' }}>
            What if I have more questions?
          </h2>
          <p className="public-body-md">
            Visit our{' '}
            <Link href="/contact" className="public-link">
              contact page
            </Link>{' '}
            to reach Think Big Digital about your report, implementation priorities or SEO support.
          </p>
        </div>
      </div>

      <div className="public-card p-10 text-center mt-12">
        <h2 className="public-heading-section" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
          Ready to Try It?
        </h2>
        <p className="public-body-md mb-6">
          See how a business-friendly Snapshot can clarify your website opportunities.
        </p>
        <Link href="/tool" className="btn btn-primary btn-lg">
          Generate Free Snapshot
        </Link>
      </div>
    </div>
  );
}
