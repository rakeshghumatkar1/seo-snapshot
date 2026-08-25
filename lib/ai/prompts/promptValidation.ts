export function isValidSnapshotV3Prompt(content: string): boolean {
  const text = content || ''
  return [
    'BUSINESS_CUSTOMER_UNDERSTANDING:',
    'SEARCH_OPPORTUNITY:',
    'AI_DISCOVERY_READINESS:',
    'TOP_PRIORITY_ACTIONS:',
  ].every(marker => text.includes(marker))
}

export function isValidDetailedV3Prompt(content: string): boolean {
  const text = content || ''
  return [
    'EXECUTIVE_BUSINESS_ASSESSMENT:',
    'SEARCH_AS_GROWTH_CHANNEL:',
    'AI_DISCOVERY_READINESS:',
    'PRIORITY_INVESTMENT_PLAN:',
    'ACTION_ROADMAP:',
  ].every(marker => text.includes(marker))
}
