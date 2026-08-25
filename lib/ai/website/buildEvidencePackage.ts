import { sanitizeUrl } from '@/lib/url/sanitize'
import type {
  EnquiryEvidenceSummary,
  PageEvidence,
  PageTypeHint,
  SiteWideEvidence,
  TrustEvidenceSummary,
  WebsiteEvidencePackage,
} from '@/types/evidence'

const FETCH_TIMEOUT_MS = 8000
const MAX_PAGES_SNAPSHOT = 9
const MAX_PAGES_DETAILED = 12
const BODY_LIMIT = 2500

type RawFetch = {
  url: string
  finalUrl: string
  status: number
  html: string
  headers: Headers
  redirected: boolean
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function metaContent(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return decodeEntities(m[1].trim())
  }
  return ''
}

function extractHeadings(html: string, level: 1 | 2 | 3): string[] {
  const re = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, 'gi')
  const out: string[] = []
  let m
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[1])
    if (text.length > 1 && text.length < 220) out.push(text)
  }
  return [...new Set(out)].slice(0, level === 1 ? 5 : 12)
}

function extractCanonical(html: string): string | null {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)
  return m?.[1]?.trim() || null
}

function extractRobotsDirectives(html: string, headers: Headers): string[] {
  const directives: string[] = []
  const meta = metaContent(html, 'robots')
  if (meta) directives.push(`meta:${meta}`)
  const x = headers.get('x-robots-tag')
  if (x) directives.push(`x-robots-tag:${x}`)
  return directives
}

function extractJsonLdTypes(html: string): string[] {
  const types: string[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1])
      const walk = (node: unknown) => {
        if (!node || typeof node !== 'object') return
        if (Array.isArray(node)) {
          node.forEach(walk)
          return
        }
        const obj = node as Record<string, unknown>
        if (typeof obj['@type'] === 'string') types.push(obj['@type'])
        if (Array.isArray(obj['@type'])) {
          for (const t of obj['@type']) if (typeof t === 'string') types.push(t)
        }
        Object.values(obj).forEach(walk)
      }
      walk(data)
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return [...new Set(types)].slice(0, 20)
}

function matchSignals(text: string, patterns: RegExp[], limit = 8): string[] {
  const hits: string[] = []
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[0]) hits.push(m[0].replace(/\s+/g, ' ').trim().slice(0, 120))
  }
  return [...new Set(hits)].slice(0, limit)
}

function classifyPageType(url: string, title: string, body: string): PageTypeHint {
  const hay = `${url} ${title} ${body.slice(0, 400)}`.toLowerCase()
  if (/\/$|home/.test(new URL(url).pathname) && new URL(url).pathname.length <= 1) return 'homepage'
  if (/about|our-story|who-we-are/.test(hay)) return 'about'
  if (/founder|ceo|leadership/.test(hay)) return 'founder'
  if (/team|people|staff/.test(hay)) return 'team'
  if (/case-stud|success-stor|portfolio|clients?/.test(hay)) return 'case_study'
  if (/testimonial|review|feedback/.test(hay)) return 'testimonial'
  if (/contact|get-in-touch|enquiry|inquiry/.test(hay)) return 'contact'
  if (/pricing|plans|packages/.test(hay)) return 'pricing'
  if (/location|branch|office|near-me|city|suburb/.test(hay)) return 'location'
  if (/blog|news|resource|guide|insight|article/.test(hay)) return 'content'
  if (/service|solution|what-we-do|offer/.test(hay)) return 'service'
  if (/product|shop|store/.test(hay)) return 'product'
  return 'other'
}

function scoreCandidate(url: string): number {
  const path = new URL(url).pathname.toLowerCase()
  const rules: Array<[RegExp, number]> = [
    [/^\/$/, 100],
    [/about/, 95],
    [/service|solution|what-we-do/, 90],
    [/product|offer/, 85],
    [/team|founder|people/, 80],
    [/case-stud|testimonial|client|portfolio/, 78],
    [/contact/, 75],
    [/pricing|plan/, 72],
    [/blog|resource|guide|insight/, 65],
    [/location|office|branch/, 60],
  ]
  for (const [re, score] of rules) {
    if (re.test(path)) return score
  }
  return 20
}

