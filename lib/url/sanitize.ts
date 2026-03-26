export interface SanitizedUrl {
  /** Full URL with protocol, e.g. "https://stripe.com" */
  url: string
  /** Hostname only, e.g. "stripe.com" */
  hostname: string
  /** Protocol, e.g. "https:" */
  protocol: string
}

/**
 * Validates and sanitizes a user-provided URL.
 * Returns only the structured parts — never raw user input.
 * Throws if the URL is invalid or uses a non-http(s) protocol.
 */
export function sanitizeUrl(raw: string): SanitizedUrl {
  const trimmed = raw.trim().replace(/\/+$/, '')

  if (!trimmed) {
    throw new Error('URL is required')
  }

  // Add protocol if missing
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  let parsed: URL
  try {
    parsed = new URL(withProtocol)
  } catch {
    throw new Error('Invalid URL format')
  }

  // Only allow http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed')
  }

  // Hostname must have at least one dot (no localhost, no IPs for LLM prompts)
  if (!parsed.hostname.includes('.')) {
    throw new Error('Invalid domain — must contain a valid hostname')
  }

  // Block obvious injection patterns in the hostname
  if (/[\n\r\t\\]/.test(parsed.hostname)) {
    throw new Error('Invalid characters in hostname')
  }

  return {
    url: `${parsed.protocol}//${parsed.hostname}`,
    hostname: parsed.hostname,
    protocol: parsed.protocol,
  }
}
