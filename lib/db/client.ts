import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set — DB features disabled')
}

export const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null

export async function dbQuery(
  query: string,
  params: any[] = []
): Promise<any[]> {
  if (!sql) {
    console.warn('[DB] DATABASE_URL is not configured — skipping query')
    return []
  }
  try {
    const result = await sql(query, params)
    return result as any[]
  } catch (err: any) {
    console.error('[DB Error]', err?.message)
    throw err
  }
}
