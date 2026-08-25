export type SampleContentMode = 'source' | 'anonymized'

export type AnonymizationStatus =
  | 'none'
  | 'generating'
  | 'draft'
  | 'needs_review'
  | 'ready'
  | 'published'
  | 'failed'

export type PrivacyIssue = {
  section: string
  text: string
  reason: string
}

export type PrivacyAuditResult = {
  safe: boolean
  issues: PrivacyIssue[]
}

export type DeterministicScanHit = {
  type: string
  match: string
  section?: string
}

export type DeterministicScanResult = {
  passed: boolean
  hits: DeterministicScanHit[]
  cleanedSections: Record<string, string>
}

export type StructureValidationResult = {
  valid: boolean
  errors: string[]
  sections?: Record<string, string>
}
