import { useState, useEffect } from 'react'
import { Activity, Settings2, X, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import type { SimulatorOutput } from '../hooks/useSimulator'
import LiveAlarmBanner from '../components/dashboard/LiveAlarmBanner'
import LiveTrendChart from '../components/dashboard/LiveTrendChart'
import SignalPopup from '../components/dashboard/SignalPopup'
import ComponentControlPanel from '../components/dashboard/ComponentControlPanel'
import ComponentDetailPopup from '../components/dashboard/ComponentDetailPopup'
import TemplateSchematicPreview from '../components/setup/TemplateSchematicPreview'
import type { MachineTemplate } from '../data/machineTemplates'

import { useHighlight } from '../context/HighlightContext'
import type { ComponentTemplate } from '../data/machineTemplates'
import PredictiveMaintenance from '../components/dashboard/PredictiveMaintenance'
import SupervisorAnalytics from '../components/dashboard/SupervisorAnalytics'

interface DashboardProps {
  configuredMachine: MachineTemplate
  sim: SimulatorOutput
  role: string
}

function barColor(status: string) {
  if (status === 'critical') return 'bg-status-critical'
  if (status === 'warning')  return 'bg-status-warning'
  return 'bg-status-ok'
}

function statusBadge(status: string) {
  if (status === 'critical') return 'text-status-critical bg-status-critical/10 border-status-critical/30'
  if (status === 'warning')  return 'text-status-warning  bg-status-warning/10  border-status-warning/30'
  return 'text-status-ok bg-status-ok/10 border-status-ok/30'
}

// Inline min/max editor that appears on a signal card
function SignalLimitEditor({
  sig, currentMin, currentMax,
  onSave, onClose,
}: {
  sig: { name: string; unit: string; min: number; max: number; threshold: number }
  currentMin: number; currentMax: number
  onSave: (min: number, max: number) => void
  onClose: () => void
}) {
  const [dMin, setDMin] = useState(String(currentMin))
  const [dMax, setDMax] = useState(String(currentMax))
  const valid = parseFloat(dMin) < parseFloat(dMax) && !isNaN(parseFloat(dMin)) && !isNaN(parseFloat(dMax))

  return (
    <div
      className="mt-2 rounded-lg border border-brand-cyan/25 bg-brand-cyan/5 p-2.5 space-y-2"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider">Edit limits ({sig.unit})</span>
        <button onClick={onClose} className="text-text-muted hover:text-text-secondary"><X size={11} /></button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <label className="block text-[9px] text-text-muted mb-1">Min</label>
          <input
            type="number" value={dMin}
            onChange={e => setDMin(e.target.value)}
            className="w-full bg-bg-base border border-bg-border rounded px-2 py-1 text-[11px] text-text-primary font-mono outline-none focus:border-brand-cyan/40"
          />
        </div>
        <div>
          <label className="block text-[9px] text-text-muted mb-1">Max</label>
          <input
            type="number" value={dMax}
            onChange={e => setDMax(e.target.value)}
            className="w-full bg-bg-base border border-bg-border rounded px-2 py-1 text-[11px] text-text-primary font-mono outline-none focus:border-brand-cyan/40"
          />
        </div>
      </div>
      <p className="text-[9px] text-text-muted font-mono">Threshold: {sig.threshold} {sig.unit} · Original: {sig.min}–{sig.max}</p>
      <div className="flex gap-1.5">
        <button
          onClick={() => { onSave(sig.min, sig.max); onClose() }}
          className="flex-1 h-7 rounded border border-bg-border text-[10px] text-text-muted hover:text-text-secondary"
        >Reset</button>
        <button
          disabled={!valid}
          onClick={() => { if (valid) { onSave(parseFloat(dMin), parseFloat(dMax)); onClose() } }}
          className="flex-1 h-7 rounded bg-brand-cyan text-bg-base text-[10px] font-semibold disabled:opacity-40"
        >Apply</button>
      </div>
    </div>
  )
}

export default function Dashboard({ configuredMachine, sim, role }: DashboardProps) {
  const [selectedSignalIndex, setSelectedSignalIndex] = useState(0)
  const [popupSignalIndex,    setPopupSignalIndex]    = useState<number | null>(null)
  const [editingLimitName,    setEditingLimitName]    = useState<string | null>(null)
  const [clickedComponent,    setClickedComponent]    = useState<ComponentTemplate | null>(null)

  // Collapsible sections
  const [trendOpen,     setTrendOpen]     = useState(true)
  const [equipCtrlOpen, setEquipCtrlOpen] = useState(true)
  const [predictiveOpen, setPredictiveOpen] = useState(true)

  const { highlight, isSignalHighlighted, isComponentHighlighted } = useHighlight()

  const handleComponentClick = (comp: ComponentTemplate) => {
    setClickedComponent(prev => prev?.id === comp.id ? null : comp)
  }

  const criticalCount = sim.alarms.filter(a => a.severity === 'critical' && !a.acknowledged).length
  const warningCount  = sim.alarms.filter(a => a.severity === 'warning'  && !a.acknowledged).length

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPopupSignalIndex(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const popupSignal = popupSignalIndex !== null ? sim.signals[popupSignalIndex] : null
  const handleStart = () => { sim.setRunning(true);  sim.setMode('Auto') }
  const handleStop  = () => { sim.setRunning(false); sim.setMode('Manual') }
  const handleHold  = () => { sim.setRunning(false); sim.setMode('Hold') }

  return (
    <div className="h-full overflow-y-auto p-4 xl:p-5 space-y-4 relative">
      {/* Role Indicator Banner */}
      <div className={clsx(
        "absolute top-4 right-4 px-3 py-1.5 rounded-full border text-[10px] font-mono font-bold tracking-widest uppercase shadow-lg z-10 backdrop-blur-md",
        role === 'engineer' ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan" : 
        role === 'supervisor' ? "border-brand-accent/40 bg-brand-accent/10 text-brand-accent" : 
        "border-status-ok/40 bg-status-ok/10 text-status-ok"
      )}>
        {role} View
      </div>

      {role === 'supervisor' && (
        <SupervisorAnalytics sim={sim} machineName={configuredMachine.name} />
      )}

      <LiveAlarmBanner
        machine={configuredMachine}
        sim={sim}
        alarms={sim.alarms}
        onAcknowledge={sim.acknowledgeAlarm}
        onSilence={sim.silenceAlarm}
        onAlarmClick={(signalName) => {
          const idx = sim.signals.findIndex(s => s.name === signalName)
          if (idx !== -1) { setSelectedSignalIndex(idx); setPopupSignalIndex(idx) }
        }}
      />

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass-card rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-transform duration-300">
          <p className="text-[9px] font-mono uppercase text-text-muted tracking-wider leading-none">Health</p>
          <p className={clsx('text-base font-semibold font-mono leading-tight mt-0.5', {
            'text-status-critical': sim.healthScore < 50,
            'text-status-warning':  sim.healthScore >= 50 && sim.healthScore < 80,
            'text-status-ok':       sim.healthScore >= 80,
          })}>{sim.healthScore}%</p>
          <p className="text-[9px] text-text-muted">{sim.signals.filter(s => s.status === 'ok').length}/{sim.signals.length} ok</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-transform duration-300">
          <p className="text-[9px] font-mono uppercase text-text-muted tracking-wider leading-none">Uptime</p>
          <p className="text-base font-semibold font-mono leading-tight mt-0.5 text-text-secondary">{sim.uptime}%</p>
          <p className="text-[9px] text-text-muted">{sim.running ? 'Running' : 'Stopped'}</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-transform duration-300">
          <p className="text-[9px] font-mono uppercase text-text-muted tracking-wider leading-none">Alarms</p>
          <p className={clsx('text-base font-semibold font-mono leading-tight mt-0.5',
            criticalCount > 0 ? 'text-status-critical' : warningCount > 0 ? 'text-status-warning' : 'text-status-ok')}>
            {criticalCount + warningCount}
          </p>
          <p className="text-[9px] text-text-muted">{criticalCount}c · {warningCount}w</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-transform duration-300">
          <p className="text-[9px] font-mono uppercase text-text-muted tracking-wider leading-none">Mode</p>
          <p className="text-base font-semibold font-mono leading-tight mt-0.5 text-text-secondary">{sim.mode}</p>
          <p className="text-[9px] text-text-muted flex items-center gap-1">
            <Activity size={8} className="text-status-ok" />{sim.lastUpdated}
          </p>
        </div>
      </div>

      {/* ── Schematic + Signal Cards ── */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="glass-card rounded-2xl p-5 min-w-0 flex flex-col shadow-2xl" style={{ minHeight: 440 }}>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase text-text-muted tracking-wider">Live Schematic</p>
              <h2 className="text-sm font-semibold text-text-primary">{configuredMachine.name}</h2>
              <p className="text-[11px] text-brand-cyan mt-0.5">
                {configuredMachine.signals.length} signals · {configuredMachine.components.length} parts
              </p>
            </div>
            
            {/* Start / Hold / Stop Machine Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStart}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border",
                  sim.running && sim.mode !== 'Hold'
                    ? "bg-status-ok/20 border-status-ok/40 text-status-ok"
                    : "bg-bg-base border-bg-border text-text-muted hover:text-status-ok hover:border-status-ok/40"
                )}
              >
                START
              </button>
              <button
                onClick={handleHold}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border",
                  sim.mode === 'Hold'
                    ? "bg-status-warning/20 border-status-warning/40 text-status-warning"
                    : "bg-bg-base border-bg-border text-text-muted hover:text-status-warning hover:border-status-warning/40"
                )}
              >
                HOLD
              </button>
              <button
                onClick={handleStop}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border",
                  !sim.running
                    ? "bg-status-critical/20 border-status-critical/40 text-status-critical"
                    : "bg-bg-base border-bg-border text-text-muted hover:text-status-critical hover:border-status-critical/40"
                )}
              >
                STOP
              </button>
            </div>
          </div>
          <div className="flex-1">
            <TemplateSchematicPreview
              machine={configuredMachine}
              hideMeta
              liveSignals={sim.signals}
              running={sim.running}
              onComponentClick={handleComponentClick}
            />
          </div>
        </section>

        {/* Signal cards — click opens popup, gear icon opens limit editor */}
        <aside className="flex flex-col gap-2">
          <div className="px-1 pb-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Live signals</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-sm font-semibold text-text-primary">All sensors</p>
              <div className="flex items-center gap-1 text-[10px] font-mono text-status-ok">
                <Activity size={9} className="animate-pulse" />{sim.lastUpdated}
              </div>
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">Click to inspect · ⚙ to set limits</p>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '460px' }}>
            {sim.signals.map((sig, i) => {
              const limits = sim.signalLimits[sig.name] ?? { min: sig.min, max: sig.max }
              const pct = Math.min(100, Math.max(0,
                ((sig.value - limits.min) / (limits.max - limits.min)) * 100
              ))
              const isSelected = selectedSignalIndex === i
              const isEditingLimit = editingLimitName === sig.name
              const hasCustomLimit =
                limits.min !== sig.min || limits.max !== sig.max

              return (
                  <div
                    key={sig.name}
                    className={clsx(
                      'glass-card rounded-xl transition-all duration-300 hover:shadow-lg',
                      isSelected ? 'border-brand-cyan/40 bg-brand-cyan/5' : '',
                      sig.status === 'critical' && !isSelected && 'border-status-critical/30',
                    sig.status === 'warning'  && !isSelected && 'border-status-warning/30',
                    isSignalHighlighted(sig.name) && 'ai-highlight',
                  )}
                >
                  <button
                    className="w-full text-left px-3 pt-2.5 pb-1 hover:bg-bg-hover/30 rounded-t-xl transition-colors"
                    onClick={() => { setSelectedSignalIndex(i); setPopupSignalIndex(i) }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-text-muted">{sig.name}</span>
                      <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border capitalize', statusBadge(sig.status))}>
                        {sig.status}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className={clsx('text-base font-mono font-semibold', {
                        'text-status-critical': sig.status === 'critical',
                        'text-status-warning':  sig.status === 'warning',
                        'text-text-primary':    sig.status === 'ok',
                      })}>
                        {sig.value % 1 === 0 ? sig.value : sig.value.toFixed(1)}
                        <span className="text-[10px] font-normal text-text-muted ml-1">{sig.unit}</span>
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">limit: {limits.max}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden bg-bg-base">
                      <div
                        className={clsx('h-full rounded-full transition-all duration-700', barColor(sig.status))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-text-muted font-mono">{limits.min} – {limits.max} {sig.unit}{hasCustomLimit ? ' ✎' : ''}</span>
                    </div>
                  </button>

                  {/* Gear button for limit editor - ONLY ENGINEER */}
                  {role === 'engineer' ? (
                    <div className="px-3 pb-2 flex items-center justify-between">
                      <span className="text-[9px] text-text-muted font-mono">tap card to inspect</span>
                      <button
                        onClick={e => { e.stopPropagation(); setEditingLimitName(isEditingLimit ? null : sig.name) }}
                        className={clsx(
                          'flex items-center gap-1 text-[9px] rounded px-1.5 py-0.5 border transition-all',
                          isEditingLimit
                            ? 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan'
                            : 'border-white/10 text-text-muted hover:text-brand-cyan hover:border-brand-cyan/30'
                        )}
                      >
                        <Settings2 size={9} />
                        limits
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 pb-2 flex items-center justify-between">
                      <span className="text-[9px] text-text-muted font-mono">tap card to inspect</span>
                    </div>
                  )}

                  {isEditingLimit && (
                    <div className="px-3 pb-3">
                      <SignalLimitEditor
                        sig={sig}
                        currentMin={limits.min}
                        currentMax={limits.max}
                        onSave={(min, max) => sim.setSignalLimit(sig.name, { min, max })}
                        onClose={() => setEditingLimitName(null)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>
      </div>

      {/* ⚙️ Equipment Control - collapsible 👇 (OPERATOR & ENGINEER ONLY) */}
      {role !== 'supervisor' && (
        <div className={clsx("glass-card rounded-2xl overflow-hidden shadow-xl", highlight.components.length > 0 && "ai-highlight")}>
          <button
            onClick={() => setEquipCtrlOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/20 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={14} className="text-text-muted" />
              <p className="text-sm font-semibold text-text-primary">Equipment Control</p>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="text-[10px] font-mono uppercase tracking-wider">{equipCtrlOpen ? 'Collapse' : 'Expand'}</span>
              {equipCtrlOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>
          {equipCtrlOpen && (
            <ComponentControlPanel
              noBorder
              components={configuredMachine.components}
              componentControls={sim.componentControls}
              signals={sim.signals}
              running={sim.running}
              mode={sim.mode}
              lastUpdated={sim.lastUpdated}
              onSetControl={sim.setComponentControl}
              onStart={handleStart}
              onStop={handleStop}
              onHold={handleHold}
            />
          )}
        </div>
      )}

      {/* 🔮 Predictive Maintenance - collapsible 👇 (ENGINEER ONLY) */}
      {role === 'engineer' && (
        <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
        <button
          onClick={() => setPredictiveOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/20 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-brand-cyan" />
            <p className="text-sm font-semibold text-text-primary">Predictive Maintenance</p>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-wider">{predictiveOpen ? 'Collapse' : 'Expand'}</span>
            {predictiveOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>
        {predictiveOpen && (
          <PredictiveMaintenance
            machineName={configuredMachine.name}
            signals={sim.signals}
            trendHistory={sim.trendHistory}
          />
        )}
      </div>
      )}

      {/* 📈 Live Trend Chart - collapsible 👇 (ENGINEER & SUPERVISOR ONLY) */}
      {role !== 'operator' && (
        <div className={clsx("glass-card rounded-2xl overflow-hidden shadow-xl", highlight.trend && "ai-highlight")}>
          <button
            onClick={() => setTrendOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/20 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-text-muted" />
              <p className="text-sm font-semibold text-text-primary">Live Trends</p>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="text-[10px] font-mono uppercase tracking-wider">{trendOpen ? 'Collapse' : 'Expand'}</span>
              {trendOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>
          {trendOpen && (
            <LiveTrendChart
              noBorder
              trendHistory={sim.trendHistory}
              signals={sim.signals}
              signalLimits={sim.signalLimits}
              onSetSignalLimit={sim.setSignalLimit}
              selectedSignalName={sim.signals[selectedSignalIndex]?.name}
              onSelectSignal={name => {
                const idx = sim.signals.findIndex(s => s.name === name)
                if (idx !== -1) { setSelectedSignalIndex(idx); setPopupSignalIndex(idx) }
              }}
            />
          )}
        </div>
      )}

      {popupSignal && (
        <SignalPopup
          signal={popupSignal}
          machine={configuredMachine}
          running={sim.running}
          mode={sim.mode}
          alarms={sim.alarms}
          componentControls={sim.componentControls}
          onClose={() => setPopupSignalIndex(null)}
          onStart={handleStart}
          onStop={handleStop}
          onHold={handleHold}
          onAcknowledge={sim.acknowledgeAlarm}
          onSetControl={sim.setComponentControl}
        />
      )}

      {/* Engineer Advanced Diagnostics Section */}
      {role === 'engineer' && (
        <div className="glass-card rounded-2xl overflow-hidden shadow-xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-status-warning" />
            <p className="text-sm font-semibold text-text-primary">Advanced Diagnostics & Tuning</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 border border-white/5 rounded-lg p-3">
              <p className="text-[10px] font-mono text-text-muted uppercase mb-2">PID Loop Tuning</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-text-secondary">Proportional (P)</span><span className="font-mono text-brand-cyan">1.24</span></div>
                <div className="flex justify-between text-xs"><span className="text-text-secondary">Integral (I)</span><span className="font-mono text-brand-cyan">0.08</span></div>
                <div className="flex justify-between text-xs"><span className="text-text-secondary">Derivative (D)</span><span className="font-mono text-brand-cyan">0.01</span></div>
              </div>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-lg p-3">
              <p className="text-[10px] font-mono text-text-muted uppercase mb-2">Network Latency</p>
              <div className="flex items-end gap-2 h-full pb-2">
                <span className="text-2xl font-mono font-semibold text-status-ok">12</span>
                <span className="text-xs text-text-muted mb-1">ms (OPC UA)</span>
              </div>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-lg p-3">
              <p className="text-[10px] font-mono text-text-muted uppercase mb-2">Safety Interlocks</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-status-ok" /><span className="text-text-secondary">E-Stop Circuit</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-status-ok" /><span className="text-text-secondary">Guard Doors</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-status-warning" /><span className="text-text-secondary">Pressure Relief</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component detail popup — triggered by clicking part in schematic */}
      {clickedComponent && (
        <ComponentDetailPopup
          comp={clickedComponent}
          controls={sim.componentControls[clickedComponent.id] ?? {}}
          signals={sim.signals}
          running={sim.running}
          mode={sim.mode}
          lastUpdated={sim.lastUpdated}
          onSetControl={(key, val) => sim.setComponentControl(clickedComponent.id, key, val)}
          onClose={() => setClickedComponent(null)}
          onStart={handleStart}
          onStop={handleStop}
          onHold={handleHold}
        />
      )}
    </div>
  )
}
