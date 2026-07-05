import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface BoilerProps extends SchematicComponentProps {
  temperature?: number
  pressure?: number
}

export default function Boiler({
  status = 'offline',
  temperature = 0,
  pressure = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'BOILER',
  className = '',
  ...rest
}: BoilerProps) {
  const tone = getStatusTone(status)
  const firing = isOperational(status)

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-boiler ${className}`} {...rest}>
      {/* Main Tank Body */}
      <rect x="-60" y="-70" width="120" height="140" rx="12" fill="#131A2A" stroke={tone.accent} strokeWidth="2.5" />
      
      {/* Steam Dome */}
      <path d="M-30 -70 C-30 -95 30 -95 30 -70 Z" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      
      {/* Burner Section */}
      <rect x="-70" y="20" width="140" height="30" rx="6" fill="#1B2436" stroke={tone.stroke} strokeWidth="2.5" />
      <path d="M-60 20 V0 H60 V20 Z" fill="#0D1421" stroke={tone.stroke} strokeWidth="2" />
      
      {/* Fire Tubes */}
      <g stroke="#263349" strokeWidth="6" strokeLinecap="round">
        <line x1="-40" y1="-50" x2="40" y2="-50" />
        <line x1="-40" y1="-30" x2="40" y2="-30" />
        <line x1="-40" y1="-10" x2="40" y2="-10" />
      </g>

      {/* Burner Flame */}
      {firing && (
        <g opacity="0.85">
          <path d="M-30 45 C-20 20 0 20 0 40 C0 20 20 20 30 45 C15 55 -15 55 -30 45 Z" fill={tone.accent} />
          <path d="M-15 45 C-10 30 0 30 0 40 C0 30 10 30 15 45 Z" fill="#FFF" opacity="0.5" />
        </g>
      )}
      {!firing && (
        <path d="M-30 45 C-20 20 0 20 0 40 C0 20 20 20 30 45 C15 55 -15 55 -30 45 Z" fill="#263349" opacity="0.4" />
      )}

      {/* Control Box */}
      <rect x="60" y="-20" width="15" height="40" rx="3" fill="#0D1421" stroke={tone.accent} strokeWidth="2" />
      <circle cx="67.5" cy="-10" r="2.5" fill={firing ? tone.accent : "#333"} />
      <circle cx="67.5" cy="0" r="2.5" fill="#333" />
      <circle cx="67.5" cy="10" r="2.5" fill="#333" />

      {/* Label */}
      <text x="0" y="-105" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      {typeof temperature === 'number' && (
        <text x="0" y="65" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
          {displayNumber(temperature)} C{typeof pressure === 'number' ? ` / ${displayNumber(pressure)} bar` : ''}
        </text>
      )}
    </g>
  )
}
