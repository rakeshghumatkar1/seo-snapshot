export type LeadTypeFilter = 'all' | 'detailed' | 'snapshot' | 'pdf'
export type LeadDateFilter = 'all' | 'today' | '7d' | '30d'
export type LeadSortPreset =
  | 'newest'
  | 'oldest'
  | 'company_asc'
  | 'company_desc'

export function parseLeadTypeFilter(value: string | null | undefined): LeadTypeFilter {
  if (value === 'detailed' || value === 'snapshot' || value === 'pdf') return value
  return 'all'
}

export function parseLeadDateFilter(value: string | null | undefined): LeadDateFilter {
  if (value === 'today' || value === '7d' || value === '30d') return value
  return 'all'
}

export function parseLeadSortPreset(value: string | null | undefined): LeadSortPreset {
  if (
    value === 'oldest' ||
    value === 'company_asc' ||
    value === 'company_desc'
  ) {
    return value
  }
  return 'newest'
}

export function parseLeadLimit(value: string | null | undefined): number {
  const n = Number(value)
  if (n === 50 || n === 100) return n
  return 20
}

export function leadDateCutoffUtc(filter: LeadDateFilter, now = new Date()): Date | null {
  if (filter === 'all') return null
  if (filter === 'today') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  }
  const days = filter === '7d' ? 7 : 30
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export function leadSortToSql(preset: LeadSortPreset): {
  column: string
  direction: 'ASC' | 'DESC'
} {
  switch (preset) {
    case 'oldest':
      return { column: 'created_at', direction: 'ASC' }
    case 'company_asc':
      return { column: 'company', direction: 'ASC' }
    case 'company_desc':
      return { column: 'company', direction: 'DESC' }
    case 'newest':
    default:
      return { column: 'created_at', direction: 'DESC' }
  }
}
