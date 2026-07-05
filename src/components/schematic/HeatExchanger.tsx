import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface HeatExchangerProps extends SchematicComponentProps {
  hotTemp?: number
  coldTemp?: number
  flowRate?: number
}

export default function HeatExchanger({
  status = 'offline',
  hotTemp = 0,
  coldTemp = 0,
  flowRate = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'HX',
  className = '',
  ...rest
}: HeatExchangerProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-heatexchanger ${className}`} {...rest}>
      <defs>
        <linearGradient id={`hx-hot-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF3B3B" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`hx-cold-${id}`} x1="1" x2="0" y1="0" y2="0">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#448AFF" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Shell body */}
      <rect x="-64" y="-36" width="128" height="72" rx="8"
        fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />

      {/* Internal tube plates */}
      <rect x="-52" y="-28" width="104" height="56" rx="4"
        fill="none" stroke="#334155" strokeWidth="1.5" />

      {/* Tube bundle - horizontal lines */}
      {[-18, -8, 2, 12, 22].map((yy, i) => (
        <line key={i} x1="-48" y1={yy} x2="48" y2={yy}
          stroke={i % 2 === 0 ? '#FF6B35' : '#00D4FF'}
          strokeWidth="3" strokeLinecap="round"
          opacity={active ? 0.75 : 0.3} />
      ))}

      {/* Hot inlet/outlet (top) */}
      <path d="M-64 -18H-80M64 -18H80" stroke="#FF6B35" strokeWidth="10" strokeLinecap="round" />
      <rect x="-80" y="-26" width="16" height="16" rx="2" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity={active ? 0.9 : 0.4} />
      <text x="-72" y="-30" textAnchor="middle" fontSize="7" fill="#FF6B35" fontFamily="monospace">HOT</text>

      {/* Cold inlet/outlet (bottom) */}
      <path d="M-64 18H-80M64 18H80" stroke="#00D4FF" strokeWidth="10" strokeLinecap="round" />
      <rect x="64" y="10" width="16" height="16" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1.5" opacity={active ? 0.9 : 0.4} />
      <text x="72" y="30" textAnchor="middle" fontSize="7" fill="#00D4FF" fontFamily="monospace">COLD</text>

      {/* Flow animation */}
      {active && flowRate > 0 && (
        <rect x="-48" y="-3" width="14" height="6" rx="3" fill={tone.accent} opacity="0.9">
          <animateTransform attributeName="transform" type="translate"
            values="-48 0; 48 0; -48 0" dur="1.8s" repeatCount="indefinite" />
        </rect>
      )}

      <text x="0" y="-50" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="52" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(hotTemp)}°C → {displayNumber(coldTemp)}°C
      </text>
    </g>
  )
}
