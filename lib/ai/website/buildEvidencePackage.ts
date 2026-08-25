import { sanitizeUrl } from '@/lib/url/sanitize'
import {
  BusinessEvidence,
  ConversionEvidence,
  EvidenceRef,
  PageEvidence,
  PageType,
  SiteDirectiveEvidence,
  TrustEvidence,
  WebsiteEvidencePackage,
} from '@/types/evidence'

const FETCH_TIMEOUT = 8000
const MAX_PAGES = 12
const MAX_VISIBLE_TEXT = 7000
const MAX_INTERNAL_LINKS_PER_PAGE = 80

interface FetchResult {
  requestedUrl: string
  finalUrl: string
  status: number
  headers: Headers
  html: string
}

interface CandidatePage {
  url: string
  pageType: PageType
  reason: string
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanVisibleText(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const source = bodyMatch?.[1] || html
  return stripTags(
    source
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
  ).substring(0, MAX_VISIBLE_TEXT)
}

function getTagAttribute(tag: string, attribute: string): string {
  const quoted = new RegExp(`${attribute}\\s*=\\s*["']([^"']*)["']`, 'i')
  const bare = new RegExp(`${attribute}\\s*=\\s*([^\\s>]+)`, 'i')
  return decodeEntities(tag.match(quoted)?.[1] || tag.match(bare)?.[1] || '').trim()
}

function findMetaContent(html: string, keys: string[]): string {
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  for (const tag of tags) {
    const name = (getTagAttribute(tag, 'name') || getTagAttribute(tag, 'property')).toLowerCase()
    if (keys.some(key => name === key.toLowerCase())) {
      return getTagAttribute(tag, 'content')
    }
  }
  return ''
}

function findLinkHref(html: string, relName: string): string {
  const tags = html.match(/<link\b[^>]*>/gi) || []
  for (const tag of tags) {
    const rel = getTagAttribute(tag, 'rel').toLowerCase().split(/\s+/)
    if (rel.includes(relName.toLowerCase())) return getTagAttribute(tag, 'href')
  }
  return ''
}

function extractTitle(html: string): string {
  return stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
}

function extractHeadings(html: string): string[] {
  const values: string[] = []
  const regex = /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const text = stripTags(match[1])
    if (text.length >= 2 && text.length <= 220) values.push(text)
  }
  return [...new Set(values)].slice(0, 40)
}

function normalizeInternalUrl(href: string, baseUrl: string): string | null {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return null
  }
  try {
    const candidate = new URL(href, baseUrl)
    const base = new URL(baseUrl)
    if (candidate.origin !== base.origin) return null
    candidate.hash = ''
    if (/\.(?:jpg|jpeg|png|gif|webp|svg|pdf|zip|xml|json|css|js|ico|woff2?)$/i.test(candidate.pathname)) return null
    return candidate.toString()
  } catch {
    return null
  }
}

function extractInternalLinks(html: string, baseUrl: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = []
  const seen = new Set<string>()
  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const tag = `<a ${match[1]}>`
    const href = normalizeInternalUrl(getTagAttribute(tag, 'href'), baseUrl)
    if (!href || seen.has(href)) continue
    seen.add(href)
    links.push({ href, text: stripTags(match[2]).substring(0, 120) })
    if (links.length >= MAX_INTERNAL_LINKS_PER_PAGE) break
  }
  return links
}

function classifyPage(url: string, title = '', headings: string[] = []): PageType {
  let path = ''
  try {
    path = new URL(url).pathname.toLowerCase()
  } catch {
    path = url.toLowerCase()
  }
  const context = `${path} ${title} ${headings.join(' ')}`.toLowerCase()
  if (path === '/' || path === '') return 'homepage'
  if (/case[-_/ ]?stud|success[-_/ ]?stor|customer[-_/ ]?stor/.test(context)) return 'case-study'
  if (/testimonial|reviews?/.test(context)) return 'testimonial'
  if (/contact|get[-_/ ]?in[-_/ ]?touch/.test(context)) return 'contact'
  if (/about|our[-_/ ]?story|company/.test(context)) return 'about'
  if (/team|leadership|founder|people/.test(context)) return 'team'
  if (/author|contributors?/.test(context)) return 'author'
  if (/pricing|plans?|fees?|costs?/.test(context)) return 'pricing'
  if (/locations?|service[-_/ ]?areas?|offices?|branches?/.test(context)) return 'location'
  if (/faq|frequently[-_/ ]?asked/.test(context)) return 'faq'
  if (/services?/.test(context)) return 'service'
  if (/products?/.test(context)) return 'product'
  if (/solutions?/.test(context)) return 'solution'
  if (/resources?|guides?|insights?|knowledge|learn/.test(context)) return 'resource'
  if (/blog|articles?|news/.test(context)) return 'blog'
  return 'other'
}

