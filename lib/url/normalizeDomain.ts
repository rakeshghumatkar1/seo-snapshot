/** Normalise website URLs to a comparable domain for public stats. */
export function normalizeDomain(websiteUrl: string): string {
  const raw = String(websiteUrl || '').trim().toLowerCase()
  if (!raw) return ''

  let value = raw.replace(/^https?:\/\//, '')
  value = value.replace(/^www\./, '')
  value = value.split('/')[0] || ''
  value = value.split('?')[0] || ''
  value = value.split('#')[0] || ''
  value = value.replace(/:\d+$/, '')
  return value.trim()
}

/** SQL expression that normalises website_url to a bare domain. */
export const SQL_NORMALIZED_DOMAIN = `
  NULLIF(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(trim(website_url)), '^https?://', ''),
        '^www\\.',
        ''
      ),
      '[/?#].*$',
      ''
    ),
    ''
  )
`.trim()
