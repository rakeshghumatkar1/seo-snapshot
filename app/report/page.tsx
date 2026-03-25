'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReportResponse, SnapshotSections } from '@/types/report';
import { FeatureConfig } from '@/types/config';
import ReportHeader from '@/components/report/ReportHeader';
import ReportSection from '@/components/report/ReportSection';
import RatingBlock from '@/components/report/RatingBlock';
import CTABlock from '@/components/report/CTABlock';
import Modal from '@/components/ui/Modal';

const sectionMeta: Record<keyof SnapshotSections, { category: string; title: string }> = {
  introduction:        { category: 'OVERVIEW',        title: 'Executive Summary' },
  whySeoMatters:       { category: 'CONTEXT',         title: 'Why This Matters for Your Business' },
  currentVisibility:   { category: 'CURRENT STATE',   title: 'Your Organic Visibility' },
  contentAuthority:    { category: 'AUTHORITY',        title: 'Content & Topic Strength' },
  technicalStructure:  { category: 'INFRASTRUCTURE',  title: 'Technical Foundation' },
  opportunities:       { category: 'OPPORTUNITIES',   title: 'Highest-Leverage Growth Areas' },
  nextSteps:           { category: 'ACTION PLAN',     title: 'Recommended Next Steps' },
};

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="glass-elevated p-16 max-w-md mx-auto text-center">
          <div className="loader mx-auto mb-4" />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--t-300)' }}>Loading report…</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [config, setConfig] = useState<FeatureConfig | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalAction, setModalAction] = useState<'pdf' | 'detailed'>('detailed');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    // Try sessionStorage first (primary data flow)
    const stored = sessionStorage.getItem('reportData');
    if (stored) {
      try {
        const parsedData = JSON.parse(stored);
        setReport(parsedData);
        setChecked(true);
        return;
      } catch (error) {
        console.error('Failed to parse stored report data:', error);
      }
    }

    // Fallback: try URL query param (legacy)
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        setReport(parsedData);
        setChecked(true);
        return;
      } catch (error) {
        console.error('Failed to parse report data from URL:', error);
      }
    }

    // No data found — redirect to tool page
    setChecked(true);
  }, [searchParams]);

  useEffect(() => {
    if (checked && !report) {
      router.push('/tool');
    }
  }, [checked, report, router]);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Failed to load config:', err));
  }, []);

  const handleDownloadPDF = () => {
    setModalError(null);
    if (config?.requireEmailForPDF) {
      setModalAction('pdf');
      setShowEmailModal(true);
    } else {
      triggerPDFDownload();
    }
  };

  const handleGenerateDetailed = () => {
    if (config?.requireEmailForDetailed) {
      setModalAction('detailed');
      setShowEmailModal(true);
    } else {
      generateDetailedReport();
    }
  };

  const triggerPDFDownload = async () => {
    if (!report) return;
    setIsSubmitting(true);
    setModalError(null);

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          company: company.trim() || undefined,
          websiteUrl: report.websiteUrl,
          sections: report.sections,
          reportType: report.type,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'PDF generation failed');
      }

      // Open print dialog — works on all browsers
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 800);
      } else {
        // Fallback: download as HTML file
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || 'seo-report.html';
        a.click();
        URL.revokeObjectURL(url);
      }

      setShowEmailModal(false);
      setEmail('');
      setName('');
      setCompany('');
    } catch (err: any) {
      console.error('[PDF]', err);
      setModalError(err.message || 'Could not generate PDF. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalSubmit = async () => {
    if (!email.trim()) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          company: company.trim() || undefined,
          websiteUrl: report?.websiteUrl || '',
          actionType: modalAction,
        }),
      });

      if (modalAction === 'detailed') {
        await generateDetailedReport();
        setShowEmailModal(false);
        setEmail('');
        setName('');
        setCompany('');
      } else {
        await triggerPDFDownload();
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setModalError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateDetailedReport = async () => {
    if (!report) return;

    try {
      const response = await fetch('/api/report/detailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: report.websiteUrl,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          company: company.trim() || undefined,
        }),
      });

      if (response.ok) {
        const detailedData = await response.json();
        sessionStorage.setItem('reportData', JSON.stringify(detailedData));
        setReport(detailedData);
      }
    } catch (error) {
      console.error('Error generating detailed report:', error);
    }
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="glass-elevated p-16 max-w-md mx-auto text-center">
          <div className="loader mx-auto mb-4" />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--t-300)' }}>Loading report…</p>
        </div>
      </div>
    );
  }

  const sections = Object.entries(report.sections) as [keyof SnapshotSections, string][];

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Report Header */}
      <ReportHeader websiteUrl={report.websiteUrl} reportType={report.type} />

      {/* Section Cards */}
      {sections.map(([key, content], index) => {
        const meta = sectionMeta[key] || { category: key.toUpperCase(), title: key };
        return (
          <div key={key} className={`fade-up delay-${Math.min(index, 7)}`}>
            <ReportSection
              category={meta.category}
              title={meta.title}
              content={content}
            />
          </div>
        );
      })}

      {/* Action Bar */}
      <div className="glass p-6 mt-8 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {config?.enablePDFDownload && (
            <button onClick={handleDownloadPDF} className="btn btn-secondary w-full sm:w-auto justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 10v3h10v-3M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download PDF Report
            </button>
          )}
          {config?.enableDetailedReport && report.type === 'snapshot' && (
            <button onClick={handleGenerateDetailed} className="btn btn-primary btn-lg pulse w-full sm:w-auto justify-center">
              Generate Detailed Report →
            </button>
          )}
        </div>
      </div>
      <p className="text-center mb-8" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--t-400)' }}>
        Advanced report requires email · Typically 45 seconds
      </p>

      {/* Rating Block */}
      {config?.enableRating && (
        <RatingBlock websiteUrl={report.websiteUrl} email={email} />
      )}

      {/* CTA Block */}
      <CTABlock />

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        badge={modalAction === 'pdf' ? 'PDF DOWNLOAD' : 'DETAILED REPORT'}
        title={modalAction === 'pdf' ? 'Download Your Report' : 'Unlock Full Analysis'}
        description={
          modalAction === 'pdf'
            ? 'Enter your email and we\'ll generate your PDF instantly. No spam, ever.'
            : 'Enter your email to unlock the complete strategic report.'
        }
      >
        <div className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label
              htmlFor="modal-email"
              style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--t-300)', display: 'block', marginBottom: '6px' }}
            >
              Email *
            </label>
            <input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="modal-name"
              style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--t-300)', display: 'block', marginBottom: '6px' }}
            >
              Name (optional)
            </label>
            <input
              id="modal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

          {/* Company */}
          <div>
            <label
              htmlFor="modal-company"
              style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--t-300)', display: 'block', marginBottom: '6px' }}
            >
              Company (optional)
            </label>
            <input
              id="modal-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input"
            />
          </div>

          {/* Actions */}
          <button
            onClick={handleModalSubmit}
            disabled={!email.trim() || isSubmitting}
            className="btn btn-primary w-full justify-center mt-2"
          >
            {isSubmitting ? 'Processing\u2026' : 'Continue →'}
          </button>
          <button
            onClick={() => setShowEmailModal(false)}
            className="btn btn-ghost w-full justify-center"
          >
            Cancel
          </button>

          {modalError && (
            <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginTop: '8px' }}>
              {modalError}
            </p>
          )}

          <p className="text-center mt-1" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--t-400)' }}>
            🔒 Your email is never shared or sold.
          </p>
        </div>
      </Modal>
    </div>
  );
}
