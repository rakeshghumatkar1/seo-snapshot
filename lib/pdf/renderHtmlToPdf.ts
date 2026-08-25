import fs from 'fs'
import chromium from '@sparticuz/chromium'
import puppeteer, { type Browser } from 'puppeteer-core'

function localChromePath(): string | null {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH
  }
  if (
    process.env.PUPPETEER_EXECUTABLE_PATH &&
    fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)
  ) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]

  for (const path of candidates) {
    if (fs.existsSync(path)) return path
  }
  return null
}

async function launchBrowser(): Promise<Browser> {
  const onVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

  if (onVercel) {
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  const executablePath = localChromePath()
  if (!executablePath) {
    throw new Error('No local Chrome executable found for PDF rendering')
  }

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=medium'],
  })
}

/** Render shared report HTML into a real PDF buffer (selectable text + links). */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  let browser: Browser | null = null
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '12mm',
        right: '10mm',
        bottom: '14mm',
        left: '10mm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="width:100%;font-size:9px;color:#6B7280;padding:0 12mm;display:flex;justify-content:space-between;font-family:Segoe UI,Arial,sans-serif;">
          <span>Think Big Digital</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    })
    await page.close()
    return Buffer.from(pdf)
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}
