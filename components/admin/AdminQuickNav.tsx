'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Keeps the existing admin sidebar as the single source of navigation.
 * On the dashboard, Leads and Reports open their full management pages
 * instead of the legacy read-only tables.
 */
export default function AdminQuickNav() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname !== '/admin/dashboard') return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button')
      const label = button?.textContent?.trim()
      if (!button || (label !== 'Leads' && label !== 'Reports')) return

      event.preventDefault()
      event.stopPropagation()
      router.push(label === 'Leads' ? '/admin/dashboard/leads' : '/admin/dashboard/reports')
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname, router])

  return null
}
