import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface ReactorProps extends SchematicComponentProps {
  level?: number
  temperature?: number
}

export default function Reactor({
  status = 'offline',
  level = 55,
  temperature,
  x = 0,
  y = 0,
  scale = 1,
  label = 'REACTOR',
  className = '',
  ...rest
}: ReactorProps) {
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const clampedLevel = Math.min(100, Math.max(0, level))
  const liquidHeight = (98 * clampedLevel) / 100

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-reactor ${className}`} {...rest}>
      <path d="M-58 -52Q-58 -80 0 -80Q58 -80 58 -52V58Q58 86 0 86Q-58 86 -58 58Z" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <path d={`M-43 ${65 - liquidHeight}H43V58Q43 72 0 72Q-43 72 -43 58Z`} fill={tone.accent} opacity={active ? 0.62 : 0.28} />
      <line x1="0" y1="-104" x2="0" y2="36" stroke="#5B6B7C" strokeWidth="5" strokeLinecap="round" />
      <path d="M-28 -4H28M-20 26H20" stroke={tone.accent} strokeWidth="5" strokeLinecap="round" opacity={active ? 0.9 : 0.32} />
      <path d="M-82 -10H-58M58 -10H82" stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />
      <text x="0" y="-120" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="108" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(clampedLevel)}%{typeof temperature === 'number' ? ` / ${displayNumber(temperature)} C` : ''}
      </text>
    </g>
  )
}
