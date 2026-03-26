export interface WebsiteContent {
  url: string
  title: string
  description: string
  bodyText: string
  error?: string
}

export async function fetchWebsiteContent(
  url: string
): Promise<WebsiteContent> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(), 8000
    )

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
        'Accept': 'text/html',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return {
        url,
        title: '',
        description: '',
        bodyText: '',
        error: `HTTP ${response.status}`,
      }
    }

    const html = await response.text()

    // Extract title
    const titleMatch = html.match(
      /<title[^>]*>([^<]+)<\/title>/i
    )
    const title = titleMatch?.[1]?.trim() || ''

    // Extract meta description
    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i
    )
    const description = descMatch?.[1]?.trim() || ''

    // Extract body text — clean HTML tags
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 3000)

    console.log(
      '[Fetcher] Success:', url,
      'Title:', title.substring(0, 50)
    )

    return { url, title, description, bodyText }

  } catch (err: any) {
    console.error('[Fetcher] Failed:', err?.message)
    return {
      url,
      title: '',
      description: '',
      bodyText: '',
      error: err?.message,
    }
  }
}
