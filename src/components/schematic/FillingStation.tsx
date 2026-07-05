import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface FillingStationProps extends SchematicComponentProps {
  fillLevel?: number
  bottlesPerMinute?: number
}

export default function FillingStation({
  status = 'offline',
  fillLevel = 70,
  bottlesPerMinute = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'FILL',
  className = '',
  ...rest
}: FillingStationProps) {
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const fill = Math.min(100, Math.max(0, fillLevel))

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-filling-station ${className}`} {...rest}>
      <path d="M0 -82V-28M-28 -28H28" stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />
      <rect x="-58" y="16" width="116" height="36" rx="9" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <path d="M-76 60H76" stroke="#263349" strokeWidth="10" strokeLinecap="round" />
      <g transform="translate(-24 0)">
        <path d="M-11 -16H11L16 48H-16Z" fill="#101827" stroke="#6B7C8F" strokeWidth="2" />
        <rect x="-10" y={48 - (52 * fill) / 100} width="20" height={(52 * fill) / 100} rx="4" fill={tone.accent} opacity={active ? 0.75 : 0.28} />
      </g>
      <g transform="translate(25 0)">
        <path d="M-11 -16H11L16 48H-16Z" fill="#101827" stroke="#6B7C8F" strokeWidth="2" />
        <rect x="-10" y={48 - (52 * fill) / 100} width="20" height={(52 * fill) / 100} rx="4" fill={tone.accent} opacity={active ? 0.75 : 0.28} />
      </g>
      <circle cx="0" cy="-24" r="7" fill={active ? tone.accent : '#484F58'} />
      <text x="0" y="-100" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="84" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(bottlesPerMinute)} BPM
      </text>
    </g>
  )
}
