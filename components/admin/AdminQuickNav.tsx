'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminQuickNav() {
  const pathname = usePathname()

  if (!pathname.startsWith('/admin/dashboard')) return null

  const onLeadManager = pathname.startsWith('/admin/dashboard/leads')

  return (
    <div
      style={{
        position: 'fixed',
        top: '14px',
        right: '18px',
        zIndex: 150,
        display: 'flex',
        gap: '6px',
        padding: '5px',
        borderRadius: '10px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(7,10,18,0.88)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.24)',
      }}
    >
      <Link
        href="/admin/dashboard"
        style={{
          padding: '6px 11px',
          borderRadius: '7px',
          textDecoration: 'none',
          fontSize: '11px',
          fontWeight: 700,
          color: !onLeadManager ? '#34d399' : 'var(--t-300)',
          background: !onLeadManager ? 'rgba(16,185,129,0.12)' : 'transparent',
        }}
      >
        Overview
      </Link>
      <Link
        href="/admin/dashboard/leads"
        style={{
          padding: '6px 11px',
          borderRadius: '7px',
          textDecoration: 'none',
          fontSize: '11px',
          fontWeight: 700,
          color: onLeadManager ? '#34d399' : 'var(--t-300)',
          background: onLeadManager ? 'rgba(16,185,129,0.12)' : 'transparent',
        }}
      >
        Lead Manager
      </Link>
    </div>
  )
}
