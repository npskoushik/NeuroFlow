import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Maximize2, Minimize2, SlidersHorizontal, RotateCcw, X } from 'lucide-react'
import clsx from 'clsx'
import type { LiveSignal, TrendPoint, SignalLimits } from '../../hooks/useSimulator'

const SIGNAL_COLORS = [
  '#FF3B3B', '#00D4FF', '#FFB800', '#4ADE80', '#A78BFA',
  '#F97316', '#EC4899', '#06B6D4', '#84CC16', '#EAB308',
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-[11px] shadow-lg" style={{ zIndex: 999 }}>
      <p className="text-text-muted mb-1 font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey}: <span className="font-mono font-semibold">
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

function buildTicks(min: number, max: number, step: number): number[] {
  if (step <= 0 || min >= max) return []
  const ticks: number[] = []
  const start = Math.ceil(min / step) * step
  for (let v = start; v <= max + 1e-9; v = parseFloat((v + step).toFixed(10))) {
    ticks.push(parseFloat(v.toFixed(6)))
    if (ticks.length > 200) break
  }
  return ticks
}

interface LiveTrendChartProps {
  trendHistory: TrendPoint[]
  signals: LiveSignal[]
  // Shared limits from useSimulator (min/max sync'd with signal cards)
  signalLimits: Record<string, SignalLimits>
  onSetSignalLimit: (name: string, limits: Partial<SignalLimits>) => void
  noBorder?: boolean
  selectedSignalName?: string
  onSelectSignal: (name: string) => void
}

export default function LiveTrendChart({
  trendHistory, signals, signalLimits, onSetSignalLimit,
  selectedSignalName, onSelectSignal, noBorder = false,
}: LiveTrendChartProps) {
  const activeSignal = signals.find(s => s.name === selectedSignalName) ?? signals[0]
  const activeIndex  = signals.findIndex(s => s.name === activeSignal?.name)
  const color        = SIGNAL_COLORS[activeIndex % SIGNAL_COLORS.length]

  const [fullscreen,     setFullscreen]     = useState(false)
  const [showScalePanel, setShowScalePanel] = useState(false)

  // Step is chart-only (not synced to signal cards)
  const [stepOverrides, setStepOverrides] = useState<Record<string, number>>({})
  const [draftMin,  setDraftMin]  = useState('')
  const [draftMax,  setDraftMax]  = useState('')
  const [draftStep, setDraftStep] = useState('')

  // Seed drafts from shared limits when active signal changes
  useEffect(() => {
    if (!activeSignal) return
    const sharedLimits = signalLimits[activeSignal.name]
    const min = sharedLimits?.min ?? activeSignal.min
    const max = sharedLimits?.max ?? activeSignal.max
    const step =
  stepOverrides[activeSignal.name] ??
  (Math.round((max - min) / 5) || 1)
    setDraftMin(String(min))
    setDraftMax(String(max))
    setDraftStep(String(step))
  }, [activeSignal?.name, signalLimits])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const applyScale = () => {
    if (!activeSignal) return
    const mn   = parseFloat(draftMin)
    const mx   = parseFloat(draftMax)
    const step = parseFloat(draftStep)
    if (isNaN(mn) || isNaN(mx) || isNaN(step) || mn >= mx || step <= 0) return
    // Shared: update min/max in simulator (syncs to signal cards)
    onSetSignalLimit(activeSignal.name, { min: mn, max: mx })
    // Local: step only
    setStepOverrides(prev => ({ ...prev, [activeSignal.name]: step }))
    setShowScalePanel(false)
  }

  const resetScale = () => {
    if (!activeSignal) return
    onSetSignalLimit(activeSignal.name, { min: activeSignal.min, max: activeSignal.max })
    setStepOverrides(prev => { const n = { ...prev }; delete n[activeSignal.name]; return n })
    setDraftMin(String(activeSignal.min))
    setDraftMax(String(activeSignal.max))
    setDraftStep(String(Math.round((activeSignal.max - activeSignal.min) / 5) || 1))
  }

  const getYDomain = (): [number, number] => {
    if (!activeSignal) return [0, 100]
    const lim = signalLimits[activeSignal.name]
    return lim ? [lim.min, lim.max] : [activeSignal.min, activeSignal.max]
  }

  const getYTicks = (): number[] | undefined => {
    if (!activeSignal) return undefined
    const lim  = signalLimits[activeSignal.name]
    const min  = lim?.min ?? activeSignal.min
    const max  = lim?.max ?? activeSignal.max
    const step = stepOverrides[activeSignal.name] ??( Math.round((max - min) / 5) || 1)
    return buildTicks(min, max, step)
  }

  const hasCustom = () => {
    if (!activeSignal) return false
    const lim = signalLimits[activeSignal.name]
    return lim ? (lim.min !== activeSignal.min || lim.max !== activeSignal.max || Boolean(stepOverrides[activeSignal.name])) : false
  }

  const renderTabs = () => (
    <div className="flex flex-wrap gap-1 mb-3">
      {signals.map((sig, i) => {
        const lim = signalLimits[sig.name]
        const customized = lim && (lim.min !== sig.min || lim.max !== sig.max || stepOverrides[sig.name])
        return (
          <button
            key={sig.name}
            onClick={() => onSelectSignal(sig.name)}
            className={clsx(
              'h-7 px-2.5 rounded-lg border text-[11px] font-semibold transition-all',
              (selectedSignalName === sig.name || (!selectedSignalName && i === 0))
                ? 'border-transparent text-bg-base'
                : 'border-bg-border text-text-muted hover:text-text-secondary'
            )}
            style={
              (selectedSignalName === sig.name || (!selectedSignalName && i === 0))
                ? { backgroundColor: SIGNAL_COLORS[i % SIGNAL_COLORS.length] }
                : {}
            }
          >
            {sig.name.length > 14 ? sig.name.slice(0, 13) + '…' : sig.name}
            {customized && <span className="ml-1 opacity-60 text-[9px]">⚙</span>}
          </button>
        )
      })}
    </div>
  )

  const renderChart = (height: number) => {
    if (trendHistory.length < 2) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-text-muted text-sm font-mono">Collecting data…</p>
        </div>
      )
    }
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={trendHistory} margin={{ top: 5, right: 24, bottom: 5, left: 4 }}>
          <XAxis
            dataKey="time"
            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={getYDomain()}
            ticks={getYTicks()}
            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          {activeSignal && (
            <ReferenceLine
              y={activeSignal.threshold}
              stroke={color}
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              label={{ value: `limit ${activeSignal.threshold}`, fill: color, fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          {activeSignal && (
            <Line
              type="monotone"
              dataKey={activeSignal.name}
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  const renderHeader = () => {
    const lim = activeSignal ? signalLimits[activeSignal.name] : undefined
    return (
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Live Trend — {activeSignal?.name ?? 'Select a signal'}
            {hasCustom() && (
              <span className="ml-2 text-[10px] font-mono text-brand-cyan border border-brand-cyan/30 bg-brand-cyan/10 px-1.5 py-0.5 rounded-full">
                custom scale
              </span>
            )}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Last {trendHistory.length}s · threshold shown
            {lim && activeSignal && (
              <span className="ml-2 font-mono">
                Y: {lim.min}–{lim.max} {activeSignal.unit}
                {stepOverrides[activeSignal.name] && ` step ${stepOverrides[activeSignal.name]}`}
                {' · '}
                <span className="text-brand-cyan/70 text-[9px]">synced with signal cards</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowScalePanel(p => !p)}
              className={clsx(
                'flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-all',
                showScalePanel || hasCustom()
                  ? 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan'
                  : 'border-bg-border text-text-muted hover:text-text-secondary'
              )}
              title="Y-axis scale"
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">Y Scale</span>
            </button>

            {showScalePanel && activeSignal && (
              <div className="absolute right-0 top-10 z-[200] bg-bg-card border border-bg-border rounded-xl shadow-2xl p-4" style={{ width: 284 }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-text-primary">Y-axis scale</p>
                  <button onClick={() => setShowScalePanel(false)} className="text-text-muted hover:text-text-secondary"><X size={13} /></button>
                </div>
                <p className="text-[11px] text-text-muted mb-1">
                  Signal: <span className="text-text-secondary font-semibold">{activeSignal.name}</span>
                  <span className="ml-1 font-mono">({activeSignal.unit})</span>
                </p>
                <p className="text-[10px] text-brand-cyan/70 mb-3 font-mono">Min & max sync to signal cards automatically</p>
                <div className="space-y-2 mb-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-text-muted mb-1">Min value</label>
                    <input type="number" value={draftMin} onChange={e => setDraftMin(e.target.value)}
                      className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono outline-none focus:border-brand-cyan/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-text-muted mb-1">Max value</label>
                    <input type="number" value={draftMax} onChange={e => setDraftMax(e.target.value)}
                      className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono outline-none focus:border-brand-cyan/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-text-muted mb-1">
                      Step — chart only (units per division)
                    </label>
                    <input type="number" value={draftStep} onChange={e => setDraftStep(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono outline-none focus:border-brand-cyan/40" />
                    <p className="text-[10px] text-text-muted mt-1 font-mono">Step 10 → ticks at …10, 20, 30…</p>
                  </div>
                </div>
                <div className="text-[10px] text-text-muted font-mono mb-3">
                  Original: {activeSignal.min} – {activeSignal.max} {activeSignal.unit}
                </div>
                <div className="flex gap-2">
                  <button onClick={resetScale}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-bg-border text-xs text-text-muted hover:text-text-secondary flex-1 justify-center">
                    <RotateCcw size={11} /> Reset
                  </button>
                  <button onClick={applyScale}
                    className="flex-1 h-8 px-3 rounded-lg bg-brand-cyan text-bg-base text-xs font-semibold hover:bg-brand-glow transition-colors">
                    Set Scale
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { setFullscreen(p => !p); setShowScalePanel(false) }}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-bg-border text-text-muted hover:text-brand-cyan hover:border-brand-cyan/30 text-xs font-semibold transition-all"
          >
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span className="hidden sm:inline">{fullscreen ? 'Exit' : 'Full'}</span>
          </button>
        </div>
      </div>
    )
  }

  if (fullscreen) {
    return (
      <>
        <div className="bg-bg-card border border-bg-border rounded-xl p-4 h-24 flex items-center justify-center opacity-30 select-none pointer-events-none">
          <p className="text-text-muted text-xs font-mono">Trend chart open in fullscreen</p>
        </div>
        <div className="fixed inset-0 z-[100] bg-bg-base flex flex-col p-6">
          {renderHeader()}
          {renderTabs()}
          <div className="flex-1 min-h-0">
            {renderChart(window.innerHeight - 200)}
          </div>
          <p className="text-center text-[11px] text-text-muted font-mono mt-3">
            Press <kbd className="border border-bg-border rounded px-1 text-text-secondary">Esc</kbd> or
            <button onClick={() => setFullscreen(false)} className="ml-1 text-brand-cyan hover:underline">Exit</button>
          </p>
        </div>
      </>
    )
  }

  return (
    <div className={noBorder ? 'p-4' : 'bg-bg-card border border-bg-border rounded-xl p-4'}>
      {renderHeader()}
      {renderTabs()}
      {renderChart(220)}
    </div>
  )
}
