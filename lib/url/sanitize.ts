const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,          // AWS/GCP metadata
  /^100\.64\./,           // Carrier-grade NAT
  /^::1$/,                // IPv6 loopback
  /^fc00:/i,              // IPv6 private
  /^fe80:/i,              // IPv6 link-local
]

export function sanitizeUrl(rawUrl: string): { url: string } {
  let parsed: URL
  try {
    parsed = new URL(rawUrl.trim())
  } catch {
    throw new Error('Invalid URL format')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed')
  }

  const hostname = parsed.hostname.toLowerCase()

  if (!hostname.includes('.') && hostname !== 'localhost') {
    throw new Error('Invalid hostname')
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error('URL points to a private or restricted address')
    }
  }

  return { url: parsed.toString() }
}
