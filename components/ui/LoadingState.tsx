'use client';

import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Fetching the website pages...",
  "Reading the homepage content...",
  "Extracting headings and site structure...",
  "Identifying services and offerings...",
  "Checking which pages exist and which are missing...",
  "Analysing the navigation structure...",
  "Researching the competitive landscape...",
  "Identifying keyword opportunities...",
  "Evaluating content depth and gaps...",
  "Sarah is writing the SEO report...",
  "Reviewing trust signals and authority...",
  "Finalising recommendations...",
  "Almost done — polishing the report...",
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
