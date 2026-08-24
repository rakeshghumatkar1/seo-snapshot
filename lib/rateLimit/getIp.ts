import { NextRequest } from 'next/server'

export function getClientIp(req: NextRequest): string {
  // Check Vercel/proxy headers first
  // On Vercel, x-vercel-forwarded-for contains the real client IP
  // set by the edge — not spoofable by the client
  const vercelIp = req.headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    return vercelIp.split(',')[0].trim()
  }

  // Fallback for non-Vercel environments (dev, staging)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the last IP (added by trusted proxy) not the first (client-supplied)
    const ips = forwarded.split(',').map(s => s.trim()).filter(Boolean)
    if (ips.length) return ips[ips.length - 1]
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp

  // Fallback for local development
  return '127.0.0.1'
}