function diversityBucket(url: string): string {
  const t = classifyPageType(url, '', '')
  return t
}

async function fetchRaw(url: string): Promise<RawFetch | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SEOSnapshotBot/3.0; +https://seo.thinkbigdigital.co)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)
    const html = await response.text()
    return {
      url,
      finalUrl: response.url || url,
      status: response.status,
      html,
      headers: response.headers,
      redirected: response.redirected || response.url !== url,
    }
  } catch (err: any) {
    console.log('[Evidence] fetch failed:', url, err?.message?.slice(0, 80))
    return null
  }
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin
  const host = new URL(baseUrl).hostname
  const re = /href=["']([^"'#]+)["']/gi
  const seen = new Set<string>()
  const links: string[] = []
  let m
  while ((m = re.exec(html)) !== null) {
    const href = m[1]
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue
    }
    try {
      const absolute = href.startsWith('http')
        ? href
        : href.startsWith('/')
          ? origin + href
          : new URL(href, baseUrl).toString()
      const u = new URL(absolute)
      if (u.hostname !== host) continue
      u.hash = ''
      const clean = u.toString().replace(/\/$/, '') || u.origin
      if (seen.has(clean)) continue
      seen.add(clean)
      links.push(clean)
    } catch {
      // skip bad URLs
    }
  }
  return links
}

function selectDiverseUrls(candidates: string[], homepage: string, maxPages: number): string[] {
  const ranked = [...new Set(candidates)]
    .filter(u => u.replace(/\/$/, '') !== homepage.replace(/\/$/, ''))
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))

  const selected: string[] = [homepage]
  const usedBuckets = new Set<string>(['homepage'])

  for (const url of ranked) {
    if (selected.length >= maxPages) break
    const bucket = diversityBucket(url)
    const sameBucket = selected.filter(s => diversityBucket(s) === bucket).length
    if (sameBucket >= (bucket === 'service' || bucket === 'content' ? 3 : 1) && bucket !== 'other') {
      continue
    }
    selected.push(url)
    usedBuckets.add(bucket)
  }

  for (const url of ranked) {
    if (selected.length >= maxPages) break
    if (!selected.includes(url)) selected.push(url)
  }

  return selected.slice(0, maxPages)
}

function parsePage(raw: RawFetch): PageEvidence {
  const titleMatch = raw.html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() || ''
  const body = stripTags(raw.html).slice(0, BODY_LIMIT)
  const pageType = classifyPageType(raw.finalUrl, title, body)
  const lower = `${title} ${body}`.toLowerCase()

  const ctaEvidence = matchSignals(lower, [
    /book (a )?(demo|call|consultation)/i,
    /get (a )?quote/i,
    /contact us/i,
    /request (a )?demo/i,
    /buy now|shop now|start (free )?trial/i,
    /enquire|inquire|get in touch/i,
  ])

  const trustEvidence = matchSignals(lower, [
    /testimonial/i,
    /case stud/i,
    /certified|accreditation|accredited/i,
    /award|recognised|recognized/i,
    /years? of experience/i,
    /our team|meet the team|founder/i,
  ])

  const businessServiceLocationEvidence = matchSignals(
    `${title} ${raw.finalUrl} ${body.slice(0, 800)}`,
    [
      /\b(services?|solutions?|products?)\b[^.]{0,80}/i,
      /\b(sydney|melbourne|brisbane|perth|adelaide|london|new york|dubai|singapore|india|australia|uk|usa)\b[^.]{0,40}/i,
      /\b(we (help|provide|offer|speciali[sz]e))\b[^.]{0,100}/i,
    ],
    10
  )

  const author =
    metaContent(raw.html, 'author') ||
    matchSignals(body, [/by [A-Z][a-z]+ [A-Z][a-z]+/], 1)[0] ||
    null

  const publishedOrUpdated =
    metaContent(raw.html, 'article:published_time') ||
    metaContent(raw.html, 'article:modified_time') ||
    metaContent(raw.html, 'og:updated_time') ||
    null

  return {
    url: raw.finalUrl,
    pageType,
    httpStatus: raw.status,
    title,
    metaDescription: metaContent(raw.html, 'description') || metaContent(raw.html, 'og:description'),
    h1: extractHeadings(raw.html, 1),
    h2: extractHeadings(raw.html, 2),
    h3: extractHeadings(raw.html, 3),
    visibleBodyText: body,
    canonical: extractCanonical(raw.html),
    robotsDirectives: extractRobotsDirectives(raw.html, raw.headers),
    internalLinks: extractInternalLinks(raw.html, raw.finalUrl).slice(0, 25),
    structuredDataTypes: extractJsonLdTypes(raw.html),
    author,
    publishedOrUpdated,
    ctaEvidence,
    trustEvidence,
    businessServiceLocationEvidence,
  }
}

