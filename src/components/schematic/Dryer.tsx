import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface DryerProps extends SchematicComponentProps {
  temperature?: number
  rpm?: number
  moisture?: number
}

export default function Dryer({
  status = 'offline',
  temperature = 0,
  rpm = 0,
  moisture = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'DRYER',
  className = '',
  ...rest
}: DryerProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const running = active && rpm > 0
  const dur = `${Math.max(1, 60 / Math.max(rpm, 20)).toFixed(2)}s`

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-dryer ${className}`} {...rest}>
      <defs>
        <linearGradient id={`dryer-end-${id}`} cx="50%" cy="50%" r="50%" fx="30%" fy="30%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#1F2A44" />
          <stop offset="100%" stopColor="#0B1020" />
        </linearGradient>
      </defs>

      {/* Support legs */}
      <line x1="-52" y1="32" x2="-46" y2="52" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
      <line x1="52"  y1="32" x2="46"  y2="52" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
      <line x1="-28" y1="32" x2="-28" y2="52" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
      <line x1="28"  y1="32" x2="28"  y2="52" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

      {/* Drum body */}
      <ellipse cx="-64" cy="0" rx="10" ry="30" fill="#0D1421" stroke={tone.accent} strokeWidth="2" />
      <rect x="-64" y="-30" width="128" height="60" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <ellipse cx="64" cy="0" rx="10" ry="30" fill="#0D1421" stroke={tone.accent} strokeWidth="2" />

      {/* Interior drum rotation (flights/lifters) */}
      <g>
        {running && (
          <animateTransform attributeName="transform" type="rotate"
            from="0" to="360" dur={dur} repeatCount="indefinite" />
        )}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const cx = 20 * Math.cos(deg * Math.PI / 180)
          const cy = 20 * Math.sin(deg * Math.PI / 180)
          return (
            <line key={i} x1="0" y1="0" x2={cx.toFixed(1)} y2={cy.toFixed(1)}
              stroke={i % 2 === 0 ? tone.accent : '#334155'}
              strokeWidth="2" opacity="0.6" />
          )
        })}
        <circle r="4" fill={tone.accent} opacity={running ? 1 : 0.5} />
      </g>

      {/* Heat source arrow */}
      {active && temperature > 0 && (
        <g>
          {[-12, 0, 12].map((xx, i) => (
            <path key={i} d={`M${xx} -42 L${xx} -28`} stroke="#FF6B35" strokeWidth="2"
              markerEnd="url(#arrowhead)" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1s"
                begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </path>
          ))}
        </g>
      )}

      {/* Inlet/outlet chutes */}
      <path d="M-64 0H-88" stroke={tone.stroke} strokeWidth="14" strokeLinecap="round" />
      <text x="-96" y="4" textAnchor="middle" fontSize="7" fill={tone.muted} fontFamily="monospace">IN</text>
      <path d="M64 0H88" stroke={tone.stroke} strokeWidth="14" strokeLinecap="round" />
      <text x="96" y="4" textAnchor="middle" fontSize="7" fill={tone.muted} fontFamily="monospace">OUT</text>

      {/* Exhaust duct (top) */}
      <rect x="-10" y="-30" width="20" height="16" rx="2"
        fill="#0D1421" stroke="#334155" strokeWidth="1.5" />
      <path d="M0 -30V-52" stroke="#334155" strokeWidth="8" strokeLinecap="round" />

      {/* Data display */}
      <text x="0" y="-66" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="-36" y="72" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(temperature)}°C
      </text>
      <text x="36" y="72" textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
        {displayNumber(moisture)}% H₂O
      </text>
    </g>
  )
}
