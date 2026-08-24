import Link from 'next/link';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Enter Your Website',
      body: 'Paste your website URL. The Snapshot does not require registration or a credit card.',
    },
    {
      num: '02',
      title: 'AI Reviews Visible Pages',
      body: 'The tool reviews selected publicly visible pages for messaging, content usefulness, visible structure and trust signals. It does not perform a complete technical crawl.',
    },
    {
      num: '03',
      title: 'Receive Clear Direction',
      body: 'Get a business-friendly report explaining visible strengths, opportunities and the priorities worth considering first.',
    },
  ];

  const highlights = [
    { value: 'Free Snapshot', label: 'Visible without registration' },
    { value: 'Business-first', label: 'Plain-language guidance' },
    { value: 'Email for Detailed', label: 'Deeper report when ready' },
  ];

  return (
    <div className="public-page-content max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-20">
        <p className="public-eyebrow mb-4" style={{ color: '#2E6BFF' }}>
          HOW IT WORKS
        </p>
        <h1 className="public-heading-section mb-4">
          Three Steps to{' '}
          <span className="public-accent-gradient">Clearer Website Direction</span>
        </h1>
        <p className="public-body-lg" style={{ maxWidth: '520px', margin: '0 auto' }}>
          Get business-friendly SEO insights in three simple steps. No technical expertise required.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {steps.map((step) => (
          <div key={step.num} className="public-card relative">
            <span
              aria-hidden="true"
              style={{
                fontSize: '4rem',
                fontWeight: 800,
                color: 'rgba(46, 107, 255, 0.12)',
                position: 'absolute',
                top: '10px',
                right: '18px',
                lineHeight: 1,
              }}
            >
              {step.num}
            </span>
            <div className="relative z-10">
              <p className="public-eyebrow mb-3" style={{ color: '#2E6BFF', fontSize: '10px' }}>
                STEP {step.num}
              </p>
              <h2 className="public-heading-card" style={{ fontSize: '1.25rem', marginBottom: '10px' }}>
                {step.title}
              </h2>
              <p className="public-body-md">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {highlights.map((stat) => (
          <div key={stat.value} className="public-card p-6 text-center">
            <p
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#2E6BFF',
                marginBottom: '4px',
              }}
            >
              {stat.value}
            </p>
            <p className="public-body-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="public-card p-12 text-center max-w-2xl mx-auto">
        <h2 className="public-heading-section" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
          See It For Yourself
        </h2>
        <p className="public-body-md mb-7">Try the tool free—no account needed for the Snapshot.</p>
        <Link href="/tool" className="btn btn-primary btn-lg">
          Generate Free Snapshot
        </Link>
      </div>
    </div>
  );
}
