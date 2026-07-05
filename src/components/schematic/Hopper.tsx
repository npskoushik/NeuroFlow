import { getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface HopperProps extends SchematicComponentProps {
  level?: number
}

export default function Hopper({
  status = 'offline',
  level = 65,
  x = 0,
  y = 0,
  scale = 1,
  label = 'HOPPER',
  className = '',
  ...rest
}: HopperProps) {
  const tone = getStatusTone(status)
  const clampedLevel = Math.min(100, Math.max(0, level))
  const liquidTop = 32 + (76 * (100 - clampedLevel)) / 100

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-hopper ${className}`} {...rest}>
      <path d="M-52 0H52L38 120H-38Z" fill="#0D1421" stroke="#6B7C8F" strokeWidth="2.5" />
      <path
        d={`M-37 ${liquidTop}H37L31 112H-31Z`}
        fill={tone.accent}
        opacity={isOperational(status) ? 0.74 : 0.42}
      />
      <path d="M-15 120H15L24 146H-24Z" fill="#111827" stroke={tone.stroke} strokeWidth="2" />
      <text x="0" y="-13" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="166" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {Math.round(clampedLevel)}%
      </text>
    </g>
  )
}
