'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReportResponse, detectReportVersion } from '@/types/report';
import { FeatureConfig } from '@/types/config';
import ReportHeader from '@/components/report/ReportHeader';
import ReportSection from '@/components/report/ReportSection';
import RatingBlock from '@/components/report/RatingBlock';
import CTABlock from '@/components/report/CTABlock';
import ServiceHelpCTA from '@/components/public/ServiceHelpCTA';
import Modal from '@/components/ui/Modal';
import {
  getSectionLabel,
  iterableSectionEntries,
} from '@/lib/report/sectionLabels';


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
  const [generatingDetailed, setGeneratingDetailed] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState('');
  const [capturedName, setCapturedName] = useState('');
  const [capturedCompany, setCapturedCompany] = useState('');

  useEffect(() => {
    // Try sessionStorage first (primary data flow)
    const stored = sessionStorage.getItem('reportData');
    if (stored) {
      try {
        const parsedData = JSON.parse(stored);
        if (
          !parsedData?.type ||
          !parsedData?.websiteUrl ||
          !parsedData?.sections
        ) {
          console.error('[Report] Invalid report shape in sessionStorage');
          router.push('/tool');
          return;
        }
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
        if (
          !parsedData?.type ||
          !parsedData?.websiteUrl ||
          !parsedData?.sections
        ) {
          console.error('[Report] Invalid report shape in ?data= param')
          router.push('/tool')
          return
        }
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

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('userEmail') || '';
    const savedName = sessionStorage.getItem('userName') || '';
    const savedCompany = sessionStorage.getItem('userCompany') || '';
    if (savedEmail) {
      setCapturedEmail(savedEmail);
      setCapturedName(savedName);
      setCapturedCompany(savedCompany);
    }
  }, []);

  const saveUserInfo = (e: string, n: string, c: string) => {
    setCapturedEmail(e);
    setCapturedName(n);
    setCapturedCompany(c);
    sessionStorage.setItem('userEmail', e);
    sessionStorage.setItem('userName', n);
    sessionStorage.setItem('userCompany', c);
  };

  const handleDownloadPDF = () => {
    setModalError(null);
    if (capturedEmail) {
      triggerPDFDownload(capturedEmail, capturedName, capturedCompany);
    } else if (config?.requireEmailForPDF) {
      setModalAction('pdf');
      setShowEmailModal(true);
    } else {
      triggerPDFDownload();
    }
  };

  const handleGenerateDetailed = () => {
    if (capturedEmail) {
      setGeneratingDetailed(true);
      generateDetailedReport(capturedEmail, capturedName, capturedCompany);
    } else if (config?.requireEmailForDetailed) {
      setModalAction('detailed');
      setShowEmailModal(true);
    } else {
      setGeneratingDetailed(true);
      generateDetailedReport();
    }
  };

  const triggerPDFDownload = async (useEmail?: string, useName?: string, useCompany?: string) => {
    if (!report) return;
    setIsSubmitting(true);
    setModalError(null);

    const finalEmail = useEmail || email.trim() || '';
    const finalName = useName || name.trim() || '';
    const finalCompany = useCompany || company.trim() || '';

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: finalEmail || undefined,
          name: finalName || undefined,
          company: finalCompany || undefined,
          websiteUrl: report.websiteUrl,
          sections: report.sections,
          reportType: report.type,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setModalError(data.error || 'PDF generation failed. Please try again.');
        return;
      }

      const data = await response.json();

      if (!data.success) {
        setModalError('PDF generation failed. Please try again.');
        return;
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
      const leadsRes = await fetch('/api/leads', {
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
      if (!leadsRes.ok) {
        const err = await leadsRes.json().catch(() => ({}));
        setModalError(err.error || 'Failed to save your information. Please try again.');
        return;
      }

      const submittedEmail = email.trim();
      const submittedName = name.trim();
      const submittedCompany = company.trim();
      saveUserInfo(submittedEmail, submittedName, submittedCompany);

      if (modalAction === 'detailed') {
        setShowEmailModal(false);
        setIsSubmitting(false);
        setGeneratingDetailed(true);
        await generateDetailedReport(submittedEmail, submittedName, submittedCompany);
        setGeneratingDetailed(false);
        setEmail('');
        setName('');
        setCompany('');
      } else {
        await triggerPDFDownload(submittedEmail, submittedName, submittedCompany);
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setModalError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateDetailedReport = async (useEmail?: string, useName?: string, useCompany?: string) => {
    if (!report) return;

    const finalEmail = useEmail || email.trim() || capturedEmail || '';
    const finalName = useName || name.trim() || capturedName || '';
    const finalCompany = useCompany || company.trim() || capturedCompany || '';

    try {
      const response = await fetch('/api/report/detailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: report.websiteUrl,
          email: finalEmail || undefined,
          name: finalName || undefined,
          company: finalCompany || undefined,
        }),
      });

      if (response.ok) {
        const detailedData = await response.json();
        sessionStorage.setItem('reportData', JSON.stringify(detailedData));
        setReport(detailedData);
      } else {
        const err = await response.json().catch(() => ({}));
        setModalError(err.error || 'Failed to generate detailed report. Please try again.');
      }
    } catch (error) {
      console.error('Error generating detailed report:', error);
      setModalError('Something went wrong. Please try again.');
    } finally {
      setGeneratingDetailed(false);
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

  const reportVersion = detectReportVersion(
    report.sections as unknown as Record<string, unknown>,
    report.reportVersion
  );

  return (
    <div className="public-page-content max-w-3xl mx-auto px-6 py-16">
      {/* Report Header */}
      <ReportHeader websiteUrl={report.websiteUrl} reportType={report.type} />

      {modalError && (
        <p className="text-center mb-6" style={{ color: '#ef4444', fontSize: '14px' }}>
          {modalError}
        </p>
      )}

      {/* Section Cards */}
      {iterableSectionEntries(report.sections as unknown as Record<string, unknown>).map(
        ([key, value], index) => {
          const label = getSectionLabel(key, report.type, reportVersion);
          return (
            <div key={key} className={`fade-up delay-${Math.min(index, 7)}`}>
              <ReportSection
                category={label.category}
                title={label.title}
                content={value}
              />
            </div>
          );
        }
      )}

      {/* Action Bar */}
      <div className="glass p-6 mt-8 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          {report.type === 'snapshot' && config?.enableDetailedReport && (
            <button onClick={handleGenerateDetailed} className="btn btn-primary btn-lg pulse w-full sm:w-auto justify-center">
              Get My Free Detailed Report →
            </button>
          )}
          {report.type === 'detailed' && config?.enablePDFDownload && (
            <button onClick={handleDownloadPDF} className="btn btn-primary btn-lg w-full sm:w-auto justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 10v3h10v-3M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download Full Report PDF →
            </button>
          )}
          {report.type === 'detailed' && capturedEmail && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--t-400)', marginTop: '-4px' }}>
              Downloading as {capturedEmail}
            </p>
          )}
        </div>
      </div>
      {report.type === 'snapshot' && (
        <p className="text-center mb-4" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--t-400)' }}>
          Detailed report requires email
        </p>
      )}

      {report.type === 'snapshot' && (
        <ServiceHelpCTA variant="compact" />
      )}

      {report.type === 'detailed' && (
        <ServiceHelpCTA variant="full" />
      )}

      {/* Rating Block */}
      {config?.enableRating && (
        <RatingBlock websiteUrl={report.websiteUrl} email={capturedEmail || email} />
      )}

      {/* CTA Block — analyze another site */}
      <CTABlock />

      {/* Detailed Report Loading Overlay */}
      {generatingDetailed && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--canvas)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
          <div className="mesh" aria-hidden="true" />

          <div className="glass" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '52px 40px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}>
            {/* Animated ring spinner */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.06)',
              borderTopColor: '#10b981',
              borderRightColor: 'rgba(16,185,129,0.3)',
              animation: 'spin 1s linear infinite',
              boxShadow: '0 0 24px rgba(16,185,129,0.25)',
              margin: '0 auto 32px',
            }} />

            {/* Badge */}
            <div className="badge badge-emerald" style={{ marginBottom: '20px' }}>
              ✦ GENERATING DETAILED REPORT
            </div>

            {/* Website being analyzed */}
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--t-100)',
              marginBottom: '12px',
              letterSpacing: '-0.02em',
            }}>
              Analyzing {report?.websiteUrl?.replace(/https?:\/\//, '')}
            </div>

            {/* Rotating status message */}
            <DetailedLoadingMessage />

            {/* Progress track */}
            <div style={{
              width: '100%',
              height: '3px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '100px',
              overflow: 'hidden',
              margin: '32px 0 20px',
            }}>
              <div style={{
                height: '100%',
                borderRadius: '100px',
                background: 'linear-gradient(90deg, #059669, #10b981, #34d399)',
                boxShadow: '0 0 10px rgba(16,185,129,0.6)',
                animation: 'detailedProgress 45s cubic-bezier(0.1,0.4,0.8,1) forwards',
              }} />
            </div>

            {/* Step indicators */}
            <DetailedStepIndicator />

            {/* Reassurance text */}
            <p style={{
              fontSize: '13px',
              color: 'var(--t-400)',
              marginTop: '20px',
              lineHeight: 1.6,
            }}>
              This typically takes 30–45 seconds.
              <br/>
              Your report is being carefully prepared.
            </p>
          </div>
        </div>
      )}

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

