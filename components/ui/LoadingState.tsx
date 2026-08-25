'use client';

import React, { useState, useEffect } from 'react';

const loadingMessages = [
  'Understanding your business and customer journey...',
  'Reviewing important service pages...',
  'Assessing trust and credibility signals...',
  'Checking search readiness...',
  'Assessing AI discovery readiness...',
  'Reviewing enquiry paths...',
  'Prioritising business opportunities...',
  'Building your action roadmap...',
  'Almost done — polishing the report...',
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messageIndex >= loadingMessages.length - 1) return;
    const timer = setTimeout(() => {
      setMessageIndex(prev => prev + 1);
    }, 4000);
    return () => clearTimeout(timer);
  }, [messageIndex]);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Loader ring */}
      <div className="loader mb-8" />

      {/* Rotating message */}
      <div aria-live="polite" className="text-center mb-10">
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            color: 'var(--t-200)',
            transition: 'opacity 0.3s ease',
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
        This usually takes 20 to 40 seconds
      </p>
    </div>
  );
}
