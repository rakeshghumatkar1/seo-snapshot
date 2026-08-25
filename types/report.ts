import type { DetailedSectionsV3, SnapshotSectionsV3 } from './reportV3'

/** Legacy V2 Snapshot shape — keep for archived report rendering only */
export interface SnapshotSectionsV2 {
  introduction: string
  whySeoMatters: string
  firstImpression: string
  contentVisibility: string
  competitorPresence: string
  keywordOpportunities: string
  technicalObservations: string
  whatCanBeImproved: string
  nextSteps: string
  conclusion: string
}

/** Legacy V2 Detailed shape — keep for archived report rendering only */
export interface DetailedSectionsV2 {
  introduction: string
  whySeoMatters: string
  websitePositioning: string
  contentStrategy: string
  competitorLandscape: string
  keywordDirection: string
  technicalSignals: string
  authorityTrust: string
  seoRoadmap: string
  detailedRecommendations: string
  nextSteps: string
  conclusion: string
}

/** Active Snapshot sections (V3) */
export type SnapshotSections = SnapshotSectionsV3

/** Active Detailed sections (V3) */
export type DetailedSections = DetailedSectionsV3

export type ReportSections =
  | SnapshotSectionsV3
  | DetailedSectionsV3
  | SnapshotSectionsV2
  | DetailedSectionsV2

export interface ReportResponse {
  type: 'snapshot' | 'detailed'
  websiteUrl: string
  sections: ReportSections
  reportVersion?: 2 | 3
}

export function isSnapshotV3Sections(sections: Record<string, unknown>): boolean {
  return typeof sections.businessCustomerUnderstanding === 'string'
}

export function isDetailedV3Sections(sections: Record<string, unknown>): boolean {
  return typeof sections.executiveBusinessAssessment === 'string'
}

export function detectReportVersion(
  sections: Record<string, unknown>,
  explicit?: number
): 2 | 3 {
  if (explicit === 3 || explicit === 2) return explicit
  if (isSnapshotV3Sections(sections) || isDetailedV3Sections(sections)) return 3
  return 2
}
