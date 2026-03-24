'use client';

import React, { useState, useEffect } from 'react';

const loadingMessages = [
  'Connecting to your website\u2026',
  'Running AI content analysis\u2026',
  'Mapping your SEO signals\u2026',
  'Identifying key opportunities\u2026',
  'Preparing your strategy report\u2026',
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      setFadeKey((prev) => prev + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Loader ring */}
      <div className="loader mb-8" />

      {/* Rotating message */}
      <div aria-live="polite" className="text-center mb-10">
        <p
          key={fadeKey}
          className="msg-in"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            color: 'var(--t-200)',
          }}
        >
          {loadingMessages[messageIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="progress-track">
          <div className="progress-bar" />
        </div>
      </div>

      {/* Reassurance */}
      <p
        className="mt-6 text-center"
        style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--t-400)' }}
      >
        Your report will be ready in about 30 seconds
      </p>
    </div>
  );
}
