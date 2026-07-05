// ============================================================
// DESTINATION: src/components/dashboard/PredictiveMaintenance.tsx
// REPLACE entire file
// ============================================================

import { useState } from 'react'
import { Activity, Loader2, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LiveSignal, TrendPoint } from '../../hooks/useSimulator'
import type { FullSystemContext } from '../../services/geminiService'
import { predictFailure } from '../../services/geminiService'
import clsx from 'clsx'

interface Props {
  machineName: string
  signals: LiveSignal[]
  trendHistory: TrendPoint[]
  // ✅ Full context so AI knows components, controls, alarms
  fullContext?: FullSystemContext
}

function parseResult(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const get = (prefix: string) =>
    lines.find(l => l.startsWith(prefix))?.replace(prefix, '').trim() ?? ''
  return {
    health: get('HEALTH STATUS:'),
    failure: get('ESTIMATED FAILURE:'),
    recommendation: get('RECOMMENDATION:'),
  }
}

function HealthBadge({ health }: { health: string }) {
  const lower = health.toLowerCase()
  if (lower.includes('critical')) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-critical/10 border border-status-critical/30 text-status-critical">
      {health}
    </span>
  )
  if (lower.includes('degrad')) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-warning/10 border border-status-warning/30 text-status-warning">
      {health}
    </span>
  )
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-ok/10 border border-status-ok/30 text-status-ok">
      {health || 'Good'}
    </span>
  )
}

function TrendIcon({ signals, name }: { signals: LiveSignal[]; name: string }) {
  const sig = signals.find(s => s.name === name)
  if (!sig) return <Minus size={11} className="text-text-muted" />
  const ratio = sig.value / sig.threshold
  if (ratio > 0.9) return <TrendingUp size={11} className="text-status-critical" />
  if (ratio > 0.7) return <TrendingDown size={11} className="text-status-warning" />
  return <Minus size={11} className="text-status-ok" />
}

export default function PredictiveMaintenance({ machineName, signals, trendHistory, fullContext }: Props) {
  const [result, setResult] = useState<ReturnType<typeof parseResult> | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePredict = async () => {
    setLoading(true)
    setResult(null)
    try {
      // ✅ Pass full context so Gemini knows component loads, alarm history, etc.
      const text = await predictFailure(machineName, signals, trendHistory, fullContext)
      setResult(parseResult(text))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 grid grid-cols-2 gap-2 border-b border-bg-border">
        {signals.slice(0, 4).map(sig => (
          <div key={sig.name} className="flex items-center gap-2 bg-bg-base rounded-lg px-3 py-2 border border-bg-border">
            <TrendIcon signals={signals} name={sig.name} />
            <div className="min-w-0">
              <p className="text-[10px] text-text-muted truncate">{sig.name}</p>
              <p className={clsx(
                'text-xs font-mono font-semibold',
                sig.status === 'critical' ? 'text-status-critical'
                  : sig.status === 'warning' ? 'text-status-warning'
                  : 'text-status-ok'
              )}>
                {sig.value}{sig.unit}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3">
        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-xs font-semibold hover:bg-brand-cyan/20 transition-all disabled:opacity-50"
        >
          {loading
            ? <><Loader2 size={12} className="animate-spin" /> Running AI analysis...</>
            : <><Sparkles size={12} /> Predict Failure Risk</>
          }
        </button>

        {result && !loading && (
          <div className="mt-3 space-y-2">
            <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted font-mono">HEALTH STATUS</span>
                <HealthBadge health={result.health} />
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] text-text-muted font-mono shrink-0">EST. FAILURE</span>
                <span className="text-[11px] text-text-secondary text-right">{result.failure}</span>
              </div>
              <div className="pt-1 border-t border-bg-border">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles size={9} className="text-brand-cyan" />
                  <span className="text-[10px] font-semibold text-brand-cyan font-mono">RECOMMENDATION</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
