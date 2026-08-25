import { Suspense } from 'react'

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
