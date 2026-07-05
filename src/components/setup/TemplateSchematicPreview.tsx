import { useRef, useState, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react'
import type { MachineTemplate, ComponentTemplate } from '../../data/machineTemplates'
import type { LiveSignal } from '../../hooks/useSimulator'
import {
  Boiler, CNCMachine, Compressor, Conveyor, Fan, FillingStation, Filter,
  Gauge, Hopper, Mixer, Motor, Pipe, Pump, Reactor, RobotArm,
  SchematicCanvas, SensorNode, Tank, Valve,
} from '../schematic'

// ── Signal extraction helpers ───────────────────────────────────────
/** Find first live signal whose name matches any keyword */
function findSignal(signals: LiveSignal[], ...keywords: string[]): LiveSignal | undefined {
  const kw = keywords.map(k => k.toLowerCase())
  return signals.find(s => kw.some(k => s.name.toLowerCase().includes(k)))
}

function signalValue(signals: LiveSignal[], fallback: number, ...keywords: string[]): number {
  return findSignal(signals, ...keywords)?.value ?? fallback
}

function signalStatus(signals: LiveSignal[], ...keywords: string[]): string {
  const sig = findSignal(signals, ...keywords)
  return sig?.status ?? 'online'
}

/** Derive overall component status from the most severe related signal */
function componentStatus(signals: LiveSignal[], ...keywords: string[]): 'running' | 'warning' | 'critical' | 'online' {
  const matches = signals.filter(s => keywords.some(k => s.name.toLowerCase().includes(k.toLowerCase())))
  if (matches.some(s => s.status === 'critical')) return 'critical'
  if (matches.some(s => s.status === 'warning'))  return 'warning'
  if (matches.length > 0) return 'running'
  return 'online'
}

/** Map 0-100% flow rate value to pipe flow speed class */
function pipeFlowStatus(signals: LiveSignal[], running: boolean): 'running' | 'online' | 'offline' {
  if (!running) return 'offline'
  const flow = findSignal(signals, 'flow', 'rate', 'throughput')
  if (!flow) return 'running'
  if (flow.status === 'critical') return 'critical' as any
  return 'running'
}

function componentKey(c: ComponentTemplate) {
  return `${c.id} ${c.label}`.toLowerCase()
}

// ── Live component renderer ─────────────────────────────────────────
function renderLiveComponent(
  component: ComponentTemplate,
  x: number,
  y: number,
  index: number,
  signals: LiveSignal[],
  running: boolean,
) {
  const key = componentKey(component)
  const label = component.label.length > 14 ? component.label.slice(0, 13) + '…' : component.label
  const baseProps = {
    x, y, label,
    scale: 0.78,
  } as const

  // ── PUMP ────────────────────────────────────────────────────────
  if (key.includes('pump') && !key.includes('vacuum') && !key.includes('dosing') && !key.includes('feed')) {
    const rpm   = signalValue(signals, running ? 1450 : 0, 'rpm', 'speed', 'motor speed')
    const temp  = signalValue(signals, 64, 'temp', 'bearing temp', 'coolant')
    const stat  = running ? (componentStatus(signals, 'temp', 'rpm', 'vibration') || 'running') : 'offline'
    return <Pump key={`${component.id}-${index}`} {...baseProps} rpm={running ? rpm : 0} temperature={temp} status={stat} />
  }

  // ── DOSING / FEED / VACUUM PUMP ─────────────────────────────────
  if (key.includes('pump')) {
    const rpm  = signalValue(signals, running ? 960 : 0, 'rpm', 'speed', 'flow')
    const temp = signalValue(signals, 45, 'temp')
    return <Pump key={`${component.id}-${index}`} {...baseProps} rpm={running ? rpm : 0} temperature={temp} status={running ? 'running' : 'offline'} />
  }

  // ── TANK / VESSEL / SILO / RECEIVER ─────────────────────────────
  if (key.includes('tank') || key.includes('silo') || key.includes('vessel') || key.includes('receiver') || key.includes('buffer') || key.includes('storage')) {
    const level = signalValue(signals, 64, 'level', 'tank level', 'water level', 'basin')
    const temp  = signalValue(signals, undefined as any, 'temp', 'inlet temp', 'outlet temp')
    const stat  = componentStatus(signals, 'level', 'temp') || 'online'
    return <Tank key={`${component.id}-${index}`} {...baseProps} level={level} temperature={typeof temp === 'number' ? temp : undefined} status={stat} />
  }

  // ── HOPPER / FEEDER / BIN ───────────────────────────────────────
  if (key.includes('hopper') || key.includes('feeder') || key.includes('bin')) {
    const level = signalValue(signals, 72, 'hopper', 'level', 'silo')
    return <Hopper key={`${component.id}-${index}`} {...baseProps} level={running ? level : Math.max(level - 5, 0)} status={running ? 'running' : 'idle'} />
  }

  // ── VALVE (all types) ───────────────────────────────────────────
  if (key.includes('valve') || key.includes('gate') || key.includes('prv') || key.includes('relief')) {
    const flow = findSignal(signals, 'flow', 'rate')
    const open = running && (flow ? flow.value > flow.min + (flow.max - flow.min) * 0.1 : true)
    return <Valve key={`${component.id}-${index}`} {...baseProps} open={open} status={running ? (open ? 'online' : 'idle') : 'offline'} />
  }

  // ── FILTER / STRAINER ───────────────────────────────────────────
  if (key.includes('filter') || key.includes('strainer') || key.includes('screen')) {
    const dp = signalValue(signals, 1.8, 'differential', 'filter', 'dp', 'pressure drop')
    const stat = componentStatus(signals, 'differential', 'filter dp') || 'online'
    return <Filter key={`${component.id}-${index}`} {...baseProps} differentialPressure={dp} status={stat} />
  }

  // ── FAN / BLOWER / EXHAUST ──────────────────────────────────────
  if (key.includes('fan') || key.includes('blower') || key.includes('exhaust')) {
    const rpm = signalValue(signals, running ? 960 : 0, 'fan speed', 'fan rpm', 'rpm', 'speed')
    return <Fan key={`${component.id}-${index}`} {...baseProps} rpm={running ? rpm : 0} status={running ? 'running' : 'offline'} />
  }

  // ── COMPRESSOR ──────────────────────────────────────────────────
  if (key.includes('compressor')) {
    const pressure = signalValue(signals, 7.2, 'discharge pressure', 'outlet pressure', 'pressure')
    const rpm      = signalValue(signals, running ? 980 : 0, 'rpm', 'speed')
    const stat     = componentStatus(signals, 'pressure', 'temp', 'rpm') || (running ? 'running' : 'offline')
    return <Compressor key={`${component.id}-${index}`} {...baseProps} pressure={pressure} rpm={running ? rpm : 0} status={stat} />
  }

  // ── MOTOR / DRIVE / ENGINE / SPINDLE ────────────────────────────
  if (key.includes('motor') || key.includes('drive') || key.includes('engine') || key.includes('spindle') || key.includes('servo')) {
    const rpm  = signalValue(signals, running ? 1280 : 0, 'rpm', 'speed', 'spindle speed', 'motor speed')
    const temp = signalValue(signals, 58, 'motor temp', 'spindle temp', 'temp', 'bearing temp')
    const stat = componentStatus(signals, 'rpm', 'temp', 'current', 'load') || (running ? 'running' : 'offline')
    return <Motor key={`${component.id}-${index}`} {...baseProps} rpm={running ? rpm : 0} temperature={temp} status={stat} />
  }

  // ── CONVEYOR / BELT ─────────────────────────────────────────────
  if (key.includes('conveyor') || key.includes('belt')) {
    const speed = signalValue(signals, running ? 1.8 : 0, 'belt speed', 'speed', 'line speed')
    const stat  = componentStatus(signals, 'speed', 'motor', 'tension', 'load') || (running ? 'running' : 'offline')
    return <Conveyor key={`${component.id}-${index}`} {...baseProps} speed={running ? speed : 0} length={130} status={stat} />
  }

  // ── BOILER / HEATER / BURNER / DRYER / OVEN ─────────────────────
  if (key.includes('boiler') || key.includes('burner') || key.includes('heater') || key.includes('oven') || key.includes('dryer')) {
    const temp     = signalValue(signals, 145, 'temp', 'zone', 'drum', 'inlet', 'steam temp', 'water temp')
    const pressure = signalValue(signals, 6.2, 'steam pressure', 'pressure', 'header')
    const stat     = componentStatus(signals, 'temp', 'pressure', 'water level') || (running ? 'running' : 'offline')
    return <Boiler key={`${component.id}-${index}`} {...baseProps} temperature={temp} pressure={pressure} status={stat} />
  }

  // ── REACTOR / FERMENTER / AUTOCLAVE / SEPARATOR ─────────────────
  if (key.includes('reactor') || key.includes('fermenter') || key.includes('autoclave') || key.includes('chamber') || key.includes('separator')) {
    const level = signalValue(signals, 58, 'level', 'tank level', 'froth', 'fill')
    const temp  = signalValue(signals, 72, 'temp', 'ferment', 'chamber temp')
    const stat  = componentStatus(signals, 'temp', 'pressure', 'level') || (running ? 'running' : 'offline')
    return <Reactor key={`${component.id}-${index}`} {...baseProps} level={level} temperature={temp} status={stat} />
  }

  // ── MIXER / AGITATOR / IMPELLER ─────────────────────────────────
  if (key.includes('mixer') || key.includes('agitator') || key.includes('impeller')) {
    const rpm   = signalValue(signals, running ? 320 : 0, 'agitator', 'mixer', 'impeller', 'rpm', 'speed')
    const level = signalValue(signals, 68, 'level', 'tank')
    return <Mixer key={`${component.id}-${index}`} {...baseProps} rpm={running ? rpm : 0} level={level} status={running ? 'running' : 'offline'} />
  }

  // ── ROBOT / ARM / GRIPPER ───────────────────────────────────────
  if (key.includes('robot') || key.includes('arm') || key.includes('gripper')) {
    const angle = signalValue(signals, -18, 'joint', 'angle', 'j1', 'j2')
    const stat  = componentStatus(signals, 'joint', 'torque', 'temp', 'force') || (running ? 'running' : 'online')
    return <RobotArm key={`${component.id}-${index}`} {...baseProps} angle={running ? angle : 0} status={stat} />
  }

  // ── CNC / LATHE / MILLING / TURRET ─────────────────────────────
  if (key.includes('cnc') || key.includes('lathe') || key.includes('milling') || key.includes('turret') || key.includes('spindle unit')) {
    const rpm = signalValue(signals, running ? 4200 : 0, 'spindle speed', 'spindle rpm', 'rpm')
    return <CNCMachine key={`${component.id}-${index}`} {...baseProps} spindleRpm={running ? rpm : 0} status={running ? 'running' : 'offline'} />
  }

  // ── FILLING / CAPPER / BOTTLE ───────────────────────────────────
  if (key.includes('fill') || key.includes('capper') || key.includes('bottle') || key.includes('nozzle')) {
    const fillLevel = signalValue(signals, 76, 'fill', 'level', 'volume')
    const bpm       = signalValue(signals, running ? 42 : 0, 'line speed', 'cycles', 'bpm', 'throughput')
    return <FillingStation key={`${component.id}-${index}`} {...baseProps} fillLevel={fillLevel} bottlesPerMinute={running ? bpm : 0} status={running ? 'running' : 'offline'} />
  }

  // ── GAUGE / METER / SENSOR / TRANSMITTER ────────────────────────
  if (key.includes('gauge') || key.includes('meter') || key.includes('sensor') || key.includes('transmitter')) {
    const primarySig = signals[0]
    const val  = primarySig ? primarySig.value : 62
    const unit = primarySig ? primarySig.unit : '%'
    const max  = primarySig ? primarySig.max : 100
    const stat = primarySig?.status ?? 'online'
    return <Gauge key={`${component.id}-${index}`} {...baseProps} value={val} unit={unit} max={max} status={stat} />
  }

  // ── HEAT EXCHANGER / COOLER / ACCUMULATOR ───────────────────────
  if (key.includes('heat') || key.includes('exchanger') || key.includes('cooler') || key.includes('accumulator')) {
    const temp = signalValue(signals, 72, 'temp', 'hot', 'cold', 'inlet', 'outlet')
    return <Gauge key={`${component.id}-${index}`} {...baseProps} value={temp} unit="°C" max={200} status={componentStatus(signals, 'temp') || 'online'} />
  }

  // ── UNKNOWN → SensorNode fallback ───────────────────────────────
  const fallbackSig = signals[index % Math.max(signals.length, 1)]
  return (
    <SensorNode
      key={`${component.id}-${index}`}
      {...baseProps}
      value={fallbackSig ? parseFloat(fallbackSig.value.toFixed(1)) : index + 1}
      unit={fallbackSig?.unit ?? '?'}
      status={fallbackSig?.status ?? 'online'}
    />
  )
}

// ── Zoom/Pan Hook ───────────────────────────────────────────────────
function useZoomPan() {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Non-passive native listener so preventDefault actually stops page scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setScale(s => Math.min(4, Math.max(0.5, s - e.deltaY * 0.001)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Keep as no-op — actual zoom handled by native listener above
  const onWheel = useCallback((_e: React.WheelEvent) => {}, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }, [offset])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    })
  }, [dragging])

  const onMouseUp = useCallback(() => setDragging(false), [])

  const zoomIn  = () => setScale(s => Math.min(4, s + 0.25))
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.25))
  const reset   = () => { setScale(1); setOffset({ x: 0, y: 0 }) }

  return { scale, offset, dragging, containerRef, onWheel, onMouseDown, onMouseMove, onMouseUp, zoomIn, zoomOut, reset }
}

