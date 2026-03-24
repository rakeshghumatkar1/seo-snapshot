'use client';

import { useState } from 'react';

interface RatingBlockProps {
  websiteUrl: string;
  email?: string;
}

export default function RatingBlock({ websiteUrl, email }: RatingBlockProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl,
          email,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass p-8 max-w-md mx-auto mt-8 text-center">
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--em-400)' }}>
          Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="glass p-8 max-w-md mx-auto mt-8 text-center">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--t-100)', marginBottom: '4px' }}>
        Was this useful?
      </h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--t-300)', marginBottom: '16px' }}>
        Help us improve the quality of AI reports
      </p>

      {/* Stars */}
      <div className="flex gap-2 justify-center mb-6">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hoveredRating || rating);
          return (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              aria-label={`Rate ${star} out of 5 stars`}
              className="transition-transform duration-150 hover:scale-110"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill={filled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={filled ? 0 : 1.5}
                style={{
                  color: filled ? 'var(--em-400)' : 'var(--t-500)',
                  filter: filled ? 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' : 'none',
                  transition: 'color 150ms, filter 150ms',
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Any additional thoughts? (optional)"
        className="input mb-4"
        rows={3}
      />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className="btn btn-secondary w-full justify-center"
      >
        {isSubmitting ? 'Submitting\u2026' : 'Submit Feedback'}
      </button>
    </div>
  );
}
