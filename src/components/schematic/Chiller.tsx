import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface ChillerProps extends SchematicComponentProps {
  supplyTemp?: number
  returnTemp?: number
  compressorRpm?: number
}

export default function Chiller({
  status = 'offline',
  supplyTemp = 7,
  returnTemp = 12,
  compressorRpm = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'CHILLER',
  className = '',
  ...rest
}: ChillerProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const compDur = `${Math.max(0.5, 60 / Math.max(compressorRpm, 60)).toFixed(2)}s`

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-chiller ${className}`} {...rest}>
      <defs>
        <linearGradient id={`chl-body-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1A2A44" />
          <stop offset="100%" stopColor="#0B1020" />
        </linearGradient>
      </defs>

      {/* Main cabinet */}
      <rect x="-62" y="-52" width="124" height="104" rx="8"
        fill={`url(#chl-body-${id})`} stroke={tone.accent} strokeWidth="2.5" />

      {/* Refrigeration circuit — simplified loop */}
      {/* Condenser coil (top half) */}
      {[-36, -24, -12, 0, 12, 24, 36].map((xx, i) => (
        <rect key={i} x={xx - 4} y="-44" width="6" height="20" rx="2"
          fill="none" stroke={i % 2 === 0 ? '#FF6B35' : '#FF8C42'}
          strokeWidth="1.5" opacity={active ? 0.7 : 0.3} />
      ))}
      <text x="0" y="-28" textAnchor="middle" fontSize="7" fill="#FF6B35" fontFamily="monospace" opacity={active ? 0.8 : 0.4}>
        CONDENSER
      </text>

      {/* Compressor (center) */}
      <g transform="translate(0 0)">
        <circle r="18" fill="#0D1421" stroke={tone.accent} strokeWidth="2" />
        {active && compressorRpm > 0 && (
          <animateTransform attributeName="transform" type="rotate"
            from="0 0 0" to="360 0 0" dur={compDur} repeatCount="indefinite" additive="sum" />
        )}
        {/* Compressor scroll symbol */}
        <path d="M0 -10 Q10 -10 10 0 Q10 10 0 10 Q-10 10 -8 0" fill="none"
          stroke={tone.accent} strokeWidth="2" strokeLinecap="round" />
        <circle r="3" fill={tone.accent} opacity={active ? 1 : 0.5} />
      </g>
      <text x="0" y="4" textAnchor="middle" fontSize="6" fill={tone.muted} fontFamily="monospace">
        COMP
      </text>

      {/* Evaporator coil (bottom half) */}
      {[-36, -24, -12, 0, 12, 24, 36].map((xx, i) => (
        <rect key={i} x={xx - 4} y="22" width="6" height="20" rx="2"
          fill="none" stroke={i % 2 === 0 ? '#00D4FF' : '#448AFF'}
          strokeWidth="1.5" opacity={active ? 0.7 : 0.3} />
      ))}
      <text x="0" y="50" textAnchor="middle" fontSize="7" fill="#00D4FF" fontFamily="monospace" opacity={active ? 0.8 : 0.4}>
        EVAPORATOR
      </text>

      {/* Frost effect on evap when running */}
      {active && (
        <rect x="-44" y="18" width="88" height="28" rx="4"
          fill="#00D4FF" opacity="0.05" />
      )}

      {/* Supply/return pipes */}
      <path d="M-62 36H-82" stroke="#00D4FF" strokeWidth="10" strokeLinecap="round" />
      <text x="-92" y="40" textAnchor="middle" fontSize="7" fill="#00D4FF" fontFamily="monospace">SUP</text>

      <path d="M-62 -36H-82" stroke="#448AFF" strokeWidth="10" strokeLinecap="round" />
      <text x="-92" y="-32" textAnchor="middle" fontSize="7" fill="#448AFF" fontFamily="monospace">RET</text>

      <text x="0" y="-66" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="70" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(supplyTemp)}→{displayNumber(returnTemp)} °C
      </text>
    </g>
  )
}
