import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface SiloProps extends SchematicComponentProps {
  level?: number
  temperature?: number
  capacity?: number
}

export default function Silo({
  status = 'offline',
  level = 70,
  temperature,
  capacity,
  x = 0,
  y = 0,
  scale = 1,
  label = 'SILO',
  className = '',
  ...rest
}: SiloProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)
  const clampedLevel = Math.min(100, Math.max(0, level))

  const bodyH = 130
  const bodyW = 70
  const coneH = 48

  // Fill height within cylindrical section
  const maxFillH = bodyH - 10
  const fillH = (maxFillH * clampedLevel) / 100
  const fillY = 10 + bodyH - fillH

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-silo ${className}`} {...rest}>
      <defs>
        <linearGradient id={`silo-body-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#1F2A44" />
          <stop offset="50%" stopColor="#0D1421" />
          <stop offset="100%" stopColor="#1F2A44" />
        </linearGradient>
        <clipPath id={`silo-clip-${id}`}>
          <rect x={-bodyW / 2} y="0" width={bodyW} height={bodyH} />
        </clipPath>
      </defs>

      {/* Conical roof */}
      <path d={`M${-bodyW / 2} 0 L0 -38 L${bodyW / 2} 0 Z`}
        fill="#1F2A44" stroke={tone.accent} strokeWidth="2" />
      {/* Vent on top */}
      <rect x="-6" y="-42" width="12" height="8" rx="2"
        fill="#0D1421" stroke="#334155" strokeWidth="1.5" />

      {/* Cylinder body */}
      <rect x={-bodyW / 2} y="0" width={bodyW} height={bodyH} rx="0"
        fill={`url(#silo-body-${id})`} stroke={tone.accent} strokeWidth="2.5" />

      {/* Fill level */}
      <rect x={-bodyW / 2 + 4} y={fillY} width={bodyW - 8} height={fillH}
        fill={tone.accent} opacity={active ? 0.38 : 0.18}
        clipPath={`url(#silo-clip-${id})`} />

      {/* Fill surface waves */}
      {active && fillH > 5 && (
        <path d={`M${-bodyW / 2 + 4} ${fillY} Q0 ${fillY - 4} ${bodyW / 2 - 4} ${fillY}`}
          fill="none" stroke={tone.accent} strokeWidth="1.5" opacity="0.7">
          <animate attributeName="d"
            values={`M${-bodyW/2+4} ${fillY} Q0 ${fillY-4} ${bodyW/2-4} ${fillY};M${-bodyW/2+4} ${fillY} Q0 ${fillY+3} ${bodyW/2-4} ${fillY};M${-bodyW/2+4} ${fillY} Q0 ${fillY-4} ${bodyW/2-4} ${fillY}`}
            dur="3s" repeatCount="indefinite" />
        </path>
      )}

      {/* Level graduation marks */}
      {[25, 50, 75].map(pct => {
        const ly = 10 + bodyH - (maxFillH * pct / 100)
        return (
          <g key={pct}>
            <line x1={bodyW / 2} y1={ly} x2={bodyW / 2 + 8} y2={ly}
              stroke="#334155" strokeWidth="1.5" />
            <text x={bodyW / 2 + 12} y={ly + 4} fontSize="7"
              fill={tone.muted} fontFamily="monospace">{pct}%</text>
          </g>
        )
      })}

      {/* Conical discharge hopper */}
      <path d={`M${-bodyW / 2} ${bodyH} L-10 ${bodyH + coneH} L10 ${bodyH + coneH} L${bodyW / 2} ${bodyH} Z`}
        fill={`url(#silo-body-${id})`} stroke={tone.accent} strokeWidth="2" />

      {/* Discharge gate */}
      <rect x="-12" y={bodyH + coneH} width="24" height="10" rx="2"
        fill="#0D1421" stroke={tone.accent} strokeWidth="1.5" />
      <line x1="-10" y1={bodyH + coneH + 5} x2="10" y2={bodyH + coneH + 5}
        stroke={active ? tone.accent : '#334155'} strokeWidth="2" />

      {/* Discharge chute */}
      <line x1="0" y1={bodyH + coneH + 10} x2="0" y2={bodyH + coneH + 28}
        stroke={tone.stroke} strokeWidth="10" strokeLinecap="round" />

      {/* Particulate flow when active */}
      {active && (
        <>
          {[-4, 0, 4].map((xx, i) => (
            <circle key={i} cx={xx} cy={bodyH + coneH + 14} r="2" fill={tone.accent} opacity="0">
              <animate attributeName="cy"
                values={`${bodyH + coneH + 14};${bodyH + coneH + 26}`}
                dur="0.9s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="0.9s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </>
      )}

      {/* Inspection door */}
      <rect x={bodyW / 2 - 2} y={bodyH * 0.4} width="8" height="20" rx="2"
        fill="#0D1421" stroke="#334155" strokeWidth="1" />

      <text x="0" y="-52" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x={-bodyW / 2 - 4} y={bodyH / 2 + 8} textAnchor="end" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(clampedLevel)}%
      </text>
      {typeof temperature === 'number' && (
        <text x="0" y={bodyH + coneH + 46} textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
          {displayNumber(temperature)}°C
        </text>
      )}
      {typeof capacity === 'number' && (
        <text x="0" y={bodyH + coneH + 58} textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
          {displayNumber(capacity)} t
        </text>
      )}
    </g>
  )
}
