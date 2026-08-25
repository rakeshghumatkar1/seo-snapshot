import { PageEvidence, WebsiteEvidencePackage } from '@/types/evidence'

export type EvidenceFormatMode = 'snapshot' | 'detailed'

function line(label: string, value: string | number | boolean | undefined): string {
  if (value === undefined || value === '') return ''
  return `${label}: ${String(value)}`
}

function listBlock(title: string, values: string[]): string {
  const clean = values.map(value => value.trim()).filter(Boolean)
  if (clean.length === 0) return `${title}: None observed in analysed evidence`
  return `${title}:\n${clean.map(value => `- ${value}`).join('\n')}`
}

function pageSummary(page: PageEvidence, mode: EvidenceFormatMode): string {
  const textLimit = mode === 'snapshot' ? 1200 : 2600
  const linkLimit = mode === 'snapshot' ? 8 : 20
  const ctaLimit = mode === 'snapshot' ? 5 : 12

  const rows = [
    `PAGE: ${page.finalUrl}`,
    `Page type: ${page.pageType}`,
    `Selection reason: ${page.selectionReason}`,
    line('HTTP status', page.httpStatus),
    line('Title', page.title),
    line('Meta description', page.metaDescription),
    line('Canonical', page.canonical),
    line('Meta robots', page.metaRobots),
    line('X-Robots-Tag', page.xRobotsTag),
    page.headings.length ? `Headings: ${page.headings.slice(0, mode === 'snapshot' ? 12 : 24).join(' | ')}` : 'Headings: None observed',
    page.structuredData.types.length ? `Structured data types: ${page.structuredData.types.join(', ')}` : 'Structured data types: None observed',
    page.authorNames.length ? `Authors: ${page.authorNames.join(', ')}` : '',
    line('Published date', page.publishedDate),
    line('Modified date', page.modifiedDate),
    page.conversionSignals.ctas.length
      ? `Observed CTAs: ${page.conversionSignals.ctas.slice(0, ctaLimit).map(cta => `${cta.text}${cta.href ? ` -> ${cta.href}` : ''}`).join(' | ')}`
      : 'Observed CTAs: None observed',
    page.conversionSignals.forms.length ? `Forms observed: ${page.conversionSignals.forms.length}` : 'Forms observed: 0',
    page.conversionSignals.phoneLinks.length ? `Phone links observed: ${page.conversionSignals.phoneLinks.map(item => item.value).join(', ')}` : '',
    page.conversionSignals.emailLinks.length ? `Email links observed: ${page.conversionSignals.emailLinks.map(item => item.value).join(', ')}` : '',
    page.trustSignals.testimonialMentions.length ? `Testimonial evidence: ${page.trustSignals.testimonialMentions.join(' | ')}` : '',
    page.trustSignals.caseStudyMentions.length ? `Case-study evidence: ${page.trustSignals.caseStudyMentions.join(' | ')}` : '',
    page.trustSignals.certificationMentions.length ? `Certification/accreditation evidence: ${page.trustSignals.certificationMentions.join(' | ')}` : '',
    page.trustSignals.clientProofMentions.length ? `Client proof evidence: ${page.trustSignals.clientProofMentions.join(' | ')}` : '',
    page.internalLinks.length
      ? `Selected internal links: ${page.internalLinks.slice(0, linkLimit).map(link => `${link.text || '(no anchor text)'} -> ${link.href}`).join(' | ')}`
      : '',
    `Visible text excerpt: ${page.visibleText.substring(0, textLimit)}`,
  ]

  return rows.filter(Boolean).join('\n')
}

