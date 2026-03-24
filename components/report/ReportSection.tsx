interface ReportSectionProps {
  title: string;
  category: string;
  content: string;
}

export default function ReportSection({ title, category, content }: ReportSectionProps) {
  return (
    <div className="glass p-8 mb-4">
      <div className="accent-bar">
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: 'var(--t-400)',
            marginBottom: '4px',
          }}
        >
          {category}
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--t-100)',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>
      </div>
      <div
        className="mt-5"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
          color: 'var(--t-200)',
          lineHeight: 1.8,
          whiteSpace: 'pre-line' as const,
        }}
      >
        {content}
      </div>
    </div>
  );
}
