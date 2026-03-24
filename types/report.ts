export interface SnapshotSections {
  introduction: string
  whySeoMatters: string
  currentVisibility: string
  contentAuthority: string
  technicalStructure: string
  opportunities: string
  nextSteps: string
}

export interface DetailedSections extends SnapshotSections {
  currentPositioning: string
  technicalReview: string
  competitorPresence: string
  keywordDirection: string
  contentStrategy: string
  roadmap: string
  conclusion: string
}

export interface ReportResponse {
  type: 'snapshot' | 'detailed'
  websiteUrl: string
  sections: SnapshotSections | DetailedSections
}
