import { normalizeDomain } from '@/lib/url/normalizeDomain'
import type { DeterministicScanHit, DeterministicScanResult } from './types'

function emailMatches(text: string): string[] {
  return text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || []
}

function urlMatches(text: string): string[] {
  return text.match(/\bhttps?:\/\/[^\s<>"'`]+/gi) || []
}

function wwwHostMatches(text: string): string[] {
  return text.match(/\bwww\.[a-z0-9.-]+\.[a-z]{2,}\b/gi) || []
}

function phoneMatches(text: string): string[] {
  const matches = text.match(
    /(?:\+\d{1,3}[\s.-]*)?(?:\(?\d{2,4}\)?[\s.-]*)?\d{3,5}[\s.-]*\d{3,5}\b/g
  ) || []
  return matches.filter((match) => match.replace(/\D/g, '').length >= 8)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hostVariants(websiteUrl: string): string[] {
  const host = normalizeDomain(websiteUrl)
  if (!host) return []
  const bare = host.toLowerCase()
  return [
    bare,
    `www.${bare}`,
    `http://${bare}`,
    `https://${bare}`,
    `http://www.${bare}`,
    `https://www.${bare}`,
  ]
}

function replaceHostMentions(text: string, hosts: string[]): string {
  let out = text
  const sorted = [...hosts].sort((a, b) => b.length - a.length)
  for (const host of sorted) {
    const re = new RegExp(escapeRegExp(host), 'gi')
    out = out.replace(re, 'the website')
  }
  return out.replace(/\s{2,}/g, ' ').trim()
}

function scrubGenericIdentifiers(text: string): string {
  let out = text
  // Longer/url-like first
  out = out.replace(/\bhttps?:\/\/[^\s<>"'`]+/gi, 'the website')
  out = out.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, 'the business contact email')
  out = out.replace(/\bwww\.[a-z0-9.-]+\.[a-z]{2,}\b/gi, 'the website')
  out = out.replace(
    /(?:\+\d{1,3}[\s.-]*)?(?:\(?\d{2,4}\)?[\s.-]*)?\d{3,5}[\s.-]*\d{3,5}\b/g,
    (match) => (match.replace(/\D/g, '').length >= 8 ? 'the business phone number' : match)
  )
  out = out.replace(
    /\bVisit the website for more information\b/gi,
    'The website provides additional service information'
  )
  // Collapse accidental "the website/path" leftovers after host strip
  out = out.replace(/\bthe website\/[^\s.,;:!?]+/gi, 'the website')
  return out.replace(/\s{2,}/g, ' ').trim()
}

export function runDeterministicPrivacyScan(
  sections: Record<string, string>,
  websiteUrl: string
): DeterministicScanResult {
  const hosts = hostVariants(websiteUrl)
  const hits: DeterministicScanHit[] = []
  const cleanedSections: Record<string, string> = {}

  for (const [key, value] of Object.entries(sections)) {
    let cleaned = String(value || '')
    const lower = cleaned.toLowerCase()

    for (const host of hosts) {
      if (host && lower.includes(host.toLowerCase())) {
        hits.push({ type: 'host', match: host, section: key })
      }
    }
    for (const match of emailMatches(cleaned)) hits.push({ type: 'email', match, section: key })
    for (const match of urlMatches(cleaned)) hits.push({ type: 'url', match, section: key })
    for (const match of phoneMatches(cleaned)) hits.push({ type: 'phone', match, section: key })

    // Scrub emails/URLs/phones before host replacement so domains inside emails are not partially rewritten
    cleaned = scrubGenericIdentifiers(cleaned)
    cleaned = replaceHostMentions(cleaned, hosts)
    cleaned = scrubGenericIdentifiers(cleaned)
    cleanedSections[key] = cleaned
  }

  const residual: DeterministicScanHit[] = []
  for (const [key, value] of Object.entries(cleanedSections)) {
    const lower = value.toLowerCase()
    for (const host of hosts) {
      if (host && lower.includes(host.toLowerCase())) {
        residual.push({ type: 'host', match: host, section: key })
      }
    }
    for (const match of emailMatches(value)) residual.push({ type: 'email', match, section: key })
    for (const match of urlMatches(value)) residual.push({ type: 'url', match, section: key })
    for (const match of wwwHostMatches(value)) residual.push({ type: 'www', match, section: key })
    for (const match of phoneMatches(value)) residual.push({ type: 'phone', match, section: key })
  }

  return {
    passed: residual.length === 0,
    hits: residual.length ? residual : hits,
    cleanedSections,
  }
}

/** Detect identifiers without mutation — for publish gates / tests. */
export function detectIdentifiers(
  text: string,
  websiteUrl: string
): DeterministicScanHit[] {
  const hosts = hostVariants(websiteUrl)
  const hits: DeterministicScanHit[] = []
  const value = String(text || '')
  const lower = value.toLowerCase()

  for (const host of hosts) {
    if (host && lower.includes(host.toLowerCase())) {
      hits.push({ type: 'host', match: host })
    }
  }
  for (const match of emailMatches(value)) hits.push({ type: 'email', match })
  for (const match of urlMatches(value)) hits.push({ type: 'url', match })
  for (const match of phoneMatches(value)) hits.push({ type: 'phone', match })
  return hits
}

export function scanSectionsForIdentifiers(
  sections: Record<string, string>,
  websiteUrl: string
): DeterministicScanHit[] {
  const hits: DeterministicScanHit[] = []
  for (const [section, text] of Object.entries(sections)) {
    for (const hit of detectIdentifiers(text, websiteUrl)) {
      hits.push({ ...hit, section })
    }
  }
  return hits
}
