import { displayNumber, getStatusTone, place, type SchematicComponentProps } from './types'

export interface GaugeProps extends SchematicComponentProps {
  value?: number
  min?: number
  max?: number
  unit?: string
}

export default function Gauge({
  status = 'offline',
  value = 0,
  min = 0,
  max = 100,
  unit = '',
  x = 0,
  y = 0,
  scale = 1,
  label = 'GAUGE',
  className = '',
  ...rest
}: GaugeProps) {
  const tone = getStatusTone(status)
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min || 1)))
  const angle = -135 + pct * 270
  const needleX = Math.cos((angle * Math.PI) / 180) * 34
  const needleY = Math.sin((angle * Math.PI) / 180) * 34

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-gauge ${className}`} {...rest}>
      <path d="M-45 0A45 45 0 1 1 45 0" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <path d="M-32 0A32 32 0 1 1 32 0" fill="none" stroke="#263349" strokeWidth="6" strokeLinecap="round" />
      <line x1="0" y1="0" x2={needleX} y2={needleY} stroke={tone.accent} strokeWidth="4" strokeLinecap="round" />
      <circle r="5" fill="#E6EDF3" />
      <text x="0" y="-56" textAnchor="middle" className="fill-text-primary text-[10px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="32" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(value)} {unit}
      </text>
    </g>
  )
}
