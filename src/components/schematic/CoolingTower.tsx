import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface CoolingTowerProps extends SchematicComponentProps {
  inletTemp?: number
  outletTemp?: number
  fanRpm?: number
}

export default function CoolingTower({
  status = 'offline',
  inletTemp = 45,
  outletTemp = 30,
  fanRpm = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'COOL TWR',
  className = '',
  ...rest
}: CoolingTowerProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const fanDur = fanRpm > 0 ? `${Math.max(0.4, 60 / Math.max(fanRpm, 60)).toFixed(2)}s` : '999s'

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-coolingtower ${className}`} {...rest}>
      <defs>
        <linearGradient id={`ct-body-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1F2A44" />
          <stop offset="100%" stopColor="#0B1020" />
        </linearGradient>
      </defs>

      {/* Tower body — trapezoidal (wider at bottom) */}
      <path d="M-30 -70 L-42 60 L42 60 L30 -70 Z"
        fill={`url(#ct-body-${id})`} stroke={tone.accent} strokeWidth="2.5" />

      {/* Louvers / slats */}
      {[-20, -5, 10, 25, 40].map((yy, i) => (
        <line key={i} x1={-28 - i * 1.2} y1={yy} x2={28 + i * 1.2} y2={yy}
          stroke="#263349" strokeWidth="2" />
      ))}

      {/* Water basin at bottom */}
      <rect x="-44" y="58" width="88" height="14" rx="4"
        fill="#0D1421" stroke="#334155" strokeWidth="1.5" />
      <rect x="-38" y="60" width={76 * 0.7} height="10" rx="3"
        fill="#00D4FF" opacity={active ? 0.4 : 0.15} />

      {/* Fan at top */}
      <g transform="translate(0 -58)">
        {active && fanRpm > 0 && (
          <animateTransform attributeName="transform" type="rotate"
            from="0 0 -58" to="360 0 -58" dur={fanDur} repeatCount="indefinite" additive="sum" />
        )}
        <ellipse rx="24" ry="6" fill={tone.accentSoft} stroke={tone.accent} strokeWidth="1.5"
          transform="translate(0 -58)" />
        <line x1="-22" y1="-58" x2="22" y2="-58" stroke={tone.accent} strokeWidth="2.5" opacity="0.8"
          transform={`rotate(0)`} />
        <line x1="0" y1="-80" x2="0" y2="-36" stroke={tone.accent} strokeWidth="2.5" opacity="0.8"
          transform={`translate(0 0)`} />
      </g>

      {/* Drift droplets animation */}
      {active && (
        <>
          {[{ x: -8, delay: '0s' }, { x: 6, delay: '0.5s' }, { x: 16, delay: '1s' }].map((d, i) => (
            <circle key={i} cx={d.x} cy="-50" r="2" fill="#00D4FF" opacity="0.7">
              <animateMotion dur="1.6s" begin={d.delay} repeatCount="indefinite"
                path={`M0,0 C${d.x > 0 ? 6 : -6},20 ${d.x > 0 ? 10 : -10},40 0,70`} />
            </circle>
          ))}
        </>
      )}

      {/* Hot water inlet */}
      <path d="M0 -70V-90" stroke="#FF6B35" strokeWidth="8" strokeLinecap="round" />
      <text x="10" y="-82" fontSize="7" fill="#FF6B35" fontFamily="monospace">HOT</text>

      {/* Cold water outlet */}
      <path d="M0 72V92" stroke="#00D4FF" strokeWidth="8" strokeLinecap="round" />

      <text x="0" y="-104" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="108" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(inletTemp)}→{displayNumber(outletTemp)} °C
      </text>
    </g>
  )
}
