import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface FanProps extends SchematicComponentProps {
  rpm?: number
}

export default function Fan({
  status = 'offline',
  rpm = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'FAN',
  className = '',
  ...rest
}: FanProps) {
  const tone = getStatusTone(status)
  const running = isOperational(status) && rpm > 0
  const duration = `${Math.max(0.5, 100 / Math.max(rpm, 80)).toFixed(2)}s`

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-fan ${className}`} {...rest}>
      <circle r="48" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <circle r="32" fill={tone.accentSoft} stroke="#5B6B7C" strokeWidth="1.5" />
      <g>
        {running && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur={duration} repeatCount="indefinite" />}
        <path d="M0 -6C18 -38 38 -26 30 -8C20 -11 11 -10 0 0Z" fill={tone.accent} opacity="0.82" />
        <path d="M6 0C38 18 26 38 8 30C11 20 10 11 0 0Z" fill={tone.accent} opacity="0.72" />
        <path d="M0 6C-18 38 -38 26 -30 8C-20 11 -11 10 0 0Z" fill={tone.accent} opacity="0.82" />
        <path d="M-6 0C-38 -18 -26 -38 -8 -30C-11 -20 -10 -11 0 0Z" fill={tone.accent} opacity="0.72" />
      </g>
      <circle r="6" fill="#E6EDF3" />
      <text x="0" y="-64" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="70" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(rpm)} RPM
      </text>
    </g>
  )
}
