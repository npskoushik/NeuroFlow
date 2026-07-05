// ============================================================
// DESTINATION: src/components/dashboard/SignalPopup.tsx
// ============================================================
// REPLACE entire file — adds drag-to-move + full scroll inside
// ============================================================

import { useEffect } from 'react'
import { X, AlertTriangle, CheckCircle2, Sparkles, Activity, Settings2, GripHorizontal } from 'lucide-react'
import clsx from 'clsx'
import { getControlDefs } from '../../hooks/useSimulator'
import { useDraggable } from '../../hooks/useDraggable'
import type { LiveSignal, SimAlarm } from '../../hooks/useSimulator'
import type { MachineTemplate, ComponentTemplate } from '../../data/machineTemplates'

const PANEL_W = 800

function barColor(s: string) {
  if (s === 'critical') return 'bg-status-critical'
  if (s === 'warning')  return 'bg-status-warning'
  return 'bg-status-ok'
}

function getRelatedComponents(signal: LiveSignal, machine: MachineTemplate): ComponentTemplate[] {
  // 1. Explicit componentIds mapping (from machineTemplates)
  const signalDef = machine.signals.find(s => s.name === signal.name)
  if (signalDef?.componentIds && signalDef.componentIds.length > 0) {
    return machine.components.filter(
      comp => signalDef.componentIds!.includes(comp.id) && getControlDefs(comp).length > 0
    )
  }

  // 2. Keyword fallback
  const n = signal.name.toLowerCase()
  return machine.components.filter(comp => {
    const k = (comp.id + ' ' + comp.label).toLowerCase()
    if (getControlDefs(comp).length === 0) return false
    if (['pump','motor','drive','spindle','compressor','cnc'].some(x => k.includes(x)))
      return ['rpm','speed','flow','pressure','vibration','power','current','throughput'].some(x => n.includes(x))
    if (k.includes('valve'))
      return ['flow','pressure','level','rate'].some(x => n.includes(x))
    if (['boiler','heater','burner','oven','dryer'].some(x => k.includes(x)))
      return ['temp','pressure','steam','fuel','combustion','water'].some(x => n.includes(x))
    if (k.includes('fan') || k.includes('blower'))
      return ['temp','speed','rpm','flow','air'].some(x => n.includes(x))
    if (k.includes('conveyor') || k.includes('belt'))
      return ['speed','belt','load','motor','tension'].some(x => n.includes(x))
    if (k.includes('mixer') || k.includes('agitator'))
      return ['rpm','speed','level','temp','viscosity'].some(x => n.includes(x))
    if (k.includes('robot') || k.includes('arm'))
      return ['joint','angle','torque','force','speed','cycle'].some(x => n.includes(x))
    if (k.includes('hopper') || k.includes('feeder'))
      return ['level','feed','hopper','rate','moisture'].some(x => n.includes(x))
    return false
  })
}

interface Props {
  signal: LiveSignal
  machine: MachineTemplate
  running: boolean
  mode: 'Auto' | 'Manual' | 'Hold'
  alarms: SimAlarm[]
  componentControls: Record<string, Record<string, number>>
  onClose: () => void
  onStart: () => void
  onStop: () => void
  onHold: () => void
  onAcknowledge: (id: string) => void
  onSetControl: (compId: string, key: string, value: number) => void
}

