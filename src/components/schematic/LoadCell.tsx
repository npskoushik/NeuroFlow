import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface LoadCellProps extends SchematicComponentProps {
  weight?: number
  maxWeight?: number
  unit?: string
}

export default function LoadCell({
  status = 'offline',
  weight = 0,
  maxWeight = 1000,
  unit = 'kg',
  x = 0,
  y = 0,
  scale = 1,
  label = 'LOAD CELL',
  className = '',
  ...rest
}: LoadCellProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const pct = Math.min(1, Math.max(0, weight / Math.max(maxWeight, 1)))
  const barW = pct * 72

  // Deformation amount (visual flex under load)
  const deflection = pct * 4

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-loadcell ${className}`} {...rest}>
      <defs>
        <filter id={`lc-glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Mounting frame */}
      <rect x="-46" y="-50" width="92" height="18" rx="4"
        fill="#1F2A44" stroke="#334155" strokeWidth="2" />

      {/* Beam (bending under load) */}
      <path
        d={`M-40 -32 Q0 ${-32 + deflection} 40 -32`}
        fill="none" stroke={tone.accent} strokeWidth="5" strokeLinecap="round"
        style={{ filter: active ? `url(#lc-glow-${id})` : undefined }} />

      {/* Strain gauge indicator on beam */}
      <rect x="-10" y={-38 + deflection / 2} width="20" height="8" rx="2"
        fill="#0D1421" stroke={tone.accent} strokeWidth="1.5" />
      {/* Strain gauge grid lines */}
      {[-6, -2, 2, 6].map(xx => (
        <line key={xx} x1={xx} y1={-37 + deflection / 2} x2={xx} y2={-31 + deflection / 2}
          stroke={tone.accent} strokeWidth="0.8" opacity="0.7" />
      ))}

      {/* Platform / load surface */}
      <rect x="-44" y={-18 + deflection} width="88" height="14" rx="4"
        fill="#0D1421" stroke={tone.accent} strokeWidth="2" />

      {/* Load visual — boxes stacked */}
      {pct > 0.1 && (
        <rect x="-20" y={-34 + deflection} width="40" height={20 * pct} rx="2"
          fill={tone.accentSoft} stroke={tone.accent} strokeWidth="1.5"
          opacity={active ? 0.7 : 0.3} />
      )}

      {/* Base */}
      <rect x="-46" y="0" width="92" height="10" rx="3"
        fill="#1F2A44" stroke="#334155" strokeWidth="1.5" />

      {/* Support legs */}
      <line x1="-34" y1="-32" x2="-34" y2="0" stroke="#334155" strokeWidth="4" />
      <line x1="34"  y1="-32" x2="34"  y2="0" stroke="#334155" strokeWidth="4" />

      {/* Weight display */}
      <rect x="-38" y="14" width="76" height="28" rx="4"
        fill="#030810" stroke="#263349" strokeWidth="1.5" />
      <text x="0" y="26" textAnchor="middle" fontSize="8" fill={tone.muted} fontFamily="monospace">
        WEIGHT
      </text>
      <text x="0" y="38" textAnchor="middle" fontSize="11" fill={tone.accent} fontFamily="monospace" fontWeight="bold">
        {displayNumber(weight)} {unit}
      </text>

      {/* Bar indicator */}
      <rect x="-36" y="46" width="72" height="6" rx="3" fill="#0D1421" stroke="#263349" strokeWidth="1" />
      <rect x="-36" y="46" width={barW} height="6" rx="3"
        fill={pct > 0.9 ? '#FF3B3B' : pct > 0.7 ? '#FFB800' : tone.accent}
        opacity={active ? 0.9 : 0.4} />

      <text x="0" y="-64" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="60" textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
        max {displayNumber(maxWeight)} {unit}
      </text>
    </g>
  )
}
