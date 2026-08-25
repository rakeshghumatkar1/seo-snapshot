'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Keeps the existing admin sidebar as the single source of navigation.
 * On the dashboard, clicking the existing "Leads" button opens the
 * full lead-management page instead of the legacy read-only table.
 */
export default function AdminQuickNav() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname !== '/admin/dashboard') return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button')
      if (!button || button.textContent?.trim() !== 'Leads') return

      event.preventDefault()
      event.stopPropagation()
      router.push('/admin/dashboard/leads')
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname, router])

  return null
}
