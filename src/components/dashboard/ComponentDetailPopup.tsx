// ============================================================
// DESTINATION: src/components/dashboard/ComponentDetailPopup.tsx
// ============================================================
// REPLACE entire file — adds drag-to-move + full scroll inside
// ============================================================

import { useEffect } from 'react'
import { X, Activity, AlertTriangle, Sparkles, GripHorizontal } from 'lucide-react'
import clsx from 'clsx'
import { getControlDefs, getComponentPhysicsReason } from '../../hooks/useSimulator'
import { useDraggable } from '../../hooks/useDraggable'
import type { LiveSignal } from '../../hooks/useSimulator'
import type { ComponentTemplate } from '../../data/machineTemplates'

const PANEL_W = 520

// ── Helpers ───────────────────────────────────────────────────────────
function getCompIcon(comp: ComponentTemplate): string {
  const k = (comp.id + ' ' + comp.label).toLowerCase()
  if (k.includes('pump'))                                               return '🔄'
  if (k.includes('valve'))                                              return '🔧'
  if (k.includes('motor') || k.includes('drive'))                       return '⚙️'
  if (k.includes('fan')   || k.includes('blower'))                      return '💨'
  if (k.includes('conveyor') || k.includes('belt'))                     return '🏭'
  if (k.includes('boiler') || k.includes('heater') || k.includes('burner')) return '🔥'
  if (k.includes('compressor'))                                         return '💨'
  if (k.includes('mixer') || k.includes('agitator'))                    return '🌀'
  if (k.includes('robot') || k.includes('arm'))                         return '🦾'
  if (k.includes('cnc') || k.includes('spindle'))                       return '⚙️'
  if (k.includes('tank') || k.includes('vessel'))                       return '🏺'
  if (k.includes('filter'))                                             return '🔹'
  if (k.includes('hopper') || k.includes('feeder'))                     return '🏗️'
  if (k.includes('heat exchanger'))                                     return '♨️'
  if (k.includes('chiller') || k.includes('cooler'))                    return '❄️'
  if (k.includes('separator') || k.includes('cyclone'))                 return '🌪️'
  if (k.includes('gauge') || k.includes('sensor'))                      return '📡'
  return '📡'
}

const COMPONENT_SIGNAL_MAP: Array<{ compKeys: string[]; signalKeys: string[] }> = [
  { compKeys: ['pump'],                            signalKeys: ['rpm','speed','flow','rate','pressure','vibration','power','current','throughput','temp','bearing','coolant','inlet temp','outlet temp'] },
  { compKeys: ['motor','drive','engine','servo'],  signalKeys: ['rpm','speed','motor speed','current','motor current','power','vibration','temp','motor temp','bearing','winding','torque','load'] },
  { compKeys: ['fan','blower','exhaust'],           signalKeys: ['fan speed','fan rpm','rpm','speed','air flow','flow','power','current','temp','humidity'] },
  { compKeys: ['valve','gate','damper','prv','relief'], signalKeys: ['flow','rate','pressure','inlet pressure','outlet pressure','level','basin','differential','steam pressure','water level'] },
  { compKeys: ['compressor'],                      signalKeys: ['discharge pressure','outlet pressure','pressure','rpm','speed','discharge temp','temp','power','current','oil pressure','inlet temp','air flow'] },
  { compKeys: ['conveyor','belt'],                 signalKeys: ['belt speed','speed','line speed','motor temp','temp','load','weight','current','motor current','power','tension','oee','throughput'] },
  { compKeys: ['boiler','heater','burner','oven','dryer','furnace'], signalKeys: ['temp','zone','drum','steam pressure','pressure','steam','water level','fuel','combustion','efficiency','flue','moisture','power'] },
  { compKeys: ['reactor','fermenter','autoclave','chamber'], signalKeys: ['temp','pressure','level','ph','co2','dissolved','oxygen','conductivity','turbidity','specific gravity'] },
  { compKeys: ['mixer','agitator','impeller'],     signalKeys: ['rpm','speed','agitator','temp','level','viscosity','power','current'] },
  { compKeys: ['robot','arm','gripper'],           signalKeys: ['joint','angle','j1','j2','j3','torque','force','end effector','cycle','speed','temp','motor temp','payload','current'] },
  { compKeys: ['cnc','spindle','lathe','milling','turret'], signalKeys: ['spindle speed','spindle rpm','rpm','cutting force','force','spindle temp','temp','tool wear','vibration','feed rate','power','load','current','chuck'] },
  { compKeys: ['fill','capper','bottle','nozzle'], signalKeys: ['fill','volume','line speed','bpm','bottles','torque','capping','reject','temp','level'] },
  { compKeys: ['filter','strainer','screen'],      signalKeys: ['differential','filter dp','dp','pressure drop','turbidity','flow','backwash'] },
  { compKeys: ['hopper','feeder','bin'],           signalKeys: ['hopper','level','silo','feed rate','rate','moisture','throughput','discharge','amplitude'] },
  { compKeys: ['heat exchanger','exchanger','cooler','condenser','evaporator','intercooler'], signalKeys: ['hot inlet','hot outlet','cold inlet','cold outlet','temp','fouling','flow','pressure','cop'] },
  { compKeys: ['tank','vessel','silo','storage','receiver','buffer'], signalKeys: ['level','water level','tank level','basin','temp','pressure','ph','conductivity'] },
  { compKeys: ['dosing','chemical','reagent'],     signalKeys: ['ph','conductivity','chlorine','turbidity','dissolved','chemical','alkalinity'] },
  { compKeys: ['generator','alternator','inverter','ups'], signalKeys: ['voltage','frequency','output','power','fuel','current','temp','load','rpm','battery','soc'] },
  { compKeys: ['chiller','refrigerant'],           signalKeys: ['chilled','temp','condenser','evaporator','pressure','cop','load','current'] },
  { compKeys: ['separator','cyclone','classifier'],signalKeys: ['recovery','efficiency','flow','pressure','level','turbidity'] },
  { compKeys: ['cooling tower','tower'],           signalKeys: ['inlet temp','outlet temp','temp','basin','level','fan','conductivity','flow'] },
]