function buildTrustSummary(pages: PageEvidence[]): TrustEvidenceSummary {
  const blob = pages.map(p => `${p.url} ${p.title} ${p.visibleBodyText}`).join('\n').toLowerCase()
  return {
    aboutSignals: matchSignals(blob, [/about (us|our company|the company)/i, /our story|who we are/i]),
    founderSignals: matchSignals(blob, [/founder/i, /co-founder/i, /ceo/i]),
    teamSignals: matchSignals(blob, [/our team|meet the team|leadership team/i]),
    namedExperts: matchSignals(blob, [/dr\.?\s+[a-z]+/i, /expert|specialist|consultant/i], 5),
    authorshipSignals: pages.flatMap(p => (p.author ? [p.author] : [])).slice(0, 8),
    credentials: matchSignals(blob, [/qualified|licensed|registered|member of/i]),
    certifications: matchSignals(blob, [/certif(ied|ication)|iso\s?\d+/i]),
    testimonials: matchSignals(blob, [/testimonial|what (our )?clients say|customer (review|story)/i]),
    caseStudies: matchSignals(blob, [/case stud(y|ies)|success stor(y|ies)|portfolio/i]),
    clientEvidence: matchSignals(blob, [/our clients|trusted by|worked with/i]),
    awards: matchSignals(blob, [/award|winner|finalist|recognised|recognized/i]),
    originalResearch: matchSignals(blob, [/research|whitepaper|original (data|study)|methodology/i]),
    methodologyProcess: matchSignals(blob, [/our process|how (we|it) works|methodology|approach/i]),
    contactTransparency: matchSignals(blob, [/phone|email|address|office|abn|acn/i], 8),
    policies: matchSignals(blob, [/privacy policy|terms (of service|and conditions)|refund policy/i]),
  }
}

function buildEnquirySummary(pages: PageEvidence[], htmlSamples: string[]): EnquiryEvidenceSummary {
  const html = htmlSamples.join('\n')
  const text = pages.map(p => `${p.title} ${p.visibleBodyText}`).join('\n')

  const telLinks = [...html.matchAll(/href=["'](tel:[^"']+)["']/gi)].map(m => m[1]).slice(0, 8)
  const emailLinks = [...html.matchAll(/href=["'](mailto:[^"']+)["']/gi)].map(m => m[1]).slice(0, 8)
  const forms = [...html.matchAll(/<form[\s\S]*?<\/form>/gi)].map((_, i) => `form_${i + 1}`).slice(0, 8)

  return {
    forms,
    telLinks: [...new Set(telLinks)],
    emailLinks: [...new Set(emailLinks)],
    bookingSignals: matchSignals(text, [/book(ing)?|schedule|appointment|calendar/i]),
    demoSignals: matchSignals(text, [/demo|trial|walkthrough/i]),
    quoteSignals: matchSignals(text, [/quote|estimate|proposal/i]),
    enquirySignals: matchSignals(text, [/enquir(y|e)|inquir(y|e)|get in touch|contact us/i]),
    purchaseSignals: matchSignals(text, [/buy now|add to cart|checkout|purchase|order now/i]),
    ctaWording: pages.flatMap(p => p.ctaEvidence).slice(0, 12),
    ctaDestinations: pages
      .flatMap(p => p.internalLinks.filter(l => /contact|book|demo|quote|pricing|cart/i.test(l)))
      .slice(0, 12),
  }
}

async function fetchTextResource(url: string): Promise<{ ok: boolean; text: string; status: number | null }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOSnapshotBot/3.0)' },
      redirect: 'follow',
    })
    clearTimeout(timeout)
    const text = await res.text()
    return { ok: res.ok, text: text.slice(0, 4000), status: res.status }
  } catch {
    return { ok: false, text: '', status: null }
  }
}

