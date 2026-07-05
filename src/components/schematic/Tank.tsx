import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface TankProps extends SchematicComponentProps {
  level?: number
  temperature?: number
  width?: number
  height?: number
}

export default function Tank({
  status = 'offline',
  level = 50,
  temperature,
  width = 96,
  height = 150,
  x = 0,
  y = 0,
  scale = 1,
  label = 'TANK',
  className = '',
  ...rest
}: TankProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const clampedLevel = Math.min(100, Math.max(0, level))
  const liquidHeight = ((height - 18) * clampedLevel) / 100
  const liquidY = 8 + height - 18 - liquidHeight

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-tank ${className}`} {...rest}>
      <defs>
        <linearGradient id={`tank-shell-${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#1F2A44" />
          <stop offset="100%" stopColor="#0B1020" />
        </linearGradient>
      </defs>
      <rect x={-width / 2} y={0} width={width} height={height} rx="18" fill={`url(#tank-shell-${id})`} stroke="#5B6B7C" strokeWidth="2" />
      <rect
        x={-width / 2 + 9}
        y={liquidY}
        width={width - 18}
        height={liquidHeight}
        rx="8"
        fill={tone.accent}
        opacity={isOperational(status) ? 0.78 : 0.42}
      />
      <line x1={-width / 2 - 16} y1="28" x2={-width / 2} y2="28" stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />
      <line x1={width / 2} y1={height - 26} x2={width / 2 + 16} y2={height - 26} stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />
      <text x="0" y="-13" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y={height + 18} textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(clampedLevel)}%
      </text>
      {typeof temperature === 'number' && (
        <text x="0" y={height + 32} textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
          {displayNumber(temperature)} C
        </text>
      )}
    </g>
  )
}
