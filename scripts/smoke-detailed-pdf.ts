import fs from 'fs'
import path from 'path'
import { buildCanonicalReportPdf } from '../lib/pdf/buildCanonicalReportPdf'
import { DETAILED_SECTION_MARKERS_V3 } from '../lib/ai/parseReportV3'

const keys = [
  'executiveBusinessAssessment',
  'searchAsGrowthChannel',
  'customerIntentDiscovery',
  'positioningOfferClarity',
  'commercialPageReadiness',
  'contentInformationAssets',
  'authorityReputationTrust',
  'traditionalSearchReadiness',
  'aiDiscoveryReadiness',
  'localSearchReadiness',
  'competitiveSearchEvidence',
  'conversionEnquiryReadiness',
  'measurementLimitations',
  'priorityInvestmentPlan',
  'actionRoadmap',
  'evidenceLimitations',
]

const sections: Record<string, unknown> = { reportVersion: 3 }
for (const key of keys) {
  if (key === 'priorityInvestmentPlan') {
    sections[key] =
      '1. Enhance service page clarity for AI automation offers (Business Impact: HIGH, Confidence: HIGH, Effort: MEDIUM, Timing: NOW)\n2. Strengthen local SEO signals for Pune-based demand (Business Impact: MEDIUM, Confidence: MEDIUM, Effort: MEDIUM, Timing: NEXT)\n3. Expand evaluate-stage content for decision makers (Business Impact: HIGH, Confidence: MEDIUM, Effort: HIGH, Timing: LATER)'
  } else if (key === 'actionRoadmap') {
    sections[key] =
      'FOUNDATION: Improve commercial page clarity and enquiry path consistency.\nGROWTH: Build intent-led assets for priority services.\nMONITOR & IMPROVE: Track enquiry quality and refresh proof points quarterly.'
  } else {
    sections[key] =
      'Placeholder business-facing assessment grounded in analysed public pages. External rankings and traffic remain Not Verified.'
  }
}

async function main() {
  const out = await buildCanonicalReportPdf({
    websiteUrl: 'https://www.thinkbigdigital.co',
    reportType: 'detailed',
    sections,
    reportVersion: 3,
  })
  const file = path.join(process.cwd(), 'tmp-detailed-smoke.pdf')
  fs.writeFileSync(file, out.bytes)
  console.log(
    JSON.stringify({
      file,
      bytes: out.bytes.length,
      filename: out.filename,
      startsWithPdf: out.bytes.slice(0, 4).toString() === '%PDF',
      markers: DETAILED_SECTION_MARKERS_V3.length,
    })
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
