import { displayNumber, getStatusTone, isAlert, place, type SchematicComponentProps } from './types'

export interface FilterProps extends SchematicComponentProps {
  differentialPressure?: number
}

export default function Filter({
  status = 'offline',
  differentialPressure = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'FILTER',
  className = '',
  ...rest
}: FilterProps) {
  const tone = getStatusTone(status)

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-filter ${className}`} {...rest}>
      <path d="M-72 0H-46M46 0H72" stroke={tone.stroke} strokeWidth="14" strokeLinecap="round" />
      <rect
        x="-44"
        y="-56"
        width="88"
        height="112"
        rx="12"
        fill="#0D1421"
        stroke={tone.accent}
        strokeWidth="2.5"
        opacity={isAlert(status) ? 1 : 0.9}
      />
      <path d="M-24 -30H24M-24 0H24M-24 30H24" stroke="#8B949E" strokeWidth="5" strokeLinecap="round" opacity="0.72" />
      <path d="M-33 -44C-15 -28 -15 -18 -33 -4M33 4C15 20 15 30 33 44" stroke={tone.accent} strokeWidth="2" fill="none" opacity="0.72" />
      <text x="0" y="-72" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="76" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        dP {displayNumber(differentialPressure)} bar
      </text>
    </g>
  )
}
