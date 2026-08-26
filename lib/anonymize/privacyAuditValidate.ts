import type { PrivacyAuditResult, PrivacyIssue } from './types'

/** Case-insensitive containment with collapsed whitespace. */
export function sectionContainsIssueText(
  sectionText: string,
  issueText: string
): boolean {
  const hay = String(sectionText || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  const needle = String(issueText || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  if (!needle) return false
  return hay.includes(needle)
}

/**
 * Keep only AI issues whose quoted `text` actually appears in the named candidate section.
 * System `_audit` failures (AI/JSON failures) are preserved when they have a reason.
 */
export function filterSupportedPrivacyIssues(
  issues: PrivacyIssue[],
  candidateSections: Record<string, string>
): { supported: PrivacyIssue[]; discarded: PrivacyIssue[] } {
  const supported: PrivacyIssue[] = []
  const discarded: PrivacyIssue[] = []

  for (const issue of issues || []) {
    if (!issue || typeof issue !== 'object') continue
    const section = String(issue.section || '')
    const text = String(issue.text || '')
    const reason = String(issue.reason || '')

    if (section === '_audit') {
      if (reason.trim()) supported.push({ section, text, reason })
      else discarded.push({ section, text, reason })
      continue
    }

    const body = candidateSections[section]
    if (typeof body !== 'string') {
      discarded.push({ section, text, reason })
      continue
    }
    if (!text.trim()) {
      discarded.push({ section, text, reason })
      continue
    }
    if (!sectionContainsIssueText(body, text)) {
      discarded.push({ section, text, reason })
      continue
    }
    supported.push({
      section,
      text: text.slice(0, 280),
      reason: reason || 'Identifying information remains.',
    })
  }

  return { supported, discarded }
}

/**
 * After parsing an AI privacy audit, drop unsupported/hallucinated issues.
 * If every content issue is unsupported and deterministic scan passed → treat as safe.
 */
export function applyValidatedPrivacyAudit(
  audit: PrivacyAuditResult,
  candidateSections: Record<string, string>,
  deterministicPassed: boolean
): PrivacyAuditResult & { discardedIssues: PrivacyIssue[] } {
  if (audit.safe) {
    return { safe: true, issues: [], discardedIssues: [] }
  }

  const { supported, discarded } = filterSupportedPrivacyIssues(
    audit.issues || [],
    candidateSections
  )

  const systemFailures = supported.filter((i) => i.section === '_audit')
  const contentIssues = supported.filter((i) => i.section !== '_audit')

  if (systemFailures.length > 0 && contentIssues.length === 0) {
    return {
      safe: false,
      issues: systemFailures,
      discardedIssues: discarded,
    }
  }

  if (contentIssues.length === 0) {
    if (deterministicPassed) {
      return { safe: true, issues: [], discardedIssues: discarded }
    }
    return {
      safe: false,
      issues: [
        {
          section: '_audit',
          text: '',
          reason: 'Deterministic privacy scan found identifying information.',
        },
      ],
      discardedIssues: discarded,
    }
  }

  return {
    safe: false,
    issues: contentIssues,
    discardedIssues: discarded,
  }
}