function pagePriority(type: PageType): number {
  const priorities: PageType[] = [
    'about',
    'service',
    'product',
    'solution',
    'case-study',
    'testimonial',
    'team',
    'contact',
    'pricing',
    'location',
    'resource',
    'faq',
    'blog',
    'author',
    'other',
  ]
  const index = priorities.indexOf(type)
  return index === -1 ? priorities.length : index
}

function selectionReason(type: PageType): string {
  const reasons: Record<PageType, string> = {
    homepage: 'Primary business and navigation page',
    about: 'Business identity and trust evidence',
    service: 'Commercial service evidence',
    product: 'Commercial product evidence',
    solution: 'Commercial solution evidence',
    'case-study': 'First-party proof and customer outcome evidence',
    testimonial: 'First-party trust evidence',
    team: 'People, expertise and authorship evidence',
    author: 'Authorship and expertise evidence',
    contact: 'Contact transparency and enquiry path',
    location: 'Geographic and local-search evidence',
    pricing: 'Commercial decision information',
    resource: 'Customer information and expertise evidence',
    blog: 'Editorial/content evidence',
    faq: 'Customer question coverage',
    other: 'Additional representative internal page',
  }
  return reasons[type]
}

async function fetchText(url: string, accept: string, timeoutMs = FETCH_TIMEOUT): Promise<{ status: number; text: string; finalUrl: string; headers: Headers } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOReportTool/3.0; +https://seo-snapshot.vercel.app)',
        Accept: accept,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    return {
      status: response.status,
      text: await response.text(),
      finalUrl: response.url || url,
      headers: response.headers,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchHtml(url: string): Promise<FetchResult | null> {
  const result = await fetchText(url, 'text/html,application/xhtml+xml')
  if (!result) return null
  return {
    requestedUrl: url,
    finalUrl: result.finalUrl,
    status: result.status,
    headers: result.headers,
    html: result.text,
  }
}

function extractJsonLd(html: string): { types: string[]; organizationNames: string[]; authors: string[]; publishedDate: string; modifiedDate: string } {
  const types = new Set<string>()
  const organizationNames = new Set<string>()
  const authors = new Set<string>()
  let publishedDate = ''
  let modifiedDate = ''

  function visit(value: unknown): void {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    const item = value as Record<string, unknown>
    const rawType = item['@type']
    const itemTypes = Array.isArray(rawType) ? rawType : rawType ? [rawType] : []
    itemTypes.forEach(type => {
      if (typeof type === 'string') types.add(type)
    })
    const isOrganization = itemTypes.some(type => typeof type === 'string' && /organization|localbusiness|corporation|professionalservice/i.test(type))
    if (isOrganization && typeof item.name === 'string') organizationNames.add(item.name.trim())
    const isPerson = itemTypes.some(type => type === 'Person')
    if (isPerson && typeof item.name === 'string') authors.add(item.name.trim())
    if (!publishedDate && typeof item.datePublished === 'string') publishedDate = item.datePublished
    if (!modifiedDate && typeof item.dateModified === 'string') modifiedDate = item.dateModified
    if (item.author) visit(item.author)
    if (item['@graph']) visit(item['@graph'])
  }

  const regex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    try {
      visit(JSON.parse(match[1].trim()))
    } catch {
      // Invalid JSON-LD is evidence that cannot be safely interpreted here.
    }
  }

  return {
    types: [...types].slice(0, 30),
    organizationNames: [...organizationNames].slice(0, 10),
    authors: [...authors].slice(0, 20),
    publishedDate,
    modifiedDate,
  }
}

function extractForms(html: string, sourceUrl: string): ConversionEvidence['forms'] {
  const forms: ConversionEvidence['forms'] = []
  const tags = html.match(/<form\b[^>]*>/gi) || []
  for (const tag of tags.slice(0, 20)) {
    forms.push({
      action: getTagAttribute(tag, 'action') || undefined,
      method: getTagAttribute(tag, 'method') || undefined,
      sourceUrl,
    })
  }
  return forms
}

