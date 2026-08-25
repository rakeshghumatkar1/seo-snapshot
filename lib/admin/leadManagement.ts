import { dbQuery } from '@/lib/db/client'

let schemaPromise: Promise<void> | null = null

/**
 * Adds the admin-only lead classification field used by the lead manager.
 * The migration is idempotent and runs only from authenticated admin routes.
 */
export async function ensureLeadManagementSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await dbQuery(`
        ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE
      `)

      await dbQuery(`
        CREATE INDEX IF NOT EXISTS idx_leads_is_test_created_at
        ON leads (is_test, created_at DESC)
      `)
    })().catch(err => {
      schemaPromise = null
      throw err
    })
  }

  return schemaPromise
}
