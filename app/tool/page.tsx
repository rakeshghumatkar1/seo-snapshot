'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingState from '@/components/ui/LoadingState';

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
    const u = new URL(withProtocol)
    return u.hostname.includes('.')
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasAutoTriggered = useRef(false);

  const handleGenerate = useCallback(async (inputUrl: string) => {
    if (!isValidInput(inputUrl)) return;

    setIsLoading(true);
    const normalized = normalizeUrl(inputUrl);

    try {
      const response = await fetch('/api/report/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: normalized }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('reportData', JSON.stringify(data));
        router.push('/report');
      } else {
        alert('Failed to generate report. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('An error occurred. Please try again.');
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
    <div className="flex items-start justify-center px-6" style={{ marginTop: '12vh' }}>
      <div className="w-full max-w-lg">
        <div className="glass-elevated p-10 fade-up">
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
            Analyze Your SEO
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
            Enter your website URL to receive an instant AI-powered SEO analysis. No signup required.
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
            {['✓ Free forever', '✓ No signup', '✓ 30 seconds'].map((t) => (
              <span key={t} className="badge badge-glass">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
