import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-workspace">
      <AdminSidebar />
      <div className="admin-workspace-main">{children}</div>
    </div>
  )
}
