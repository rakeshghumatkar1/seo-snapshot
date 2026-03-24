import Link from 'next/link';

export default function CTABlock() {
  return (
    <div className="glass-elevated p-10 mt-8 text-center relative">
      {/* Emerald accent line */}
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
        Want a Deeper Analysis?
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
          color: 'var(--t-200)',
          lineHeight: 1.7,
          maxWidth: '420px',
          margin: '0 auto 28px',
        }}
      >
        Our AI can generate a comprehensive strategic report with competitive insights and a 6-month roadmap.
      </p>
      <Link href="/tool" className="btn btn-primary btn-lg">
        Analyze Another Website
      </Link>
    </div>
  );
}
