import { sanitizeUrl } from '@/lib/url/sanitize'

export interface PageContent {
  url: string
  title: string
  headings: string[]
  navLinks: string[]
  bodyText: string
}

export interface WebsiteContent {
  domain: string
  homepage: PageContent
  additionalPages: PageContent[]
  allText: string
  error?: string
}

const FETCH_TIMEOUT = 8000

function extractHeadings(html: string): string[] {
  const regex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi
  const headings: string[] = []
  let match
  while ((match = regex.exec(html)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length > 2 && text.length < 200) {
      headings.push(text)
    }
  }
  return [...new Set(headings)].slice(0, 20)
}

function extractNavLinks(html: string): string[] {
  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/gi)
  if (!navMatch) return []
  const labels: string[] = []
  for (const nav of navMatch) {
    const linkRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi
    let m
    while ((m = linkRegex.exec(nav)) !== null) {
      const text = m[1]
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (text.length > 1 && text.length < 60) {
        labels.push(text)
      }
    }
  }
  return [...new Set(labels)].slice(0, 15)
}

function buildStructuredSummary(
  homepage: PageContent,
  additionalPages: PageContent[]
): string {
  const allHeadings = [
    ...homepage.headings,
    ...additionalPages.flatMap(p => p.headings)
  ]
  const allNavLinks = [
    ...homepage.navLinks,
    ...additionalPages.flatMap(p => p.navLinks)
  ]
  const uniqueHeadings = [...new Set(allHeadings)].slice(0, 30)
  const uniqueNav = [...new Set(allNavLinks)].slice(0, 20)
  const pageList = [
    homepage.url,
    ...additionalPages.map(p => p.url)
  ]

  return [
    '=== STRUCTURED WEBSITE FACTS ===',
    `WEBSITE TITLE: ${homepage.title}`,
    `PAGES FOUND (${pageList.length}):`,
    ...pageList.map(u => `  - ${u}`),
    '',
    uniqueNav.length > 0
      ? `NAVIGATION SECTIONS:\n${uniqueNav.map(n => `  - ${n}`).join('\n')}`
      : '',
    '',
    uniqueHeadings.length > 0
      ? `ALL HEADINGS (exact business language):\n${uniqueHeadings.map(h => `  "${h}"`).join('\n')}`
      : '',
    '=== END STRUCTURED FACTS ===',
  ].filter(Boolean).join('\n')
}

async function fetchSinglePage(
  url: string
): Promise<PageContent | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT
    )

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) return null

    const html = await response.text()

    // Extract title
    const titleMatch = html.match(
      /<title[^>]*>([^<]+)<\/title>/i
    )
    const title = titleMatch?.[1]
      ?.trim()
      ?.replace(/\s+/g, ' ') || ''

    // Extract headings and nav links before stripping HTML
    const headings = extractHeadings(html)
    const navLinks = extractNavLinks(html)

    // Clean HTML to text
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 3000)

    if (bodyText.length < 50) return null

    return { url, title, headings, navLinks, bodyText }

  } catch (err: any) {
    console.log(
      '[Fetcher] Page failed:', url,
      err?.message?.substring(0, 50)
    )
    return null
  }
}

function extractInternalLinks(
  html: string,
  baseUrl: string
): string[] {
  const domain = new URL(baseUrl).origin
  const linkRegex = /href=["']([^"']+)["']/gi
  const links: string[] = []
  const seen = new Set<string>()

  // Priority pages to look for
  const priorityPaths = [
    '/about', '/about-us', '/services',
    '/what-we-do', '/blog', '/resources',
    '/contact', '/team', '/solutions',
    '/features', '/pricing', '/how-it-works',
    '/why-us', '/case-studies', '/clients',
  ]

  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    if (!href) continue

    let fullUrl = ''

    if (href.startsWith('http')) {
      if (href.includes(new URL(baseUrl).hostname)) {
        fullUrl = href
      }
    } else if (href.startsWith('/') &&
               !href.startsWith('//')) {
      fullUrl = domain + href
    }

    if (fullUrl && !seen.has(fullUrl)) {
      seen.add(fullUrl)
      links.push(fullUrl)
    }
  }

  // Sort by priority
  const prioritized = links.sort((a, b) => {
    const aPath = new URL(a).pathname.toLowerCase()
    const bPath = new URL(b).pathname.toLowerCase()

    const aScore = priorityPaths.findIndex(
      p => aPath.includes(p)
    )
    const bScore = priorityPaths.findIndex(
      p => bPath.includes(p)
    )

    if (aScore === -1 && bScore === -1) return 0
    if (aScore === -1) return 1
    if (bScore === -1) return -1
    return aScore - bScore
  })

  return prioritized.slice(0, 8)
}

export async function fetchWebsiteContent(
  websiteUrl: string
): Promise<WebsiteContent> {
  const { url } = sanitizeUrl(websiteUrl)

  const domain = url
    .replace(/https?:\/\//, '')
    .replace(/\/$/, '')
    .split('/')[0]

  console.log('[Fetcher] Starting:', url)

  // Step 1: Fetch homepage
  const homepage = await fetchSinglePage(
    url
  )

  if (!homepage) {
    console.warn(
      '[Fetcher] Homepage failed:', url
    )
    return {
      domain,
      homepage: {
        url: url,
        title: '',
        headings: [],
        navLinks: [],
        bodyText: '',
      },
      additionalPages: [],
      allText: '',
      error: 'Could not fetch homepage',
    }
  }

  console.log(
    '[Fetcher] Homepage OK:', homepage.title
  )

  // Step 2: Extract links from homepage HTML
  let homepageHtml = ''
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
    })
    homepageHtml = await res.text()
  } catch {
    homepageHtml = ''
  }

  const internalLinks = homepageHtml
    ? extractInternalLinks(homepageHtml, url)
    : []

  console.log(
    '[Fetcher] Found links:',
    internalLinks.length
  )

  // Step 3: Fetch up to 4 additional pages in parallel
  const additionalPages: PageContent[] = []

  const pagePromises = internalLinks
    .slice(0, 4)
    .map(url => fetchSinglePage(url))

  const results = await Promise.allSettled(
    pagePromises
  )

  for (const result of results) {
    if (result.status === 'fulfilled' &&
        result.value) {
      additionalPages.push(result.value)
      console.log(
        '[Fetcher] Page OK:',
        result.value.url.split('/').pop() || '/'
      )
    }
  }

  console.log(
    '[Fetcher] Total pages fetched:',
    1 + additionalPages.length
  )

  // Step 4: Build structured summary and combine all text for AI
  const structuredSummary = buildStructuredSummary(
    homepage,
    additionalPages
  )

  const pageBlocks = [
    `=== HOMEPAGE (${homepage.url}) ===`,
    `Title: ${homepage.title}`,
    homepage.headings.length > 0
      ? `Headings: ${homepage.headings.join(' | ')}`
      : '',
    homepage.bodyText,
    ...additionalPages.map(p => [
      `=== ${p.url.split('/').slice(-2).join('/')} ===`,
      `Title: ${p.title}`,
      p.headings.length > 0
        ? `Headings: ${p.headings.join(' | ')}`
        : '',
      p.bodyText,
    ].filter(Boolean).join('\n')),
  ].filter(Boolean).join('\n\n')

  const allText = [
    structuredSummary,
    '',
    pageBlocks,
  ].join('\n').substring(0, 12000)

  return {
    domain,
    homepage,
    additionalPages,
    allText,
  }
}