function getAffectedSignals(comp: ComponentTemplate, signals: LiveSignal[]): LiveSignal[] {
  const compKey = (comp.id + ' ' + comp.label).toLowerCase()
  const matched = new Set<string>()
  for (const rule of COMPONENT_SIGNAL_MAP) {
    if (rule.compKeys.some(ck => compKey.includes(ck))) {
      rule.signalKeys.forEach(sk => matched.add(sk))
    }
  }
  if (matched.size === 0) return []
  return signals.filter(s => [...matched].some(kw => s.name.toLowerCase().includes(kw)))
}

function barColor(s: string) {
  if (s === 'critical') return 'bg-status-critical'
  if (s === 'warning')  return 'bg-status-warning'
  return 'bg-status-ok'
}
function statusColor(s: string) {
  if (s === 'critical') return 'text-status-critical'
  if (s === 'warning')  return 'text-status-warning'
  return 'text-status-ok'
}

// ── Props ─────────────────────────────────────────────────────────────
interface ComponentDetailPopupProps {
  comp: ComponentTemplate
  controls: Record<string, number>
  signals: LiveSignal[]
  running: boolean
  mode: 'Auto' | 'Manual' | 'Hold'
  lastUpdated: string
  onSetControl: (key: string, value: number) => void
  onClose: () => void
  onStart: () => void
  onStop: () => void
  onHold: () => void
}

