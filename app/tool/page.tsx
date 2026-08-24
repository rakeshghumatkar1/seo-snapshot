'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingState from '@/components/ui/LoadingState';
import { sanitizeUrl } from '@/lib/url/sanitize'

export default function ToolPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="loader" />
      </div>
    }>
      <ToolContent />
    </Suspense>
  );
}

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

function ToolContent() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitData, setRateLimitData] = useState<{
    retryAfterMs: number
    retryAfterFormatted: string
    resetAt: number
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasAutoTriggered = useRef(false);

  const handleGenerate = useCallback(async (inputUrl: string) => {
    if (!isValidInput(inputUrl)) return;

    setIsLoading(true);
    setError(null);
    setRateLimitData(null);
    const normalized = normalizeUrl(inputUrl);

    try {
      const response = await fetch('/api/report/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: normalized }),
      });

      if (response.status === 429) {
        const data = await response.json();
        setRateLimitData({
          retryAfterMs: data.retryAfterMs,
          retryAfterFormatted: data.retryAfterFormatted,
          resetAt: data.resetAt,
        });
        setError('rate_limited');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate report');
      }

      const data = await response.json();
      console.log('API response:', data);
      console.log('Sections:', data.sections);

      sessionStorage.setItem('reportData', JSON.stringify(data));
      setIsLoading(false);
      router.push('/report');
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Something went wrong. Please check your connection and try again.');
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true;
      setUrl(urlParam);
      handleGenerate(urlParam);
    }
  }, [searchParams, handleGenerate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate(url);
  };

  if (error === 'rate_limited' && rateLimitData) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-full max-w-lg mx-auto px-6">
          <RateLimitScreen
            resetAt={rateLimitData.resetAt}
            onBack={() => { setError(null); setRateLimitData(null); router.push('/'); }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-full max-w-lg mx-auto px-6">
          <div className="glass-elevated p-10 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--t-100)', marginBottom: '8px' }}>
              Report Generation Failed
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--t-300)', lineHeight: 1.7, marginBottom: '24px' }}>
              {error}
            </p>
            <button
              onClick={() => { setError(null); handleGenerate(url); }}
              className="btn btn-primary btn-lg justify-center"
            >
              Try Again
            </button>
            <button
              onClick={() => { setError(null); }}
              className="btn btn-ghost justify-center mt-3"
            >
              Change URL
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-full max-w-lg mx-auto px-6">
          <div className="glass-elevated p-10">
            <LoadingState />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page-content flex items-start justify-center px-6" style={{ paddingTop: '12vh', paddingBottom: '4rem' }}>
      <div className="w-full max-w-lg">
        <div className="public-card p-10 fade-up">
          {/* Badge */}
          <div className="badge badge-emerald mb-5">ENTER YOUR WEBSITE</div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h2)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: 'var(--t-100)',
              marginBottom: '8px',
            }}
          >
            Generate Your Snapshot
          </h1>

          {/* Sub */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: 'var(--t-200)',
              lineHeight: 1.7,
              marginBottom: '28px',
            }}
          >
            Enter your website URL for a free, business-friendly review of visible pages. No signup
            required for the Snapshot.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <input
              id="website-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourdomain.com"
              className="input input-hero mb-4"
              aria-label="Website URL"
            />
            <button type="submit" className="btn btn-primary btn-lg pulse w-full justify-center">
              Generate Free Snapshot
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>

          {/* Trust pills */}
          <div className="flex gap-2 mt-5 justify-center flex-wrap">
            {['Free Snapshot', 'No signup required', 'Business-first guidance'].map((t) => (
              <span key={t} className="public-trust-pill public-trust-pill-light">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RateLimitScreen({ resetAt, onBack }: { resetAt: number; onBack: () => void }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function update() {
      const ms = resetAt - Date.now()
      if (ms <= 0) {
        setTimeLeft('Ready!')
        return
      }
      const hours = Math.floor(ms / 3600000)
      const mins = Math.floor((ms % 3600000) / 60000)
      const secs = Math.floor((ms % 60000) / 1000)
      if (hours > 0) {
        setTimeLeft(`${hours}h ${mins}m ${secs}s`)
      } else if (mins > 0) {
        setTimeLeft(`${mins}m ${secs}s`)
      } else {
        setTimeLeft(`${secs}s`)
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [resetAt])

  return (
    <div className="glass" style={{
      maxWidth: '480px',
      margin: '0 auto',
      padding: '48px 32px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(16,185,129,0.1)',
        border: '1px solid rgba(16,185,129,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: '28px',
      }}>
        ⏱
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '24px',
        fontWeight: 700,
        color: 'var(--t-100)',
        marginBottom: '12px',
      }}>
        Daily Limit Reached
      </h2>

      <p style={{
        fontSize: '15px',
        color: 'var(--t-200)',
        lineHeight: 1.6,
        marginBottom: '32px',
      }}>
        You've used your 20 free reports for today.
        Your limit resets in:
      </p>

      <div style={{
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '40px',
          fontWeight: 800,
          color: 'var(--em-400)',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {timeLeft}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--t-300)',
          marginTop: '8px',
        }}>
          until your reports reset
        </div>
      </div>

      <p style={{
        fontSize: '13px',
        color: 'var(--t-300)',
        marginBottom: '24px',
      }}>
        Need more reports? Generate a Detailed
        Report to save your analysis for later.
      </p>

      <button
        className="btn btn-secondary"
        onClick={onBack}
        style={{ width: '100%' }}
      >
        ← Back to Home
      </button>
    </div>
  )
}
