'use client'

import { useEffect, useState } from 'react'
import { SpotlightTour } from './spotlight-tour'
import { getTourSteps } from './tour-definitions'
import type { UserRole } from '@/lib/types/database'

export function TourProvider({ role, userId }: { role: UserRole; userId: string }) {
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    const key = `tour_seen_${userId}`
    if (!localStorage.getItem(key)) {
      const timer = setTimeout(() => setShowTour(true), 800)
      return () => clearTimeout(timer)
    }
  }, [userId])

  if (!showTour) return null

  return (
    <SpotlightTour
      steps={getTourSteps(role)}
      onComplete={() => {
        localStorage.setItem(`tour_seen_${userId}`, 'true')
        setShowTour(false)
      }}
      onSkip={() => {
        localStorage.setItem(`tour_seen_${userId}`, 'true')
        setShowTour(false)
      }}
    />
  )
}
