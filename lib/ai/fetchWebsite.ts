export interface PageContent {
  url: string
  title: string
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
      .substring(0, 2000)

    if (bodyText.length < 50) return null

    return { url, title, bodyText }

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
  const domain = websiteUrl
    .replace(/https?:\/\//, '')
    .replace(/\/$/, '')
    .split('/')[0]

  console.log('[Fetcher] Starting:', websiteUrl)

  // Step 1: Fetch homepage
  const homepage = await fetchSinglePage(
    websiteUrl
  )

  if (!homepage) {
    console.warn(
      '[Fetcher] Homepage failed:', websiteUrl
    )
    return {
      domain,
      homepage: {
        url: websiteUrl,
        title: '',
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
    const res = await fetch(websiteUrl, {
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
    ? extractInternalLinks(homepageHtml, websiteUrl)
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

  // Step 4: Combine all text for AI
  const allText = [
    `=== HOMEPAGE (${homepage.url}) ===`,
    `Title: ${homepage.title}`,
    homepage.bodyText,
    ...additionalPages.map(p => [
      `=== ${p.url.split('/').slice(-2).join('/')} ===`,
      `Title: ${p.title}`,
      p.bodyText,
    ].join('\n')),
  ].join('\n\n').substring(0, 6000)

  return {
    domain,
    homepage,
    additionalPages,
    allText,
  }
}
