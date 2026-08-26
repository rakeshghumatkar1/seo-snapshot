'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * On Admin dashboard mounts, refresh the DB-backed session cookie expiry.
 * At most one call per browser tab load of /admin/dashboard*.
 */
export default function AdminSessionKeeper() {
  const pathname = usePathname()
  const ranRef = useRef(false)

  useEffect(() => {
    if (!pathname?.startsWith('/admin/dashboard')) return
    if (ranRef.current) return
    ranRef.current = true

    void fetch('/api/admin/session/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    }).catch(() => {})
  }, [pathname])

  return null
}
