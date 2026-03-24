'use client';

import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, description, badge, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => modalRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          background: 'rgba(3,7,18,0.85)',
          backdropFilter: 'blur(12px) saturate(160%)',
          WebkitBackdropFilter: 'blur(12px) saturate(160%)',
          animation: 'backdrop-in 200ms ease both',
        }}
      />

      {/* Modal Card — desktop: centered, mobile: bottom sheet */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="glass-elevated relative w-full max-w-md mx-4 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:max-w-none max-sm:mx-0 max-sm:rounded-b-none"
        style={{
          animation: 'scale-in 250ms var(--ease-out-expo) both',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Emerald accent line */}
        <div
          className="absolute top-0 left-0 right-0 z-10"
          style={{
            height: '2px',
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
            background: 'linear-gradient(90deg, var(--em-600), var(--em-400), var(--em-600))',
          }}
        />

        <div className="p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200"
            style={{
              background: 'var(--glass-2)',
              border: '1px solid var(--glass-border)',
              color: 'var(--t-300)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t-100)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t-300)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Badge */}
          {badge && (
            <div className="badge badge-emerald mb-4">{badge}</div>
          )}

          {/* Heading */}
          <h2
            className="mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--t-100)',
            }}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              className="mb-6"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--t-200)',
                lineHeight: 1.6,
              }}
            >
              {description}
            </p>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
