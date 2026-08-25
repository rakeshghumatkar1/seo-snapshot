'use client'

import Link from 'next/link'
import ReportHeader from '@/components/report/ReportHeader'
import ReportSection from '@/components/report/ReportSection'
import ReportFooter from '@/components/report/ReportFooter'
import CTABlock from '@/components/report/CTABlock'
import ServiceHelpCTA from '@/components/public/ServiceHelpCTA'
import {
  getSectionLabel,
  iterableSectionEntries,
} from '@/lib/report/sectionLabels'
import { formatSectionNumber, isEmphasizedSection } from '@/lib/report/presentation'
import { detectReportVersion } from '@/types/report'

export type SampleReportDocumentData = {
  displayName: string
  domain: string | null
  showDomain: boolean
  businessCategory: string | null
  publicLocation?: string | null
  reportType: 'snapshot' | 'detailed'
  reportVersion: 2 | 3
  generatedAt: string | null
  sections: Record<string, string>
  isAnonymizedSample?: boolean
}

export default function SampleReportDocument({
  data,
  hidePublicCta = false,
}: {
  data: SampleReportDocumentData
  hidePublicCta?: boolean
}) {
  const reportVersion = detectReportVersion(data.sections, data.reportVersion)
  const analysedUrl =
    data.showDomain && data.domain
      ? data.domain.startsWith('http')
        ? data.domain
        : `https://${data.domain}`
      : null

  const metaBits = [data.publicLocation, data.businessCategory].filter(Boolean)

  return (
    <div className="public-page-content report-doc max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
      <ReportHeader
        websiteUrl={analysedUrl || data.displayName}
        reportType={data.reportType}
        generatedAt={data.generatedAt ? new Date(data.generatedAt) : undefined}
        preparedFor={data.displayName}
        analysedUrl={analysedUrl}
        isSample
        sampleDisclosure={data.isAnonymizedSample ? 'REAL REPORT SAMPLE' : undefined}
      />

      {data.isAnonymizedSample ? (
        <p className="report-doc-sample-disclosure">
          Identifying business details have been anonymised.
        </p>
      ) : null}
      {metaBits.length ? (
        <p className="report-doc-sample-category">{metaBits.join(' · ')}</p>
      ) : data.businessCategory ? (
        <p className="report-doc-sample-category">{data.businessCategory}</p>
      ) : null}

      <div className="report-doc-sections">
        {iterableSectionEntries(data.sections, data.reportType, reportVersion).map(
          ([key, value], index) => {
          const label = getSectionLabel(key, data.reportType, reportVersion)
          return (
            <div key={key} className={`fade-up delay-${Math.min(index, 7)}`}>
              <ReportSection
                category={label.category}
                title={label.title}
                content={value}
                sectionNumber={formatSectionNumber(index)}
                emphasized={isEmphasizedSection(key, data.reportType, reportVersion)}
              />
            </div>
          )
        })}
      </div>

      {!hidePublicCta && (
        <div className="report-doc-actions">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center">
            <Link href="/tool" className="btn btn-primary btn-lg w-full sm:w-auto justify-center">
              Generate Your Free Snapshot →
            </Link>
          </div>
          <p className="report-doc-actions-note">
            This is a public sample. Your own report is generated from your website.
          </p>
        </div>
      )}

      <ServiceHelpCTA variant={data.reportType === 'snapshot' ? 'compact' : 'full'} />
      <CTABlock />
      <ReportFooter />
    </div>
  )
}
