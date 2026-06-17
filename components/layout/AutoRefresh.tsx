'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  intervalMs?: number
}

export default function AutoRefresh({ intervalMs = 5000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    // Perform router refresh
    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }

    const interval = setInterval(handleRefresh, intervalMs)

    return () => {
      clearInterval(interval)
    }
  }, [router, intervalMs])

  return null
}
