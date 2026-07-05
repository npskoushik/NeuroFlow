import { useId } from 'react'
import { displayNumber, getStatusTone, isAlert, place, type SchematicComponentProps } from './types'

export interface PressureReliefProps extends SchematicComponentProps {
  setPoint?: number
  pressure?: number
}

export default function PressureRelief({
  status = 'offline',
  setPoint = 10,
  pressure = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'PRV',
  className = '',
  ...rest
}: PressureReliefProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const alert = isAlert(status)
  const popping = alert || pressure >= setPoint * 0.95

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-pressurerelief ${className}`} {...rest}>
      <defs>
        <filter id={`prv-glow-${id}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Inline pipe */}
      <path d="M-54 0H-20M20 0H54" stroke={tone.stroke} strokeWidth="14" strokeLinecap="round" />

      {/* Valve body */}
      <rect x="-22" y="-18" width="44" height="36" rx="6"
        fill="#0D1421" stroke={tone.accent} strokeWidth="2.5"
        style={{ filter: popping ? `url(#prv-glow-${id})` : undefined }} />

      {/* Disc / poppet */}
      <ellipse cx="0" cy={popping ? -14 : -4} rx="12" ry="5"
        fill={popping ? tone.accent : '#263349'} stroke={tone.accent} strokeWidth="2">
        {popping && (
          <animate attributeName="cy" values="-14;-18;-14" dur="0.3s" repeatCount="indefinite" />
        )}
      </ellipse>

      {/* Stem */}
      <line x1="0" y1={popping ? -19 : -9} x2="0" y2="-32"
        stroke={tone.accent} strokeWidth="3" strokeLinecap="round">
        {popping && (
          <animate attributeName="y1" values="-19;-22;-19" dur="0.3s" repeatCount="indefinite" />
        )}
      </line>

      {/* Spring coils on stem */}
      {[0, 1, 2, 3].map(i => (
        <path key={i}
          d={`M-4 ${-32 - i * 6} Q0 ${-35 - i * 6} 4 ${-32 - i * 6}`}
          fill="none" stroke="#334155" strokeWidth="1.5" />
      ))}

      {/* Bonnet cap */}
      <rect x="-8" y="-58" width="16" height="10" rx="3"
        fill="#1F2A44" stroke={tone.accent} strokeWidth="1.5" />

      {/* Exhaust vent (top) — shows steam when popping */}
      {popping && (
        <>
          <path d="M0 -58V-80" stroke="#FF6B35" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
          {[{ x: -6, delay: '0s' }, { x: 6, delay: '0.2s' }, { x: 0, delay: '0.4s' }].map((d, i) => (
            <circle key={i} cx={d.x} cy="-72" r="2.5" fill="#FF6B35" opacity="0">
              <animate attributeName="cy" values="-72;-92" dur="0.8s" begin={d.delay} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="0.8s" begin={d.delay} repeatCount="indefinite" />
              <animate attributeName="r" values="2;5" dur="0.8s" begin={d.delay} repeatCount="indefinite" />
            </circle>
          ))}
        </>
      )}

      <text x="0" y="-94" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="34" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        Set: {displayNumber(setPoint)} bar
      </text>
      <text x="0" y="48" textAnchor="middle" className={`text-[9px] font-mono font-bold ${popping ? 'fill-status-critical' : 'fill-text-muted'}`}>
        {popping ? 'RELIEVING' : `${displayNumber(pressure)} bar`}
      </text>
    </g>
  )
}
