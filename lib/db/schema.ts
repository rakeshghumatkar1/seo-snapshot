import { dbQuery } from './client'

export async function setupDatabase() {
  try {
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        company VARCHAR(255),
        website_url TEXT NOT NULL,
        requested_report_type VARCHAR(50) NOT NULL DEFAULT 'snapshot',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        website_url TEXT NOT NULL,
        report_type VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        sections_json JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        website_url TEXT NOT NULL,
        email VARCHAR(255),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS config (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await dbQuery(`
      INSERT INTO config (key, value) VALUES
        ('enableDetailedReport', 'true'),
        ('enablePDFDownload', 'true'),
        ('enableRating', 'true'),
        ('requireEmailForDetailed', 'true'),
        ('requireEmailForPDF', 'true')
      ON CONFLICT (key) DO NOTHING
    `)

    console.log('[DB] Schema ready')
    return { success: true }
  } catch (err: any) {
    console.error('[DB] Setup failed:', err?.message)
    return { success: false, error: err?.message }
  }
}

export async function insertLead({
  email,
  name,
  company,
  websiteUrl,
  requestedReportType,
}: {
  email: string
  name?: string
  company?: string
  websiteUrl: string
  requestedReportType: string
}) {
  try {
    await dbQuery(
      `INSERT INTO leads (email, name, company, website_url, requested_report_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        email.toLowerCase().trim(),
        name?.trim() || null,
        company?.trim() || null,
        websiteUrl,
        requestedReportType,
      ]
    )
    console.log('[DB] Lead saved:', email)
    return { success: true }
  } catch (err: any) {
    console.error('[DB] Lead insert failed:', err?.message)
    return { success: false }
  }
}

export async function insertRating({
  websiteUrl,
  email,
  rating,
  comment,
}: {
  websiteUrl: string
  email?: string
  rating: number
  comment?: string
}) {
  try {
    await dbQuery(
      `INSERT INTO ratings (website_url, email, rating, comment)
       VALUES ($1, $2, $3, $4)`,
      [
        websiteUrl,
        email?.toLowerCase().trim() || null,
        Number(rating),
        comment?.trim() || null,
      ]
    )
    console.log('[DB] Rating saved:', rating)
    return { success: true }
  } catch (err: any) {
    console.error('[DB] Rating insert failed:', err?.message)
    return { success: false }
  }
}

export async function getConfig(): Promise<Record<string, boolean>> {
  const defaults: Record<string, boolean> = {
    enableDetailedReport: true,
    enablePDFDownload: true,
    enableRating: true,
    requireEmailForDetailed: true,
    requireEmailForPDF: true,
  }

  try {
    const rows = await dbQuery(`SELECT key, value FROM config`)
    if (!rows.length) return defaults

    const config: Record<string, boolean> = {}
    for (const row of rows) {
      config[row.key] = row.value === 'true'
    }
    return { ...defaults, ...config }
  } catch (err) {
    console.error('[DB] Config fetch failed')
    return defaults
  }
}
