import { getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface ValveProps extends SchematicComponentProps {
  open?: boolean
}

export default function Valve({
  status = 'offline',
  open,
  x = 0,
  y = 0,
  scale = 1,
  label = 'VALVE',
  className = '',
  ...rest
}: ValveProps) {
  const tone = getStatusTone(status)
  const isOpen = open ?? isOperational(status)

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-valve ${className}`} {...rest}>
      {/* Pipe Flanges */}
      <rect x="-40" y="-15" width="10" height="30" rx="2" fill="#131A2A" stroke={tone.stroke} strokeWidth="2" />
      <rect x="30" y="-15" width="10" height="30" rx="2" fill="#131A2A" stroke={tone.stroke} strokeWidth="2" />
      
      {/* Valve Body */}
      <path d="M-30 -10 L0 -25 L30 -10 V10 L0 25 L-30 10 Z" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="0" cy="0" r="10" fill="#1B2436" stroke={tone.stroke} strokeWidth="2" />
      <circle cx="0" cy="0" r="4" fill={isOpen ? tone.accentSoft : '#0D1421'} stroke={tone.accent} strokeWidth="1.5" />
      
      {/* Stem */}
      <rect x="-4" y="-45" width="8" height="25" fill="#1B2436" stroke={tone.stroke} strokeWidth="2" />
      
      {/* Actuator / Handwheel */}
      <path d="M-20 -50 H20" stroke={tone.accent} strokeWidth="4" strokeLinecap="round" />
      <rect x="-15" y="-60" width="30" height="15" rx="3" fill="#0D1421" stroke={tone.accent} strokeWidth="2" />
      <circle cx="0" cy="-52.5" r="4" fill={isOpen ? tone.accent : '#263349'} stroke={tone.accent} strokeWidth="1.5" />

      {/* Connection pipes */}
      <path d="M-60 0 H-40 M40 0 H60" stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />

      {/* Labels */}
      <text x="0" y="45" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="60" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {isOpen ? 'OPEN' : 'CLOSED'}
      </text>
    </g>
  )
}