function interpretOaiAccess(robotsText: string): SiteWideEvidence['oaiSearchBotAccess'] {
  if (!robotsText) return 'unknown'
  const lower = robotsText.toLowerCase()
  if (!lower.includes('oai-searchbot')) return 'not_specified'
  const block = lower.split(/user-agent:\s*/i).find(p => p.startsWith('oai-searchbot'))
  if (!block) return 'not_specified'
  if (/disallow:\s*\//i.test(block.split('user-agent:')[0] || block)) return 'disallowed'
  if (/allow:\s*\//i.test(block)) return 'allowed'
  return 'not_specified'
}

export async function buildWebsiteEvidencePackage(
  websiteUrl: string,
  options?: { depth?: 'snapshot' | 'detailed' }
): Promise<WebsiteEvidencePackage> {
  const depth = options?.depth || 'snapshot'
  const maxPages = depth === 'detailed' ? MAX_PAGES_DETAILED : MAX_PAGES_SNAPSHOT
  const { url } = sanitizeUrl(websiteUrl)
  const origin = new URL(url).origin
  const domain = new URL(url).hostname

  console.log('[Evidence] Building package for', url, 'depth=', depth)

  const homepageRaw = await fetchRaw(url)
  const candidateLinks = homepageRaw
    ? extractInternalLinks(homepageRaw.html, homepageRaw.finalUrl)
    : []

  const selectedUrls = selectDiverseUrls(
    candidateLinks,
    homepageRaw?.finalUrl || url,
    maxPages
  )

  const pageRaws: RawFetch[] = []
  const settled = await Promise.allSettled(
    selectedUrls.map(async (pageUrl, index) => {
      if (index === 0 && homepageRaw) return homepageRaw
      return fetchRaw(pageUrl)
    })
  )

  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value && result.value.status < 400) {
      pageRaws.push(result.value)
    }
  }

  const pages = pageRaws.map(parsePage)
  const htmlSamples = pageRaws.map(p => p.html)

  const robots = await fetchTextResource(`${origin}/robots.txt`)
  const sitemapCandidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ]
  let sitemap = { ok: false, text: '', status: null as number | null }
  for (const s of sitemapCandidates) {
    sitemap = await fetchTextResource(s)
    if (sitemap.ok) break
  }

  const siteWide: SiteWideEvidence = {
    robotsTxtFound: robots.ok,
    robotsTxtSummary: robots.ok
      ? robots.text.slice(0, 600).replace(/\s+/g, ' ')
      : 'robots.txt not observed at the default location',
    sitemapFound: sitemap.ok,
    sitemapSummary: sitemap.ok
      ? `Sitemap observed (${sitemap.text.match(/<loc>/gi)?.length || 0} loc tags in sample)`
      : 'Sitemap not observed at common default locations',
    oaiSearchBotAccess: robots.ok ? interpretOaiAccess(robots.text) : 'unknown',
    homepageHttpStatus: homepageRaw?.status ?? null,
    finalUrl: homepageRaw?.finalUrl || url,
    https: (homepageRaw?.finalUrl || url).startsWith('https://'),
    redirectObserved: Boolean(homepageRaw?.redirected),
    metaRobots: pages[0]?.robotsDirectives.filter(d => d.startsWith('meta:')) || [],
    xRobotsTag: homepageRaw?.headers.get('x-robots-tag') || null,
    siteCanonical: pages[0]?.canonical || null,
  }

  return {
    domain,
    analysedAt: new Date().toISOString(),
    analysisCoverage: {
      pagesRequested: selectedUrls.length,
      pagesReviewed: pages.length,
      pageUrls: pages.map(p => p.url),
      selectionNotes:
        'Pages were prioritised for diversity (homepage, about, services, trust, contact, content, location) rather than first-link order. Coverage is a sample of publicly fetchable HTML pages, not a complete crawl.',
      method: 'html_fetch',
    },
    siteWide,
    pages,
    trust: buildTrustSummary(pages),
    enquiry: buildEnquirySummary(pages, htmlSamples),
    externalEvidence: {
      collected: false,
      status: 'NOT_VERIFIED',
      note: 'External evidence (search rankings, reviews, backlinks, Analytics, CRM, AI citations) was not collected for this report.',
    },
  }
}
