/** Public homepage samples must be Detailed Reports only (Snapshot is Step 1 only). */
export const PUBLIC_SAMPLE_DETAILED_ONLY_MESSAGE =
  'Only Detailed Reports can be published as public homepage samples. Snapshot reports cannot be showcased.'

export function isDetailedReportType(reportType: unknown): boolean {
  return String(reportType || '').toLowerCase() === 'detailed'
}
