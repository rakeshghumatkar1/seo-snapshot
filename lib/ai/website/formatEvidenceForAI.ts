import type { WebsiteEvidencePackage } from '@/types/evidence'

function listOrNone(items: string[], empty = 'None observed in the pages reviewed'): string {
  if (!items.length) return empty
  return items.map(i => `- ${i}`).join('\n')
}

export function formatEvidenceForAI(
  pkg: WebsiteEvidencePackage,
  depth: 'snapshot' | 'detailed' = 'snapshot'
): string {
  const bodyLimit = depth === 'detailed' ? 1800 : 1100
  const maxPages = depth === 'detailed' ? 12 : 9

  const pageBlocks = pkg.pages.slice(0, maxPages).map((p, idx) => {
    return [
      `--- PAGE ${idx + 1}: ${p.pageType.toUpperCase()} ---`,
      `URL: ${p.url}`,
      `HTTP: ${p.httpStatus ?? 'unknown'}`,
      `Title: ${p.title || '(not observed)'}`,
      `Meta description: ${p.metaDescription || '(not observed)'}`,
      `H1: ${p.h1.join(' | ') || '(not observed)'}`,
      `H2: ${p.h2.slice(0, 8).join(' | ') || '(not observed)'}`,
      depth === 'detailed' ? `H3: ${p.h3.slice(0, 8).join(' | ') || '(not observed)'}` : null,
      `Canonical: ${p.canonical || '(not observed)'}`,
      `Robots: ${p.robotsDirectives.join('; ') || '(not observed)'}`,
      `Schema types: ${p.structuredDataTypes.join(', ') || '(not observed)'}`,
      `Author: ${p.author || '(not observed)'}`,
      `Published/updated: ${p.publishedOrUpdated || '(not observed)'}`,
      `CTA evidence: ${p.ctaEvidence.join('; ') || '(not observed)'}`,
      `Trust evidence: ${p.trustEvidence.join('; ') || '(not observed)'}`,
      `Business/service/location evidence: ${p.businessServiceLocationEvidence.join('; ') || '(not observed)'}`,
      `Visible body text (truncated):\n${p.visibleBodyText.slice(0, bodyLimit)}`,
    ]
      .filter(Boolean)
      .join('\n')
  })

  return [
    '=== WEBSITE EVIDENCE PACKAGE (V3) ===',
    `Domain: ${pkg.domain}`,
    `Analysed at: ${pkg.analysedAt}`,
    `Method: ${pkg.analysisCoverage.method}`,
    `Pages reviewed: ${pkg.analysisCoverage.pagesReviewed} / requested ${pkg.analysisCoverage.pagesRequested}`,
    `Coverage note: ${pkg.analysisCoverage.selectionNotes}`,
    `Page URLs:`,
    ...pkg.analysisCoverage.pageUrls.map(u => `  - ${u}`),
    '',
    '=== SITE-WIDE (OBSERVED — WEBSITE) ===',
    `HTTPS: ${pkg.siteWide.https}`,
    `Final URL: ${pkg.siteWide.finalUrl}`,
    `Homepage HTTP status: ${pkg.siteWide.homepageHttpStatus ?? 'unknown'}`,
    `Redirect observed: ${pkg.siteWide.redirectObserved}`,
    `robots.txt found: ${pkg.siteWide.robotsTxtFound}`,
    `robots.txt summary: ${pkg.siteWide.robotsTxtSummary}`,
    `OAI-SearchBot access: ${pkg.siteWide.oaiSearchBotAccess}`,
    `Sitemap found: ${pkg.siteWide.sitemapFound}`,
    `Sitemap summary: ${pkg.siteWide.sitemapSummary}`,
    `Meta robots: ${pkg.siteWide.metaRobots.join('; ') || '(not observed)'}`,
    `X-Robots-Tag: ${pkg.siteWide.xRobotsTag || '(not observed)'}`,
    `Site canonical (homepage): ${pkg.siteWide.siteCanonical || '(not observed)'}`,
    '',
    '=== TRUST SUMMARY (from analysed pages) ===',
    `About: ${listOrNone(pkg.trust.aboutSignals)}`,
    `Founder: ${listOrNone(pkg.trust.founderSignals)}`,
    `Team: ${listOrNone(pkg.trust.teamSignals)}`,
    `Testimonials: ${listOrNone(pkg.trust.testimonials)}`,
    `Case studies: ${listOrNone(pkg.trust.caseStudies)}`,
    `Credentials/certifications: ${listOrNone([...pkg.trust.credentials, ...pkg.trust.certifications])}`,
    `Contact transparency: ${listOrNone(pkg.trust.contactTransparency)}`,
    `Policies: ${listOrNone(pkg.trust.policies)}`,
    '',
    '=== ENQUIRY SUMMARY (from analysed pages) ===',
    `Forms observed: ${pkg.enquiry.forms.length}`,
    `Tel links: ${listOrNone(pkg.enquiry.telLinks)}`,
    `Email links: ${listOrNone(pkg.enquiry.emailLinks)}`,
    `Booking: ${listOrNone(pkg.enquiry.bookingSignals)}`,
    `Demo: ${listOrNone(pkg.enquiry.demoSignals)}`,
    `Quote: ${listOrNone(pkg.enquiry.quoteSignals)}`,
    `Enquiry CTA wording: ${listOrNone(pkg.enquiry.ctaWording)}`,
    `CTA destinations: ${listOrNone(pkg.enquiry.ctaDestinations)}`,
    '',
    '=== EXTERNAL EVIDENCE ===',
    `Status: ${pkg.externalEvidence.status}`,
    `Collected: ${pkg.externalEvidence.collected}`,
    `Note: ${pkg.externalEvidence.note}`,
    '',
    '=== PAGE EVIDENCE ===',
    ...pageBlocks,
    '',
    '=== END EVIDENCE PACKAGE ===',
    '',
    'EVIDENCE CLASS RULES FOR THE MODEL:',
    '- OBSERVED — WEBSITE: only facts present above.',
    '- OBSERVED — EXTERNAL: none available in this package.',
    '- INFERRED: reasonable interpretation; mark as inferred.',
    '- NOT VERIFIED: cannot be established from this package.',
    '- Never say something “does not exist” only because it was absent from this sample. Prefer “not observed in the pages reviewed”.',
  ].join('\n')
}
