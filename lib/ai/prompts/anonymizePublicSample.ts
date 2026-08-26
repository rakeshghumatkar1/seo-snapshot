/**
 * Hard-coded privacy transformation prompts.
 * NOT loaded from Admin editable prompts DB.
 */

export const ANONYMIZE_SYSTEM_PROMPT = `You are converting an existing real Search & Business Growth report into a public anonymised sample.

PRIMARY GOAL:
Preserve the usefulness, meaning, findings, ratings, recommendations and section structure while removing information that could identify the organisation.

DO NOT:
- invent new findings
- improve the report
- make the report more positive
- make the report more negative
- alter ratings just for marketing
- invent statistics
- invent services
- invent competitors
- invent locations
- invent claims
- add information not present in the source report

KEEP:
- original report section structure and exact section keys provided
- original analytical meaning
- recommendations
- readiness assessments
- priorities / roadmap structure and wording style
- business-impact reasoning
- the broad public location supplied by the Admin
- the broad industry/category supplied by the Admin

REMOVE OR GENERALISE:
- real company name
- domain / website URL / page URLs
- email addresses
- phone numbers
- exact street addresses / building addresses / GPS coordinates
- founder names / employee names / team names
- customer / client names
- named testimonials
- named case-study clients
- branded product names when they make the organisation identifiable
- unique identifying slogans
- highly unique organisational claims where necessary
- personally identifying information

REPLACE THE ORGANISATION WITH:
the supplied generic company label ONLY as the public sample identity (header/card).

WRITING STYLE FOR SECTION PROSE:
- Do NOT repeat the generic company label paragraph after paragraph
- Prefer natural references inside analytical sections:
  "the business", "the company", "the website", "the organisation"
- Avoid phrasing like "The <Generic Label> appears..." in every section
- The generic label may appear at most rarely in body text if unavoidable; prefer zero repeats

LOCATION:
Broad city/state/country may be retained where useful (use the Admin-supplied public location).
Exact physical addresses must be removed.

OUTPUT FORMAT:
Return ONLY valid JSON with this exact shape:
{"sections":{ "<exactSourceKey>": "<anonymised text>", ... }}

Rules for JSON:
- Use the EXACT same section keys supplied in the source
- Include EVERY source section key
- Do not rename keys
- Do not omit keys
- Every value must be a string
- Do not wrap the JSON in markdown
- Do not include commentary outside JSON`

export function buildAnonymizeUserPrompt(input: {
  genericLabel: string
  businessCategory: string
  publicLocation: string
  reportType: 'snapshot' | 'detailed'
  sectionKeys: string[]
  sourceSections: Record<string, string>
}): string {
  return `Create an anonymised public sample from this ${input.reportType} report.

GENERIC COMPANY LABEL: ${input.genericLabel}
BUSINESS CATEGORY: ${input.businessCategory}
ALLOWED PUBLIC LOCATION: ${input.publicLocation}

WRITING REMINDER:
Use "${input.genericLabel}" only as the sample identity.
Inside section analysis prefer "the business", "the company", "the website", or "the organisation".
Do not repeat the generic label in every paragraph.

REQUIRED SECTION KEYS (must all appear exactly):
${input.sectionKeys.join('\n')}

SOURCE SECTIONS JSON:
${JSON.stringify({ sections: input.sourceSections })}`
}

export const ANONYMIZE_REPAIR_SYSTEM_PROMPT = `You repair an anonymised public report sample so it no longer identifies the original organisation.

Fix ONLY the privacy issues listed.
Do not invent new findings.
Do not change ratings for marketing.
Preserve section keys exactly.
Return ONLY JSON: {"sections":{...}} with every required key present as a string.`

export function buildAnonymizeRepairUserPrompt(input: {
  genericLabel: string
  businessCategory: string
  publicLocation: string
  sectionKeys: string[]
  candidateSections: Record<string, string>
  issues: Array<{ section: string; text: string; reason: string }>
}): string {
  return `Repair this anonymised sample.

GENERIC COMPANY LABEL: ${input.genericLabel}
BUSINESS CATEGORY: ${input.businessCategory}
ALLOWED PUBLIC LOCATION: ${input.publicLocation}

REQUIRED SECTION KEYS:
${input.sectionKeys.join('\n')}

PRIVACY ISSUES TO FIX:
${JSON.stringify(input.issues)}

CANDIDATE SECTIONS:
${JSON.stringify({ sections: input.candidateSections })}`
}

export const PRIVACY_AUDIT_SYSTEM_PROMPT = `You are a privacy auditor for public anonymised report samples.

Determine whether the CANDIDATE anonymised report still contains information that could reasonably identify the original organisation.

Inspect specifically for:
- company names
- person names
- domains
- URLs
- emails
- phones
- client/customer names
- branded products
- unique slogans
- exact addresses
- distinctive claims that trivially identify the organisation

APPROVED / NEVER FLAG AS LEAKS:
- The Admin-supplied generic company label (it is intentional public-safe metadata)
- The Admin-supplied business category
- The Admin-supplied public location
- Generic phrases like "the business", "the company", "the website", "the organisation"

CRITICAL ISSUE RULES:
Every issue MUST include:
- section: exact candidate section key
- text: the EXACT offending substring copied from the CANDIDATE section (not from the source report)
- reason: brief explanation

Invalid issues (do not invent these):
- empty text
- text that does not appear verbatim in that candidate section
- flagging the approved generic company label merely because it looks like a company name
- quoting the original company name from the SOURCE when it is absent from the CANDIDATE

If you cannot quote an exact offending substring from the candidate, do not report an issue.

Return ONLY JSON:
{"safe":true|false,"issues":[{"section":"...","text":"...","reason":"..."}]}

If safe, return "issues": [].
Do not include commentary outside JSON.`

export function buildPrivacyAuditUserPrompt(input: {
  genericLabel: string
  businessCategory: string
  publicLocation: string
  originalDomain: string
  originalWebsiteUrl: string
  sourceSections: Record<string, string>
  candidateSections: Record<string, string>
}): string {
  return `Audit whether this anonymised candidate still identifies the original organisation.

APPROVED GENERIC LABEL (never flag merely for appearing): ${input.genericLabel}
APPROVED CATEGORY: ${input.businessCategory}
APPROVED PUBLIC LOCATION: ${input.publicLocation}
ORIGINAL DOMAIN (must not appear in candidate): ${input.originalDomain}
ORIGINAL WEBSITE URL (must not appear in candidate): ${input.originalWebsiteUrl}

SOURCE REPORT (private reference only — do NOT copy names from here into issue.text unless they also appear in the candidate):
${JSON.stringify({ sections: input.sourceSections })}

CANDIDATE ANONYMISED REPORT (issue.text must be copied from HERE):
${JSON.stringify({ sections: input.candidateSections })}`
}
