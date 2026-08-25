'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSectionLabel } from '@/lib/report/sectionLabels'
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

type FormState = {
  genericLabel: string
  businessCategory: string
  publicLocation: string
  slug: string
  featured: boolean
  displayOrder: number
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

const META_DEBOUNCE_MS = 800
const SECTION_DEBOUNCE_MS = 850

export default function AnonymizedSampleDrawer({
  report,
  onClose,
}: {
  report: ReportRow
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successNote, setSuccessNote] = useState<string | null>(null)
  const [privacyCheck, setPrivacyCheck] = useState<string | null>(null)
  const [auditIssues, setAuditIssues] = useState<any[]>([])
  const [preview, setPreview] = useState<PreviewPayload | null>(null)
  const [sectionDraft, setSectionDraft] = useState<Record<string, string>>({})
  const [metaSaveState, setMetaSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [sectionSaveState, setSectionSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [form, setForm] = useState<FormState>({
    genericLabel: '',
    businessCategory: '',
    publicLocation: '',
    slug: '',
    featured: false,
    displayOrder: 0,
  })

  const readyRef = useRef(false)
  const formRef = useRef(form)
  const sectionsRef = useRef(sectionDraft)
  const metaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const busyRef = useRef(false)

  formRef.current = form
  sectionsRef.current = sectionDraft

  const host = useMemo(
    () =>
      report.website_url
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0] || '',
    [report.website_url]
  )

  const sectionKeys = useMemo(() => Object.keys(sectionDraft), [sectionDraft])
  const hasDraft = sectionKeys.length > 0
  const reportType = report.report_type === 'detailed' ? 'detailed' : 'snapshot'
  const version = detectReportVersion(report.sections_json || sectionDraft)
  const busy = generating || publishing

  const applyServerPayload = useCallback((data: any) => {
    if (data.privacyCheck) setPrivacyCheck(data.privacyCheck)
    if (data.audit?.issues) setAuditIssues(data.audit.issues)
    if (Array.isArray(data.residual) && data.residual.length) {
      setAuditIssues(
        data.residual.map((r: any) => ({
          section: r.section || '',
          reason: `${r.type || 'identifier'}: ${r.match || 'found'}`,
          text: '',
        }))
      )
    }
    if (data.preview) {
      setPreview(data.preview)
      if (data.preview.sections) setSectionDraft(data.preview.sections)
    }
    if (data.showcase) {
      const sc = data.showcase
      if (sc.slug) {
        setForm((prev) => ({
          ...prev,
          slug: String(sc.slug || prev.slug),
          genericLabel: String(sc.public_display_name || prev.genericLabel),
          businessCategory: String(sc.business_category || prev.businessCategory),
          publicLocation: String(sc.public_location || prev.publicLocation),
          featured: Boolean(sc.featured),
          displayOrder: Number(sc.display_order || prev.displayOrder),
        }))
      }
      const status = sc.anonymization_status
      if (status === 'ready' || status === 'published') setPrivacyCheck('Passed')
      else if (status === 'needs_review') setPrivacyCheck('Needs Review')
      else if (status === 'failed') setPrivacyCheck('Failed')
    }
  }, [])

  async function apiPost(action: string, extra: Record<string, unknown> = {}) {
    const current = formRef.current
    const res = await fetch('/api/admin/showcase/anonymize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        reportId: report.id,
        genericLabel: current.genericLabel,
        businessCategory: current.businessCategory,
        publicLocation: current.publicLocation,
        slug: current.slug,
        featured: current.featured,
        displayOrder: current.displayOrder,
        ...extra,
      }),
    })
    if (res.status === 401) {
      router.push('/admin')
      return null
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed') as Error & { data?: any }
      err.data = data
      throw err
    }
    return data
  }

  async function load() {
    setLoading(true)
    setError(null)
    readyRef.current = false
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
      setMetaSaveState('idle')
      setSectionSaveState('idle')
    } catch (err: any) {
      setError(err?.message || 'Failed to load')
    } finally {
      setLoading(false)
      // Allow autosave after initial hydrate settles
      setTimeout(() => {
        readyRef.current = true
      }, 50)
    }
  }

  useEffect(() => {
    load()
    return () => {
      if (metaTimer.current) clearTimeout(metaTimer.current)
      if (sectionTimer.current) clearTimeout(sectionTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id])

  const saveMetaNow = useCallback(async () => {
    const current = formRef.current
    if (!current.genericLabel.trim()) return false
    setMetaSaveState('saving')
    try {
      const data = await apiPost('save_meta')
      if (!data) return false
      applyServerPayload(data)
      setMetaSaveState('saved')
      return true
    } catch (err: any) {
      setMetaSaveState('error')
      setError(err?.message || 'Could not save changes.')
      return false
    }
  }, [applyServerPayload, report.id, router])

  const saveSectionsNow = useCallback(async () => {
    const sections = sectionsRef.current
    if (!Object.keys(sections).length) return true
    setSectionSaveState('saving')
    try {
      const data = await apiPost('save_sections', { sections })
      if (!data) return false
      applyServerPayload(data)
      if (data.privacyCheck === 'Needs Review') {
        setError('Privacy check found identifying information in section edits. Fix before publishing.')
      }
      setSectionSaveState('saved')
      return true
    } catch (err: any) {
      setSectionSaveState('error')
      setError(err?.message || 'Could not save changes.')
      return false
    }
  }, [applyServerPayload, report.id, router])

  // Debounced metadata autosave
  useEffect(() => {
    if (!readyRef.current || busyRef.current || generating || publishing) return
    if (!form.genericLabel.trim()) return
    if (metaTimer.current) clearTimeout(metaTimer.current)
    metaTimer.current = setTimeout(() => {
      void saveMetaNow()
    }, META_DEBOUNCE_MS)
    return () => {
      if (metaTimer.current) clearTimeout(metaTimer.current)
    }
  }, [form, generating, publishing, saveMetaNow])

  // Debounced section autosave
  useEffect(() => {
    if (!readyRef.current || busyRef.current || generating || publishing) return
    if (!Object.keys(sectionDraft).length) return
    if (sectionTimer.current) clearTimeout(sectionTimer.current)
    sectionTimer.current = setTimeout(() => {
      void saveSectionsNow()
    }, SECTION_DEBOUNCE_MS)
    return () => {
      if (sectionTimer.current) clearTimeout(sectionTimer.current)
    }
  }, [sectionDraft, generating, publishing, saveSectionsNow])

  async function generateSample() {
    if (hasDraft) {
      const ok = window.confirm(
        'Regenerating will replace the current anonymised draft and any manual section edits. Continue?'
      )
      if (!ok) return
    }

    if (!form.genericLabel.trim() || !form.businessCategory.trim() || !form.publicLocation.trim()) {
      setError('Generic company label, business category, and public location are required.')
      return
    }

    if (metaTimer.current) clearTimeout(metaTimer.current)
    if (sectionTimer.current) clearTimeout(sectionTimer.current)

    setGenerating(true)
    busyRef.current = true
    setError(null)
    setSuccessNote(null)
    try {
      const metaOk = await saveMetaNow()
      if (!metaOk) {
        setError('Could not save metadata. Generation was not started.')
        return
      }
      const data = await apiPost('generate')
      if (!data) return
      applyServerPayload(data)
      setSuccessNote(
        data.privacyCheck === 'Passed'
          ? 'Anonymised draft generated. Privacy check passed.'
          : `Anonymised draft generated. Privacy check: ${data.privacyCheck || data.status}.`
      )
      setSectionSaveState('saved')
      setMetaSaveState('saved')
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not generate anonymised sample. Your source report was not changed.'
      )
      if (err?.data) applyServerPayload(err.data)
    } finally {
      setGenerating(false)
      busyRef.current = false
    }
  }

  async function publishToHomepage() {
    if (metaTimer.current) clearTimeout(metaTimer.current)
    if (sectionTimer.current) clearTimeout(sectionTimer.current)

    setPublishing(true)
    busyRef.current = true
    setError(null)
    setSuccessNote(null)
    try {
      const data = await apiPost('publish', {
        sections: Object.keys(sectionsRef.current).length ? sectionsRef.current : undefined,
      })
      if (!data) return
      applyServerPayload(data)
      setMetaSaveState('saved')
      setSectionSaveState('saved')
      setSuccessNote('Published to homepage.')
      if (data.publicUrl) {
        window.open(data.publicUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (err: any) {
      setError(
        err?.message || 'Cannot publish yet. Privacy check found identifying information.'
      )
      if (err?.data) {
        applyServerPayload(err.data)
        if (err.data.privacyCheck) setPrivacyCheck(err.data.privacyCheck)
      }
    } finally {
      setPublishing(false)
      busyRef.current = false
    }
  }

  async function unpublish() {
    setPublishing(true)
    busyRef.current = true
    setError(null)
    try {
      const data = await apiPost('unpublish')
      if (!data) return
      applyServerPayload(data)
      await load()
      setSuccessNote('Unpublished from homepage.')
    } catch (err: any) {
      setError(err?.message || 'Could not unpublish.')
    } finally {
      setPublishing(false)
      busyRef.current = false
    }
  }

  const canPublish =
    hasDraft &&
    Boolean(form.genericLabel.trim()) &&
    privacyCheck === 'Passed' &&
    preview?.anonymizationStatus !== 'failed' &&
    preview?.anonymizationStatus !== 'needs_review' &&
    preview?.anonymizationStatus !== 'generating'

  const draftLabel = hasDraft ? 'Saved' : 'Not created'
  const publishedLabel = preview?.useAsSample ? 'Yes' : 'No'
  const saveHint =
    metaSaveState === 'saving' || sectionSaveState === 'saving'
      ? 'Saving…'
      : metaSaveState === 'error' || sectionSaveState === 'error'
        ? 'Save error'
        : metaSaveState === 'saved' || sectionSaveState === 'saved'
          ? 'Saved'
          : null

  const actionBtn: React.CSSProperties = {
    fontSize: '12px',
    padding: '8px 14px',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 290,
        background: 'rgba(0,0,0,0.76)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          background: '#0f1117',
          boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--glass-border)',
            gap: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                color: 'var(--t-100)',
                fontSize: '16px',
              }}
            >
              {hasDraft ? 'Edit Anonymised Sample' : 'Create Anonymised Sample'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--t-400)', marginTop: '3px' }}>
              Source (private): {report.report_type.toUpperCase()} · {host} · original report unchanged
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--t-400)', fontSize: '22px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '18px 22px', overflowY: 'auto' }}>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--t-400)',
              lineHeight: 1.55,
              marginBottom: '14px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.22)',
            }}
          >
            Enter public metadata, generate an anonymised draft, preview, then publish. Metadata and section edits save automatically. Nothing auto-publishes.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loader" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <label
                  style={{
                    display: 'grid',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--t-400)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Generic company label
                  <input
                    value={form.genericLabel}
                    onChange={(e) => setForm((p) => ({ ...p, genericLabel: e.target.value }))}
                    disabled={busy}
                    style={{ ...controlStyle, fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}
                    placeholder="e.g. B2B Digital Services Company"
                  />
                </label>
                <label
                  style={{
                    display: 'grid',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--t-400)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Business category
                  <input
                    value={form.businessCategory}
                    onChange={(e) => setForm((p) => ({ ...p, businessCategory: e.target.value }))}
                    disabled={busy}
                    style={{ ...controlStyle, fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}
                    placeholder="e.g. Digital Marketing"
                  />
                </label>
                <label
                  style={{
                    display: 'grid',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--t-400)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Public location
                  <input
                    value={form.publicLocation}
                    onChange={(e) => setForm((p) => ({ ...p, publicLocation: e.target.value }))}
                    disabled={busy}
                    style={{ ...controlStyle, fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}
                    placeholder="e.g. Pune, India"
                  />
                </label>
                <label
                  style={{
                    display: 'grid',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--t-400)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Public slug
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    disabled={busy}
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
                    disabled={busy}
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
                    disabled={busy}
                    value={form.displayOrder}
                    onChange={(e) => setForm((p) => ({ ...p, displayOrder: Number(e.target.value || 0) }))}
                    style={{ ...controlStyle, width: '90px', fontWeight: 500 }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px 16px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: 'var(--t-400)' }}>
                  Draft: <strong style={{ color: 'var(--t-100)' }}>{draftLabel}</strong>
                </span>
                <span style={{ color: 'var(--t-400)' }}>
                  Privacy check:{' '}
                  <strong
                    style={{
                      color:
                        privacyCheck === 'Passed'
                          ? '#34d399'
                          : privacyCheck === 'Needs Review'
                            ? '#f59e0b'
                            : privacyCheck
                              ? '#f87171'
                              : 'var(--t-200)',
                    }}
                  >
                    {privacyCheck || '—'}
                  </strong>
                </span>
                <span style={{ color: 'var(--t-400)' }}>
                  Published: <strong style={{ color: 'var(--t-100)' }}>{publishedLabel}</strong>
                </span>
                {preview?.anonymizationStatus && (
                  <span style={{ color: 'var(--t-400)' }}>
                    Status: <strong style={{ color: 'var(--t-100)' }}>{preview.anonymizationStatus}</strong>
                  </span>
                )}
                {saveHint && (
                  <span style={{ color: saveHint === 'Save error' ? '#f87171' : '#34d399' }}>{saveHint}</span>
                )}
              </div>

              {auditIssues.length > 0 && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245,158,11,0.3)',
                    background: 'rgba(245,158,11,0.08)',
                    color: '#fbbf24',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>Privacy issues</div>
                  {auditIssues.slice(0, 8).map((issue, idx) => (
                    <div key={idx} style={{ marginBottom: '4px' }}>
                      {issue.section}: {issue.reason}
                    </div>
                  ))}
                </div>
              )}

              {sectionKeys.length > 0 && (
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      color: 'var(--t-300)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Anonymised section text (keys locked · auto-saves)
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
                          disabled={busy}
                          onChange={(e) =>
                            setSectionDraft((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          rows={4}
                          style={{
                            ...controlStyle,
                            resize: 'vertical',
                            lineHeight: 1.5,
                            fontFamily: 'var(--font-body)',
                          }}
                        />
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {successNote && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(52,211,153,0.3)',
                background: 'rgba(52,211,153,0.08)',
                color: '#34d399',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {successNote}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(248,113,113,0.3)',
                background: 'rgba(248,113,113,0.08)',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 22px 18px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '8px',
            borderTop: '1px solid var(--glass-border)',
            flexWrap: 'wrap',
          }}
        >
          {!hasDraft ? (
            <>
              <button
                className="btn btn-primary"
                disabled={busy || loading}
                onClick={generateSample}
                style={actionBtn}
              >
                {generating ? 'Generating…' : 'Generate Anonymised Sample'}
              </button>
              <button className="btn btn-secondary" onClick={onClose} disabled={generating} style={actionBtn}>
                Close
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary"
                disabled={busy || loading || !canPublish}
                onClick={publishToHomepage}
                style={actionBtn}
                title={!canPublish ? 'Privacy must pass before publish' : 'Publish to homepage'}
              >
                {publishing ? 'Publishing…' : 'Publish to Homepage'}
              </button>
              <a
                href={`/admin/dashboard/reports/anonymized-preview/${encodeURIComponent(report.id)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{
                  ...actionBtn,
                  textDecoration: 'none',
                  pointerEvents: busy ? 'none' : 'auto',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                Preview
              </a>
              <button
                className="btn btn-secondary"
                disabled={busy || loading}
                onClick={generateSample}
                style={actionBtn}
              >
                {generating ? 'Generating…' : 'Regenerate'}
              </button>
              {preview?.useAsSample && (
                <button className="btn btn-secondary" disabled={busy} onClick={unpublish} style={actionBtn}>
                  Unpublish
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose} disabled={busy} style={actionBtn}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
