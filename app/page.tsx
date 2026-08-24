'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sanitizeUrl } from '@/lib/url/sanitize'

function isValidInput(url: string): boolean {
  const cleaned = url.trim()
  if (!cleaned) return false
  const withProtocol = cleaned.startsWith('http')
    ? cleaned
    : 'https://' + cleaned
  try {
    sanitizeUrl(withProtocol)
    return true
  } catch {
    return false
  }
}

function normalizeUrl(url: string): string {
  const cleaned = url.trim()
  return cleaned.startsWith('http') ? cleaned : 'https://' + cleaned
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
      {/* ═══ HERO ═══ */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 relative z-10">
        {/* Status badge */}
        <div className="badge badge-emerald badge-dot fade-up delay-0">
          AI-Powered SEO Intelligence · Free Snapshot
        </div>

        {/* Headline */}
        <h1
          className="fade-up delay-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-hero)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            color: 'var(--t-100)',
            maxWidth: '820px',
            margin: '28px auto 0',
          }}
        >
          Your Website&apos;s SEO{' '}
          <span className="gradient-text-wide">Decoded by AI</span>
        </h1>

        {/* Sub */}
        <p
          className="fade-up delay-2"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'var(--t-200)',
            lineHeight: 1.75,
            maxWidth: '500px',
            margin: '24px auto 0',
          }}
        >
          Get a free AI-generated SEO report in 30 seconds. No jargon. No scores. Just clear, strategic guidance your business can act on.
        </p>

        {/* Input + CTA */}
        <form onSubmit={handleSubmit} className="fade-up delay-3 w-full" style={{ maxWidth: '540px', marginTop: '44px' }}>
          <div className="flex gap-2.5 flex-col xs:flex-row">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourdomain.com"
              className="input input-hero flex-1"
            />
            <button type="submit" className="btn btn-primary btn-lg pulse whitespace-nowrap">
              Analyze Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>

        {/* Trust pills */}
        <div className="fade-up delay-4 flex gap-2 mt-5 justify-center flex-wrap">
          {['✓ Free forever', '✓ No signup', '✓ 30 seconds'].map((t) => (
            <span key={t} className="badge badge-glass">{t}</span>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-hint" style={{ animation: 'chevron-fade-in 1s ease 2s both, bounce-gentle 2.5s ease-in-out 3s infinite' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--t-400)' }}>
            <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF BAR ═══ */}
      <section className="py-8 relative social-proof-bar">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-6 flex-wrap" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--t-300)' }}>
          <span><strong style={{ fontFamily: 'monospace', color: 'var(--t-200)' }}>10,000+</strong> reports generated</span>
          <span style={{ color: 'var(--t-500)' }}>·</span>
          <span><strong style={{ fontFamily: 'monospace', color: 'var(--t-200)' }}>30</strong> second analysis</span>
          <span style={{ color: 'var(--t-500)' }}>·</span>
          <span>Business-first insights</span>
        </div>
      </section>

      {/* ═══ BENEFITS ═══ */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="badge badge-emerald mx-auto mb-4">WHY IT MATTERS</div>
          <h2 className="section-heading-gradient" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--t-100)', maxWidth: '640px', margin: '0 auto' }}>
            The Unfair Advantage Your Competitors Don&apos;t Want You to Have
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
              title: 'Clarity over Complexity',
              body: 'Our AI distills hundreds of SEO signals into plain-language advisory. No dashboards to decipher, no scores to second-guess.',
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />,
              title: 'Lead Generation Engine',
              body: 'Free Snapshot gets them in the door. Email-gated Detailed report turns visitors into qualified leads — automatically.',
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
              title: 'Business-First Language',
              body: 'Built for founders, not developers. Every recommendation maps to revenue impact, not technical vanity metrics.',
            },
          ].map((card, i) => (
            <div key={card.title} className={`glass p-8 fade-up delay-${i + 1}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--em-400)' }}>{card.icon}</svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--t-100)', marginBottom: '10px' }}>{card.title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--t-200)', lineHeight: 1.7 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="badge badge-emerald mx-auto mb-4">SIMPLE PROCESS</div>
          <h2 className="section-heading-gradient" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--t-100)' }}>
            Three Steps to Strategic Clarity
          </h2>
        </div>

        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-6 relative">
          {/* Dashed connectors (desktop only) */}
          <div className="hidden md:block absolute top-1/2 left-[33.3%] w-[33.3%] -translate-y-1/2 z-0" style={{ borderTop: '1px dashed var(--t-500)' }} />
          <div className="hidden md:block absolute top-1/2 right-0 w-[33.3%] -translate-y-1/2 z-0" style={{ borderTop: '1px dashed var(--t-500)' }} />

          {[
            { num: '1', title: 'Enter Your URL', body: 'Simply paste your website URL. No signup, no credit card, no complexity.' },
            { num: '2', title: 'AI Analyzes Everything', body: 'Our AI reviews content, structure, authority, and competitive landscape in seconds.' },
            { num: '3', title: 'Get Strategic Insights', body: 'Receive a clear, actionable report written in language your business can act on immediately.' },
          ].map((step, i) => (
            <div key={step.num} className={`glass p-8 relative z-10 fade-up delay-${i + 1}`}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '80px', fontWeight: 800, color: 'var(--t-500)', position: 'absolute', top: '12px', right: '20px', lineHeight: 1, pointerEvents: 'none' }}>{step.num}</span>
              <div className="relative z-10">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--t-100)', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--t-200)', lineHeight: 1.7 }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SNAPSHOT vs DETAILED ═══ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <div className="badge badge-emerald mx-auto mb-4">COMPARE</div>
          <h2 className="section-heading-gradient" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--t-100)' }}>
            Choose Your Level of Insight
          </h2>
        </div>

        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          {/* Snapshot */}
          <div className="glass p-8">
            <div className="badge badge-glass mb-4">FREE</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--t-100)', marginBottom: '16px' }}>Snapshot Report</h3>
            <ul className="space-y-3 mb-8">
              {['High-level SEO overview', 'Current visibility assessment', 'Content authority evaluation', 'Key opportunity areas', 'Immediate next steps'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--t-300)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--t-200)' }}>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/tool" className="btn btn-secondary w-full justify-center">Try Free →</Link>
          </div>

          {/* Detailed */}
          <div className="glass p-8 relative" style={{ borderColor: 'rgba(16,185,129,0.25)', boxShadow: 'var(--shadow-card), var(--em-glow-sm)' }}>
            <div className="accent-line-top" />
            <div className="absolute -top-3 right-6 z-20" style={{ background: 'var(--em-500)', color: '#fff', padding: '4px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', transform: 'rotate(3deg)', boxShadow: 'var(--em-glow-sm)' }}>Most Popular</div>
            <div className="badge badge-emerald mb-4">ADVANCED</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--t-100)', marginBottom: '16px' }}>Detailed Report</h3>
            <ul className="space-y-3 mb-8">
              {['Everything in Snapshot, plus:', 'Comprehensive technical review', 'Competitive landscape analysis', 'Strategic keyword direction', 'Content strategy recommendations', '6-month implementation roadmap', 'Current positioning assessment', 'Downloadable PDF report'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--em-400)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--t-200)' }}>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/tool" className="btn btn-primary w-full justify-center">Unlock Free →</Link>
            <p className="mt-3 text-center" style={{ fontSize: '12px', color: 'var(--t-400)', fontFamily: 'var(--font-body)' }}>Email required for advanced report</p>
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="glass-elevated p-10 sm:p-16 text-center relative">
            {/* Glow line */}
            <div className="absolute top-0 left-0 right-0 z-10" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--em-500), transparent)' }} />
            <h2 className="section-heading-gradient" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--t-100)', marginBottom: '16px' }}>
              Ready to See What Your Website Is Missing?
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--t-200)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 32px' }}>
              Join thousands of business owners who&apos;ve unlocked actionable SEO insights — free.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/tool" className="btn btn-primary btn-lg">Analyze My Website</Link>
              <Link href="/how-it-works" className="btn btn-secondary btn-lg">Learn More</Link>
            </div>
            <p className="mt-5" style={{ fontSize: '13px', color: 'var(--t-400)', fontFamily: 'var(--font-body)' }}>No credit card · No signup · Results in 30 seconds</p>
          </div>
        </div>
      </section>
    </div>
  );
}
