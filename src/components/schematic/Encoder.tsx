import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface EncoderProps extends SchematicComponentProps {
  rpm?: number
  pulseCount?: number
  resolution?: number
}

export default function Encoder({
  status = 'offline',
  rpm = 0,
  pulseCount,
  resolution = 1024,
  x = 0,
  y = 0,
  scale = 1,
  label = 'ENC',
  className = '',
  ...rest
}: EncoderProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const running = active && rpm > 0
  const dur = `${Math.max(0.3, 60 / Math.max(rpm, 60)).toFixed(2)}s`
  const slots = 16  // number of encoder slots

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-encoder ${className}`} {...rest}>
      <defs>
        <filter id={`enc-glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Housing */}
      <circle r="38" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5"
        style={{ filter: active ? `url(#enc-glow-${id})` : undefined }} />
      <circle r="30" fill="#060D1A" stroke="#1F2A44" strokeWidth="1.5" />

      {/* Rotating disc with slots */}
      <g>
        {running && (
          <animateTransform attributeName="transform" type="rotate"
            from="0" to="360" dur={dur} repeatCount="indefinite" />
        )}
        {/* Disc */}
        <circle r="24" fill="#0D1421" stroke="#263349" strokeWidth="1" />
        {/* Alternating opaque / transparent slots */}
        {Array.from({ length: slots }, (_, i) => {
          const startAngle = (i / slots) * 2 * Math.PI - Math.PI / 2
          const endAngle = ((i + 0.5) / slots) * 2 * Math.PI - Math.PI / 2
          const x1 = (12 * Math.cos(startAngle)).toFixed(2)
          const y1 = (12 * Math.sin(startAngle)).toFixed(2)
          const x2 = (22 * Math.cos(startAngle)).toFixed(2)
          const y2 = (22 * Math.sin(startAngle)).toFixed(2)
          const x3 = (22 * Math.cos(endAngle)).toFixed(2)
          const y3 = (22 * Math.sin(endAngle)).toFixed(2)
          const x4 = (12 * Math.cos(endAngle)).toFixed(2)
          const y4 = (12 * Math.sin(endAngle)).toFixed(2)
          return (
            <path key={i}
              d={`M${x1},${y1} L${x2},${y2} A22,22 0 0,1 ${x3},${y3} L${x4},${y4} A12,12 0 0,0 ${x1},${y1}Z`}
              fill={tone.accent} opacity={i % 2 === 0 ? 0.8 : 0.1} />
          )
        })}
        {/* Hub */}
        <circle r="5" fill={tone.accent} opacity={active ? 1 : 0.5} />
        <circle r="2" fill="#0D1421" />
      </g>

      {/* Sensor head */}
      <rect x="24" y="-6" width="12" height="12" rx="2"
        fill="#1F2A44" stroke={tone.accent} strokeWidth="1.5" />
      {/* Beam dot */}
      <circle cx="30" cy="0" r="2.5" fill={active ? '#FF3B3B' : '#484F58'}>
        {active && rpm > 0 && (
          <animate attributeName="opacity" values="1;0.2;1" dur={`${Math.max(0.05, 1 / Math.max(rpm, 10) * 60).toFixed(2)}s`} repeatCount="indefinite" />
        )}
      </circle>

      {/* Cable */}
      <path d="M38 0 H58" stroke="#263349" strokeWidth="4" strokeLinecap="round" />

      {/* Shaft */}
      <path d="M0 -38 V-58" stroke={tone.stroke} strokeWidth="8" strokeLinecap="round" />

      <text x="0" y="-72" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="54" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(rpm)} RPM
      </text>
      <text x="0" y="68" textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
        {resolution} PPR{typeof pulseCount === 'number' ? ` · ${pulseCount}` : ''}
      </text>
    </g>
  )
}
