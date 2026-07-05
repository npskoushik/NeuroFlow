import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface ElectricPanelProps extends SchematicComponentProps {
  voltage?: number
  current?: number
  powerFactor?: number
}

export default function ElectricPanel({
  status = 'offline',
  voltage = 0,
  current = 0,
  powerFactor,
  x = 0,
  y = 0,
  scale = 1,
  label = 'MCC',
  className = '',
  ...rest
}: ElectricPanelProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const active = isOperational(status)

  // Panel dimensions
  const W = 80, H = 110

  const breakerStates = [true, true, active, active, active, false]
  const indicatorColors = [
    active ? '#00E676' : '#484F58',
    active ? '#FFB800' : '#484F58',
    status === 'critical' ? '#FF3B3B' : '#484F58',
  ]

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-electricpanel ${className}`} {...rest}>
      {/* Panel enclosure */}
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx="6"
        fill="#0A1020" stroke={tone.accent} strokeWidth="2.5" />

      {/* Inner door */}
      <rect x={-W / 2 + 4} y={-H / 2 + 4} width={W - 8} height={H - 8} rx="4"
        fill="#0D1421" stroke="#1F2A44" strokeWidth="1.5" />

      {/* Title bar */}
      <rect x={-W / 2 + 4} y={-H / 2 + 4} width={W - 8} height="16" rx="3"
        fill="#1F2A44" />
      <text x="0" y={-H / 2 + 15} textAnchor="middle" fontSize="8" fill={tone.accent} fontFamily="monospace" fontWeight="bold">
        {label}
      </text>

      {/* Indicator lights row */}
      <g transform={`translate(0, ${-H / 2 + 28})`}>
        {indicatorColors.map((color, i) => (
          <g key={i} transform={`translate(${(i - 1) * 18}, 0)`}>
            <circle r="5" fill={color} opacity={active ? 1 : 0.4}>
              {active && i === 0 && (
                <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
              )}
            </circle>
            <circle r="7" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
          </g>
        ))}
      </g>

      {/* Circuit breakers — 2 columns of 3 */}
      {breakerStates.map((on, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const bx = col === 0 ? -22 : 4
        const by = -H / 2 + 46 + row * 20
        return (
          <g key={i} transform={`translate(${bx}, ${by})`}>
            <rect width="16" height="14" rx="2" fill={on ? '#1F2A44' : '#0D1421'} stroke={on ? tone.accent : '#334155'} strokeWidth="1.5" />
            {/* Breaker handle */}
            <rect x="5" y={on ? "2" : "6"} width="6" height="6" rx="1"
              fill={on ? tone.accent : '#484F58'} />
          </g>
        )
      })}

      {/* Bus bar at top */}
      <rect x={-W / 2 + 8} y={-H / 2 + 40} width={W - 16} height="3" rx="1"
        fill={tone.accent} opacity={active ? 0.6 : 0.2} />

      {/* Readings at bottom */}
      <rect x={-W / 2 + 4} y={H / 2 - 28} width={W - 8} height="24" rx="3"
        fill="#030810" stroke="#1F2A44" strokeWidth="1" />
      <text x={-W / 2 + 14} y={H / 2 - 17} fontSize="8" fill={tone.accent} fontFamily="monospace">
        {displayNumber(voltage)}V
      </text>
      <text x={W / 2 - 14} y={H / 2 - 17} textAnchor="end" fontSize="8" fill={tone.muted} fontFamily="monospace">
        {displayNumber(current)}A
      </text>
      {typeof powerFactor === 'number' && (
        <text x="0" y={H / 2 - 7} textAnchor="middle" fontSize="7" fill={tone.muted} fontFamily="monospace">
          PF {displayNumber(powerFactor)}
        </text>
      )}

      <text x="0" y={-H / 2 - 14} textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
    </g>
  )
}
