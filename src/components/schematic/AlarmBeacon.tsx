import { getStatusTone, isAlert, place, type SchematicComponentProps } from './types'

export interface AlarmBeaconProps extends SchematicComponentProps {
  active?: boolean
}

export default function AlarmBeacon({
  status = 'critical',
  active,
  x = 0,
  y = 0,
  scale = 1,
  label = 'ALARM',
  className = '',
  ...rest
}: AlarmBeaconProps) {
  const tone = getStatusTone(status)
  const flashing = active ?? isAlert(status)

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-alarm-beacon ${className}`} {...rest}>
      <path d="M-30 22H30L22 -28Q20 -46 0 -46Q-20 -46 -22 -28Z" fill={tone.accentSoft} stroke={tone.accent} strokeWidth="2.5" className={flashing ? 'animate-pulse' : undefined} />
      <path d="M-44 22H44V38H-44Z" fill="#0D1421" stroke="#5B6B7C" strokeWidth="2" />
      <path d="M-12 -54L-20 -76M12 -54L20 -76M-34 -38L-54 -52M34 -38L54 -52" stroke={tone.accent} strokeWidth="4" strokeLinecap="round" opacity={flashing ? 0.9 : 0.24} />
      <text x="0" y="58" textAnchor="middle" className="fill-text-primary text-[10px] font-mono font-semibold">
        {label}
      </text>
    </g>
  )
}
