import { getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface RobotArmProps extends SchematicComponentProps {
  angle?: number
}

export default function RobotArm({
  status = 'offline',
  angle = -18,
  x = 0,
  y = 0,
  scale = 1,
  label = 'ROBOT',
  className = '',
  ...rest
}: RobotArmProps) {
  const tone = getStatusTone(status)
  const active = isOperational(status)

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-robot-arm ${className}`} {...rest}>
      <rect x="-38" y="48" width="76" height="24" rx="7" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <circle cx="0" cy="40" r="20" fill={tone.accentSoft} stroke={tone.accent} strokeWidth="2.5" />
      <g transform={`rotate(${angle} 0 40)`}>
        <rect x="-7" y="-22" width="14" height="66" rx="7" fill="#172033" stroke="#6B7C8F" strokeWidth="2" />
        <circle cx="0" cy="-24" r="17" fill="#101827" stroke={tone.accent} strokeWidth="2" />
        <g transform="rotate(-38 0 -24)">
          <rect x="-5" y="-86" width="10" height="66" rx="5" fill="#172033" stroke="#6B7C8F" strokeWidth="2" />
          <path d="M0 -88L-16 -106M0 -88L16 -106" stroke={active ? tone.accent : '#5B6B7C'} strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
      <text x="0" y="-85" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
    </g>
  )
}
