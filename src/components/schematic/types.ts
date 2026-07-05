import type { SVGProps } from 'react'

export type SchematicStatus =
  | 'online'
  | 'running'
  | 'ok'
  | 'idle'
  | 'warning'
  | 'critical'
  | 'offline'
  | 'maintenance'
  | (string & {})

export interface SchematicComponentProps extends Omit<SVGProps<SVGGElement>, 'x' | 'y'> {
  status?: SchematicStatus
  x?: number
  y?: number
  scale?: number
  label?: string
}

export interface StatusTone {
  accent: string
  accentSoft: string
  stroke: string
  fill: string
  panel: string
  text: string
  muted: string
  glow: string
}

const baseTone: StatusTone = {
  accent: '#00D4FF',
  accentSoft: 'rgba(0, 212, 255, 0.16)',
  stroke: '#334155',
  fill: '#0D1421',
  panel: '#101827',
  text: '#E6EDF3',
  muted: '#8B949E',
  glow: 'rgba(0, 212, 255, 0.26)',
}

const tones: Record<string, StatusTone> = {
  online: {
    ...baseTone,
    accent: '#00E676',
    accentSoft: 'rgba(0, 230, 118, 0.16)',
    glow: 'rgba(0, 230, 118, 0.34)',
  },
  running: {
    ...baseTone,
    accent: '#00E676',
    accentSoft: 'rgba(0, 230, 118, 0.16)',
    glow: 'rgba(0, 230, 118, 0.34)',
  },
  ok: {
    ...baseTone,
    accent: '#00E676',
    accentSoft: 'rgba(0, 230, 118, 0.16)',
    glow: 'rgba(0, 230, 118, 0.34)',
  },
  warning: {
    ...baseTone,
    accent: '#FFB800',
    accentSoft: 'rgba(255, 184, 0, 0.18)',
    glow: 'rgba(255, 184, 0, 0.3)',
  },
  critical: {
    ...baseTone,
    accent: '#FF3B3B',
    accentSoft: 'rgba(255, 59, 59, 0.18)',
    glow: 'rgba(255, 59, 59, 0.34)',
  },
  offline: {
    ...baseTone,
    accent: '#484F58',
    accentSoft: 'rgba(72, 79, 88, 0.2)',
    glow: 'rgba(72, 79, 88, 0.18)',
  },
  idle: {
    ...baseTone,
    accent: '#448AFF',
    accentSoft: 'rgba(68, 138, 255, 0.16)',
    glow: 'rgba(68, 138, 255, 0.24)',
  },
  maintenance: {
    ...baseTone,
    accent: '#A78BFA',
    accentSoft: 'rgba(167, 139, 250, 0.16)',
    glow: 'rgba(167, 139, 250, 0.28)',
  },
}

export function getStatusTone(status: SchematicStatus = 'offline'): StatusTone {
  return tones[String(status).toLowerCase()] ?? baseTone
}

export function isOperational(status: SchematicStatus = 'offline') {
  const normalized = String(status).toLowerCase()
  return normalized === 'online' || normalized === 'running' || normalized === 'ok'
}

export function isAlert(status: SchematicStatus = 'offline') {
  const normalized = String(status).toLowerCase()
  return normalized === 'warning' || normalized === 'critical'
}

export function place(x = 0, y = 0, scale = 1) {
  return `translate(${x} ${y}) scale(${scale})`
}

export function displayNumber(value: number | undefined, fallback = '--') {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
