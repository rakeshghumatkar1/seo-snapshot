import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="badge badge-emerald mb-4 fade-up">ABOUT US</div>
      <h1
        className="fade-up delay-1"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--t-100)', marginBottom: '16px' }}
      >
        About <span className="gradient-text">SEO AI</span>
      </h1>
      <p className="fade-up delay-2" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--t-200)', lineHeight: 1.75, marginBottom: '40px' }}>
        We believe SEO guidance should be accessible, actionable, and business-focused — not buried in technical jargon.
      </p>

      <div className="glass p-8 mb-4 fade-up delay-3">
        <div className="accent-bar">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t-400)', marginBottom: '4px' }}>MISSION</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--t-100)' }}>Our Mission</h2>
        </div>
        <p className="mt-5" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--t-200)', lineHeight: 1.8 }}>
          Most SEO tools overwhelm business owners with data they don&apos;t understand. We take a different approach: AI-powered advisory reports that speak your language and focus on what actually drives business growth.
        </p>
      </div>

      <div className="glass p-8 mb-4 fade-up delay-4">
        <div className="accent-bar">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t-400)', marginBottom: '4px' }}>DIFFERENTIATORS</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--t-100)' }}>Why We&apos;re Different</h2>
        </div>
        <ul className="mt-5 space-y-4">
          {[
            { title: 'Business-First Thinking:', desc: 'We focus on revenue impact, not vanity metrics' },
            { title: 'Plain Language:', desc: 'No technical jargon — just clear, actionable guidance' },
            { title: 'AI-Powered Insights:', desc: 'Advanced analysis delivered in seconds' },
            { title: 'Strategic Roadmaps:', desc: 'Know exactly what to do next' },
          ].map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--em-400)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--t-200)', lineHeight: 1.7 }}><strong style={{ color: 'var(--t-100)' }}>{item.title}</strong> {item.desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass p-8 mb-4 fade-up delay-5">
        <div className="accent-bar">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t-400)', marginBottom: '4px' }}>AUDIENCE</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--t-100)' }}>Who It&apos;s For</h2>
        </div>
        <p className="mt-5" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--t-200)', lineHeight: 1.8 }}>
          SEO AI is built for founders, business owners, and marketing leaders who need strategic SEO guidance without the complexity. Whether you&apos;re just starting to think about SEO or looking to improve your existing strategy, our reports give you the clarity you need to move forward confidently.
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="glass-elevated p-10 text-center mt-12 relative fade-up delay-6">
        <div className="accent-line-top" />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--t-100)', marginBottom: '12px' }}>
          Ready to Understand Your SEO?
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--t-200)', marginBottom: '24px' }}>
          Get your free snapshot report and see the difference for yourself.
        </p>
        <Link href="/tool" className="btn btn-primary btn-lg">Generate Free Report</Link>
      </div>
    </div>
  );
}
