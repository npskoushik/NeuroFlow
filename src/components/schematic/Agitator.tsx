import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface AgitatorProps extends SchematicComponentProps {
  rpm?: number
  level?: number
  temperature?: number
}

export default function Agitator({
  status = 'offline',
  rpm = 0,
  level = 65,
  temperature,
  x = 0,
  y = 0,
  scale = 1,
  label = 'AGIT',
  className = '',
  ...rest
}: AgitatorProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const running = active && rpm > 0
  const dur = `${Math.max(0.5, 60 / Math.max(rpm, 30)).toFixed(2)}s`
  const clampedLevel = Math.min(100, Math.max(0, level))
  const W = 80, H = 110
  const liquidH = ((H - 16) * clampedLevel) / 100
  const liquidY = 8 + H - 16 - liquidH

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-agitator ${className}`} {...rest}>
      <defs>
        <linearGradient id={`agit-shell-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#1F2A44" />
          <stop offset="100%" stopColor="#0D1421" />
        </linearGradient>
        <clipPath id={`agit-clip-${id}`}>
          <rect x={-W/2 + 4} y="8" width={W - 8} height={H - 16} />
        </clipPath>
      </defs>

      {/* Drive motor on top */}
      <rect x="-14" y="-48" width="28" height="20" rx="4"
        fill="#0D1421" stroke={tone.accent} strokeWidth="2" />
      <text x="0" y="-35" textAnchor="middle" fontSize="8" fill={tone.accent} fontFamily="monospace">M</text>

      {/* Drive shaft */}
      <line x1="0" y1="-28" x2="0" y2={H / 2 + 4}
        stroke="#334155" strokeWidth="4" strokeLinecap="round" />

      {/* Vessel */}
      <rect x={-W/2} y="0" width={W} height={H} rx="14"
        fill={`url(#agit-shell-${id})`} stroke="#5B6B7C" strokeWidth="2.5" />

      {/* Liquid fill */}
      <rect x={-W/2 + 4} y={liquidY} width={W - 8} height={liquidH}
        fill={tone.accent} opacity={active ? 0.38 : 0.2}
        clipPath={`url(#agit-clip-${id})`} />

      {/* Turbulent surface when running */}
      {running && (
        <path d={`M${-W/2+8} ${liquidY} Q${-W/4} ${liquidY-5} 0 ${liquidY} Q${W/4} ${liquidY+5} ${W/2-8} ${liquidY}`}
          fill="none" stroke={tone.accent} strokeWidth="1.5" opacity="0.6"
          clipPath={`url(#agit-clip-${id})`}>
          <animate attributeName="d"
            values={`M${-W/2+8} ${liquidY} Q${-W/4} ${liquidY-5} 0 ${liquidY} Q${W/4} ${liquidY+5} ${W/2-8} ${liquidY};M${-W/2+8} ${liquidY} Q${-W/4} ${liquidY+4} 0 ${liquidY} Q${W/4} ${liquidY-4} ${W/2-8} ${liquidY};M${-W/2+8} ${liquidY} Q${-W/4} ${liquidY-5} 0 ${liquidY} Q${W/4} ${liquidY+5} ${W/2-8} ${liquidY}`}
            dur="1.5s" repeatCount="indefinite" />
        </path>
      )}

      {/* Impeller blades (rotating) */}
      <g transform={`translate(0 ${H * 0.6})`}>
        {running && (
          <animateTransform attributeName="transform" type="rotate"
            from={`0 0 ${H * 0.6}`} to={`360 0 ${H * 0.6}`}
            dur={dur} repeatCount="indefinite" additive="sum" />
        )}
        {/* 4 blades */}
        {[0, 90, 180, 270].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          const x2 = (28 * Math.cos(rad)).toFixed(2)
          const y2 = (28 * Math.sin(rad) + H * 0.6).toFixed(2)
          return (
            <path key={i}
              d={`M0,${H * 0.6} L${x2},${y2}`}
              stroke={i % 2 === 0 ? tone.accent : '#334155'}
              strokeWidth="4" strokeLinecap="round" />
          )
        })}
        {/* Blade tips */}
        {[0, 90, 180, 270].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          return (
            <rect key={i}
              x={(22 * Math.cos(rad) - 5).toFixed(2)}
              y={(22 * Math.sin(rad) + H * 0.6 - 3).toFixed(2)}
              width="10" height="6" rx="1"
              fill={tone.accentSoft} stroke={tone.accent} strokeWidth="1"
              transform={`rotate(${deg} ${(22 * Math.cos(rad)).toFixed(2)} ${(22 * Math.sin(rad) + H * 0.6).toFixed(2)})`} />
          )
        })}
        <circle cy={H * 0.6} r="4" fill={tone.accent} />
      </g>

      {/* Baffles */}
      {[-1, 1].map(side => (
        <rect key={side} x={side * (W / 2 - 8)} y="20" width="6" height={H - 40} rx="2"
          fill="#1F2A44" stroke="#334155" strokeWidth="1" />
      ))}

      {/* Side nozzle */}
      <line x1={-W/2} y1={H * 0.8} x2={-W/2 - 16} y2={H * 0.8}
        stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />

      <text x="0" y="-62" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y={H + 18} textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(rpm)} RPM · {displayNumber(clampedLevel)}%
      </text>
      {typeof temperature === 'number' && (
        <text x="0" y={H + 32} textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
          {displayNumber(temperature)}°C
        </text>
      )}
    </g>
  )
}
