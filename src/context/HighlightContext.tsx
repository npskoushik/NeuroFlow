// ============================================================
// DESTINATION: src/context/HighlightContext.tsx
// NEW FILE — create src/context/ folder if it doesn't exist
// ============================================================

import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react'

export interface HighlightTarget {
  signals: string[]       // signal names to glow e.g. ['Temperature', 'Pressure']
  components: string[]    // component labels to glow e.g. ['Drive Motor', 'Feed Tank']
  trend: boolean          // glow the trend chart section
  alarms: boolean         // glow the alarm panel
}

interface HighlightContextValue {
  highlight: HighlightTarget
  triggerHighlight: (target: Partial<HighlightTarget>) => void
  isSignalHighlighted: (name: string) => boolean
  isComponentHighlighted: (label: string) => boolean
}

const empty: HighlightTarget = { signals: [], components: [], trend: false, alarms: false }

const HighlightContext = createContext<HighlightContextValue>({
  highlight: empty,
  triggerHighlight: () => {},
  isSignalHighlighted: () => false,
  isComponentHighlighted: () => false,
})

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [highlight, setHighlight] = useState<HighlightTarget>(empty)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerHighlight = useCallback((target: Partial<HighlightTarget>) => {
    // Clear any running timer
    if (timerRef.current) clearTimeout(timerRef.current)

    const next: HighlightTarget = {
      signals: target.signals ?? [],
      components: target.components ?? [],
      trend: target.trend ?? false,
      alarms: target.alarms ?? false,
    }

    setHighlight(next)

    // Auto-clear after 3 blink cycles (each ~600ms → 3 × 600 = 1800ms + buffer)
    timerRef.current = setTimeout(() => {
      setHighlight(empty)
    }, 2200)
  }, [])

  const isSignalHighlighted = useCallback(
    (name: string) => highlight.signals.some(s => name.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(name.toLowerCase())),
    [highlight.signals]
  )

  const isComponentHighlighted = useCallback(
    (label: string) => highlight.components.some(c => label.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(label.toLowerCase())),
    [highlight.components]
  )

  return (
    <HighlightContext.Provider value={{ highlight, triggerHighlight, isSignalHighlighted, isComponentHighlighted }}>
      {children}
    </HighlightContext.Provider>
  )
}

export function useHighlight() {
  return useContext(HighlightContext)
}

// ── Parse AI response text → highlight targets ───────────────
// Called by AIPanel after every AI response
export function parseHighlightTargets(
  aiText: string,
  availableSignals: string[],
  availableComponents: string[]
): Partial<HighlightTarget> | null {
  const text = aiText.toLowerCase()

  const signals: string[] = []
  const components: string[] = []
  let trend = false
  let alarms = false

  // Match signal names
  for (const sig of availableSignals) {
    if (text.includes(sig.toLowerCase())) {
      signals.push(sig)
    }
  }

  // Match component labels
  for (const comp of availableComponents) {
    if (text.includes(comp.toLowerCase())) {
      components.push(comp)
    }
  }

  // Match trend / chart keywords
  if (
    text.includes('trend') ||
    text.includes('chart') ||
    text.includes('graph') ||
    text.includes('history') ||
    text.includes('over time') ||
    text.includes('rising') ||
    text.includes('falling') ||
    text.includes('slope')
  ) {
    trend = true
  }

  // Match alarm keywords
  if (
    text.includes('alarm') ||
    text.includes('alert') ||
    text.includes('critical') ||
    text.includes('warning') ||
    text.includes('fault') ||
    text.includes('trip')
  ) {
    alarms = true
  }

  // Only return if something matched
  if (signals.length || components.length || trend || alarms) {
    return { signals, components, trend, alarms }
  }
  return null
}
