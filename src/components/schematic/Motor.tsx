import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface MotorProps extends SchematicComponentProps {
  rpm?: number
  temperature?: number
}

export default function Motor({
  status = 'offline',
  rpm = 0,
  temperature,
  x = 0,
  y = 0,
  scale = 1,
  label = 'MOTOR',
  className = '',
  ...rest
}: MotorProps) {
  const tone = getStatusTone(status)
  const running = isOperational(status) && rpm > 0
  const duration = `${Math.max(0.2, 100 / Math.max(rpm, 10)).toFixed(2)}s`

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-motor ${className}`} {...rest}>
      {/* Motor base */}
      <path d="M-40 30L-50 50H50L40 30Z" fill="#0D1421" stroke={tone.stroke} strokeWidth="2.5" strokeLinejoin="round" />
      
      {/* Main Body */}
      <rect x="-54" y="-35" width="90" height="70" rx="8" fill="#131A2A" stroke={tone.accent} strokeWidth="2.5" />
      
      {/* Cooling Fins */}
      <g stroke={tone.stroke} strokeWidth="2" opacity="0.6">
        <line x1="-40" y1="-35" x2="-40" y2="35" />
        <line x1="-25" y1="-35" x2="-25" y2="35" />
        <line x1="-10" y1="-35" x2="-10" y2="35" />
        <line x1="5" y1="-35" x2="5" y2="35" />
        <line x1="20" y1="-35" x2="20" y2="35" />
      </g>
      
      {/* End Bell (Fan cover) */}
      <path d="M-54 -30 C-65 -30 -65 30 -54 30 Z" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      
      {/* Front Bell */}
      <path d="M36 -25 C45 -25 45 25 36 25 Z" fill="#1B2436" stroke={tone.accent} strokeWidth="2.5" />
      
      {/* Drive Shaft */}
      <path d="M43 -5 H70 V5 H43 Z" fill="#0D1421" stroke={tone.stroke} strokeWidth="2" strokeLinejoin="round" />
      {running && (
        <line x1="45" y1="0" x2="68" y2="0" stroke={tone.accent} strokeWidth="1" strokeDasharray="4 2">
           <animate attributeName="stroke-dashoffset" from="0" to="-20" dur={duration} repeatCount="indefinite" />
        </line>
      )}

      {/* Terminal Box */}
      <rect x="-15" y="-50" width="30" height="15" rx="3" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <circle cx="0" cy="-42" r="3" fill={running ? tone.accentSoft : "#333"} />

      {/* Labels */}
      <text x="0" y="-58" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="66" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(rpm)} RPM{typeof temperature === 'number' ? ` / ${displayNumber(temperature)} C` : ''}
      </text>
    </g>
  )
}
