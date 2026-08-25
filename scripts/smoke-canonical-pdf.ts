import fs from 'fs'
import path from 'path'
import { buildCanonicalReportPdf } from '../lib/pdf/buildCanonicalReportPdf'

const sections = {
  reportVersion: 3,
  businessCustomerUnderstanding:
    'Think Big Digital helps businesses grow through AI automation, websites, SEO and digital systems.',
  searchOpportunity:
    'Search can support acquisition when service pages and content match customer intent.',
  websiteOfferClarity: 'Offer clarity is generally strong across core commercial pages.',
  trustReputation: 'On-site trust signals are visible; external reputation is not verified.',
  traditionalSearchReadiness: 'Titles, structure and HTTPS fundamentals appear in place.',
  aiDiscoveryReadiness: 'Preparedness is improving; measured AI visibility is not verified.',
  customerContentOpportunities: 'Durable service and case-study assets can fill remaining gaps.',
  enquiryReadiness: 'Contact paths are visible; conversion rates are not verified.',
  topPriorityActions:
    '1. Strengthen service page clarity for priority offers\n2. Improve trust and proof placement near enquiry points\n3. Expand intent-led content for evaluate-stage buyers',
  limitsNextStep: 'This Snapshot reviews selected public pages only.',
}

async function main() {
  const out = await buildCanonicalReportPdf({
    websiteUrl: 'https://www.thinkbigdigital.co',
    reportType: 'snapshot',
    sections,
    reportVersion: 3,
  })
  const file = path.join(process.cwd(), 'tmp-snapshot-smoke.pdf')
  fs.writeFileSync(file, out.bytes)
  console.log(
    JSON.stringify({
      file,
      bytes: out.bytes.length,
      filename: out.filename,
      startsWithPdf: out.bytes.slice(0, 4).toString() === '%PDF',
    })
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
