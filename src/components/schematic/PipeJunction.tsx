import { getStatusTone, place, type SchematicComponentProps } from './types'

export type JunctionType = 'T' | 'cross' | 'elbow'

export interface PipeJunctionProps extends SchematicComponentProps {
  junctionType?: JunctionType
  flowing?: boolean
  pipeSize?: number
}

export default function PipeJunction({
  status = 'offline',
  junctionType = 'T',
  flowing = true,
  pipeSize = 14,
  x = 0,
  y = 0,
  scale = 1,
  label,
  className = '',
  ...rest
}: PipeJunctionProps) {
  const tone = getStatusTone(status)
  const active = flowing

  const ps = pipeSize // pipe stroke width
  const flowDash = `${ps * 2} ${ps}`

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-pipejunction ${className}`} {...rest}>

      {junctionType === 'T' && (
        <>
          {/* Horizontal run */}
          <path d="M-50 0H50" stroke={tone.stroke} strokeWidth={ps} strokeLinecap="round" />
          {/* Branch down */}
          <path d="M0 0V50" stroke={tone.stroke} strokeWidth={ps} strokeLinecap="round" />

          {/* Flow indicator lines */}
          {active && (
            <>
              <path d="M-50 0H0" stroke={tone.accent} strokeWidth={ps * 0.4}
                strokeDasharray={flowDash} strokeLinecap="round" opacity="0.5">
                <animate attributeName="stroke-dashoffset" values="0;-40" dur="1s" repeatCount="indefinite" />
              </path>
              <path d="M0 0V50" stroke={tone.accent} strokeWidth={ps * 0.4}
                strokeDasharray={flowDash} strokeLinecap="round" opacity="0.4">
                <animate attributeName="stroke-dashoffset" values="0;40" dur="1.2s" repeatCount="indefinite" />
              </path>
              <path d="M0 0H50" stroke={tone.accent} strokeWidth={ps * 0.4}
                strokeDasharray={flowDash} strokeLinecap="round" opacity="0.4">
                <animate attributeName="stroke-dashoffset" values="0;40" dur="0.9s" repeatCount="indefinite" />
              </path>
            </>
          )}

          {/* Junction center dot */}
          <circle r={ps * 0.7} fill={tone.accent} opacity={active ? 0.9 : 0.4} />
        </>
      )}

      {junctionType === 'cross' && (
        <>
          <path d="M-50 0H50" stroke={tone.stroke} strokeWidth={ps} strokeLinecap="round" />
          <path d="M0 -50V50" stroke={tone.stroke} strokeWidth={ps} strokeLinecap="round" />

          {active && (
            <>
              <path d="M-50 0H50" stroke={tone.accent} strokeWidth={ps * 0.4}
                strokeDasharray={flowDash} opacity="0.5">
                <animate attributeName="stroke-dashoffset" values="0;-40" dur="1s" repeatCount="indefinite" />
              </path>
              <path d="M0 -50V50" stroke={tone.accent} strokeWidth={ps * 0.4}
                strokeDasharray={flowDash} opacity="0.5">
                <animate attributeName="stroke-dashoffset" values="0;40" dur="1.1s" repeatCount="indefinite" />
              </path>
            </>
          )}
          <circle r={ps * 0.7} fill={tone.accent} opacity={active ? 0.9 : 0.4} />
        </>
      )}

      {junctionType === 'elbow' && (
        <>
          {/* 90° elbow — from right to bottom */}
          <path d="M-50 0 Q0 0 0 50" fill="none" stroke={tone.stroke} strokeWidth={ps} strokeLinecap="round" />

          {active && (
            <path d="M-50 0 Q0 0 0 50" fill="none" stroke={tone.accent} strokeWidth={ps * 0.4}
              strokeDasharray={flowDash} opacity="0.5">
              <animate attributeName="stroke-dashoffset" values="0;-40" dur="1s" repeatCount="indefinite" />
            </path>
          )}
          <circle r={ps * 0.7} fill={tone.accent} opacity={active ? 0.9 : 0.4} cx="0" cy="0" />
        </>
      )}

      {label && (
        <text x="0" y="-28" textAnchor="middle" className="fill-text-muted text-[9px] font-mono">{label}</text>
      )}
    </g>
  )
}
