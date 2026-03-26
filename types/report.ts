export interface SnapshotSections {
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

export interface DetailedSections {
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

export type ReportSections = SnapshotSections | DetailedSections

export interface ReportResponse {
  type: 'snapshot' | 'detailed'
  websiteUrl: string
  sections: ReportSections
}
