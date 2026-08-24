import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/schema'
import { defaultFeatureConfig } from '@/lib/config'

export async function GET() {
  try {
    const config = await getConfig()
    return NextResponse.json(config)
  } catch (err: any) {
    console.error('[Config] Failed to load feature flags:', err?.message)
    return NextResponse.json(defaultFeatureConfig)
  }
}
