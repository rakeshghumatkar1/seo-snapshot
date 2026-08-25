import SampleReportView from '@/components/public/SampleReportView'

export const dynamic = 'force-dynamic'

export default function SampleReportPage({
  params,
}: {
  params: { slug: string }
}) {
  const slug = decodeURIComponent(params.slug || '').trim()
  return <SampleReportView slug={slug} />
}