export default function SignalPopup({
  signal, machine, running, mode, alarms,
  componentControls,
  onClose, onStart, onStop, onHold, onAcknowledge, onSetControl,
}: Props) {
  // ── Drag ──────────────────────────────────────────────────
  const { pos, onHeaderMouseDown } = useDraggable(PANEL_W, 520)

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const pct           = Math.min(100, Math.max(0, ((signal.value - signal.min) / (signal.max - signal.min)) * 100))
  const activeAlarms  = alarms.filter(a => !a.acknowledged)
  const signalAlarm   = activeAlarms.find(a => a.signalName === signal.name)
  const relatedComps  = getRelatedComponents(signal, machine)

  const borderGlow =
    signal.status === 'critical' ? 'border-status-critical/40 shadow-[0_0_32px_rgba(255,59,59,0.22)]' :
    signal.status === 'warning'  ? 'border-status-warning/40  shadow-[0_0_32px_rgba(251,191,36,0.18)]' :
                                   'border-brand-cyan/30       shadow-[0_0_32px_rgba(0,212,255,0.12)]'

  // Max height of scrollable body = viewport height minus panel top + header + footer
  const bodyMaxH = Math.max(200, window.innerHeight - pos.y - 120)

  return (
    <>
      {/* ── Dim backdrop — click outside to close ── */}
      <div
        className="fixed inset-0 z-50 bg-bg-base/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ── Floating draggable panel ── */}
      <div
        className={clsx(
          'fixed z-[51] rounded-2xl border bg-bg-card shadow-2xl flex flex-col',
          borderGlow
        )}
        style={{
          left:     pos.x,
          top:      pos.y,
          width:    PANEL_W,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {/* ── Header — drag handle ── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-bg-border cursor-grab active:cursor-grabbing select-none rounded-t-2xl"
          onMouseDown={onHeaderMouseDown}
        >
          <div className="flex items-center gap-3">
            {/* Grip icon — visual drag hint */}
            <GripHorizontal size={14} className="text-text-muted shrink-0" />
            <div className={clsx('w-2 h-2 rounded-full shrink-0', {
              'bg-status-critical animate-pulse': signal.status === 'critical',
              'bg-status-warning  animate-pulse': signal.status === 'warning',
              'bg-status-ok':                     signal.status === 'ok',
            })} />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Signal inspector</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-sm font-semibold text-text-primary">{signal.name}</h2>
                <span className="text-[10px] text-text-muted font-mono">{machine.name}</span>
                <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize', {
                  'text-status-critical border-status-critical/30 bg-status-critical/10': signal.status === 'critical',
                  'text-status-warning  border-status-warning/30  bg-status-warning/10':  signal.status === 'warning',
                  'text-status-ok       border-status-ok/30       bg-status-ok/10':        signal.status === 'ok',
                })}>
                  {signal.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] font-mono text-status-ok">
              <Activity size={9} className="animate-pulse" />live
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-bg-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-muted transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Scrollable 4-col body ── */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-bg-border overflow-y-auto"
          style={{ maxHeight: bodyMaxH }}
        >
          {/* COL 1 — Signal values */}
          <div className="p-4 space-y-3">
            <div className="rounded-lg border border-bg-border bg-bg-base p-3">
              <p className="text-[10px] font-mono uppercase text-text-muted">Current value</p>
              <p className={clsx('text-3xl font-mono font-semibold mt-1', {
                'text-status-critical': signal.status === 'critical',
                'text-status-warning':  signal.status === 'warning',
                'text-text-primary':    signal.status === 'ok',
              })}>
                {signal.value % 1 === 0 ? signal.value : signal.value.toFixed(1)}
                <span className="text-base font-normal text-text-muted ml-1">{signal.unit}</span>
              </p>
              <div className="mt-2 h-2 rounded-full overflow-hidden bg-bg-hover">
                <div className={clsx('h-full rounded-full transition-all duration-700', barColor(signal.status))} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[9px] font-mono text-text-muted">
                <span>{signal.min} {signal.unit}</span>
                <span>limit {signal.threshold}</span>
                <span>{signal.max} {signal.unit}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-bg-border bg-bg-base px-3 py-2">
                <p className="text-[9px] font-mono uppercase text-text-muted">Min range</p>
                <p className="font-mono text-sm text-text-secondary mt-0.5">{signal.min} <span className="text-[10px]">{signal.unit}</span></p>
              </div>
              <div className="rounded-lg border border-bg-border bg-bg-base px-3 py-2">
                <p className="text-[9px] font-mono uppercase text-text-muted">Threshold</p>
                <p className="font-mono text-sm text-text-secondary mt-0.5">{signal.threshold} <span className="text-[10px]">{signal.unit}</span></p>
              </div>
            </div>
          </div>

          {/* COL 2 — AI Diagnosis */}
          <div className="p-4">
            <div className={clsx(
              'rounded-lg border p-3 h-full',
              signalAlarm ? 'border-brand-cyan/15 bg-brand-cyan/5' : 'border-bg-border bg-bg-base'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-brand-cyan" />
                <p className="text-xs font-semibold text-brand-cyan">AI diagnosis</p>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">
                {signalAlarm
                  ? signalAlarm.aiInsight
                  : `${signal.name} is within normal operating range at ${signal.value.toFixed(1)} ${signal.unit}. No action required.`
                }
              </p>
              {signalAlarm && (
                <div className="mt-3 pt-3 border-t border-brand-cyan/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={10} className="text-status-warning" />
                    <p className="text-[10px] font-semibold text-status-warning uppercase tracking-wider">Recommended action</p>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Adjust the component controls to bring this signal back into range.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COL 3 — Component controls */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Settings2 size={12} className="text-text-muted" />
              <p className="text-xs font-semibold text-text-primary">Components driving this signal</p>
            </div>

            {relatedComps.length === 0 ? (
              <div className="rounded-lg border border-bg-border bg-bg-base p-3 text-center">
                <p className="text-[11px] text-text-muted">No controllable components mapped to this signal.</p>
                <p className="text-[10px] text-text-muted mt-1">This may be a passive or calculated signal.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {relatedComps.map(comp => {
                  const defs = getControlDefs(comp)
                  const ctrl = componentControls[comp.id] ?? {}
                  return (
                    <div key={comp.id} className="rounded-lg border border-bg-border bg-bg-base p-3 space-y-2">
                      <p className="text-[11px] font-semibold text-text-secondary">{comp.label}</p>
                      {defs.map(def => {
                        const value     = running ? (ctrl[def.key] ?? def.default) : def.min
                        const displayVal = def.unit === '%'  ? `${Math.round(value)}%`
                                         : def.unit === '°'  ? `${Math.round(value)}°`
                                         : `${value.toFixed(1)} ${def.unit}`
                        return (
                          <div key={def.key}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-text-muted">{def.label}</span>
                              <span className="text-[10px] font-mono text-text-secondary">{running ? displayVal : '—'}</span>
                            </div>
                            <input
                              type="range"
                              min={def.min} max={def.max} step={1}
                              value={running ? value : def.min}
                              disabled={!running}
                              onChange={e => onSetControl(comp.id, def.key, Number(e.target.value))}
                              className="w-full accent-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                            <div className="flex justify-between text-[9px] font-mono text-text-muted">
                              <span>{def.min}{def.unit}</span>
                              <span>{def.max}{def.unit}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Machine controls */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button onClick={onStart} className={clsx('h-8 rounded-lg border text-[11px] font-semibold flex items-center justify-center transition-all',
                running && mode === 'Auto' ? 'border-status-ok/50 bg-status-ok/20 text-status-ok' : 'border-status-ok/25 bg-status-ok/10 text-status-ok hover:bg-status-ok/20')}>
                ▶ Start
              </button>
              <button onClick={onHold} className={clsx('h-8 rounded-lg border text-[11px] font-semibold flex items-center justify-center transition-all',
                mode === 'Hold' ? 'border-status-warning/50 bg-status-warning/20 text-status-warning' : 'border-status-warning/25 bg-status-warning/10 text-status-warning hover:bg-status-warning/20')}>
                ⏸ Hold
              </button>
              <button onClick={onStop} className={clsx('h-8 rounded-lg border text-[11px] font-semibold flex items-center justify-center transition-all',
                !running && mode === 'Manual' ? 'border-status-critical/50 bg-status-critical/20 text-status-critical' : 'border-status-critical/25 bg-status-critical/10 text-status-critical hover:bg-status-critical/20')}>
                ■ Stop
              </button>
            </div>
            {!running && (
              <p className="text-[10px] text-status-warning text-center border border-status-warning/20 rounded-lg py-1 bg-status-warning/5">
                Start machine to enable controls
              </p>
            )}
          </div>

          {/* COL 4 — Active Alarms */}
          <div className="p-4 flex flex-col gap-3">
            {activeAlarms.length > 0 ? (
              <>
                <div className="rounded-lg border border-status-critical/20 bg-status-critical/5 p-3 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={12} className="text-status-critical animate-pulse" />
                    <p className="text-[10px] font-semibold text-status-critical uppercase tracking-wider">
                      Active alarms ({activeAlarms.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {activeAlarms.slice(0, 5).map(a => (
                      <div key={a.id} className="border-l-2 border-status-critical/40 pl-2">
                        <span className={clsx('font-semibold capitalize text-[10px]', {
                          'text-status-critical': a.severity === 'critical',
                          'text-status-warning':  a.severity === 'warning',
                        })}>{a.severity}</span>
                        <span className="text-text-muted ml-1 font-mono text-[10px]">{a.signalName}</span>
                        <p className="text-[10px] mt-0.5 text-text-secondary">{a.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => activeAlarms.forEach(a => onAcknowledge(a.id))}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-status-ok/25 bg-status-ok/10 text-xs font-semibold text-status-ok hover:bg-status-ok/20 transition-colors"
                >
                  <CheckCircle2 size={14} />
                  Acknowledge all
                </button>
              </>
            ) : (
              <div className="rounded-lg border border-status-ok/20 bg-status-ok/5 p-3 flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 size={24} className="text-status-ok mx-auto mb-2" />
                  <p className="text-xs text-status-ok font-semibold">No active alarms</p>
                  <p className="text-[10px] text-text-muted mt-1">All signals normal</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2 border-t border-bg-border flex items-center gap-3 text-[10px] text-text-muted rounded-b-2xl">
          <GripHorizontal size={10} className="text-text-muted" />
          <span>Drag header to move</span>
          <span className="mx-1">·</span>
          <span>Click outside or</span>
          <kbd className="border border-bg-border rounded px-1.5 py-0.5 font-mono">Esc</kbd>
          <span>to close</span>
        </div>
      </div>
    </>
  )
}
