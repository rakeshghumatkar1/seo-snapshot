/**
 * Production QA for admin sessions + PDF shares.
 * Usage: node scripts/_prod-share-auth-qa.js
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createHash } = crypto

const BASE = 'https://seo.thinkbigdigital.co'
const envPath = path.join(__dirname, '..', '.env.local')
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    })
)

const password = env.ADMIN_PASSWORD
if (!password) {
  console.error('ADMIN_PASSWORD missing')
  process.exit(1)
}

function parseSetCookie(res) {
  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  const list = raw.length ? raw : [res.headers.get('set-cookie')].filter(Boolean)
  const jar = {}
  for (const c of list) {
    const [pair] = c.split(';')
    const eq = pair.indexOf('=')
    if (eq > 0) jar[pair.slice(0, eq)] = pair.slice(eq + 1)
  }
  return jar
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

async function main() {
  const out = { steps: [] }

  // LOGIN
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const loginJson = await loginRes.json()
  const jar = parseSetCookie(loginRes)
  out.steps.push({
    login: loginRes.status,
    ok: loginJson.success === true,
    hasCookie: Boolean(jar.admin_session),
    cookieLen: jar.admin_session ? jar.admin_session.length : 0,
    looksLegacy: jar.admin_session
      ? !/[-_]/.test(jar.admin_session) &&
        /^.+:\d+$/.test(Buffer.from(jar.admin_session, 'base64').toString('utf8'))
      : null,
  })
  if (!jar.admin_session) throw new Error('No admin_session cookie')

  const cookie = cookieHeader(jar)

  // SESSION REFRESH
  const refreshRes = await fetch(`${BASE}/api/admin/session/refresh`, {
    method: 'POST',
    headers: { Cookie: cookie },
  })
  out.steps.push({ refresh: refreshRes.status, body: await refreshRes.json() })

  // REPORTS
  const reportsRes = await fetch(`${BASE}/api/admin/reports?limit=20&pdf=stored`, {
    headers: { Cookie: cookie },
  })
  const reports = await reportsRes.json()
  const rows = reports.rows || []
  out.steps.push({
    reports: reportsRes.status,
    count: rows.length,
    activeShareCount: reports.summary?.activeShareCount,
    shareStatuses: rows.map((r) => r.share_status),
  })

  const withPdf = rows.filter((r) => r.has_pdf)
  if (withPdf.length < 1) throw new Error('Need at least one stored PDF report')

  const primary = withPdf[0]
  const secondary = withPdf[1] || withPdf[0]

  // CREATE SHARE
  const createRes = await fetch(`${BASE}/api/admin/pdf-shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ action: 'create', reportId: primary.id }),
  })
  const created = await createRes.json()
  out.steps.push({ create: createRes.status, created })
  if (!created.publicUrl) throw new Error('No publicUrl')

  // IDEMPOTENT CREATE
  const create2 = await fetch(`${BASE}/api/admin/pdf-shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ action: 'create', reportId: primary.id }),
  })
  const created2 = await create2.json()
  out.steps.push({
    createReuse: create2.status,
    sameToken: created.shareToken === created2.shareToken,
    createdFlag: created2.created,
  })

  // PUBLIC PDF
  const pubRes = await fetch(created.publicUrl)
  const pubBuf = Buffer.from(await pubRes.arrayBuffer())
  out.steps.push({
    publicPdf: pubRes.status,
    contentType: pubRes.headers.get('content-type'),
    disposition: pubRes.headers.get('content-disposition'),
    robots: pubRes.headers.get('x-robots-tag'),
    cache: pubRes.headers.get('cache-control'),
    bytes: pubBuf.length,
  })

  // ADMIN PDF for SHA compare
  const adminPdfRes = await fetch(`${BASE}/api/admin/reports/${primary.id}/pdf`, {
    headers: { Cookie: cookie },
  })
  const adminBuf = Buffer.from(await adminPdfRes.arrayBuffer())
  const shaPub = createHash('sha256').update(pubBuf).digest('hex')
  const shaAdmin = createHash('sha256').update(adminBuf).digest('hex')
  out.steps.push({
    adminPdf: adminPdfRes.status,
    shaMatch: shaPub === shaAdmin,
    shaPub: shaPub.slice(0, 12),
  })

  // CREATE SECOND SHARE if different report
  let secondUrl = null
  if (secondary.id !== primary.id) {
    const c2 = await fetch(`${BASE}/api/admin/pdf-shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ action: 'create', reportId: secondary.id }),
    })
    const j2 = await c2.json()
    secondUrl = j2.publicUrl
    out.steps.push({ secondCreate: c2.status, url: secondUrl })
  }

  // REVOKE SELECTED (primary only)
  const revSel = await fetch(`${BASE}/api/admin/pdf-shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ action: 'revoke_selected', reportIds: [primary.id] }),
  })
  const revSelBody = await revSel.json()
  const afterRevoke = await fetch(created.publicUrl, { cache: 'no-store' })
  out.steps.push({
    revokeSelected: revSel.status,
    revoked: revSelBody.revoked,
    primaryAfter: afterRevoke.status,
    primaryAfterState: afterRevoke.headers.get('x-share-state'),
  })
  if (afterRevoke.status !== 404) {
    throw new Error(
      `Revoked share still accessible: ${afterRevoke.status} ${afterRevoke.headers.get('x-share-state')}`
    )
  }

  // Recreate primary for filter/all tests
  const recreate = await fetch(`${BASE}/api/admin/pdf-shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ action: 'create', reportId: primary.id }),
  })
  const recreated = await recreate.json()

  // SHARE FILTER
  const sharedFilter = await fetch(`${BASE}/api/admin/reports?share=shared&limit=50`, {
    headers: { Cookie: cookie },
  })
  const sharedBody = await sharedFilter.json()
  const privateFilter = await fetch(`${BASE}/api/admin/reports?share=private&limit=50`, {
    headers: { Cookie: cookie },
  })
  const privateBody = await privateFilter.json()
  out.steps.push({
    filterShared: (sharedBody.rows || []).every((r) => r.share_status === 'shared'),
    filterPrivate: (privateBody.rows || []).every((r) => r.share_status === 'private'),
    sharedCount: (sharedBody.rows || []).length,
  })

  // Admin PDF still works after revoke+recreate
  const adminStill = await fetch(`${BASE}/api/admin/reports/${primary.id}/pdf`, {
    headers: { Cookie: cookie },
  })
  out.steps.push({ adminPdfAfterRevokeCycle: adminStill.status })

  // Save cookie token for deployment-survival check (hash only marker)
  fs.writeFileSync(
    path.join(__dirname, '..', 'tmp-prod-session-marker.json'),
    JSON.stringify(
      {
        cookiePresent: true,
        tokenPrefix: jar.admin_session.slice(0, 8),
        tokenLen: jar.admin_session.length,
        reportId: primary.id,
        shareUrl: recreated.publicUrl,
        secondUrl,
        at: new Date().toISOString(),
      },
      null,
      2
    )
  )
  // Keep full cookie for follow-up script (local tmp only)
  fs.writeFileSync(
    path.join(__dirname, '..', 'tmp-prod-admin-cookie.txt'),
    jar.admin_session,
    'utf8'
  )

  console.log(JSON.stringify(out, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