function DetailedLoadingMessage() {
  const messages = [
    'Understanding your business and customer journey...',
    'Reviewing important service pages...',
    'Assessing trust and credibility signals...',
    'Checking search readiness...',
    'Assessing AI discovery readiness...',
    'Reviewing enquiry paths...',
    'Prioritising business opportunities...',
    'Building your action roadmap...',
  ];
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % messages.length);
        setShow(true);
      }, 350);
    }, 4500);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p style={{
      fontSize: '15px',
      color: 'var(--t-200)',
      minHeight: '26px',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(6px)',
    }}>
      {messages[idx]}
    </p>
  );
}

function DetailedStepIndicator() {
  const steps = ['Research', 'Analysis', 'Strategy', 'Report'];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const intervals = [0, 10000, 25000, 38000];
    const timers = intervals.map((ms, i) =>
      setTimeout(() => setActive(i), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0',
      marginTop: '8px',
    }}>
      {steps.map((step, i) => (
        <div key={step} style={{
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: i <= active
                ? 'rgba(16,185,129,0.15)'
                : 'rgba(255,255,255,0.04)',
              border: i <= active
                ? '1px solid rgba(16,185,129,0.4)'
                : '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: i <= active
                ? '#34d399'
                : 'var(--t-400)',
              fontWeight: 700,
              transition: 'all 0.5s ease',
              boxShadow: i === active
                ? '0 0 12px rgba(16,185,129,0.3)'
                : 'none',
            }}>
              {i < active ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: i <= active
                ? 'var(--t-300)'
                : 'var(--t-500)',
              transition: 'color 0.5s ease',
            }}>
              {step.toUpperCase()}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: '48px',
              height: '1px',
              background: i < active
                ? 'rgba(16,185,129,0.4)'
                : 'rgba(255,255,255,0.06)',
              margin: '0 4px',
              marginBottom: '20px',
              transition: 'background 0.5s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}
