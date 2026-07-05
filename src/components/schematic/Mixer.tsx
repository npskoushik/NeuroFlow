import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface MixerProps extends SchematicComponentProps {
  rpm?: number
  level?: number
}

export default function Mixer({
  status = 'offline',
  rpm = 0,
  level = 60,
  x = 0,
  y = 0,
  scale = 1,
  label = 'MIXER',
  className = '',
  ...rest
}: MixerProps) {
  const tone = getStatusTone(status)
  const running = isOperational(status) && rpm > 0
  const liquidHeight = (70 * Math.min(100, Math.max(0, level))) / 100

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-mixer ${className}`} {...rest}>
      <rect x="-46" y="-50" width="92" height="112" rx="18" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <rect x="-35" y={54 - liquidHeight} width="70" height={liquidHeight} rx="8" fill={tone.accent} opacity={running ? 0.64 : 0.28} />
      <rect x="-24" y="-88" width="48" height="26" rx="7" fill="#101827" stroke={tone.accent} strokeWidth="2" />
      <line x1="0" y1="-62" x2="0" y2="28" stroke="#8B949E" strokeWidth="5" strokeLinecap="round" />
      <g>
        {running && <animateTransform attributeName="transform" type="rotate" from="0 0 28" to="360 0 28" dur="1.3s" repeatCount="indefinite" />}
        <path d="M0 28L-28 42M0 28L28 42" stroke={tone.accent} strokeWidth="5" strokeLinecap="round" />
      </g>
      <text x="0" y="-103" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="84" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(rpm)} RPM
      </text>
    </g>
  )
}
