'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getSectionLabel,
} from '@/lib/report/sectionLabels'
import { detectReportVersion } from '@/types/report'

type ReportRow = {
  id: string
  website_url: string
  report_type: string
  created_at: string
  status: string | null
  sections_json?: Record<string, unknown> | null
}

type PreviewPayload = {
  slug: string | null
  displayName: string | null
  businessCategory: string | null
  publicLocation: string | null
  reportType: 'snapshot' | 'detailed'
  reportVersion: number | null
  sections: Record<string, string> | null
  anonymizationStatus: string
  audit: any
  featured: boolean
  displayOrder: number
  useAsSample: boolean
}

const controlStyle: React.CSSProperties = {
  padding: '9px 11px',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--t-100)',
  fontSize: '12px',
  outline: 'none',
  width: '100%',
}

export default function AnonymizedSampleDrawer({
  report,
  onClose,
}: {
  report: ReportRow
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [privacyCheck, setPrivacyCheck] = useState<string | null>(null)
  const [auditIssues, setAuditIssues] = useState<any[]>([])
  const [preview, setPreview] = useState<PreviewPayload | null>(null)
  const [sectionDraft, setSectionDraft] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    genericLabel: '',
    businessCategory: '',
    publicLocation: '',
    slug: '',
    featured: false,
    displayOrder: 0,
  })

  const host = useMemo(
    () =>
      report.website_url
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0] || '',
    [report.website_url]
  )

  const sectionKeys = useMemo(() => Object.keys(sectionDraft), [sectionDraft])
  const reportType = report.report_type === 'detailed' ? 'detailed' : 'snapshot'
  const version = detectReportVersion(report.sections_json || sectionDraft)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/showcase/anonymize?reportId=${encodeURIComponent(report.id)}`,
        { cache: 'no-store' }
      )
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load anonymised sample')
      const sc = data.showcase
      const pv = data.preview as PreviewPayload | null
      setPreview(pv)
      setForm({
        genericLabel: String(sc?.public_display_name || ''),
        businessCategory: String(sc?.business_category || ''),
        publicLocation: String(sc?.public_location || ''),
        slug: String(sc?.slug || ''),
        featured: Boolean(sc?.featured),
        displayOrder: Number(sc?.display_order || 0),
      })
      const sections =
        (pv?.sections && typeof pv.sections === 'object' ? pv.sections : null) || {}
      setSectionDraft(sections)
      setPrivacyCheck(
        sc?.anonymization_status === 'ready' || sc?.anonymization_status === 'published'
          ? 'Passed'
          : sc?.anonymization_status === 'needs_review'
            ? 'Needs Review'
            : sc?.anonymization_status === 'failed'
              ? 'Failed'
              : null
      )
      const issues = sc?.anonymization_audit_json?.audit?.issues
      setAuditIssues(Array.isArray(issues) ? issues : [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id])

  async function postAction(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/showcase/anonymize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reportId: report.id,
          genericLabel: form.genericLabel,
          businessCategory: form.businessCategory,
          publicLocation: form.publicLocation,
          slug: form.slug,
          featured: form.featured,
          displayOrder: form.displayOrder,
          ...extra,
        }),
      })
      if (res.status === 401) {
        router.push('/admin')
        return null
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      if (data.privacyCheck) setPrivacyCheck(data.privacyCheck)
      if (data.audit?.issues) setAuditIssues(data.audit.issues)
      if (data.preview) {
        setPreview(data.preview)
        if (data.preview.sections) setSectionDraft(data.preview.sections)
      }
      if (data.showcase?.slug) {
        setForm((prev) => ({ ...prev, slug: data.showcase.slug }))
      }
      return data
    } catch (err: any) {
      setError(err?.message || 'Request failed')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function generateDraft() {
    await postAction('generate')
  }

  async function saveMeta() {
    await postAction('save_meta')
  }

  async function saveSections() {
    await postAction('save_sections', { sections: sectionDraft })
  }

  async function publish() {
    const data = await postAction('publish')
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank', 'noopener,noreferrer')
    }
  }

  async function unpublish() {
    await postAction('unpublish')
    await load()
  }

  const canPublish =
    Boolean(form.genericLabel.trim()) &&
    Boolean(form.slug.trim()) &&
    Boolean(Object.keys(sectionDraft).length) &&
    privacyCheck === 'Passed' &&
    preview?.anonymizationStatus !== 'failed' &&
    preview?.anonymizationStatus !== 'needs_review' &&
    preview?.anonymizationStatus !== 'generating'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 290, background: 'rgba(0,0,0,0.76)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '920px', maxHeight: '92vh', borderRadius: '12px', border: '1px solid var(--glass-border)', background: '#0f1117', boxShadow: '0 24px 70px rgba(0,0,0,0.45)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--t-100)', fontSize: '16px' }}>
              {preview?.sections ? 'Edit Anonymised Sample' : 'Create Anonymised Sample'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--t-400)', marginTop: '3px' }}>
              Source (private): {report.report_type.toUpperCase()} · {host} · original report unchanged
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t-400)', fontSize: '22px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '18px 22px', overflowY: 'auto' }}>
          <p style={{ fontSize: '12px', color: 'var(--t-400)', lineHeight: 1.55, marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
            Creates a separate anonymised public sample. Nothing auto-publishes. Domain/email/phone and source company identity must be removed before publish.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="loader" style={{ margin: '0 auto' }} /></div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'grid', gap: '6px', fontSize: '11px', color: 'var(--t-400)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Generic company label
                  <input
                    value={form.genericLabel}
                    onChange={(e) => setForm((p) => ({ ...p, genericLabel: e.target.value }))}
                    style={{ ...controlStyle, fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}
                    placeholder="e.g. B2B Digital Services Company"
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: '11px', color: 'var(--t-400)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Business category
                  <input
                    value={form.businessCategory}
                    onChange={(e) => setForm((p) => ({ ...p, businessCategory: e.target.value }))}
                    style={{ ...controlStyle, fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}
                    placeholder="e.g. Digital Marketing"
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: '11px', color: 'var(--t-400)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Public location
                  <input
                    value={form.publicLocation}
                    onChange={(e) => setForm((p) => ({ ...p, publicLocation: e.target.value }))}
                    style={{ ...controlStyle, fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}
                    placeholder="e.g. Pune, India"
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: '11px', color: 'var(--t-400)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Public slug
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    style={{ ...controlStyle, fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}
                    placeholder="b2b-digital-services-company"
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--t-200)', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                  />
                  Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--t-200)', fontSize: '13px' }}>
                  Display order
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={form.displayOrder}
                    onChange={(e) => setForm((p) => ({ ...p, displayOrder: Number(e.target.value || 0) }))}
                    style={{ ...controlStyle, width: '90px', fontWeight: 500 }}
                  />
                </label>
                {privacyCheck && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: privacyCheck === 'Passed' ? '#34d399' : privacyCheck === 'Needs Review' ? '#f59e0b' : '#f87171',
                  }}>
                    Privacy check: {privacyCheck}
                  </span>
                )}
                {preview?.anonymizationStatus && (
                  <span style={{ fontSize: '11px', color: 'var(--t-400)' }}>
                    Status: {preview.anonymizationStatus}
                    {preview.useAsSample ? ' · published' : ''}
                  </span>
                )}
              </div>

              {auditIssues.length > 0 && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: '#fbbf24', fontSize: '12px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>Audit issues</div>
                  {auditIssues.slice(0, 8).map((issue, idx) => (
                    <div key={idx} style={{ marginBottom: '4px' }}>
                      {issue.section}: {issue.reason}
                    </div>
                  ))}
                </div>
              )}

              {sectionKeys.length > 0 && (
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--t-300)', textTransform: 'uppercase' }}>
                    Anonymised section text (keys locked)
                  </div>
                  {sectionKeys.map((key) => {
                    const label = getSectionLabel(key, reportType, version)
                    return (
                      <label key={key} style={{ display: 'grid', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--t-400)', fontWeight: 700 }}>
                          {label.category} · {label.title}
                        </span>
                        <textarea
                          value={sectionDraft[key] || ''}
                          onChange={(e) =>
                            setSectionDraft((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          rows={4}
                          style={{ ...controlStyle, resize: 'vertical', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}
                        />
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: '#f87171', fontSize: '12px', fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 22px 18px', display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" disabled={busy || loading} onClick={saveMeta} style={{ fontSize: '12px' }}>
              Save Metadata
            </button>
            <button className="btn btn-secondary" disabled={busy || loading} onClick={generateDraft} style={{ fontSize: '12px' }}>
              {busy ? 'Working…' : 'Generate Anonymised Draft'}
            </button>
            {sectionKeys.length > 0 && (
              <button className="btn btn-secondary" disabled={busy || loading} onClick={saveSections} style={{ fontSize: '12px' }}>
                Save Section Edits
              </button>
            )}
            {form.slug && sectionKeys.length > 0 && (
              <a
                href={`/admin/dashboard/reports/anonymized-preview/${encodeURIComponent(report.id)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ textDecoration: 'none', fontSize: '12px' }}
              >
                Preview Anonymised Report
              </a>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {preview?.useAsSample && (
              <button className="btn btn-secondary" disabled={busy} onClick={unpublish} style={{ fontSize: '12px' }}>
                Unpublish
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '12px' }}>Close</button>
            <button
              className="btn btn-primary"
              disabled={busy || loading || !canPublish}
              onClick={publish}
              style={{ fontSize: '12px' }}
              title={!canPublish ? 'Privacy must pass and draft must be ready' : 'Publish anonymised sample'}
            >
              Publish Anonymised Sample
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
