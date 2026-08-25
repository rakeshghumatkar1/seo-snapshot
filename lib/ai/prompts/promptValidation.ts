import {
  DETAILED_V3_DB_MARKERS,
  SNAPSHOT_V3_DB_MARKERS,
} from '@/types/reportV3'

export function isValidSnapshotV3Prompt(content: string): boolean {
  const text = content || ''
  return SNAPSHOT_V3_DB_MARKERS.every(marker => text.includes(marker))
}

export function isValidDetailedV3Prompt(content: string): boolean {
  const text = content || ''
  return DETAILED_V3_DB_MARKERS.every(marker => text.includes(marker))
}
