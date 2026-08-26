import AdminQuickNav from '@/components/admin/AdminQuickNav'
import AdminSessionKeeper from '@/components/admin/AdminSessionKeeper'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-shell">
      <AdminQuickNav />
      <AdminSessionKeeper />
      {children}
    </div>
  )
}
