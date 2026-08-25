import AdminQuickNav from '@/components/admin/AdminQuickNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <AdminQuickNav />
      {children}
    </div>
  )
}