// ── Main Component ──────────────────────────────────────────────────
interface TemplateSchematicPreviewProps {
  machine: MachineTemplate
  hideMeta?: boolean
  liveSignals?: LiveSignal[]
  running?: boolean
  onComponentClick?: (comp: ComponentTemplate) => void
}

export default function TemplateSchematicPreview({
  machine,
  hideMeta = false,
  liveSignals = [],
  running = true,
  onComponentClick,
}: TemplateSchematicPreviewProps) {
  const zoom = useZoomPan()
  const components = machine.components.slice(0, 9)
  const hasLive = liveSignals.length > 0

  // Layout: fit components in a single process lane
  const laneY   = 200
  const startX  = 100
  const gap      = Math.min(130, Math.max(90, 900 / Math.max(components.length, 1)))
  const viewW    = Math.max(900, startX * 2 + components.length * gap)

  // Pipe flow status
  const flowSig  = liveSignals.find(s => ['flow', 'rate', 'throughput', 'speed'].some(k => s.name.toLowerCase().includes(k)))
  const pipeStatusStr = !running ? 'offline' : flowSig ? flowSig.status === 'critical' ? 'critical' : 'running' : 'running'

  return (
    <div className={hideMeta ? 'flex flex-col h-full' : 'rounded-xl border border-bg-border bg-bg-base/70 p-3 flex flex-col'}>
      {/* Meta header */}
      {!hideMeta && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Schematic preview</p>
            <p className="truncate text-sm font-semibold text-text-primary">{machine.name}</p>
          </div>
          <span className="rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-[10px] font-semibold text-brand-cyan">
            {machine.components.length} parts / {machine.signals.length} signals
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={zoom.zoomIn}
            className="w-7 h-7 rounded-lg border border-bg-border bg-bg-card flex items-center justify-center text-text-muted hover:text-brand-cyan hover:border-brand-cyan/30 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={zoom.zoomOut}
            className="w-7 h-7 rounded-lg border border-bg-border bg-bg-card flex items-center justify-center text-text-muted hover:text-brand-cyan hover:border-brand-cyan/30 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={zoom.reset}
            className="w-7 h-7 rounded-lg border border-bg-border bg-bg-card flex items-center justify-center text-text-muted hover:text-brand-cyan hover:border-brand-cyan/30 transition-colors"
            title="Reset view"
          >
            <Maximize2 size={12} />
          </button>
          <span className="text-[10px] font-mono text-text-muted ml-1 select-none">
            {Math.round(zoom.scale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted select-none">
          <Move size={10} />
          drag to pan · scroll to zoom
          {hasLive && (
            <span className="flex items-center gap-1 text-status-ok ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-ok animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Canvas container with zoom/pan */}
      <div
        ref={zoom.containerRef}
        className="relative flex-1 overflow-hidden rounded-xl border border-bg-border bg-bg-base"
        style={{ minHeight: 300, cursor: zoom.dragging ? 'grabbing' : 'grab' }}
        onWheel={zoom.onWheel}
        onMouseDown={zoom.onMouseDown}
        onMouseMove={zoom.onMouseMove}
        onMouseUp={zoom.onMouseUp}
        onMouseLeave={zoom.onMouseUp}
      >
        <div
          style={{
            transform: `translate(${zoom.offset.x}px, ${zoom.offset.y}px) scale(${zoom.scale})`,
            transformOrigin: 'center center',
            transition: zoom.dragging ? 'none' : 'transform 0.1s ease',
            width: '100%',
            height: '100%',
          }}
        >
          <SchematicCanvas
            height="100%"
            viewBox={`0 0 ${viewW} 380`}
            style={{ width: '100%', minHeight: 300 }}
            aria-label={`${machine.name} live schematic`}
          >
            {components.map((component, index) => {
              const cx = startX + index * gap
              const isClickable = !!onComponentClick
              return (
                <g
                  key={`slot-${component.id}-${index}`}
                  onClick={isClickable ? (e) => { e.stopPropagation(); onComponentClick(component) } : undefined}
                  style={isClickable ? { cursor: 'pointer' } : undefined}
                >
                  {/* Invisible hit area — generous tap target */}
                  {isClickable && (
                    <rect
                      x={cx - 52}
                      y={laneY - 130}
                      width={104}
                      height={200}
                      rx={10}
                      fill="transparent"
                      stroke="rgba(0,212,255,0)"
                      className="hover:stroke-brand-cyan/30 transition-all"
                      strokeWidth={1.5}
                    />
                  )}
                  {/* Pipe between components */}
                  {index > 0 && (
                    <Pipe
                      x={startX + (index - 1) * gap + 46}
                      y={laneY}
                      length={Math.max(36, gap - 90)}
                      status={pipeStatusStr as any}
                      thickness={13}
                      flow={running}
                    />
                  )}
                  {/* Component with live values */}
                  {renderLiveComponent(component, cx, laneY, index, liveSignals, running)}
                  {/* Click hint label */}
                  {isClickable && (
                    <text
                      x={cx}
                      y={laneY + 82}
                      textAnchor="middle"
                      fontSize={8}
                      fontFamily="monospace"
                      fill="rgba(0,212,255,0.45)"
                    >
                      tap to control
                    </text>
                  )}
                </g>
              )
            })}

            {/* Live signal readouts floating above each component */}
            {hasLive && components.map((component, index) => {
              const cx = startX + index * gap
              const key = componentKey(component)

              // Find the most relevant signal for this component type
              let displaySig: LiveSignal | undefined
              if (key.includes('pump')) displaySig = findSignal(liveSignals, 'rpm', 'speed')
              else if (key.includes('tank') || key.includes('vessel')) displaySig = findSignal(liveSignals, 'level', 'tank')
              else if (key.includes('boiler') || key.includes('heater')) displaySig = findSignal(liveSignals, 'temp', 'steam')
              else if (key.includes('compressor')) displaySig = findSignal(liveSignals, 'pressure', 'discharge')
              else if (key.includes('conveyor')) displaySig = findSignal(liveSignals, 'speed', 'belt')
              else if (key.includes('fan')) displaySig = findSignal(liveSignals, 'fan speed', 'rpm')
              else if (key.includes('motor')) displaySig = findSignal(liveSignals, 'rpm', 'motor speed')
              else if (key.includes('valve')) displaySig = findSignal(liveSignals, 'flow', 'rate')
              else if (key.includes('filter')) displaySig = findSignal(liveSignals, 'differential', 'filter', 'dp')
              else displaySig = liveSignals[index % liveSignals.length]

              if (!displaySig) return null
              const statusColor =
                displaySig.status === 'critical' ? '#FF3B3B' :
                displaySig.status === 'warning'  ? '#FFB800' : '#00D4FF'

              return (
                <g key={`readout-${component.id}-${index}`}>
                  {/* Badge background */}
                  <rect
                    x={cx - 38}
                    y={laneY - 122}
                    width={76}
                    height={28}
                    rx={6}
                    fill="#0D1421"
                    stroke={statusColor}
                    strokeWidth={1.2}
                    opacity={0.92}
                  />
                  {/* Signal name */}
                  <text
                    x={cx}
                    y={laneY - 111}
                    textAnchor="middle"
                    fontSize={8}
                    fontFamily="monospace"
                    fill="#8B949E"
                  >
                    {displaySig.name.length > 12 ? displaySig.name.slice(0, 11) + '…' : displaySig.name}
                  </text>
                  {/* Live value */}
                  <text
                    x={cx}
                    y={laneY - 100}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="monospace"
                    fontWeight="600"
                    fill={statusColor}
                  >
                    {displaySig.value % 1 === 0
                      ? displaySig.value
                      : displaySig.value.toFixed(1)
                    } {displaySig.unit}
                  </text>
                </g>
              )
            })}
          </SchematicCanvas>
        </div>
      </div>

      {!hideMeta && (
        <p className="mt-2 text-[11px] text-text-muted">
          Unknown custom parts render as sensor nodes. Live values update every second.
        </p>
      )}
    </div>
  )
}
