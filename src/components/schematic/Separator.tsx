import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface SeparatorProps extends SchematicComponentProps {
  pressure?: number
  level?: number
}

export default function Separator({
  status = 'offline',
  pressure = 0,
  level = 30,
  x = 0,
  y = 0,
  scale = 1,
  label = 'SEP',
  className = '',
  ...rest
}: SeparatorProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const clampedLevel = Math.min(100, Math.max(0, level))

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-separator ${className}`} {...rest}>
      <defs>
        <linearGradient id={`sep-body-${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#1F2A44" />
          <stop offset="100%" stopColor="#0B1020" />
        </linearGradient>
      </defs>

      {/* Cylindrical body */}
      <rect x="-32" y="-72" width="64" height="100" rx="8"
        fill={`url(#sep-body-${id})`} stroke={tone.accent} strokeWidth="2.5" />

      {/* Conical bottom */}
      <path d="M-32 28L0 72L32 28Z"
        fill={`url(#sep-body-${id})`} stroke={tone.accent} strokeWidth="2.5" />

      {/* Liquid level in cone */}
      {clampedLevel > 0 && (
        <clipPath id={`sep-clip-${id}`}>
          <path d="M-32 28L0 72L32 28Z" />
        </clipPath>
      )}
      <rect x="-32" y={72 - (44 * clampedLevel / 100)} width="64" height={44 * clampedLevel / 100}
        fill={tone.accent} opacity={active ? 0.5 : 0.2}
        clipPath={`url(#sep-clip-${id})`} />

      {/* Tangential inlet */}
      <path d="M32 -50H60" stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />
      <text x="66" y="-47" fontSize="7" fill={tone.muted} fontFamily="monospace">IN</text>

      {/* Gas outlet top */}
      <path d="M0 -72V-96" stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />
      <text x="8" y="-88" fontSize="7" fill={tone.muted} fontFamily="monospace">GAS</text>

      {/* Liquid outlet bottom */}
      <path d="M0 72V96" stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />
      <text x="8" y="90" fontSize="7" fill={tone.muted} fontFamily="monospace">LIQ</text>

      {/* Swirl animation */}
      {active && (
        <g opacity="0.5">
          <circle r="18" fill="none" stroke={tone.accent} strokeWidth="1.5" strokeDasharray="6 4"
            cx="0" cy="-22">
            <animateTransform attributeName="transform" type="rotate"
              from="0 0 -22" to="360 0 -22" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Pressure indicator */}
      <rect x="-28" y="-68" width="56" height="16" rx="3" fill="#0D1421" stroke="#263349" strokeWidth="1" />
      <text x="0" y="-57" textAnchor="middle" fontSize="9" fill={tone.accent} fontFamily="monospace">
        {displayNumber(pressure)} bar
      </text>

      <text x="0" y="-108" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="110" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        Lvl {displayNumber(clampedLevel)}%
      </text>
    </g>
  )
}
