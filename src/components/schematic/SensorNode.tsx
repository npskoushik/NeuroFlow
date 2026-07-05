import { displayNumber, getStatusTone, isAlert, place, type SchematicComponentProps } from './types'

export interface SensorNodeProps extends SchematicComponentProps {
  value?: number
  unit?: string
}

export default function SensorNode({
  status = 'offline',
  value,
  unit = '',
  x = 0,
  y = 0,
  scale = 1,
  label = 'SENSOR',
  className = '',
  ...rest
}: SensorNodeProps) {
  const tone = getStatusTone(status)

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-sensor-node ${className}`} {...rest}>
      <circle r="24" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" className={isAlert(status) ? 'animate-pulse' : undefined} />
      <circle r="8" fill={tone.accent} opacity="0.85" />
      <path d="M0 -38V-24M0 24V38M-38 0H-24M24 0H38" stroke={tone.stroke} strokeWidth="4" strokeLinecap="round" />
      <text x="0" y="-50" textAnchor="middle" className="fill-text-primary text-[10px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="58" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(value)} {unit}
      </text>
    </g>
  )
}
