import { sanitizeUrl } from '@/lib/url/sanitize'

export const WEBSITE_URL_INVALID_MESSAGE =
  'Please enter a valid website address, e.g. yourdomain.com'

/**
 * Normalize a public website entry (trim + optional https://) then run security sanitize.
 * Does not invent hosts from arbitrary words — sanitizeUrl still rejects invalid hostnames.
 */
export function normalizePublicWebsiteInput(raw: string): string {
  const cleaned = String(raw || '').trim()
  if (!cleaned) {
    throw new Error(WEBSITE_URL_INVALID_MESSAGE)
  }

  // Protocol-only / protocol-relative junk
  if (
    cleaned.startsWith('://') ||
    /^https?:\/\/*$/i.test(cleaned) ||
    /^https?:$/i.test(cleaned)
  ) {
    throw new Error(WEBSITE_URL_INVALID_MESSAGE)
  }

  const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`

  try {
    sanitizeUrl(withProtocol)
  } catch {
    throw new Error(WEBSITE_URL_INVALID_MESSAGE)
  }

  // Keep the user-facing normalized string (no forced trailing slash from URL#toString).
  return withProtocol
}

export function isValidPublicWebsiteInput(raw: string): boolean {
  try {
    normalizePublicWebsiteInput(raw)
    return true
  } catch {
    return false
  }
}
