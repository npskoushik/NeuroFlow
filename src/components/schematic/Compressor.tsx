import { displayNumber, getStatusTone, isOperational, place, type SchematicComponentProps } from './types'

export interface CompressorProps extends SchematicComponentProps {
  pressure?: number
  rpm?: number
}

export default function Compressor({
  status = 'offline',
  pressure = 0,
  rpm = 0,
  x = 0,
  y = 0,
  scale = 1,
  label = 'COMP',
  className = '',
  ...rest
}: CompressorProps) {
  const tone = getStatusTone(status)
  const running = isOperational(status) && rpm > 0

  return (
    <g transform={place(x, y, scale)} className={`schematic-part schematic-compressor ${className}`} {...rest}>
      {/* Pressure Tank Base */}
      <rect x="-70" y="25" width="140" height="25" rx="12.5" fill="#131A2A" stroke={tone.stroke} strokeWidth="2.5" />
      
      {/* Tank Feet */}
      <path d="M-50 50 V60 M50 50 V60" stroke={tone.stroke} strokeWidth="4" strokeLinecap="round" />
      
      {/* Compressor Pump Body */}
      <path d="M-30 25 V-10 L-20 -30 H20 L30 -10 V25 Z" fill="#0D1421" stroke={tone.accent} strokeWidth="2.5" />
      
      {/* Cooling Fins */}
      <g stroke={tone.stroke} strokeWidth="2" strokeLinecap="round">
        <line x1="-26" y1="-5" x2="26" y2="-5" />
        <line x1="-24" y1="-15" x2="24" y2="-15" />
        <line x1="-21" y1="-25" x2="21" y2="-25" />
      </g>
      
      {/* Drive Wheel/Pulley */}
      <circle cx="-45" cy="5" r="20" fill="#1B2436" stroke={tone.accent} strokeWidth="2" />
      <circle cx="-45" cy="5" r="5" fill="#0D1421" stroke={tone.accent} strokeWidth="1.5" />
      {running && (
        <path d="M-45 -15 V25 M-65 5 H-25" stroke={tone.accentSoft} strokeWidth="1">
          <animateTransform attributeName="transform" type="rotate" from="0 -45 5" to="360 -45 5" dur="0.3s" repeatCount="indefinite" />
        </path>
      )}
      
      {/* Air Intake Filter */}
      <rect x="25" y="-35" width="20" height="15" rx="3" fill="#1B2436" stroke={tone.stroke} strokeWidth="2" />
      
      {/* Discharge Pipe */}
      <path d="M0 -30 V-45 H45 V25" fill="none" stroke="#263349" strokeWidth="4" strokeLinejoin="round" />
      
      <text x="0" y="-55" textAnchor="middle" className="fill-text-primary text-[11px] font-mono font-semibold">
        {label}
      </text>
      <text x="0" y="75" textAnchor="middle" className="fill-text-secondary text-[10px] font-mono">
        {displayNumber(pressure)} bar{typeof rpm === 'number' ? ` / ${displayNumber(rpm)} RPM` : ''}
      </text>
    </g>
  )
}
