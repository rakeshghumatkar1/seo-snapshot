import Link from 'next/link';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Enter Your Website URL',
      body: 'Type in your domain and hit analyze. No account needed, no credit card required.',
    },
    {
      num: '02',
      title: 'AI Analyzes Your SEO',
      body: 'Our AI reviews your site structure, content signals, and visibility factors in real time.',
    },
    {
      num: '03',
      title: 'Get Strategic Insights',
      body: 'Receive a clear, business-friendly report with actionable recommendations — not technical noise.',
    },
  ];

  const stats = [
    { value: '30 sec', label: 'Average report time' },
    { value: '100% Free', label: 'For Snapshot reports' },
    { value: 'No Signup', label: 'Required for Snapshot' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* ═══ HERO ═══ */}
      <div className="text-center mb-20">
        <div className="badge badge-emerald mx-auto mb-4 fade-up">HOW IT WORKS</div>
        <h1
          className="fade-up delay-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h1)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            color: 'var(--t-100)',
            marginBottom: '16px',
          }}
        >
          Three Steps to{' '}
          <span className="gradient-text">Strategic Clarity</span>
        </h1>
        <p
          className="fade-up delay-2"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'var(--t-200)',
            lineHeight: 1.75,
            maxWidth: '520px',
            margin: '0 auto',
          }}
        >
          Get professional SEO insights in three simple steps. No technical expertise required.
        </p>
      </div>

      {/* ═══ STEPS ═══ */}
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`glass p-8 relative fade-up delay-${i + 3}`}
          >
            {/* Large background number */}
            <span
              aria-hidden="true"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '80px',
                fontWeight: 800,
                color: 'var(--em-500)',
                opacity: 0.15,
                position: 'absolute',
                top: '10px',
                right: '18px',
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {step.num}
            </span>

            {/* Content */}
            <div className="relative z-10">
              <div className="badge badge-emerald mb-4">
                STEP {step.num}
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--t-100)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                  marginBottom: '10px',
                }}
              >
                {step.title}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  color: 'var(--t-200)',
                  lineHeight: 1.8,
                }}
              >
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ STAT HIGHLIGHTS ═══ */}
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {stats.map((stat, i) => (
          <div
            key={stat.value}
            className={`glass p-6 text-center fade-up delay-${i + 5}`}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--em-400)',
                marginBottom: '4px',
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--t-300)',
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ═══ BOTTOM CTA ═══ */}
      <div className="glass-elevated p-12 text-center relative max-w-2xl mx-auto">
        <div className="accent-line-top" />
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h2)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--t-100)',
            marginBottom: '12px',
          }}
        >
          See It For Yourself
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            color: 'var(--t-200)',
            marginBottom: '28px',
          }}
        >
          Try the tool free — no account needed
        </p>
        <Link href="/tool" className="btn btn-primary btn-lg">
          Generate Free Snapshot
        </Link>
      </div>
    </div>
  );
}
