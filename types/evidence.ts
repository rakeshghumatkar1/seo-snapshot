export type EvidenceStatus = 'found' | 'not_observed' | 'verified_unavailable'

export type EvidenceSource = 'website' | 'external'

export type PageType =
  | 'homepage'
  | 'about'
  | 'service'
  | 'product'
  | 'solution'
  | 'case-study'
  | 'testimonial'
  | 'team'
  | 'author'
  | 'contact'
  | 'location'
  | 'pricing'
  | 'resource'
  | 'blog'
  | 'faq'
  | 'other'

export interface EvidenceRef {
  source: EvidenceSource
  url: string
  label?: string
}

export interface SiteDirectiveEvidence {
  robotsTxt: {
    status: EvidenceStatus
    url: string
    httpStatus?: number
    googlebotAllowed?: boolean
    oaiSearchBotAllowed?: boolean
    rawExcerpt?: string
  }
  sitemap: {
    status: EvidenceStatus
    urls: string[]
    discoveredFrom?: 'robots' | 'common_path'
  }
  https: boolean
}

export interface StructuredDataEvidence {
  types: string[]
  organizationNames: string[]
}

export interface ConversionEvidence {
  forms: Array<{
    action?: string
    method?: string
    sourceUrl: string
  }>
  phoneLinks: Array<{ value: string; sourceUrl: string }>
  emailLinks: Array<{ value: string; sourceUrl: string }>
  ctas: Array<{
    text: string
    href?: string
    sourceUrl: string
  }>
}

export interface TrustEvidence {
  aboutPage: EvidenceRef[]
  founderTeam: EvidenceRef[]
  namedExperts: string[]
  authors: string[]
  testimonials: EvidenceRef[]
  caseStudies: EvidenceRef[]
  certifications: Array<{ text: string; sourceUrl: string }>
  clientProof: Array<{ text: string; sourceUrl: string }>
  contactTransparency: EvidenceRef[]
}

export interface BusinessEvidence {
  possibleBusinessNames: string[]
  servicePages: EvidenceRef[]
  productPages: EvidenceRef[]
  solutionPages: EvidenceRef[]
  locationPages: EvidenceRef[]
  pricingPages: EvidenceRef[]
  contactPages: EvidenceRef[]
}

export interface PageEvidence {
  requestedUrl: string
  finalUrl: string
  pageType: PageType
  selectionReason: string
  httpStatus: number
  fetchMode: 'html'
  title: string
  metaDescription: string
  canonical: string
  metaRobots: string
  xRobotsTag: string
  headings: string[]
  visibleText: string
  internalLinks: Array<{ href: string; text: string }>
  structuredData: StructuredDataEvidence
  authorNames: string[]
  publishedDate: string
  modifiedDate: string
  conversionSignals: ConversionEvidence
  trustSignals: {
    testimonialMentions: string[]
    caseStudyMentions: string[]
    certificationMentions: string[]
    clientProofMentions: string[]
  }
  error?: string
}

export interface AnalysisCoverage {
  websiteUrl: string
  analysedAt: string
  discoveredInternalUrls: number
  analysedPages: number
  pages: Array<{
    url: string
    pageType: PageType
    selectionReason: string
    status: 'analysed' | 'failed'
  }>
  renderedFallbackUsed: boolean
}

export interface ExternalEvidencePlaceholder {
  status: 'not_collected'
  note: string
}

export interface WebsiteEvidencePackage {
  version: 3
  domain: string
  coverage: AnalysisCoverage
  siteDirectives: SiteDirectiveEvidence
  businessEvidence: BusinessEvidence
  trustEvidence: TrustEvidence
  conversionEvidence: ConversionEvidence
  pages: PageEvidence[]
  externalEvidence: ExternalEvidencePlaceholder
  limitations: string[]
}
