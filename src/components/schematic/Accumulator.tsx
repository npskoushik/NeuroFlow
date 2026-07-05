import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface AccumulatorProps extends SchematicComponentProps {
  pressure?: number
  gasVolume?: number  // % gas on top
}

export default function Accumulator({
  status = 'offline',
  pressure = 0,
  gasVolume = 50,
  x = 0,
  y = 0,
  scale = 1,
  label = 'ACCUM',
  className = '',
  ...rest
}: AccumulatorProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const clampedGas = Math.min(100, Math.max(0, gasVolume))
  const liquidFill = 100 - clampedGas
  const bodyH = 100
  const liquidH = (bodyH * liquidFill) / 100
  const liquidY = -bodyH / 2 + (bodyH * clampedGas / 100)

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-accumulator ${className}`} {...rest}>
      <defs>
        <linearGradient id={`acc-shell-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#1F2A44" />
          <stop offset="100%" stopColor="#0D1421" />
        </linearGradient>
        <clipPath id={`acc-clip-${id}`}>
          <rect x="-28" y={-bodyH / 2} width="56" height={bodyH} />
        </clipPath>
      </defs>

      {/* Vessel elliptical caps */}
      <ellipse cx="0" cy={-bodyH / 2} rx="28" ry="14"
        fill={`url(#acc-shell-${id})`} stroke={tone.accent} strokeWidth="2" />
      <ellipse cx="0" cy={bodyH / 2} rx="28" ry="14"
        fill={`url(#acc-shell-${id})`} stroke={tone.accent} strokeWidth="2" />

      {/* Cylinder body */}
      <rect x="-28" y={-bodyH / 2} width="56" height={bodyH}
        fill={`url(#acc-shell-${id})`} stroke={tone.accent} strokeWidth="2.5" />

      {/* Liquid fill */}
      <rect x="-26" y={liquidY} width="52" height={liquidH}
        fill={tone.accent} opacity={active ? 0.45 : 0.2}
        clipPath={`url(#acc-clip-${id})`} />

      {/* Gas/liquid interface line */}
      <line x1="-26" y1={liquidY} x2="26" y2={liquidY}
        stroke={tone.accent} strokeWidth="1.5" strokeDasharray="4 3" opacity={active ? 0.8 : 0.4} />

      {/* Gas label */}
      <text x="0" y={liquidY - 8} textAnchor="middle" fontSize="8" fill={tone.muted} fontFamily="monospace">
        GAS
      </text>

      {/* Pressure pulse animation */}
      {active && (
        <circle cx="0" cy="0" r="8" fill="none" stroke={tone.accent} strokeWidth="1.5" opacity="0">
          <animate attributeName="r" values="8;30;8" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Top port */}
      <path d="M0 -114V-94" stroke={tone.stroke} strokeWidth="8" strokeLinecap="round" />
      {/* Bottom port */}
      <path d="M0 64V84" stroke={tone.stroke} strokeWidth="8" strokeLinecap="round" />

      {/* Pressure gauge */}
      <rect x="-24" y="-90" width="48" height="14" rx="3" fill="#0D1421" stroke="#263349" strokeWidth="1" />
      <text x="0" y="-81" textAnchor="middle" fontSize="9" fill={tone.accent} fontFamily="monospace">
        {displayNumber(pressure)} bar
      </text>

      <text x="0" y="-106" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="98" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        Gas {displayNumber(clampedGas)}%
      </text>
    </g>
  )
}
