import Link from 'next/link';

export default function CTABlock() {
  return (
    <div className="glass-elevated p-10 mt-8 text-center relative">
      <div className="accent-line-top" />

      <h2 className="public-heading-section" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
        Analyze Another Website?
      </h2>
      <p className="public-body-md" style={{ maxWidth: '420px', margin: '0 auto 28px' }}>
        Generate a free Snapshot for another site to compare visible positioning and priorities.
      </p>
      <Link href="/tool" className="btn btn-secondary btn-lg">
        Generate Free Snapshot
      </Link>
    </div>
  );
}
