import { splitReportContent } from '@/lib/report/presentation'

interface ReportSectionProps {
  title: string
  category: string
  content: string
  sectionNumber?: string
  emphasized?: boolean
}

export default function ReportSection({
  title,
  category,
  content,
  sectionNumber,
  emphasized = false,
}: ReportSectionProps) {
  const blocks = splitReportContent(content)

  return (
    <section
      className={`report-section${emphasized ? ' report-section-emphasis' : ''}`}
      aria-labelledby={sectionNumber ? `report-section-${sectionNumber}` : undefined}
    >
      <header className="report-section-head">
        {sectionNumber ? (
          <span className="report-section-number" aria-hidden="true">
            {sectionNumber}
          </span>
        ) : null}
        <div className="report-section-titles">
          <p className="report-section-category">{category}</p>
          <h2
            id={sectionNumber ? `report-section-${sectionNumber}` : undefined}
            className="report-section-title"
          >
            {title}
          </h2>
        </div>
      </header>

      <div className="report-section-body">
        {blocks.map((block, index) => {
          if (block.type === 'stage') {
            return (
              <div key={`stage-${index}`} className="report-stage">
                <p className="report-stage-label">{block.label}</p>
                {block.text ? <p className="report-stage-text">{block.text}</p> : null}
              </div>
            )
          }

          if (block.type === 'priority') {
            return (
              <div key={`priority-${index}`} className="report-priority">
                <p className="report-priority-label">Priority {block.index}</p>
                <p className="report-priority-text">{block.text}</p>
              </div>
            )
          }

          return (
            <p key={`p-${index}`} className="report-paragraph">
              {block.text}
            </p>
          )
        })}
      </div>
    </section>
  )
}
