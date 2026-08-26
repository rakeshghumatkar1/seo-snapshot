'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function buildDiffLines(
  current: string,
  defaultContent: string
): Array<{ text: string; type: 'current' | 'default' | 'both' }> {
  const curLines = current.split('\n')
  const defLines = defaultContent.split('\n')
  const defSet = new Set(defLines)
  const curSet = new Set(curLines)
  const result: Array<{ text: string; type: 'current' | 'default' | 'both' }> = []
  for (const line of curLines) {
    result.push({ text: line, type: defSet.has(line) ? 'both' : 'current' })
  }
  for (const line of defLines) {
    if (!curSet.has(line)) {
      result.push({ text: line, type: 'default' })
    }
  }
  return result
}

export default function AdminPromptEditor() {
  const router = useRouter()

  const [activePromptTab, setActivePromptTab] = useState<'snapshot' | 'detailed'>('snapshot')
  const [snapshotPrompt, setSnapshotPrompt] = useState('')
  const [detailedPrompt, setDetailedPrompt] = useState('')
  const [snapshotUpdatedAt, setSnapshotUpdatedAt] = useState<string | null>(null)
  const [detailedUpdatedAt, setDetailedUpdatedAt] = useState<string | null>(null)
  const [promptSaving, setPromptSaving] = useState(false)
  const [promptMessage, setPromptMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [skipValidation, setSkipValidation] = useState(false)
  const [missingKeys, setMissingKeys] = useState<string[]>([])

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyEntries, setHistoryEntries] = useState<Array<{ id: number; key: string; content: string; saved_at: string }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [restoredFromHistory, setRestoredFromHistory] = useState(false)

  const [testUrl, setTestUrl] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  const [diffOpen, setDiffOpen] = useState(false)
  const [defaultPromptContent, setDefaultPromptContent] = useState('')
  const [diffLoading, setDiffLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/prompts')
      .then(r => {
        if (r.status === 401) {
          router.push('/admin')
          return null
        }
        return r.json()
      })
      .then(data => {
        if (!data) return
        if (data.snapshot !== undefined) setSnapshotPrompt(data.snapshot)
        if (data.detailed !== undefined) setDetailedPrompt(data.detailed)
        if (data.snapshotUpdatedAt) setSnapshotUpdatedAt(data.snapshotUpdatedAt)
        if (data.detailedUpdatedAt) setDetailedUpdatedAt(data.detailedUpdatedAt)
      })
      .catch(() => {})
  }, [router])

  async function savePrompt() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    const content = activePromptTab === 'snapshot' ? snapshotPrompt : detailedPrompt
    setPromptSaving(true)
    setPromptMessage(null)
    setMissingKeys([])
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content, skipValidation }),
      })
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      if (res.ok) {
        setPromptMessage({ type: 'success', text: 'Prompt saved' })
        setRestoredFromHistory(false)
        const now = new Date().toISOString()
        if (activePromptTab === 'snapshot') setSnapshotUpdatedAt(now)
        else setDetailedUpdatedAt(now)
        setTimeout(() => setPromptMessage(null), 3000)
      } else if (data.missing) {
        setMissingKeys(data.missing)
        setPromptMessage({ type: 'error', text: data.error || 'Validation failed' })
      } else {
        setPromptMessage({ type: 'error', text: data.error || 'Failed to save' })
        setTimeout(() => setPromptMessage(null), 3000)
      }
    } catch {
      setPromptMessage({ type: 'error', text: 'Network error' })
      setTimeout(() => setPromptMessage(null), 3000)
    } finally {
      setPromptSaving(false)
    }
  }

  async function loadDefault() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    try {
      const res = await fetch(`/api/admin/prompts/default?key=${key}`)
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      if (data.content) {
        if (activePromptTab === 'snapshot') setSnapshotPrompt(data.content)
        else setDetailedPrompt(data.content)
      }
    } catch (err) {
      console.error('Load default failed:', err)
    }
  }

  async function clearPrompt() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    if (activePromptTab === 'snapshot') setSnapshotPrompt('')
    else setDetailedPrompt('')
    setPromptSaving(true)
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content: '' }),
      })
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      if (!res.ok) {
        setPromptMessage({ type: 'error', text: 'Failed to clear prompt. Try again.' })
        return
      }
      setPromptMessage({ type: 'success', text: 'Cleared — using fallback' })
      const now = new Date().toISOString()
      if (activePromptTab === 'snapshot') setSnapshotUpdatedAt(now)
      else setDetailedUpdatedAt(now)
    } catch {
      setPromptMessage({ type: 'error', text: 'Failed to clear' })
    } finally {
      setPromptSaving(false)
      setTimeout(() => setPromptMessage(null), 3000)
    }
  }

  async function openHistory() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    setHistoryOpen(true)
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/admin/prompts/history?key=${key}`)
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      setHistoryEntries(data.entries || [])
    } catch {
      setHistoryEntries([])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function openDiff() {
    if (diffOpen) { setDiffOpen(false); return }
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    setDiffLoading(true)
    setDiffOpen(true)
    try {
      const res = await fetch(`/api/admin/prompts/default?key=${key}`)
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      setDefaultPromptContent(data.content || '')
    } catch {
      setDefaultPromptContent('')
    } finally {
      setDiffLoading(false)
    }
  }

  async function runTest() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    const content = activePromptTab === 'snapshot' ? snapshotPrompt : detailedPrompt
    setTestLoading(true)
    setTestResult(null)
    setTestError(null)
    try {
      const res = await fetch('/api/admin/prompts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content, url: testUrl }),
      })
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      if (res.ok) {
        setTestResult(data.introduction || '')
      } else {
        setTestError(data.error || 'Test failed')
      }
    } catch {
      setTestError('Network error')
    } finally {
      setTestLoading(false)
    }
  }

  const currentPrompt = activePromptTab === 'snapshot' ? snapshotPrompt : detailedPrompt
  const currentUpdatedAt = activePromptTab === 'snapshot' ? snapshotUpdatedAt : detailedUpdatedAt
  const charColor = currentPrompt.length >= 20000 ? '#f87171' : currentPrompt.length >= 15000 ? '#f59e0b' : '#34d399'
  const tokens = Math.round(currentPrompt.length / 4)
  const contextPct = Math.round((tokens / 128000) * 100)
  const tokenColor = tokens > 6000 ? '#f87171' : tokens >= 3000 ? '#f59e0b' : '#34d399'

  return (
    <main className="admin-page">
      <div className="admin-page-header">
        <div>
          <div className="admin-eyebrow">ADMIN · PROMPTS</div>
          <h1 className="admin-title">Prompt Editor</h1>
          <p className="admin-subtitle">
            Edit snapshot and detailed system prompts, compare with defaults, and run test generations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['snapshot', 'detailed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActivePromptTab(tab); setPromptMessage(null); setMissingKeys([]); setRestoredFromHistory(false); setDiffOpen(false); setTestResult(null); setTestError(null) }}
            style={{
              padding: '6px 18px',
              borderRadius: '100px',
              border: activePromptTab === tab ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--glass-border)',
              background: activePromptTab === tab ? 'rgba(16,185,129,0.12)' : 'transparent',
              color: activePromptTab === tab ? '#34d399' : 'var(--t-300)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'snapshot' ? 'Snapshot Prompt' : 'Detailed Prompt'}
          </button>
        ))}
      </div>

      {/* Two-panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: textarea + diff + test */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass" style={{ padding: '24px' }}>
            {restoredFromHistory && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
                Restored from history — click Save to apply
              </div>
            )}
            <textarea
              value={currentPrompt}
              onChange={e => {
                if (activePromptTab === 'snapshot') setSnapshotPrompt(e.target.value)
                else setDetailedPrompt(e.target.value)
                if (missingKeys.length > 0) setMissingKeys([])
              }}
              placeholder="Enter custom system prompt here..."
              style={{
                width: '100%',
                minHeight: '600px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '16px',
                color: 'var(--t-100)',
                fontSize: '12px',
                fontFamily: 'monospace',
                lineHeight: '1.65',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                display: 'block',
              }}
            />
            <div style={{ marginTop: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: charColor }}>
              {currentPrompt.length.toLocaleString()} / 20,000 characters
            </div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={savePrompt}
                disabled={promptSaving}
                style={{ padding: '8px 24px', fontSize: '13px' }}
              >
                {promptSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={openHistory}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                History
              </button>
              <button
                className="btn btn-secondary"
                onClick={openDiff}
                disabled={diffLoading}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  background: diffOpen ? 'rgba(99,102,241,0.12)' : undefined,
                  borderColor: diffOpen ? 'rgba(99,102,241,0.4)' : undefined,
                  color: diffOpen ? '#818cf8' : undefined,
                }}
              >
                {diffLoading ? 'Loading...' : diffOpen ? 'Close Diff' : 'Compare with Default'}
              </button>
              {promptMessage && (
                <span style={{ fontSize: '13px', fontWeight: 600, color: promptMessage.type === 'success' ? '#34d399' : '#f87171' }}>
                  {promptMessage.text}
                </span>
              )}
            </div>
            {missingKeys.length > 0 && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>Missing required section keys:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {missingKeys.map(k => (
                    <span key={k} style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '4px', color: '#f87171', fontFamily: 'monospace' }}>
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <label style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--t-400)' }}>
              <input
                type="checkbox"
                checked={skipValidation}
                onChange={e => setSkipValidation(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Skip section key validation (testing only)
            </label>
          </div>

          {/* Diff view */}
          {diffOpen && !diffLoading && (
            <div className="glass" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--t-300)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                  Comparing DB version vs Hardcoded Default
                </div>
                <button onClick={() => setDiffOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--t-400)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '11px', color: 'var(--t-400)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: 'rgba(52,211,153,0.25)', borderRadius: '2px', display: 'inline-block' }} />DB only</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: 'rgba(248,113,113,0.25)', borderRadius: '2px', display: 'inline-block' }} />Hardcoded only</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', display: 'inline-block' }} />Both</span>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '8px' }}>
                {buildDiffLines(currentPrompt, defaultPromptContent).map((line, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '1px 6px',
                      background: line.type === 'current' ? 'rgba(52,211,153,0.1)' : line.type === 'default' ? 'rgba(248,113,113,0.1)' : 'transparent',
                      color: line.type === 'current' ? '#34d399' : line.type === 'default' ? '#f87171' : 'var(--t-400)',
                      whiteSpace: 'pre-wrap' as const,
                      wordBreak: 'break-all' as const,
                    }}
                  >
                    {line.type === 'current' ? '+ ' : line.type === 'default' ? '- ' : '  '}{line.text || ' '}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Prompt */}
          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--t-300)', marginBottom: '14px' }}>
              Test this prompt on a URL
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input
                type="text"
                value={testUrl}
                onChange={e => setTestUrl(e.target.value)}
                placeholder="https://example.com"
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--t-100)', fontSize: '13px', outline: 'none' }}
              />
              <button
                className="btn btn-primary"
                onClick={runTest}
                disabled={testLoading || !testUrl.trim()}
                style={{ padding: '8px 20px', fontSize: '13px', flexShrink: 0 }}
              >
                {testLoading ? 'Running...' : 'Run Test'}
              </button>
            </div>
            {testLoading && (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <div className="loader" style={{ margin: '0 auto' }} />
                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--t-400)' }}>Running AI test...</div>
              </div>
            )}
            {testError && (
              <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', fontSize: '12px', color: '#f87171', fontWeight: 600 }}>
                {testError}
              </div>
            )}
            {testResult !== null && !testLoading && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '8px', letterSpacing: '0.04em' }}>Report preview:</div>
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '12px', color: 'var(--t-200)', lineHeight: '1.7', whiteSpace: 'pre-wrap' as const, maxHeight: '400px', overflowY: 'auto' }}>
                  {testResult}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: status + actions + preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status */}
          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--t-300)', marginBottom: '14px' }}>
              Status
            </div>
            {[
              {
                label: 'Active Source',
                value: currentPrompt
                  ? <span style={{ color: '#34d399', fontWeight: 700 }}>DB Custom</span>
                  : <span style={{ color: '#f59e0b', fontWeight: 700 }}>Hardcoded Fallback</span>,
              },
              {
                label: 'Characters',
                value: <span style={{ color: charColor, fontWeight: 600 }}>{currentPrompt.length.toLocaleString()}</span>,
              },
              {
                label: 'Est. Tokens',
                value: <span style={{ color: tokenColor, fontWeight: 600 }}>{tokens.toLocaleString()}</span>,
              },
              {
                label: 'Last Updated',
                value: currentUpdatedAt
                  ? new Date(currentUpdatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—',
              },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '12px', color: 'var(--t-400)' }}>{label}</span>
                <span style={{ fontSize: '12px', color: 'var(--t-200)' }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--t-400)' }}>
              ~{contextPct}% of GPT-4 Turbo context used by prompt
            </div>
          </div>

          {/* Actions */}
          <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--t-300)', marginBottom: '4px' }}>
              Actions
            </div>
            <button
              className="btn btn-secondary"
              onClick={loadDefault}
              style={{ width: '100%', fontSize: '12px', padding: '9px 14px' }}
            >
              Load Hardcoded Default
            </button>
            <button
              onClick={clearPrompt}
              disabled={promptSaving}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(248,113,113,0.3)',
                background: 'rgba(248,113,113,0.08)',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Clear &amp; Use Fallback
            </button>
          </div>

          {/* Preview */}
          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-300)', marginBottom: '12px' }}>
              Preview (first 200 chars)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--t-400)', fontFamily: 'monospace', lineHeight: '1.6', wordBreak: 'break-word', minHeight: '56px' }}>
              {currentPrompt
                ? currentPrompt.substring(0, 200) + (currentPrompt.length > 200 ? '...' : '')
                : <span style={{ fontStyle: 'italic' }}>No custom prompt set</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {historyOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ width: '100%', maxWidth: '640px', background: '#0f1117', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--t-100)' }}>
                Prompt History — {activePromptTab === 'snapshot' ? 'Snapshot' : 'Detailed'}
              </div>
              <button onClick={() => setHistoryOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--t-400)', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loader" style={{ margin: '0 auto' }} />
                </div>
              ) : historyEntries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t-400)', fontSize: '14px' }}>No history available yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {historyEntries.map(entry => (
                    <div key={entry.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--t-400)' }}>
                          {new Date(entry.saved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            if (activePromptTab === 'snapshot') setSnapshotPrompt(entry.content)
                            else setDetailedPrompt(entry.content)
                            setRestoredFromHistory(true)
                            setHistoryOpen(false)
                            setMissingKeys([])
                          }}
                          style={{ fontSize: '11px', padding: '4px 12px' }}
                        >
                          Restore
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--t-400)', fontFamily: 'monospace', lineHeight: '1.5', wordBreak: 'break-word' }}>
                        {entry.content.substring(0, 120)}{entry.content.length > 120 ? '...' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
