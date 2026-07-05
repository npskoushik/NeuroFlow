import { useId } from 'react'
import { displayNumber, getStatusTone, place, type SchematicComponentProps } from './types'

export interface PumpProps extends SchematicComponentProps {
  rpm?: number
  temperature?: number
}

export default function Pump({
  status = 'offline',
  rpm = 0,
  temperature = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'PUMP',
  className = '',
  ...rest
}: PumpProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const running = String(status).toLowerCase() !== 'offline' && rpm > 0
  const bladeDuration = `${Math.max(0.45, 90 / Math.max(rpm, 60)).toFixed(2)}s`

  return (
    <g
      transform={place(x, y, scale)}
      className={`schematic-part schematic-pump ${className}`}
      role="img"
      aria-label={`${label} ${status}`}
      {...rest}
    >
      <defs>
        <filter id={`pump-glow-${id}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0.9  0 0 0 0 0.7  0 0 0 0.9 0"
            result="coloredBlur"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`pump-body-${id}`} x1="-46" x2="46" y1="-44" y2="44">
          <stop offset="0%" stopColor="#172033" />
          <stop offset="55%" stopColor="#0D1421" />
          <stop offset="100%" stopColor="#050814" />
        </linearGradient>
      </defs>

      <path d="M-92 -13H-45" stroke={tone.stroke} strokeWidth="18" strokeLinecap="round" />
      <path d="M45 -13H92" stroke={tone.stroke} strokeWidth="18" strokeLinecap="round" />
      <path d="M-95 -23h18v20h-18zM77 -23h18v20H77z" fill={tone.panel} stroke={tone.stroke} strokeWidth="2" />

      <circle
        r="48"
        fill={tone.accentSoft}
        stroke={tone.accent}
        strokeWidth="2.5"
        opacity={running ? 1 : 0.7}
        style={{ filter: running ? `url(#pump-glow-${id})` : undefined }}
      />
      <circle r="38" fill={`url(#pump-body-${id})`} stroke="#5B6B7C" strokeWidth="2" />
      <circle r="7" fill={tone.accent} opacity={running ? 1 : 0.75} />

      <g>
        {running && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur={bladeDuration}
            repeatCount="indefinite"
          />
        )}
        <path d="M0 -7C15 -33 30 -31 34 -20C23 -18 14 -12 6 0Z" fill="#A7F3D0" opacity="0.85" />
        <path d="M7 0C33 15 31 30 20 34C18 23 12 14 0 6Z" fill="#A7F3D0" opacity="0.75" />
        <path d="M0 7C-15 33 -30 31 -34 20C-23 18 -14 12 -6 0Z" fill="#A7F3D0" opacity="0.85" />
        <path d="M-7 0C-33 -15 -31 -30 -20 -34C-18 -23 -12 -14 0 -6Z" fill="#A7F3D0" opacity="0.75" />
      </g>

      <circle r="53" fill="none" stroke={tone.accent} strokeWidth="1.5" strokeDasharray="8 7" opacity={running ? 0.75 : 0.24} />
      <text x="0" y="-68" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="72" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(rpm)} RPM
      </text>
      <text x="0" y="86" textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
        {displayNumber(temperature)} C
      </text>
    </g>
  )
}
