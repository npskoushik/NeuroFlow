import { getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface PipeProps extends SchematicComponentProps {
  length?: number
  thickness?: number
  orientation?: 'horizontal' | 'vertical'
  flow?: boolean
}

export default function Pipe({
  status = 'offline',
  length = 160,
  thickness = 16,
  orientation = 'horizontal',
  flow,
  x = 0,
  y = 0,
  scale = 1,
  className = '',
  ...rest
}: PipeProps) {
  const tone = getStatusTone(status)
  const active = flow ?? isOperational(status)
  const rotate = orientation === 'vertical' ? ' rotate(90)' : ''

  return (
    <g transform={`${place(x, y, scale)}${rotate}`} className={`schematic-part schematic-pipe ${className}`} {...rest}>
      <line x1="0" y1="0" x2={length} y2="0" stroke="#263349" strokeWidth={thickness + 6} strokeLinecap="round" />
      <line x1="0" y1="0" x2={length} y2="0" stroke={tone.stroke} strokeWidth={thickness} strokeLinecap="round" />
      <line
        x1="0"
        y1="0"
        x2={length}
        y2="0"
        stroke={tone.accent}
        strokeWidth={Math.max(4, thickness * 0.34)}
        strokeLinecap="round"
        strokeDasharray="10 10"
        opacity={active ? 0.85 : 0.18}
        className={active ? 'flow-animate' : undefined}
      />
    </g>
  )
}
