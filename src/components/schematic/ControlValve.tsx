import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface ControlValveProps extends SchematicComponentProps {
  open?: boolean
  signal?: number
}

export default function ControlValve({
  status = 'offline',
  open,
  signal = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'CV',
  className = '',
  ...rest
}: ControlValveProps) {
  const tone = getStatusTone(status)
  const isOpen = open ?? isOperational(status)

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-control-valve ${className}`} {...rest}>
      <path d="M-64 0H-30M30 0H64" stroke={tone.stroke} strokeWidth="14" strokeLinecap="round" />
      <path d="M-30 -25L0 0L-30 25Z" fill={isOpen ? tone.accentSoft : '#0D1421'} stroke={tone.accent} strokeWidth="2.5" />
      <path d="M30 -25L0 0L30 25Z" fill={isOpen ? tone.accentSoft : '#0D1421'} stroke={tone.accent} strokeWidth="2.5" />
      <line x1="0" y1="-31" x2="0" y2="-58" stroke={tone.stroke} strokeWidth="5" strokeLinecap="round" />
      <rect x="-26" y="-94" width="52" height="36" rx="7" fill="#101827" stroke={tone.accent} strokeWidth="2" />
      <path d="M-12 -72h24" stroke={tone.accent} strokeWidth="3" strokeLinecap="round" />
      <text x="0" y="-101" textAnchor="middle" className="fill-text-primary text-[10px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="52" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(signal)}%
      </text>
    </g>
  )
}
