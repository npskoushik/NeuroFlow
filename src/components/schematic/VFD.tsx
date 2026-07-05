import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface VFDProps extends SchematicComponentProps {
  frequency?: number
  outputVoltage?: number
  current?: number
}

export default function VFD({
  status = 'offline',
  frequency = 0,
  outputVoltage = 0,
  current = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'VFD',
  className = '',
  ...rest
}: VFDProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const freqPct = Math.min(1, frequency / 60)

  // Sine wave path based on frequency %
  const sinePoints = Array.from({ length: 40 }, (_, i) => {
    const t = (i / 39) * 2 * Math.PI * (active ? 2 : 1)
    const px = -28 + (i / 39) * 56
    const py = -(Math.sin(t) * 8 * freqPct)
    return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`
  }).join(' ')

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-vfd ${className}`} {...rest}>
      <defs>
        <filter id={`vfd-glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Enclosure */}
      <rect x="-48" y="-58" width="96" height="116" rx="8"
        fill="#0A1020" stroke={tone.accent} strokeWidth="2.5" />

      {/* Top vent slots */}
      {[-16, -6, 4, 14].map(xx => (
        <rect key={xx} x={xx} y="-54" width="6" height="4" rx="1" fill="#263349" />
      ))}

      {/* Display screen */}
      <rect x="-38" y="-48" width="76" height="44" rx="4"
        fill="#030810" stroke={tone.accent} strokeWidth="1.5"
        style={{ filter: active ? `url(#vfd-glow-${id})` : undefined }} />

      {/* Frequency label */}
      <text x="-32" y="-36" fontSize="7" fill={tone.muted} fontFamily="monospace">Hz</text>
      <text x="-32" y="-22" fontSize="14" fill={tone.accent} fontFamily="monospace" fontWeight="bold">
        {displayNumber(frequency)}
      </text>

      {/* Output waveform */}
      <path d={sinePoints} fill="none" stroke={tone.accent} strokeWidth="1.5"
        transform="translate(20 -32)" opacity={active ? 0.8 : 0.2}>
        {active && frequency > 0 && (
          <animateTransform attributeName="transform" type="translate"
            values="20 -32; -36 -32; 20 -32" dur={`${Math.max(0.5, 2 / Math.max(freqPct, 0.1)).toFixed(1)}s`}
            repeatCount="indefinite" />
        )}
      </path>

      {/* Keypad buttons */}
      {[
        { x: -36, y: 2, label: '▲' },
        { x: -20, y: 2, label: '▼' },
        { x: -4,  y: 2, label: '◀' },
        { x: 12,  y: 2, label: '▶' },
        { x: 28,  y: 2, label: 'OK' },
      ].map((btn, i) => (
        <g key={i} transform={`translate(${btn.x}, ${btn.y})`}>
          <rect width="12" height="12" rx="2" fill="#0D1421" stroke="#334155" strokeWidth="1.2" />
          <text x="6" y="9" textAnchor="middle" fontSize="6" fill={tone.muted} fontFamily="monospace">{btn.label}</text>
        </g>
      ))}

      {/* Status LED */}
      <circle cx="32" cy="8" r="4" fill={active ? tone.accent : '#484F58'}>
        {active && (
          <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Power/output readings */}
      <rect x="-38" y="22" width="76" height="30" rx="3" fill="#030810" stroke="#1F2A44" strokeWidth="1" />
      <text x="-32" y="33" fontSize="7" fill={tone.muted} fontFamily="monospace">
        {displayNumber(outputVoltage)}V  {displayNumber(current)}A
      </text>
      <text x="-32" y="45" fontSize="7" fill={tone.muted} fontFamily="monospace">
        {displayNumber(outputVoltage * current / 1000)} kW
      </text>

      {/* Bottom cable entry */}
      <rect x="-16" y="58" width="12" height="8" rx="2" fill="#0D1421" stroke="#334155" strokeWidth="1" />
      <rect x="4"  y="58" width="12" height="8" rx="2" fill="#0D1421" stroke="#334155" strokeWidth="1" />

      <text x="0" y="-72" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
    </g>
  )
}
