import AdminQuickNav from '@/components/admin/AdminQuickNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-shell">
      <AdminQuickNav />
      {children}
    </div>
  )
}