function extractActionLinks(html: string, sourceUrl: string): Pick<ConversionEvidence, 'phoneLinks' | 'emailLinks' | 'ctas'> {
  const phoneLinks: ConversionEvidence['phoneLinks'] = []
  const emailLinks: ConversionEvidence['emailLinks'] = []
  const ctas: ConversionEvidence['ctas'] = []
  const regex = /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi
  const ctaPattern = /contact|book|schedule|demo|quote|enquir|inquir|consult|call|buy|purchase|shop|apply|register|sign\s?up|get started|talk to|request|order/i
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const tag = `<${match[1]} ${match[2]}>`
    const href = getTagAttribute(tag, 'href')
    const text = stripTags(match[3]).substring(0, 140)
    if (href.startsWith('tel:')) phoneLinks.push({ value: href.replace(/^tel:/i, ''), sourceUrl })
    if (href.startsWith('mailto:')) emailLinks.push({ value: href.replace(/^mailto:/i, '').split('?')[0], sourceUrl })
    if (text && (ctaPattern.test(text) || href.startsWith('tel:') || href.startsWith('mailto:'))) {
      ctas.push({ text, href: href || undefined, sourceUrl })
    }
  }
  return {
    phoneLinks: phoneLinks.slice(0, 20),
    emailLinks: emailLinks.slice(0, 20),
    ctas: ctas.slice(0, 40),
  }
}

function mentionSnippets(text: string, pattern: RegExp, max = 8): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  return sentences
    .filter(sentence => pattern.test(sentence))
    .map(sentence => sentence.trim().substring(0, 260))
    .filter(Boolean)
    .slice(0, max)
}

function buildPageEvidence(fetchResult: FetchResult, pageType: PageType, reason: string): PageEvidence {
  const { requestedUrl, finalUrl, status, headers, html } = fetchResult
  const title = extractTitle(html)
  const headings = extractHeadings(html)
  const visibleText = cleanVisibleText(html)
  const jsonLd = extractJsonLd(html)
  const metaAuthor = findMetaContent(html, ['author'])
  const authors = [...new Set([metaAuthor, ...jsonLd.authors].filter(Boolean))]
  const publishedDate = jsonLd.publishedDate || findMetaContent(html, ['article:published_time', 'date', 'datepublished'])
  const modifiedDate = jsonLd.modifiedDate || findMetaContent(html, ['article:modified_time', 'last-modified', 'datemodified'])
  const actions = extractActionLinks(html, finalUrl)
  const forms = extractForms(html, finalUrl)

  return {
    requestedUrl,
    finalUrl,
    pageType,
    selectionReason: reason,
    httpStatus: status,
    fetchMode: 'html',
    title,
    metaDescription: findMetaContent(html, ['description']),
    canonical: findLinkHref(html, 'canonical'),
    metaRobots: findMetaContent(html, ['robots', 'googlebot']),
    xRobotsTag: headers.get('x-robots-tag') || '',
    headings,
    visibleText,
    internalLinks: extractInternalLinks(html, finalUrl),
    structuredData: {
      types: jsonLd.types,
      organizationNames: jsonLd.organizationNames,
    },
    authorNames: authors,
    publishedDate,
    modifiedDate,
    conversionSignals: {
      forms,
      phoneLinks: actions.phoneLinks,
      emailLinks: actions.emailLinks,
      ctas: actions.ctas,
    },
    trustSignals: {
      testimonialMentions: mentionSnippets(visibleText, /testimonial|what (?:our )?clients say|customer review|client review/i),
      caseStudyMentions: mentionSnippets(visibleText, /case stud|success stor|customer stor|client stor|results? achieved/i),
      certificationMentions: mentionSnippets(visibleText, /certif|accredit|ISO\s?\d{3,5}|licensed|registered with/i),
      clientProofMentions: mentionSnippets(visibleText, /trusted by|our clients|our customers|worked with|served more than|customers include|clients include/i),
    },
  }
}

