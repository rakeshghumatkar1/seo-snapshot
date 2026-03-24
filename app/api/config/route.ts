import { NextResponse } from 'next/server';
import { defaultFeatureConfig } from '@/lib/config';

export async function GET() {
  return NextResponse.json(defaultFeatureConfig);
}
