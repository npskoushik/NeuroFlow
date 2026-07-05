import { useState, useEffect } from 'react'
import { AlertTriangle, ArrowRight, Check, ChevronDown, ChevronUp, Info, Sparkles, BellOff, Zap, Clock, Brain, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { SimAlarm, SimulatorOutput } from '../../hooks/useSimulator'
import type { MachineTemplate } from '../../data/machineTemplates'
import type { Severity } from '../../types'
import { analyzeRootCause } from '../../services/geminiService'

function severityStyle(s: Severity) {
  if (s === 'critical') return 'text-status-critical bg-status-critical/10 border-status-critical/30'
  if (s === 'warning')  return 'text-status-warning bg-status-warning/10 border-status-warning/30'
  return 'text-text-muted bg-bg-hover border-bg-border'
}

function SeverityIcon({ s }: { s: Severity }) {
  if (s === 'critical') return <AlertTriangle size={12} className="text-status-critical" />
  if (s === 'warning')  return <AlertTriangle size={12} className="text-status-warning" />
  return <Info size={12} className="text-text-muted" />
}

function elapsed(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60)  return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

interface LiveAlarmBannerProps {
  machine?: MachineTemplate
  sim?: SimulatorOutput
  alarms: SimAlarm[]
  onAcknowledge: (id: string) => void
  onSilence: (id: string, durationMs: number) => void
  onAlarmClick: (signalName: string) => void
}

export default function LiveAlarmBanner({
  machine, sim, alarms, onAcknowledge, onSilence, onAlarmClick,
}: LiveAlarmBannerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Phase 4: Root Cause Correlation
  const [rcResult, setRcResult] = useState<{title: string, explanation: string, action: string} | null>(null)
  const [rcLoading, setRcLoading] = useState(false)

  const nowMs = Date.now()
  const active = alarms.filter(a => !a.acknowledged && !(a.silencedUntil && nowMs < a.silencedUntil))
  const silenced = alarms.filter(a => !a.acknowledged && a.silencedUntil && nowMs < a.silencedUntil)
  const criticalCount = active.filter(a => a.severity === 'critical').length
  const warningCount  = active.filter(a => a.severity === 'warning').length
  const topAlarm = active.find(a => a.severity === 'critical') ?? active[0]

  const handleAnalyzeCorrelated = async () => {
    if (!machine || !sim) return
    setRcLoading(true)
    const ctx = {
      machine,
      signals: sim.signals,
      alarms: sim.alarms,
      trendHistory: sim.trendHistory,
      running: sim.running,
      mode: sim.mode,
      healthScore: sim.healthScore,
      uptime: sim.uptime,
      lastUpdated: sim.lastUpdated,
      componentControls: sim.componentControls,
      signalLimits: sim.signalLimits
    }
    const res = await analyzeRootCause(ctx)
    setRcResult(res)
    setRcLoading(false)
  }

  // Clear result if alarms drop below threshold
  useEffect(() => {
    if (active.length < 2) setRcResult(null)
  }, [active.length])

  if (active.length === 0 && silenced.length === 0) {
    return (
      <section className="rounded-xl border border-status-ok/25 bg-status-ok/5 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border border-status-ok/30 bg-status-ok/15 flex items-center justify-center">
          <Check size={14} className="text-status-ok" />
        </div>
        <div>
          <p className="text-sm font-semibold text-status-ok">All clear — no active alarms</p>
          <p className="text-[11px] text-text-muted mt-0.5">All signals within normal operating range.</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-status-ok">
          <span className="w-1.5 h-1.5 rounded-full bg-status-ok animate-pulse" />
          LIVE
        </div>
      </section>
    )
  }

  const showCorrelation = active.length >= 2

  return (
    <section className="rounded-xl border border-status-critical/35 bg-status-critical/5 shadow-[0_0_28px_rgba(255,59,59,0.10)] overflow-hidden">

      {/* PHASE 4: Alarm Correlation Engine (Takes over top banner if 2+ alarms) */}
      {showCorrelation ? (
        <div className="px-4 py-4 border-b border-status-critical/20 bg-status-critical/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-brand-cyan animate-pulse" />
              <h2 className="text-sm font-semibold text-text-primary">
                NexAI Correlation Engine: {active.length} Alarms Detected
              </h2>
            </div>
            {!rcResult && !rcLoading && (
              <button 
                onClick={handleAnalyzeCorrelated}
                className="text-[11px] font-semibold bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan px-3 py-1.5 rounded-lg hover:bg-brand-cyan/30 transition-colors flex items-center gap-1.5"
              >
                <Sparkles size={11} /> Find Root Cause
              </button>
            )}
            {rcLoading && (
              <span className="text-[11px] font-semibold text-brand-cyan flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" /> Analyzing Physics...
              </span>
            )}
          </div>
          
          {rcResult && (
            <div className="bg-bg-base/80 border border-brand-cyan/30 rounded-xl p-3 shadow-lg">
              <h3 className="text-[13px] font-bold text-status-critical mb-1 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Root Cause: {rcResult.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-2">
                {rcResult.explanation}
              </p>
              <div className="bg-brand-cyan/10 border border-brand-cyan/20 rounded p-2 flex items-start gap-2">
                <Check size={14} className="text-brand-cyan shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider block mb-0.5">Recommended Action</span>
                  <span className="text-xs text-text-primary font-semibold">{rcResult.action}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : topAlarm ? (
        <div className="grid gap-3 px-4 py-3 border-b border-status-critical/20 lg:grid-cols-[1.1fr_1.4fr_auto] lg:items-center">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onAlarmClick(topAlarm.signalName)}
            title="Click to inspect signal"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-status-critical/35 bg-status-critical/15">
              <AlertTriangle size={18} className="text-status-critical animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-status-critical flex items-center gap-1">
                {topAlarm.escalatedAt && <span className="text-[9px] bg-status-critical/20 border border-status-critical/30 rounded px-1">ESCALATED</span>}
                Live alarm · {topAlarm.timestamp}
              </p>
              <h2 className="truncate text-sm font-semibold text-text-primary group-hover:text-brand-cyan transition-colors">
                {topAlarm.message}
              </h2>
              {topAlarm.causeComponents.length > 0 && (
                <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                  <Zap size={9} className="text-status-warning" />
                  Caused by: {topAlarm.causeComponents.join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-2 rounded-lg border border-brand-cyan/15 bg-brand-cyan/5 px-3 py-2">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-cyan" />
            <p className="text-xs leading-relaxed text-text-secondary">{topAlarm.aiInsight}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onAcknowledge(topAlarm.id)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-status-ok/35 bg-status-ok/15 px-4 text-xs font-semibold text-status-ok hover:bg-status-ok/20 transition-colors whitespace-nowrap"
            >
              Acknowledge <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onSilence(topAlarm.id, 5 * 60 * 1000)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-bg-border bg-bg-hover px-4 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors whitespace-nowrap"
            >
              <BellOff size={12} /> Silence 5 min
            </button>
          </div>
        </div>
      ) : null}

      {/* Alarm list */}
      <div>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-bg-border/60">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-brand-cyan" />
            <span className="text-xs font-semibold text-text-primary">Active Alarms</span>
          </div>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border', severityStyle('critical'))}>
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border', severityStyle('warning'))}>
                {warningCount} warning
              </span>
            )}
            {silenced.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-text-muted bg-bg-hover border-bg-border">
                {silenced.length} silenced
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-bg-border/50 max-h-56 overflow-y-auto">
          {active.map(alarm => (
            <div key={alarm.id}>
              <div
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover/40 cursor-pointer"
                onClick={() => setExpandedId(expandedId === alarm.id ? null : alarm.id)}
              >
                <SeverityIcon s={alarm.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize', severityStyle(alarm.severity))}>
                      {alarm.severity}
                    </span>
                    {alarm.escalatedAt && (
                      <span className="text-[9px] bg-status-critical/15 border border-status-critical/25 text-status-critical rounded px-1 font-mono">ESC</span>
                    )}
                    {/* signal name — clickable to open popup */}
                    <button
                      className="text-[11px] text-brand-cyan font-mono hover:underline"
                      onClick={e => { e.stopPropagation(); onAlarmClick(alarm.signalName) }}
                      title="Inspect signal"
                    >
                      {alarm.signalName}
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">{alarm.message}</p>
                  {alarm.causeComponents.length > 0 && (
                    <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                      <Zap size={9} className="text-status-warning shrink-0" />
                      {alarm.causeComponents.join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-text-muted font-mono flex items-center gap-0.5">
                    <Clock size={9} />
                    {elapsed(alarm.firstFiredAt)}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); onSilence(alarm.id, 5 * 60 * 1000) }}
                    className="w-6 h-6 rounded-md bg-bg-hover border border-bg-border flex items-center justify-center hover:bg-bg-base transition-colors"
                    title="Silence 5 min"
                  >
                    <BellOff size={10} className="text-text-muted" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onAcknowledge(alarm.id) }}
                    className="w-6 h-6 rounded-md bg-status-ok/10 border border-status-ok/20 flex items-center justify-center hover:bg-status-ok/20 transition-colors"
                    title="Acknowledge"
                  >
                    <Check size={11} className="text-status-ok" />
                  </button>
                  {expandedId === alarm.id ? <ChevronUp size={12} className="text-text-muted" /> : <ChevronDown size={12} className="text-text-muted" />}
                </div>
              </div>

              {/* Expanded insight */}
              {expandedId === alarm.id && (
                <div className="mx-4 mb-2.5 rounded-lg border border-brand-cyan/15 bg-brand-cyan/5 px-3 py-2.5 space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles size={12} className="mt-0.5 shrink-0 text-brand-cyan" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-brand-cyan mb-1">AI Insight</p>
                      <p className="text-[11px] leading-relaxed text-text-secondary">{alarm.aiInsight}</p>
                    </div>
                  </div>
                  {alarm.causeComponents.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-brand-cyan/10">
                      <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Responsible components:</span>
                      {alarm.causeComponents.map(c => (
                        <span key={c} className="text-[10px] bg-status-warning/10 border border-status-warning/25 text-status-warning rounded px-2 py-0.5">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1 border-t border-brand-cyan/10">
                    <button
                      onClick={() => onAlarmClick(alarm.signalName)}
                      className="flex-1 h-7 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-[11px] font-semibold text-brand-cyan hover:bg-brand-cyan/20 transition-colors flex items-center justify-center gap-1"
                    >
                      Inspect signal <ArrowRight size={11} />
                    </button>
                    <button
                      onClick={() => onSilence(alarm.id, 5 * 60 * 1000)}
                      className="flex-1 h-7 rounded-lg border border-bg-border bg-bg-hover text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors flex items-center justify-center gap-1"
                    >
                      <BellOff size={11} /> Silence 5 min
                    </button>
                    <button
                      onClick={() => onAcknowledge(alarm.id)}
                      className="flex-1 h-7 rounded-lg border border-status-ok/30 bg-status-ok/10 text-[11px] font-semibold text-status-ok hover:bg-status-ok/20 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check size={11} /> Acknowledge
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Silenced alarms row */}
          {silenced.map(alarm => (
            <div key={alarm.id} className="flex items-center gap-3 px-4 py-2 opacity-50">
              <BellOff size={12} className="text-text-muted" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-text-muted font-mono">{alarm.signalName}</span>
                <span className="text-[10px] text-text-muted ml-2">
                  silenced · resumes in {Math.ceil(((alarm.silencedUntil ?? 0) - Date.now()) / 60000)}m
                </span>
              </div>
              <button
                onClick={() => onAcknowledge(alarm.id)}
                className="text-[10px] text-text-muted border border-bg-border rounded px-2 py-0.5 hover:text-text-primary"
              >
                ack
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