function parseRobotsGroup(robots: string, userAgent: string): { allowed?: boolean } {
  const lines = robots.split(/\r?\n/).map(line => line.split('#')[0].trim()).filter(Boolean)
  let active = false
  let matched = false
  let rootDisallowed = false
  let rootAllowed = false

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(':')
    const key = rawKey.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (key === 'user-agent') {
      active = value.toLowerCase() === userAgent.toLowerCase()
      if (active) matched = true
      continue
    }
    if (!active) continue
    if (key === 'disallow' && value === '/') rootDisallowed = true
    if (key === 'allow' && value === '/') rootAllowed = true
  }

  if (!matched && userAgent !== '*') return parseRobotsGroup(robots, '*')
  if (!matched) return {}
  if (rootAllowed) return { allowed: true }
  if (rootDisallowed) return { allowed: false }
  return { allowed: true }
}

async function collectSiteDirectives(baseUrl: string): Promise<{ directives: SiteDirectiveEvidence; sitemapUrls: string[] }> {
  const origin = new URL(baseUrl).origin
  const robotsUrl = `${origin}/robots.txt`
  const robotsResult = await fetchText(robotsUrl, 'text/plain,*/*')
  const robotsAvailable = !!robotsResult && robotsResult.status >= 200 && robotsResult.status < 400
  const robotsText = robotsAvailable ? robotsResult!.text : ''
  const sitemapFromRobots = [...robotsText.matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map(match => match[1])

  const candidateSitemaps = sitemapFromRobots.length > 0
    ? sitemapFromRobots
    : [`${origin}/sitemap.xml`]

  const sitemapUrls: string[] = []
  let sitemapFound = false
  for (const sitemapUrl of candidateSitemaps.slice(0, 5)) {
    const sitemap = await fetchText(sitemapUrl, 'application/xml,text/xml,text/plain,*/*')
    if (!sitemap || sitemap.status < 200 || sitemap.status >= 400) continue
    sitemapFound = true
    const locs = [...sitemap.text.matchAll(/<loc[^>]*>([\s\S]*?)<\/loc>/gi)]
      .map(match => stripTags(match[1]))
      .filter(Boolean)
    sitemapUrls.push(...locs)
  }

  return {
    directives: {
      robotsTxt: {
        status: robotsAvailable ? 'found' : robotsResult?.status === 404 ? 'verified_unavailable' : 'not_observed',
        url: robotsUrl,
        httpStatus: robotsResult?.status,
        googlebotAllowed: robotsAvailable ? parseRobotsGroup(robotsText, 'Googlebot').allowed : undefined,
        oaiSearchBotAllowed: robotsAvailable ? parseRobotsGroup(robotsText, 'OAI-SearchBot').allowed : undefined,
        rawExcerpt: robotsAvailable ? robotsText.substring(0, 1600) : undefined,
      },
      sitemap: {
        status: sitemapFound ? 'found' : 'not_observed',
        urls: [...new Set(sitemapUrls)].slice(0, 500),
        discoveredFrom: sitemapFound ? (sitemapFromRobots.length > 0 ? 'robots' : 'common_path') : undefined,
      },
      https: new URL(baseUrl).protocol === 'https:',
    },
    sitemapUrls: [...new Set(sitemapUrls)],
  }
}

function chooseCandidatePages(homepage: PageEvidence, sitemapUrls: string[]): CandidatePage[] {
  const candidateMap = new Map<string, CandidatePage>()
  for (const link of homepage.internalLinks) {
    const type = classifyPage(link.href, link.text)
    candidateMap.set(link.href, { url: link.href, pageType: type, reason: selectionReason(type) })
  }
  for (const url of sitemapUrls.slice(0, 300)) {
    try {
      const parsed = new URL(url)
      const homeOrigin = new URL(homepage.finalUrl).origin
      if (parsed.origin !== homeOrigin) continue
      const type = classifyPage(url)
      if (!candidateMap.has(url)) candidateMap.set(url, { url, pageType: type, reason: selectionReason(type) })
    } catch {
      // Ignore invalid sitemap URLs.
    }
  }

  const candidates = [...candidateMap.values()].sort((a, b) => pagePriority(a.pageType) - pagePriority(b.pageType))
  const chosen: CandidatePage[] = []
  const counts = new Map<PageType, number>()

  for (const candidate of candidates) {
    if (chosen.length >= MAX_PAGES - 1) break
    const current = counts.get(candidate.pageType) || 0
    const limit = ['service', 'product', 'solution', 'location', 'resource', 'blog'].includes(candidate.pageType) ? 2 : 1
    if (current >= limit) continue
    chosen.push(candidate)
    counts.set(candidate.pageType, current + 1)
  }

  return chosen
}

function dedupeRefs(refs: EvidenceRef[]): EvidenceRef[] {
  const seen = new Set<string>()
  return refs.filter(ref => {
    const key = `${ref.url}|${ref.label || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function mergeConversions(pages: PageEvidence[]): ConversionEvidence {
  const forms = pages.flatMap(page => page.conversionSignals.forms)
  const phoneLinks = pages.flatMap(page => page.conversionSignals.phoneLinks)
  const emailLinks = pages.flatMap(page => page.conversionSignals.emailLinks)
  const ctas = pages.flatMap(page => page.conversionSignals.ctas)

  const unique = <T>(items: T[], keyFn: (item: T) => string): T[] => {
    const seen = new Set<string>()
    return items.filter(item => {
      const key = keyFn(item)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  return {
    forms: unique(forms, item => `${item.sourceUrl}|${item.action || ''}|${item.method || ''}`).slice(0, 30),
    phoneLinks: unique(phoneLinks, item => `${item.value}|${item.sourceUrl}`).slice(0, 30),
    emailLinks: unique(emailLinks, item => `${item.value}|${item.sourceUrl}`).slice(0, 30),
    ctas: unique(ctas, item => `${item.text}|${item.href || ''}|${item.sourceUrl}`).slice(0, 60),
  }
}

function buildBusinessEvidence(pages: PageEvidence[]): BusinessEvidence {
  const refsFor = (type: PageType): EvidenceRef[] => pages
    .filter(page => page.pageType === type)
    .map(page => ({ source: 'website', url: page.finalUrl, label: page.title || page.headings[0] || undefined }))

  const names = new Set<string>()
  pages.forEach(page => page.structuredData.organizationNames.forEach(name => names.add(name)))
  const homepage = pages.find(page => page.pageType === 'homepage')
  if (homepage?.title) {
    const candidate = homepage.title.split(/\s[|–—-]\s/)[0].trim()
    if (candidate.length >= 2 && candidate.length <= 100) names.add(candidate)
  }

  return {
    possibleBusinessNames: [...names].slice(0, 10),
    servicePages: refsFor('service'),
    productPages: refsFor('product'),
    solutionPages: refsFor('solution'),
    locationPages: refsFor('location'),
    pricingPages: refsFor('pricing'),
    contactPages: refsFor('contact'),
  }
}

function buildTrustEvidence(pages: PageEvidence[]): TrustEvidence {
  const refs = (filter: (page: PageEvidence) => boolean): EvidenceRef[] => dedupeRefs(
    pages.filter(filter).map(page => ({ source: 'website', url: page.finalUrl, label: page.title || page.headings[0] || undefined }))
  )

  const namedExperts = new Set<string>()
  const authors = new Set<string>()
  const certifications: TrustEvidence['certifications'] = []
  const clientProof: TrustEvidence['clientProof'] = []

  for (const page of pages) {
    page.authorNames.forEach(author => {
      authors.add(author)
      namedExperts.add(author)
    })
    page.trustSignals.certificationMentions.forEach(text => certifications.push({ text, sourceUrl: page.finalUrl }))
    page.trustSignals.clientProofMentions.forEach(text => clientProof.push({ text, sourceUrl: page.finalUrl }))
  }

  return {
    aboutPage: refs(page => page.pageType === 'about'),
    founderTeam: refs(page => page.pageType === 'team' || (page.pageType === 'about' && /founder|leadership|our team/i.test(`${page.headings.join(' ')} ${page.visibleText.substring(0, 1800)}`))),
    namedExperts: [...namedExperts].slice(0, 30),
    authors: [...authors].slice(0, 30),
    testimonials: refs(page => page.pageType === 'testimonial' || page.trustSignals.testimonialMentions.length > 0),
    caseStudies: refs(page => page.pageType === 'case-study' || page.trustSignals.caseStudyMentions.length > 0),
    certifications: certifications.slice(0, 20),
    clientProof: clientProof.slice(0, 20),
    contactTransparency: refs(page => page.pageType === 'contact' || page.conversionSignals.phoneLinks.length > 0 || page.conversionSignals.emailLinks.length > 0),
  }
}

export async function buildWebsiteEvidencePackage(websiteUrl: string): Promise<WebsiteEvidencePackage> {
  const { url } = sanitizeUrl(websiteUrl)
  const initialUrl = url
  const initialOrigin = new URL(initialUrl).origin
  const domain = new URL(initialUrl).hostname
  const analysedAt = new Date().toISOString()

  const { directives, sitemapUrls } = await collectSiteDirectives(initialUrl)
  const homepageFetch = await fetchHtml(initialUrl)

  if (!homepageFetch || homepageFetch.status < 200 || homepageFetch.status >= 400) {
    return {
      version: 3,
      domain,
      coverage: {
        websiteUrl: initialUrl,
        analysedAt,
        discoveredInternalUrls: 0,
        analysedPages: 0,
        pages: [{
          url: initialUrl,
          pageType: 'homepage',
          selectionReason: selectionReason('homepage'),
          status: 'failed',
        }],
        renderedFallbackUsed: false,
      },
      siteDirectives: directives,
      businessEvidence: {
        possibleBusinessNames: [], servicePages: [], productPages: [], solutionPages: [], locationPages: [], pricingPages: [], contactPages: [],
      },
      trustEvidence: {
        aboutPage: [], founderTeam: [], namedExperts: [], authors: [], testimonials: [], caseStudies: [], certifications: [], clientProof: [], contactTransparency: [],
      },
      conversionEvidence: { forms: [], phoneLinks: [], emailLinks: [], ctas: [] },
      pages: [],
      externalEvidence: {
        status: 'not_collected',
        note: 'External search, backlink, review, ranking and AI-citation evidence is not collected in the current V3 testing phase.',
      },
      limitations: [
        'The homepage could not be fetched successfully, so page-level conclusions are unavailable.',
        'Rendered JavaScript fallback is not yet enabled.',
        'External search and reputation evidence is not collected in the current testing phase.',
      ],
    }
  }

  const homepage = buildPageEvidence(homepageFetch, 'homepage', selectionReason('homepage'))
  const candidates = chooseCandidatePages(homepage, sitemapUrls)
  const candidateFetches = await Promise.allSettled(candidates.map(candidate => fetchHtml(candidate.url)))
  const pages: PageEvidence[] = [homepage]
  const coveragePages: WebsiteEvidencePackage['coverage']['pages'] = [{
    url: homepage.finalUrl,
    pageType: 'homepage',
    selectionReason: selectionReason('homepage'),
    status: 'analysed',
  }]

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const result = candidateFetches[i]
    if (result.status === 'fulfilled' && result.value && result.value.status >= 200 && result.value.status < 400) {
      const actualType = classifyPage(result.value.finalUrl, extractTitle(result.value.html), extractHeadings(result.value.html))
      pages.push(buildPageEvidence(result.value, actualType, candidate.reason))
      coveragePages.push({ url: result.value.finalUrl, pageType: actualType, selectionReason: candidate.reason, status: 'analysed' })
    } else {
      coveragePages.push({ url: candidate.url, pageType: candidate.pageType, selectionReason: candidate.reason, status: 'failed' })
    }
  }

  const discovered = new Set<string>()
  homepage.internalLinks.forEach(link => discovered.add(link.href))
  sitemapUrls.forEach(sitemapUrl => {
    try {
      if (new URL(sitemapUrl).origin === initialOrigin) discovered.add(sitemapUrl)
    } catch {
      // Ignore invalid URLs.
    }
  })

  return {
    version: 3,
    domain,
    coverage: {
      websiteUrl: initialUrl,
      analysedAt,
      discoveredInternalUrls: discovered.size,
      analysedPages: pages.length,
      pages: coveragePages,
      renderedFallbackUsed: false,
    },
    siteDirectives: directives,
    businessEvidence: buildBusinessEvidence(pages),
    trustEvidence: buildTrustEvidence(pages),
    conversionEvidence: mergeConversions(pages),
    pages,
    externalEvidence: {
      status: 'not_collected',
      note: 'External search, backlink, review, ranking and AI-citation evidence is not collected in the current V3 testing phase.',
    },
    limitations: [
      `This is a focused sample of ${pages.length} analysed page${pages.length === 1 ? '' : 's'}, not a full-site crawl.`,
      'Rendered JavaScript fallback is not yet enabled; heavily client-rendered pages may be under-read.',
      'External rankings, traffic, backlinks, reviews, search demand, competitor performance and actual AI citations are not verified.',
      'Business/audience interpretation should be treated as inference unless directly stated in the collected evidence.',
    ],
  }
}
