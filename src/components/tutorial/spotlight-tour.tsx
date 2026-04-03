'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TourStep } from './tour-definitions'

interface SpotlightTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
}

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 8

function getClipPath(rect: TargetRect): string {
  const top = rect.top - PADDING
  const left = rect.left - PADDING
  const right = rect.left + rect.width + PADDING
  const bottom = rect.top + rect.height + PADDING

  return `polygon(
    0% 0%, 0% 100%, ${left}px 100%, ${left}px ${top}px,
    ${right}px ${top}px, ${right}px ${bottom}px,
    ${left}px ${bottom}px, ${left}px 100%, 100% 100%, 100% 0%
  )`
}

function getTooltipPosition(
  rect: TargetRect,
  placement: 'top' | 'bottom' | 'left' | 'right'
): { top: number; left: number } {
  const gap = 12

  switch (placement) {
    case 'top':
      return {
        top: rect.top - PADDING - gap,
        left: rect.left + rect.width / 2,
      }
    case 'bottom':
      return {
        top: rect.top + rect.height + PADDING + gap,
        left: rect.left + rect.width / 2,
      }
    case 'left':
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - PADDING - gap,
      }
    case 'right':
      return {
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width + PADDING + gap,
      }
  }
}

function getTooltipTransform(
  placement: 'top' | 'bottom' | 'left' | 'right'
): string {
  switch (placement) {
    case 'top':
      return 'translate(-50%, -100%)'
    case 'bottom':
      return 'translate(-50%, 0)'
    case 'left':
      return 'translate(-100%, -50%)'
    case 'right':
      return 'translate(0, -50%)'
  }
}

export function SpotlightTour({ steps, onComplete, onSkip }: SpotlightTourProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const findValidStep = useCallback(
    (startIndex: number, direction: 1 | -1): number => {
      let idx = startIndex
      while (idx >= 0 && idx < steps.length) {
        const el = document.querySelector(steps[idx].selector)
        if (el) return idx
        idx += direction
      }
      return -1
    },
    [steps]
  )

  const measureTarget = useCallback(
    (index: number) => {
      if (index < 0 || index >= steps.length) {
        setTargetRect(null)
        return
      }
      const el = document.querySelector(steps[index].selector)
      if (!el) {
        setTargetRect(null)
        return
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Small delay to let scroll settle before measuring
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
      })
    },
    [steps]
  )

  // On mount: find the first valid step
  useEffect(() => {
    const validIndex = findValidStep(0, 1)
    if (validIndex === -1) {
      onComplete()
      return
    }
    setCurrentIndex(validIndex)
    measureTarget(validIndex)
  }, [findValidStep, measureTarget, onComplete])

  // Re-measure on resize
  useEffect(() => {
    function handleResize() {
      measureTarget(currentIndex)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentIndex, measureTarget])

  const goToStep = useCallback(
    (direction: 1 | -1) => {
      const nextIndex = findValidStep(currentIndex + direction, direction)
      if (nextIndex === -1) {
        onComplete()
        return
      }
      setCurrentIndex(nextIndex)
      measureTarget(nextIndex)
    },
    [currentIndex, findValidStep, measureTarget, onComplete]
  )

  const handleNext = useCallback(() => {
    if (currentIndex >= steps.length - 1) {
      onComplete()
      return
    }
    goToStep(1)
  }, [currentIndex, steps.length, onComplete, goToStep])

  const handleBack = useCallback(() => {
    goToStep(-1)
  }, [goToStep])

  const step = steps[currentIndex]
  if (!step || !targetRect) return null

  const placement = step.placement ?? 'bottom'
  const tooltipPos = getTooltipPosition(targetRect, placement)
  const tooltipTransform = getTooltipTransform(placement)
  const isLastStep = findValidStep(currentIndex + 1, 1) === -1
  const isFirstStep = findValidStep(currentIndex - 1, -1) === -1

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop with cutout */}
      <div
        className="absolute inset-0 transition-[clip-path] duration-300 ease-in-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          clipPath: getClipPath(targetRect),
        }}
        onClick={onSkip}
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute z-[10000] w-80 max-w-xs rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-900"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transform: tooltipTransform,
        }}
      >
        <p className="mb-1 text-xs text-muted-foreground">
          Step {currentIndex + 1} of {steps.length}
        </p>
        <h3 className="mb-1 font-semibold">{step.title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {step.description}
        </p>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip
          </Button>
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