export default function ComponentDetailPopup({
  comp, controls, signals, running, mode, lastUpdated,
  onSetControl, onClose, onStart, onStop, onHold,
}: ComponentDetailPopupProps) {
  // ── Drag ────────────────────────────────────────────────────
  const { pos, onHeaderMouseDown } = useDraggable(PANEL_W, 560)

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const defs      = getControlDefs(comp)
  const affected  = getAffectedSignals(comp, signals)
  const reason    = getComponentPhysicsReason(comp)
  const isPassive = defs.length === 0

  const criticalSigs = affected.filter(s => s.status === 'critical')
  const warningSigs  = affected.filter(s => s.status === 'warning')
  const hasAlert     = criticalSigs.length > 0 || warningSigs.length > 0

  const modeLabel = !running ? 'STOPPED' : mode === 'Hold' ? 'HOLD' : 'RUNNING'
  const modeColor = !running        ? 'text-status-critical border-status-critical/30 bg-status-critical/10' :
                    mode === 'Hold' ? 'text-status-warning  border-status-warning/30  bg-status-warning/10'  :
                                      'text-status-ok       border-status-ok/30        bg-status-ok/10'

  const borderColor = criticalSigs.length > 0 ? 'border-status-critical/40' :
                      warningSigs.length  > 0 ? 'border-status-warning/35'  :
                                                 'border-brand-cyan/30'

  // Scrollable body max height = remaining viewport below header
  const bodyMaxH = Math.max(200, window.innerHeight - pos.y - 160)

  return (
    <>
      {/* ── Dim backdrop — click outside closes ── */}
      <div
        className="fixed inset-0 z-[200] bg-bg-base/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ── Floating draggable panel ── */}
      <div
        className={clsx('fixed z-[201] rounded-2xl border bg-bg-card shadow-2xl flex flex-col', borderColor)}
        style={{
          left:     pos.x,
          top:      pos.y,
          width:    PANEL_W,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {/* ── Header — drag handle ── */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-bg-border cursor-grab active:cursor-grabbing select-none rounded-t-2xl"
          onMouseDown={onHeaderMouseDown}
        >
          <div className="flex items-center gap-3">
            <GripHorizontal size={14} className="text-text-muted shrink-0" />
            <span className="text-2xl">{getCompIcon(comp)}</span>
            <div>
              <p className="text-sm font-semibold text-text-primary">{comp.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-text-muted">{comp.id}</span>
                <span className={clsx('text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border', modeColor)}>
                  {modeLabel}
                </span>
                {hasAlert && (
                  <span className={clsx(
                    'flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border',
                    criticalSigs.length > 0
                      ? 'text-status-critical border-status-critical/30 bg-status-critical/10'
                      : 'text-status-warning border-status-warning/30 bg-status-warning/10'
                  )}>
                    <AlertTriangle size={9} />
                    {criticalSigs.length > 0 ? `${criticalSigs.length} critical` : `${warningSigs.length} warning`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
              <Activity size={9} className={clsx(running && 'text-status-ok animate-pulse')} />
              {lastUpdated}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-bg-border flex items-center justify-center text-text-muted hover:text-text-secondary hover:border-text-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Machine controls strip ── */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-bg-border bg-bg-base/40">
          <p className="text-[10px] font-mono uppercase text-text-muted tracking-wider flex-1">Machine</p>
          <button
            onClick={onStart}
            className={clsx('flex items-center h-7 px-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all',
              running && mode === 'Auto'
                ? 'border-status-ok/50 bg-status-ok/20 text-status-ok'
                : 'border-status-ok/25 bg-status-ok/10 text-status-ok hover:bg-status-ok/20'
            )}
          >▶ Start</button>
          <button
            onClick={onHold}
            className={clsx('flex items-center h-7 px-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all',
              mode === 'Hold'
                ? 'border-status-warning/50 bg-status-warning/20 text-status-warning'
                : 'border-status-warning/25 bg-status-warning/10 text-status-warning hover:bg-status-warning/20'
            )}
          >⏸ Hold</button>
          <button
            onClick={onStop}
            className={clsx('flex items-center h-7 px-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all',
              !running && mode === 'Manual'
                ? 'border-status-critical/50 bg-status-critical/20 text-status-critical'
                : 'border-status-critical/25 bg-status-critical/10 text-status-critical hover:bg-status-critical/20'
            )}
          >■ Stop</button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="overflow-y-auto" style={{ maxHeight: bodyMaxH }}>

          {/* Physics reason */}
          <div className="mx-5 mt-4 rounded-lg border border-brand-cyan/15 bg-brand-cyan/5 px-3 py-2.5 flex items-start gap-2">
            <Sparkles size={12} className="text-brand-cyan mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-mono uppercase text-brand-cyan tracking-wider">Why this component matters</p>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{reason}</p>
            </div>
          </div>

          {/* Setpoint controls */}
          <div className="px-5 pt-4 pb-2">
            {isPassive ? (
              <div className="rounded-lg border border-bg-border bg-bg-base px-3 py-2.5">
                <p className="text-xs font-semibold text-text-primary mb-1">Passive component</p>
                <p className="text-[11px] text-text-muted">
                  This component has no direct setpoint controls. It monitors and reports process conditions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase text-text-muted tracking-wider">Component setpoints</p>
                {defs.map(def => {
                  const value      = running ? (controls[def.key] ?? def.default) : def.min
                  const displayVal = def.unit === '%' ? `${Math.round(value)}%`
                                   : def.unit === '°' ? `${Math.round(value)}°`
                                   : `${value.toFixed(1)} ${def.unit}`
                  const affectedByThisControl = affected.find(s => {
                    const n = s.name.toLowerCase()
                    if (def.key === 'speed') return ['rpm','speed','flow'].some(k => n.includes(k))
                    if (def.key === 'open')  return ['flow','pressure','level'].some(k => n.includes(k))
                    if (def.key === 'power') return ['temp','pressure','steam'].some(k => n.includes(k))
                    return false
                  })
                  return (
                    <div key={def.key} className="rounded-lg border border-bg-border bg-bg-base px-3 py-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-text-primary">{def.label}</span>
                        <div className="flex items-center gap-2">
                          {affectedByThisControl && (
                            <span className={clsx('text-[10px] font-mono', statusColor(affectedByThisControl.status))}>
                              → {affectedByThisControl.name}: {affectedByThisControl.value.toFixed(1)} {affectedByThisControl.unit}
                            </span>
                          )}
                          <span className={clsx('text-sm font-mono font-semibold', !running ? 'text-text-muted' : 'text-brand-cyan')}>
                            {running ? displayVal : '—'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={def.min} max={def.max} step={1}
                        value={running ? value : def.min}
                        disabled={!running}
                        onChange={e => onSetControl(def.key, Number(e.target.value))}
                        className="w-full accent-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] font-mono text-text-muted">{def.min}{def.unit}</span>
                        <span className="text-[9px] font-mono text-text-muted">{def.max}{def.unit}</span>
                      </div>
                    </div>
                  )
                })}
                {!running && (
                  <p className="text-[11px] text-status-warning text-center py-2 rounded-lg border border-status-warning/20 bg-status-warning/5">
                    Start machine to enable setpoint controls
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Live signals */}
          <div className="px-5 pt-3 pb-5">
            <p className="text-[10px] font-mono uppercase text-text-muted tracking-wider mb-2">
              Live signals — {affected.length} affected by this component
            </p>
            {affected.length === 0 ? (
              <p className="text-[11px] text-text-muted">No signals mapped to this component type.</p>
            ) : (
              <div className="space-y-2">
                {affected.map(sig => {
                  const pct = Math.min(100, Math.max(0, ((sig.value - sig.min) / (sig.max - sig.min)) * 100))
                  return (
                    <div key={sig.name} className={clsx(
                      'rounded-lg border px-3 py-2',
                      sig.status === 'critical' ? 'border-status-critical/25 bg-status-critical/5' :
                      sig.status === 'warning'  ? 'border-status-warning/25  bg-status-warning/5'  :
                                                   'border-bg-border bg-bg-base'
                    )}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-text-muted">{sig.name}</span>
                        <div className="flex items-center gap-2">
                          {(sig.status === 'critical' || sig.status === 'warning') && (
                            <AlertTriangle size={10} className={statusColor(sig.status)} />
                          )}
                          <span className={clsx('text-sm font-mono font-semibold', statusColor(sig.status))}>
                            {sig.value % 1 === 0 ? sig.value : sig.value.toFixed(1)}
                            <span className="text-[10px] font-normal text-text-muted ml-1">{sig.unit}</span>
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-bg-hover">
                        <div className={clsx('h-full rounded-full transition-all duration-700', barColor(sig.status))} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] font-mono text-text-muted">{sig.min} {sig.unit}</span>
                        <span className="text-[9px] font-mono text-text-muted">limit: {sig.threshold} {sig.unit}</span>
                        <span className="text-[9px] font-mono text-text-muted">{sig.max} {sig.unit}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2 border-t border-bg-border flex items-center gap-3 text-[10px] text-text-muted rounded-b-2xl">
          <GripHorizontal size={10} className="text-text-muted" />
          <span>Drag header to move</span>
          <span className="mx-1">·</span>
          <kbd className="border border-bg-border rounded px-1.5 py-0.5 font-mono">Esc</kbd>
          <span>to close</span>
        </div>
      </div>
    </>
  )
}
