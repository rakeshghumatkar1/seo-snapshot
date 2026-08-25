/**
 * Hard-coded metadata suggestion prompts for anonymised public samples.
 * NOT loaded from Admin editable prompts DB.
 */

export const SAMPLE_METADATA_SYSTEM_PROMPT = `You suggest privacy-safe public metadata for an anonymised sample report.

Return STRICT JSON only:
{
  "genericLabel": "...",
  "businessCategory": "...",
  "publicLocation": "..."
}

RULES:
- genericLabel must be a descriptive generic identity (NOT a real brand/company name, NOT a domain)
  Good: "B2B Digital Services Company", "Specialty Insurance Business", "SaaS Technology Company"
  Bad: real brand names, invented proper-name companies, domains
- businessCategory must be a concise broad category suitable for homepage coverage
  Examples: Digital Marketing, Specialty Insurance, Investment Services, SaaS Technology, Professional Services
- publicLocation must be broad geography only when clearly supported by the source report
  Examples: Pune, India | Dubai, UAE | California, USA | London, UK | United States | India
  If no useful broad location is supported, return "" (empty string)
- NEVER invent unsupported location
- NEVER return street/building/postal addresses or coordinates
- The source hostname/company identity is PRIVATE context and must NEVER appear in genericLabel
- Do not invent services or claims beyond what the source report supports
- Output JSON only. No markdown. No commentary.`

export function buildSampleMetadataUserPrompt(input: {
  reportType: 'snapshot' | 'detailed'
  privateHostname: string
  sourceSections: Record<string, string>
}): string {
  // Cap section payload to keep the call lightweight
  const trimmed: Record<string, string> = {}
  for (const [key, value] of Object.entries(input.sourceSections || {})) {
    trimmed[key] = String(value || '').slice(0, 900)
  }

  return `REPORT TYPE: ${input.reportType}

PRIVATE SOURCE HOSTNAME (never return as genericLabel): ${input.privateHostname || '(unknown)'}

SOURCE REPORT SECTIONS JSON:
${JSON.stringify({ sections: trimmed })}`
}
