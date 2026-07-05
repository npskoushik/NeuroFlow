import { useId } from 'react'
import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface GearboxProps extends SchematicComponentProps {
  inputRpm?: number
  outputRpm?: number
  ratio?: number
}

function GearTeeth({ r, teeth, id: gid, fill, stroke }: { r: number; teeth: number; id: string; fill: string; stroke: string }) {
  const toothH = r * 0.22
  const angles = Array.from({ length: teeth }, (_, i) => (i / teeth) * 2 * Math.PI)
  const pts = angles.flatMap(a => {
    const w = (Math.PI / teeth) * 0.55
    const inner = r
    const outer = r + toothH
    const cos1 = Math.cos(a - w), sin1 = Math.sin(a - w)
    const cos2 = Math.cos(a + w), sin2 = Math.sin(a + w)
    return [
      `${(inner * cos1).toFixed(2)},${(inner * sin1).toFixed(2)}`,
      `${(outer * cos1).toFixed(2)},${(outer * sin1).toFixed(2)}`,
      `${(outer * cos2).toFixed(2)},${(outer * sin2).toFixed(2)}`,
      `${(inner * cos2).toFixed(2)},${(inner * sin2).toFixed(2)}`,
    ]
  })
  return (
    <polygon points={pts.join(' ')} fill={fill} stroke={stroke} strokeWidth="1" id={gid} />
  )
}

export default function Gearbox({
  status = 'offline',
  inputRpm = 0,
  outputRpm = 0,
  ratio = 3,
  x = 0,
  y = 0,
  scale = 1,
  label = 'GEARBOX',
  className = '',
  ...rest
}: GearboxProps) {
  const id = useId().replace(/:/g, '')
  const tone = getStatusTone(status)
  const running = isOperational(status) && inputRpm > 0
  const bigDur  = running ? `${(60 / Math.max(inputRpm, 10)).toFixed(2)}s` : '999s'
  const smallDur = running ? `${(60 / Math.max(outputRpm || inputRpm * ratio, 10)).toFixed(2)}s` : '999s'

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-gearbox ${className}`} {...rest}>
      {/* Housing */}
      <rect x="-70" y="-52" width="140" height="104" rx="10"
        fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      <rect x="-62" y="-44" width="124" height="88" rx="6"
        fill="none" stroke="#1F2A44" strokeWidth="1" />

      {/* Input shaft */}
      <line x1="-70" y1="0" x2="-100" y2="0" stroke={tone.stroke} strokeWidth="12" strokeLinecap="round" />
      {/* Output shaft */}
      <line x1="70" y1="0" x2="100" y2="0" stroke={tone.stroke} strokeWidth="12" strokeLinecap="round" />

      {/* Large drive gear (left) */}
      <g>
        {running && (
          <animateTransform attributeName="transform" type="rotate"
            from="0" to="360" dur={bigDur} repeatCount="indefinite" />
        )}
        <GearTeeth r={28} teeth={12} id={`gear-big-${id}`} fill={tone.accentSoft} stroke={tone.accent} />
        <circle r="8" fill={tone.accent} opacity={running ? 1 : 0.6} />
        <circle r="4" fill="#0D1421" />
      </g>

      {/* Small driven gear (right) */}
      <g transform="translate(46 0)">
        {running && (
          <animateTransform attributeName="transform" type="rotate"
            from="360" to="0" dur={smallDur} repeatCount="indefinite"
            additive="sum" />
        )}
        <GearTeeth r={16} teeth={8} id={`gear-small-${id}`} fill={tone.accentSoft} stroke={tone.accent} />
        <circle r="5" fill={tone.accent} opacity={running ? 1 : 0.6} />
        <circle r="2.5" fill="#0D1421" />
      </g>

      <text x="0" y="-64" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">{label}</text>
      <text x="0" y="70" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(inputRpm)} → {displayNumber(outputRpm)} RPM
      </text>
      <text x="0" y="84" textAnchor="middle" className="fill-text-muted text-[9px] font-mono">
        ratio {ratio}:1
      </text>
    </g>
  )
}
