import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface PulleyProps extends SchematicComponentProps {
  speed?: number
  tension?: number
  ratio?: number
}

export default function Pulley({
  status = 'offline',
  speed = 0,
  tension = 0,
  ratio = 2,
  x = 0,
  y = 0,
  scale = 1,
  label = 'PULLEY',
  className = '',
  ...rest
}: PulleyProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const running = isOperational(status) && speed > 0
  const dur = `${Math.max(0.5, 60 / Math.max(speed, 30)).toFixed(2)}s`
  const smallDur = `${Math.max(0.25, 60 / Math.max(speed * ratio, 60)).toFixed(2)}s`

  // Large pulley: r=28 at left, small: r=14 at right
  // Belt tangent lines: top at y = -28/-14, bottom at y = 28/14
  const beltOffset = 2 // belt thickness visual

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-pulley ${className}`} {...rest}>
      <defs>
        <marker id={`belt-arrow-${id}`} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill={tone.accent} opacity="0.6" />
        </marker>
      </defs>

      {/* Belt strands */}
      {/* Top strand */}
      <path d={`M-50 -${28 + beltOffset} L36 -${14 + beltOffset}`}
        fill="none" stroke={tone.accent} strokeWidth="4" opacity={running ? 0.6 : 0.25}>
        {running && (
          <animate attributeName="stroke-dashoffset" values="0;-20" dur={dur}
            repeatCount="indefinite" />
        )}
      </path>
      {/* Bottom strand */}
      <path d={`M-50 ${28 + beltOffset} L36 ${14 + beltOffset}`}
        fill="none" stroke={tone.accent} strokeWidth="4" opacity={running ? 0.5 : 0.2}>
        {running && (
          <animate attributeName="stroke-dashoffset" values="-20;0" dur={dur}
            repeatCount="indefinite" />
        )}
      </path>

      {/* Drive shaft */}
      <line x1="-80" y1="0" x2="-50" y2="0" stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />

      {/* Large drive pulley (left) */}
      <g transform="translate(-50 0)">
        {running && (
          <animateTransform attributeName="transform" type="rotate"
            from="0 -50 0" to="360 -50 0" dur={dur} repeatCount="indefinite" additive="sum" />
        )}
        <circle cx="-50" cy="0" r="28" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
        <circle cx="-50" cy="0" r="18" fill={tone.accentSoft} stroke="#334155" strokeWidth="1.5" />
        {/* Hub spokes */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <line key={i}
            x1={(-50 + 10 * Math.cos(deg * Math.PI / 180)).toFixed(2)}
            y1={(10 * Math.sin(deg * Math.PI / 180)).toFixed(2)}
            x2={(-50 + 24 * Math.cos(deg * Math.PI / 180)).toFixed(2)}
            y2={(24 * Math.sin(deg * Math.PI / 180)).toFixed(2)}
            stroke="#334155" strokeWidth="2" />
        ))}
        <circle cx="-50" cy="0" r="5" fill={tone.accent} />
      </g>

      {/* Small driven pulley (right) */}
      <g transform="translate(36 0)">
        {running && (
          <animateTransform attributeName="transform" type="rotate"
            from="360 36 0" to="0 36 0" dur={smallDur} repeatCount="indefinite" additive="sum" />
        )}
        <circle cx="36" cy="0" r="14" fill="#0D1421" stroke={tone.accent} strokeWidth="2" />
        <circle cx="36" cy="0" r="8" fill={tone.accentSoft} stroke="#334155" strokeWidth="1.5" />
        {[0, 90, 180, 270].map((deg, i) => (
          <line key={i}
            x1={(36 + 4 * Math.cos(deg * Math.PI / 180)).toFixed(2)}
            y1={(4 * Math.sin(deg * Math.PI / 180)).toFixed(2)}
            x2={(36 + 11 * Math.cos(deg * Math.PI / 180)).toFixed(2)}
            y2={(11 * Math.sin(deg * Math.PI / 180)).toFixed(2)}
            stroke="#334155" strokeWidth="1.5" />
        ))}
        <circle cx="36" cy="0" r="3" fill={tone.accent} />
      </g>

      {/* Shaft out */}
      <line x1="50" y1="0" x2="70" y2="0" stroke={tone.stroke} strokeWidth="8" strokeLinecap="round" />

      <text x="-16" y="-44" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="-16" y="48" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(speed)} m/min · T:{displayNumber(tension)}N
      </text>
    </g>
  )
}
