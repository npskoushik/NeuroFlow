import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface SolenoidValveProps extends SchematicComponentProps {
  open?: boolean
  pressure?: number
  coilVoltage?: number
}

export default function SolenoidValve({
  status = 'offline',
  open,
  pressure = 0,
  coilVoltage = 24,
  x = 0,
  y = 0,
  scale = 1,
  label = 'SOL',
  className = '',
  ...rest
}: SolenoidValveProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const isOpen = open ?? active

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-solenoidvalve ${className}`} {...rest}>
      <defs>
        <filter id={`sol-glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Pipe */}
      <path d="M-60 0H-22M22 0H60" stroke={tone.stroke} strokeWidth="14" strokeLinecap="round" />

      {/* Valve body (triangle-bow tie like gate valve) */}
      <path d="M-22 -18L0 0L-22 18Z" fill={isOpen ? tone.accentSoft : '#0D1421'} stroke={tone.accent} strokeWidth="2.5" />
      <path d="M22  -18L0 0L22  18Z" fill={isOpen ? tone.accentSoft : '#0D1421'} stroke={tone.accent} strokeWidth="2.5" />

      {/* Solenoid coil body */}
      <rect x="-12" y="-38" width="24" height="20" rx="3"
        fill="#0D1421" stroke={active ? tone.accent : '#334155'} strokeWidth="2"
        style={{ filter: active ? `url(#sol-glow-${id})` : undefined }} />

      {/* Coil windings */}
      {[-32, -26, -20].map(yy => (
        <path key={yy} d={`M-9 ${yy} Q0 ${yy - 4} 9 ${yy}`}
          fill="none" stroke={active ? tone.accent : '#334155'} strokeWidth="1.5" />
      ))}

      {/* Plunger */}
      <rect x="-3" y={isOpen ? -18 : -22} width="6" height="8" rx="2"
        fill={active ? tone.accent : '#484F58'} stroke={tone.accent} strokeWidth="1">
        {active && (
          <animate attributeName="y" values={isOpen ? "-18;-20;-18" : "-22;-20;-22"}
            dur="0.5s" repeatCount={isOpen ? 'indefinite' : '1'} />
        )}
      </rect>

      {/* Stem */}
      <line x1="0" y1="-18" x2="0" y2="-10" stroke={tone.accent} strokeWidth="2.5" />

      {/* Field lines when energized */}
      {active && (
        <>
          <line x1="-18" y1="-28" x2="-24" y2="-28" stroke={tone.accent} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
          <line x1="18"  y1="-28" x2="24"  y2="-28" stroke={tone.accent} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
        </>
      )}

      {/* Status indicator dot */}
      <circle cx="16" cy="-32" r="3.5" fill={isOpen ? '#00E676' : '#484F58'}>
        {active && isOpen && (
          <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Voltage label */}
      <text x="-18" y="-46" fontSize="7" fill={tone.muted} fontFamily="monospace">
        {displayNumber(coilVoltage)}V DC
      </text>

      <text x="0" y="-58" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="34" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {isOpen ? 'OPEN' : 'CLOSED'} · {displayNumber(pressure)} bar
      </text>
    </g>
  )
}
