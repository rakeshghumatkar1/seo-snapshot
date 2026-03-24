import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    { q: 'Is the snapshot report really free?', a: 'Yes! The snapshot report is completely free with no credit card required. Simply enter your website URL and receive instant AI-powered insights about your SEO position.' },
    { q: "What's the difference between snapshot and detailed reports?", a: 'The snapshot report gives you a high-level overview of your SEO position, key opportunities, and next steps. The detailed report includes everything in the snapshot plus comprehensive technical review, competitive landscape analysis, strategic keyword direction, content strategy recommendations, 6-month implementation roadmap, and downloadable PDF report.' },
    { q: 'How long does it take to generate a report?', a: "Snapshot reports are generated in seconds. Detailed reports may take a bit longer as they include more comprehensive analysis, but you'll typically have your report within a minute." },
    { q: 'Do I need technical SEO knowledge to understand the reports?', a: 'Not at all! Our reports are written in plain language for business owners and founders. We avoid technical jargon and focus on actionable insights you can actually use.' },
    { q: 'Is this a technical SEO crawler?', a: 'No. SEO AI is an AI-powered advisory tool, not a technical crawler. We focus on strategic guidance and business-first recommendations rather than overwhelming you with technical data points.' },
    { q: 'Can I generate reports for multiple websites?', a: "Yes! You can generate snapshot reports for as many websites as you'd like. Each report is tailored to the specific website you analyze." },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <div className="badge badge-emerald mx-auto mb-4 fade-up">SUPPORT</div>
        <h1
          className="fade-up delay-1"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--t-100)', marginBottom: '12px' }}
        >
          Frequently Asked Questions
        </h1>
        <p className="fade-up delay-2" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--t-200)' }}>
          Everything you need to know about SEO AI
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className={`glass p-8 fade-up delay-${Math.min(i + 3, 7)}`}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--t-100)', marginBottom: '8px' }}>{faq.q}</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--t-200)', lineHeight: 1.7 }}>{faq.a}</p>
          </div>
        ))}

        <div className="glass p-8">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--t-100)', marginBottom: '8px' }}>What if I have more questions?</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--t-200)', lineHeight: 1.7 }}>
            We&apos;re here to help! Visit our <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 transition-colors">contact page</Link> to get in touch with our team.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="glass-elevated p-10 text-center mt-12 relative">
        <div className="accent-line-top" />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--t-100)', marginBottom: '12px' }}>
          Ready to Try It?
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--t-200)', marginBottom: '24px' }}>
          See for yourself how easy it is to get professional SEO insights.
        </p>
        <Link href="/tool" className="btn btn-primary btn-lg">Generate Free Snapshot</Link>
      </div>
    </div>
  );
}
