import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface CNCMachineProps extends SchematicComponentProps {
  spindleRpm?: number
}

export default function CNCMachine({
  status = 'offline',
  spindleRpm = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'CNC',
  className = '',
  ...rest
}: CNCMachineProps) {
  const tone = getStatusTone(status)
  const active = isOperational(status) && spindleRpm > 0

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-cnc ${className}`} {...rest}>
      <rect x="-72" y="-58" width="144" height="116" rx="10" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <rect x="-56" y="-40" width="70" height="56" rx="6" fill="#050814" stroke="#263349" strokeWidth="2" />
      <rect x="24" y="-40" width="32" height="56" rx="5" fill="#101827" stroke="#263349" strokeWidth="2" />
      <path d="M-22 -40V-4M-38 16H14" stroke={active ? tone.accent : '#5B6B7C'} strokeWidth="5" strokeLinecap="round" />
      <circle cx="40" cy="-22" r="5" fill={active ? tone.accent : '#484F58'} />
      <circle cx="40" cy="-4" r="5" fill="#448AFF" opacity="0.7" />
      <path d="M-64 58L-76 82H76L64 58" fill="#101827" stroke="#263349" strokeWidth="2" />
      <text x="0" y="-75" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="100" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(spindleRpm)} RPM
      </text>
    </g>
  )
}
