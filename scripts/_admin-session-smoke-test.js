/**
 * Smoke tests for admin session hashing / legacy detection.
 * Run: npx tsx scripts/_admin-session-smoke-test.js
 */
const assert = require('assert')
const {
  sha256Hex,
  isLegacyAdminSessionToken,
  authenticateSessionToken,
} = require('../lib/admin/authVerify.ts')

async function main() {
  const a = await sha256Hex('hello')
  const b = await sha256Hex('hello')
  const c = await sha256Hex('world')
  assert.equal(a, b)
  assert.notEqual(a, c)
  assert.equal(a.length, 64)

  const legacy = Buffer.from('testsecret:1710000000000').toString('base64')
  assert.equal(isLegacyAdminSessionToken(legacy), true)

  const opaque = 'abcdefghijklmnopqrstuvwx_yz0123456789ABCDEF'
  assert.equal(isLegacyAdminSessionToken(opaque), false)

  const missing = await authenticateSessionToken(null)
  assert.equal(missing.ok, false)
  assert.equal(missing.reason, 'missing_cookie')

  const malformed = await authenticateSessionToken('short')
  assert.equal(malformed.ok, false)
  assert.equal(malformed.reason, 'malformed_token')

  const legacyAuth = await authenticateSessionToken(legacy)
  assert.equal(legacyAuth.ok, false)
  assert.equal(legacyAuth.reason, 'malformed_token')

  console.log(
    JSON.stringify({
      ok: true,
      tests: ['sha256', 'legacy-detect', 'opaque-not-legacy', 'missing', 'malformed', 'legacy-auth'],
    })
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