export function formatEvidenceForAI(evidence: WebsiteEvidencePackage, mode: EvidenceFormatMode): string {
  const pageLimit = mode === 'snapshot' ? Math.min(evidence.pages.length, 8) : evidence.pages.length
  const pages = evidence.pages.slice(0, pageLimit)

  const coverage = [
    '=== ANALYSIS COVERAGE ===',
    line('Website', evidence.coverage.websiteUrl),
    line('Analysed at', evidence.coverage.analysedAt),
    line('Discovered internal URLs', evidence.coverage.discoveredInternalUrls),
    line('Pages analysed', evidence.coverage.analysedPages),
    line('Rendered fallback used', evidence.coverage.renderedFallbackUsed),
    listBlock(
      'Analysed pages',
      evidence.coverage.pages.map(page => `${page.status.toUpperCase()} | ${page.pageType} | ${page.url} | ${page.selectionReason}`)
    ),
  ].filter(Boolean).join('\n')

  const searchEligibility = [
    '=== SEARCH ELIGIBILITY EVIDENCE ===',
    line('HTTPS', evidence.siteDirectives.https),
    line('robots.txt status', evidence.siteDirectives.robotsTxt.status),
    line('robots.txt HTTP status', evidence.siteDirectives.robotsTxt.httpStatus),
    line('Googlebot allowed at root', evidence.siteDirectives.robotsTxt.googlebotAllowed),
    line('OAI-SearchBot allowed at root', evidence.siteDirectives.robotsTxt.oaiSearchBotAllowed),
    line('Sitemap status', evidence.siteDirectives.sitemap.status),
    line('Sitemap URL count observed', evidence.siteDirectives.sitemap.urls.length),
  ].filter(Boolean).join('\n')

  const business = [
    '=== BUSINESS EVIDENCE ===',
    listBlock('Possible business names', evidence.businessEvidence.possibleBusinessNames),
    listBlock('Service pages', evidence.businessEvidence.servicePages.map(ref => `${ref.label || 'Service page'} -> ${ref.url}`)),
    listBlock('Product pages', evidence.businessEvidence.productPages.map(ref => `${ref.label || 'Product page'} -> ${ref.url}`)),
    listBlock('Solution pages', evidence.businessEvidence.solutionPages.map(ref => `${ref.label || 'Solution page'} -> ${ref.url}`)),
    listBlock('Location pages', evidence.businessEvidence.locationPages.map(ref => `${ref.label || 'Location page'} -> ${ref.url}`)),
    listBlock('Pricing pages', evidence.businessEvidence.pricingPages.map(ref => `${ref.label || 'Pricing page'} -> ${ref.url}`)),
    listBlock('Contact pages', evidence.businessEvidence.contactPages.map(ref => `${ref.label || 'Contact page'} -> ${ref.url}`)),
  ].join('\n')

  const trust = [
    '=== ON-SITE TRUST EVIDENCE ===',
    listBlock('About pages', evidence.trustEvidence.aboutPage.map(ref => `${ref.label || 'About'} -> ${ref.url}`)),
    listBlock('Founder/team evidence', evidence.trustEvidence.founderTeam.map(ref => `${ref.label || 'Founder/team'} -> ${ref.url}`)),
    listBlock('Named experts', evidence.trustEvidence.namedExperts),
    listBlock('Authors', evidence.trustEvidence.authors),
    listBlock('Testimonial evidence pages', evidence.trustEvidence.testimonials.map(ref => `${ref.label || 'Testimonials'} -> ${ref.url}`)),
    listBlock('Case-study evidence pages', evidence.trustEvidence.caseStudies.map(ref => `${ref.label || 'Case study'} -> ${ref.url}`)),
    listBlock('Certification/accreditation evidence', evidence.trustEvidence.certifications.map(item => `${item.text} -> ${item.sourceUrl}`)),
    listBlock('Client proof evidence', evidence.trustEvidence.clientProof.map(item => `${item.text} -> ${item.sourceUrl}`)),
    listBlock('Contact transparency evidence', evidence.trustEvidence.contactTransparency.map(ref => `${ref.label || 'Contact evidence'} -> ${ref.url}`)),
    'External reputation is separate from on-site trust and is not verified unless external evidence is explicitly supplied.',
  ].join('\n')

  const conversion = [
    '=== ENQUIRY / CONVERSION EVIDENCE ===',
    line('Forms observed', evidence.conversionEvidence.forms.length),
    listBlock('Phone links', evidence.conversionEvidence.phoneLinks.map(item => `${item.value} -> ${item.sourceUrl}`)),
    listBlock('Email links', evidence.conversionEvidence.emailLinks.map(item => `${item.value} -> ${item.sourceUrl}`)),
    listBlock('Calls to action', evidence.conversionEvidence.ctas.slice(0, mode === 'snapshot' ? 15 : 35).map(item => `${item.text}${item.href ? ` -> ${item.href}` : ''} | source ${item.sourceUrl}`)),
  ].join('\n')

  const pageEvidence = [
    '=== PAGE EVIDENCE ===',
    ...pages.map(page => pageSummary(page, mode)),
  ].join('\n\n')

  const external = [
    '=== EXTERNAL EVIDENCE ===',
    `Status: ${evidence.externalEvidence.status}`,
    evidence.externalEvidence.note,
  ].join('\n')

  const limitations = [
    '=== KNOWN LIMITATIONS ===',
    ...evidence.limitations.map(item => `- ${item}`),
  ].join('\n')

  return [
    coverage,
    searchEligibility,
    business,
    trust,
    conversion,
    pageEvidence,
    external,
    limitations,
  ].join('\n\n')
}
