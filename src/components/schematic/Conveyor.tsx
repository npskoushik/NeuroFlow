import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface ConveyorProps extends SchematicComponentProps {
  length?: number
  speed?: number
}

export default function Conveyor({
  status = 'offline',
  length = 180,
  speed = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'CONVEYOR',
  className = '',
  ...rest
}: ConveyorProps) {
  const tone = getStatusTone(status)
  const running = isOperational(status) && speed > 0
  const half = length / 2

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-conveyor ${className}`} {...rest}>
      <rect x={-half} y="-22" width={length} height="44" rx="18" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <circle cx={-half + 24} cy="0" r="14" fill="#111827" stroke="#6B7C8F" strokeWidth="2" />
      <circle cx={half - 24} cy="0" r="14" fill="#111827" stroke="#6B7C8F" strokeWidth="2" />
      <path
        d={`M${-half + 48} 0H${half - 48}`}
        stroke={tone.accent}
        strokeWidth="5"
        strokeDasharray="10 12"
        className={running ? 'flow-animate' : undefined}
        opacity={running ? 0.9 : 0.24}
      />
      <path d={`M${-half + 26} 22L${-half + 8} 58M${half - 26} 22L${half - 8} 58`} stroke="#263349" strokeWidth="5" strokeLinecap="round" />
      <text x="0" y="-38" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="72" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(speed)} m/min
      </text>
    </g>
  )
}
