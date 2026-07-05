import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface FlowmeterProps extends SchematicComponentProps {
  flowRate?: number
  unit?: string
  totalFlow?: number
}

export default function Flowmeter({
  status = 'offline',
  flowRate = 0,
  unit = 'L/min',
  totalFlow,
  x = 0,
  y = 0,
  scale = 1,
  label = 'FM',
  className = '',
  ...rest
}: FlowmeterProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const rotateDur = flowRate > 0 ? `${Math.max(0.3, 60 / Math.max(flowRate * 2, 30)).toFixed(2)}s` : '999s'

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-flowmeter ${className}`} {...rest}>
      <defs>
        <filter id={`fm-glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Flow pipe */}
      <path d="M-76 0H-36M36 0H76" stroke={tone.stroke} strokeWidth="18" strokeLinecap="round" />

      {/* Meter body */}
      <circle r="38" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5"
        style={{ filter: active ? `url(#fm-glow-${id})` : undefined }} />
      <circle r="30" fill="#060D1A" stroke="#1F2A44" strokeWidth="1.5" />

      {/* Rotating indicator disc */}
      <g>
        {active && flowRate > 0 && (
          <animateTransform attributeName="transform" type="rotate"
            from="0" to="360" dur={rotateDur} repeatCount="indefinite" />
        )}
        {/* Paddle wheel spokes */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <line key={i}
            x1="0" y1="0"
            x2={(24 * Math.cos((deg * Math.PI) / 180)).toFixed(2)}
            y2={(24 * Math.sin((deg * Math.PI) / 180)).toFixed(2)}
            stroke={i % 2 === 0 ? tone.accent : '#334155'}
            strokeWidth="2.5" strokeLinecap="round" />
        ))}
        <circle r="4" fill={tone.accent} />
      </g>

      {/* Flow direction arrow */}
      <path d="M-50 -8L-42 0L-50 8" fill="none" stroke={tone.accent} strokeWidth="1.5" opacity={active ? 0.6 : 0.2} />
      <path d="M50 -8L42 0L50 8" fill="none" stroke={tone.accent} strokeWidth="1.5" opacity={active ? 0.6 : 0.2} />

      {/* Display */}
      <rect x="-26" y="-10" width="52" height="20" rx="4" fill="#030810" stroke="#263349" strokeWidth="1" opacity="0" />

      <text x="0" y="-52" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="54" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(flowRate)} {unit}
      </text>
      {typeof totalFlow === 'number' && (
        <text x="0" y="68" textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
          Total: {displayNumber(totalFlow)}
        </text>
      )}
    </g>
  )
}
