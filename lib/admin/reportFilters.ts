export type ReportTypeFilter = 'all' | 'snapshot' | 'detailed'
export type PdfFilter = 'all' | 'stored' | 'missing'
export type SampleFilter = 'all' | 'published' | 'draft' | 'none'
export type ShareFilter = 'all' | 'shared' | 'private'
export type DateFilter = 'all' | 'today' | '7d' | '30d'
export type SortPreset =
  | 'newest'
  | 'oldest'
  | 'website_asc'
  | 'website_desc'
  | 'type'
  | 'pdf'

export type SampleStatus = 'published' | 'draft' | 'needs_review' | 'failed' | 'none'

export function parseReportTypeFilter(value: string | null | undefined): ReportTypeFilter {
  if (value === 'snapshot' || value === 'detailed') return value
  return 'all'
}

export function parsePdfFilter(value: string | null | undefined): PdfFilter {
  if (value === 'stored' || value === 'missing') return value
  return 'all'
}

export function parseSampleFilter(value: string | null | undefined): SampleFilter {
  if (value === 'published' || value === 'draft' || value === 'none') return value
  return 'all'
}

export function parseShareFilter(value: string | null | undefined): ShareFilter {
  if (value === 'shared' || value === 'private') return value
  return 'all'
}

export function parseDateFilter(value: string | null | undefined): DateFilter {
  if (value === 'today' || value === '7d' || value === '30d') return value
  return 'all'
}

export function parseSortPreset(value: string | null | undefined): SortPreset {
  if (
    value === 'oldest' ||
    value === 'website_asc' ||
    value === 'website_desc' ||
    value === 'type' ||
    value === 'pdf'
  ) {
    return value
  }
  return 'newest'
}

export function parseLimit(value: string | null | undefined): number {
  const n = Number(value)
  if (n === 50 || n === 100) return n
  return 20
}

/** UTC cutoff for Admin date filters. */
export function dateFilterCutoffUtc(filter: DateFilter, now = new Date()): Date | null {
  if (filter === 'all') return null
  if (filter === 'today') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  }
  const days = filter === '7d' ? 7 : 30
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export function sortPresetToSql(preset: SortPreset): { column: string; direction: 'ASC' | 'DESC' } {
  switch (preset) {
    case 'oldest':
      return { column: 'r.created_at', direction: 'ASC' }
    case 'website_asc':
      return { column: 'r.website_url', direction: 'ASC' }
    case 'website_desc':
      return { column: 'r.website_url', direction: 'DESC' }
    case 'type':
      return { column: 'r.report_type', direction: 'ASC' }
    case 'pdf':
      return { column: 'has_pdf', direction: 'DESC' }
    case 'newest':
    default:
      return { column: 'r.created_at', direction: 'DESC' }
  }
}

/**
 * Derive a clean Admin-facing sample status from homepage_showcase fields.
 */
export function deriveSampleStatus(row: {
  sample_content_mode?: string | null
  anonymization_status?: string | null
  use_as_sample?: boolean | null
  has_anonymized_sections?: boolean | null
}): SampleStatus {
  const mode = String(row.sample_content_mode || 'source')
  const status = String(row.anonymization_status || 'none')
  const hasSections = Boolean(row.has_anonymized_sections)
  const useAsSample = Boolean(row.use_as_sample)

  if (mode === 'anonymized' && status === 'published' && useAsSample) {
    return 'published'
  }

  if (mode === 'anonymized' || hasSections) {
    if (status === 'needs_review') return 'needs_review'
    if (status === 'failed') return 'failed'
    return 'draft'
  }

  return 'none'
}

export function sampleStatusSqlCase(): string {
  return `
    CASE
      WHEN hs.sample_content_mode = 'anonymized'
           AND hs.anonymization_status = 'published'
           AND hs.use_as_sample = TRUE
        THEN 'published'
      WHEN hs.anonymized_sections_json IS NOT NULL
           OR hs.sample_content_mode = 'anonymized'
        THEN CASE
          WHEN hs.anonymization_status = 'needs_review' THEN 'needs_review'
          WHEN hs.anonymization_status = 'failed' THEN 'failed'
          ELSE 'draft'
        END
      ELSE 'none'
    END
  `
}
