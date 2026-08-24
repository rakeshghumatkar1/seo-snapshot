export interface LeadPayload {
  email: string
  name?: string
  company?: string
  websiteUrl: string
  actionType: 'pdf' | 'detailed'
}
