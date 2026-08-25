export type EvidenceClass =
  | 'OBSERVED_WEBSITE'
  | 'OBSERVED_EXTERNAL'
  | 'INFERRED'
  | 'NOT_VERIFIED'

export type PageTypeHint =
  | 'homepage'
  | 'about'
  | 'service'
  | 'product'
  | 'team'
  | 'founder'
  | 'case_study'
  | 'testimonial'
  | 'contact'
  | 'content'
  | 'location'
  | 'pricing'
  | 'other'

export interface SiteWideEvidence {
  robotsTxtFound: boolean
  robotsTxtSummary: string
  sitemapFound: boolean
  sitemapSummary: string
  oaiSearchBotAccess: 'allowed' | 'disallowed' | 'not_specified' | 'unknown'
  homepageHttpStatus: number | null
  finalUrl: string
  https: boolean
  redirectObserved: boolean
  metaRobots: string[]
  xRobotsTag: string | null
  siteCanonical: string | null
}

export interface PageEvidence {
  url: string
  pageType: PageTypeHint
  httpStatus: number | null
  title: string
  metaDescription: string
  h1: string[]
  h2: string[]
  h3: string[]
  visibleBodyText: string
  canonical: string | null
  robotsDirectives: string[]
  internalLinks: string[]
  structuredDataTypes: string[]
  author: string | null
  publishedOrUpdated: string | null
  ctaEvidence: string[]
  trustEvidence: string[]
  businessServiceLocationEvidence: string[]
}

export interface TrustEvidenceSummary {
  aboutSignals: string[]
  founderSignals: string[]
  teamSignals: string[]
  namedExperts: string[]
  authorshipSignals: string[]
  credentials: string[]
  certifications: string[]
  testimonials: string[]
  caseStudies: string[]
  clientEvidence: string[]
  awards: string[]
  originalResearch: string[]
  methodologyProcess: string[]
  contactTransparency: string[]
  policies: string[]
}

export interface EnquiryEvidenceSummary {
  forms: string[]
  telLinks: string[]
  emailLinks: string[]
  bookingSignals: string[]
  demoSignals: string[]
  quoteSignals: string[]
  enquirySignals: string[]
  purchaseSignals: string[]
  ctaWording: string[]
  ctaDestinations: string[]
}

export interface ExternalEvidence {
  collected: false
  status: 'NOT_VERIFIED'
  note: string
}

export interface AnalysisCoverage {
  pagesRequested: number
  pagesReviewed: number
  pageUrls: string[]
  selectionNotes: string
  method: 'html_fetch'
}

export interface WebsiteEvidencePackage {
  domain: string
  analysedAt: string
  analysisCoverage: AnalysisCoverage
  siteWide: SiteWideEvidence
  pages: PageEvidence[]
  trust: TrustEvidenceSummary
  enquiry: EnquiryEvidenceSummary
  externalEvidence: ExternalEvidence
}
