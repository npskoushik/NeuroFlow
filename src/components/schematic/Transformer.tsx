import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface TransformerProps extends SchematicComponentProps {
  primaryVoltage?: number
  secondaryVoltage?: number
  kva?: number
}

export default function Transformer({
  status = 'offline',
  primaryVoltage = 0,
  secondaryVoltage = 0,
  kva = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'XFMR',
  className = '',
  ...rest
}: TransformerProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)

  // Generate winding coil path (series of arcs)
  function coilPath(startX: number, y: number, coils: number, r: number, dir: 1 | -1): string {
    const parts: string[] = [`M${startX},${y}`]
    for (let i = 0; i < coils; i++) {
      const cx = startX + i * r * 2 * dir + r * dir
      parts.push(`A${r},${r} 0 0 ${dir > 0 ? 1 : 0} ${startX + (i + 1) * r * 2 * dir},${y}`)
    }
    return parts.join(' ')
  }

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-transformer ${className}`} {...rest}>
      <defs>
        <filter id={`xfmr-glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Core lamination stack */}
      {[-14, -8, -2, 4, 10].map((yy, i) => (
        <rect key={i} x="-10" y={yy} width="20" height="5"
          fill={i % 2 === 0 ? '#1F2A44' : '#263349'} stroke="#334155" strokeWidth="0.5" />
      ))}
      <rect x="-10" y="-18" width="20" height="52" rx="0"
        fill="none" stroke={tone.accent} strokeWidth="1.5" opacity="0.4" />

      {/* Primary winding (left side) */}
      <path d={coilPath(-38, -8, 5, 7, 1)} fill="none"
        stroke={active ? '#FF6B35' : '#334155'} strokeWidth="2.5" strokeLinecap="round"
        style={{ filter: active ? `url(#xfmr-glow-${id})` : undefined }} />
      {/* Primary leads */}
      <line x1="-38" y1="-8" x2="-60" y2="-8" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" opacity={active ? 0.8 : 0.3} />
      <line x1="-38" y1="62" x2="-60" y2="62" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" opacity={active ? 0.8 : 0.3} />

      {/* Invisible extend path — move end of primary winding coil to match */}
      <path d={coilPath(-38, 22, 5, 7, 1)} fill="none"
        stroke={active ? '#FF6B35' : '#334155'} strokeWidth="2.5" strokeLinecap="round" />

      {/* Secondary winding (right side) */}
      <path d={coilPath(38, -8, 4, 7, -1)} fill="none"
        stroke={active ? tone.accent : '#334155'} strokeWidth="2.5" strokeLinecap="round" />
      <path d={coilPath(38, 22, 4, 7, -1)} fill="none"
        stroke={active ? tone.accent : '#334155'} strokeWidth="2.5" strokeLinecap="round" />
      {/* Secondary leads */}
      <line x1="38" y1="-8" x2="60" y2="-8" stroke={tone.accent} strokeWidth="6" strokeLinecap="round" opacity={active ? 0.8 : 0.3} />
      <line x1="38" y1="62" x2="60" y2="62" stroke={tone.accent} strokeWidth="6" strokeLinecap="round" opacity={active ? 0.8 : 0.3} />

      {/* Flux animation */}
      {active && (
        <ellipse cx="0" cy="27" rx="8" ry="26" fill="none" stroke={tone.accent} strokeWidth="1"
          strokeDasharray="5 4" opacity="0.5">
          <animate attributeName="stroke-dashoffset" values="0;18" dur="1.2s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Voltage labels */}
      <text x="-52" y="-20" textAnchor="middle" fontSize="8" fill="#FF6B35" fontFamily="monospace">
        {displayNumber(primaryVoltage)}V
      </text>
      <text x="52" y="-20" textAnchor="middle" fontSize="8" fill={tone.accent} fontFamily="monospace">
        {displayNumber(secondaryVoltage)}V
      </text>

      <text x="0" y="-30" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="86" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(kva)} kVA
      </text>
    </g>
  )
}
