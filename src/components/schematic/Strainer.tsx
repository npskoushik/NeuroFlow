import { displayNumber, getStatusTone, isAlert, place, type SchematicComponentProps } from './types'

export interface StrainerProps extends SchematicComponentProps {
  differentialPressure?: number
  plugged?: boolean
}

export default function Strainer({
  status = 'offline',
  differentialPressure = 0,
  plugged = false,
  x = 0,
  y = 0,
  scale = 1,
  label = 'STRAINER',
  className = '',
  ...rest
}: StrainerProps) {
  const tone = getStatusTone(status)
  const alert = isAlert(status) || plugged

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-strainer ${className}`} {...rest}>
      {/* Inline pipe */}
      <path d="M-60 0H-22M22 0H60" stroke={tone.stroke} strokeWidth="14" strokeLinecap="round" />

      {/* Y body */}
      <path d="M-22 -12L0 12L22 -12Z"
        fill={alert ? '#1A0D0D' : '#0D1421'}
        stroke={alert ? '#FF3B3B' : tone.accent}
        strokeWidth="2.5" />
      <path d="M-22 12L0 -12L22 12Z"
        fill={alert ? '#1A0D0D' : '#0D1421'}
        stroke={alert ? '#FF3B3B' : tone.accent}
        strokeWidth="2" opacity="0.5" />

      {/* Mesh screen symbol */}
      {[-8, 0, 8].map(xx => (
        <line key={xx} x1={xx} y1="-6" x2={xx} y2="6"
          stroke={alert ? '#FF3B3B' : tone.accent}
          strokeWidth="1.2" opacity={alert ? 0.9 : 0.6} />
      ))}
      {[-4, 4].map(yy => (
        <line key={yy} x1="-10" y1={yy} x2="10" y2={yy}
          stroke={alert ? '#FF3B3B' : tone.accent}
          strokeWidth="1.2" opacity={alert ? 0.9 : 0.6} />
      ))}

      {/* Blow-down leg */}
      <line x1="0" y1="12" x2="0" y2="38" stroke={tone.stroke} strokeWidth="8" strokeLinecap="round" />
      <rect x="-6" y="36" width="12" height="8" rx="2"
        fill="#0D1421" stroke={tone.accent} strokeWidth="1.5" />
      <text x="10" y="44" fontSize="7" fill={tone.muted} fontFamily="monospace">DRAIN</text>

      {/* Plugged indicator */}
      {plugged && (
        <text x="0" y="-2" textAnchor="middle" fontSize="10" fill="#FF3B3B" fontFamily="monospace" fontWeight="bold">
          ✕
        </text>
      )}

      <text x="0" y="-28" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="54" textAnchor="middle" className={`text-[10px] font-mono ${alert ? 'fill-status-critical' : 'fill-text-secondary'}`}>
        ΔP {displayNumber(differentialPressure)} bar
      </text>
    </g>
  )
}
