'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const WORK_LINKS = [
  { href: '/admin/dashboard', label: 'Overview', exact: true },
  { href: '/admin/dashboard/leads', label: 'Leads' },
  { href: '/admin/dashboard/reports', label: 'Reports' },
] as const

const TOOL_LINKS = [
  { href: '/admin/dashboard/ratings', label: 'Ratings' },
  { href: '/admin/dashboard/rate-limits', label: 'Rate Limits' },
  { href: '/admin/dashboard/prompts', label: 'Prompt Editor' },
] as const

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminSidebar() {
  const pathname = usePathname() || ''

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin'
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="badge badge-emerald" style={{ marginBottom: '10px', fontSize: '10px' }}>
          ADMIN PANEL
        </div>
        <div className="admin-sidebar-title">
          SEO Tool
          <br />
          Dashboard
        </div>
      </div>

      <div className="admin-sidebar-divider" />

      <nav className="admin-sidebar-nav">
        <div className="admin-sidebar-group-label">Work</div>
        {WORK_LINKS.map((item) => {
          const active = isActive(pathname, item.href, 'exact' in item ? item.exact : false)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link${active ? ' is-active' : ''}`}
            >
              {item.label}
            </Link>
          )
        })}

        <div className="admin-sidebar-group-label admin-sidebar-group-label-tools">Tools</div>
        {TOOL_LINKS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link admin-sidebar-link-tool${active ? ' is-active' : ''}`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-divider" />
        <button type="button" className="btn btn-ghost admin-sidebar-logout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
