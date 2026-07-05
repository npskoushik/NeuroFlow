import { useState, useEffect } from 'react'
import { TrendingUp, Package, Target, Clock, Activity, CheckCircle, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import type { SimulatorOutput } from '../../hooks/useSimulator'

interface SupervisorAnalyticsProps {
  sim: SimulatorOutput
  machineName: string
}

export default function SupervisorAnalytics({ sim, machineName }: SupervisorAnalyticsProps) {
  const [unitsProduced, setUnitsProduced] = useState(12450)
  const dailyGoal = 15000
  const remaining = Math.max(0, dailyGoal - unitsProduced)
  const progressPct = Math.min(100, (unitsProduced / dailyGoal) * 100)
  
  // Simulate production while running
  useEffect(() => {
    if (!sim.running) return
    const interval = setInterval(() => {
      // Simulate producing units based on speed/health
      const speedFactor = sim.healthScore / 100
      setUnitsProduced(prev => prev + Math.floor(Math.random() * 3 * speedFactor) + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [sim.running, sim.healthScore])

  // OEE (Overall Equipment Effectiveness) = Availability x Performance x Quality
  const availability = sim.uptime
  const performance = Math.max(60, sim.healthScore - 5) // Mock performance based on health
  const quality = 99.2 // Mock quality
  const oee = (availability * performance * quality) / 10000

  return (
    <div className="glass-card rounded-2xl p-5 mb-4 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-brand-accent" />
        <h2 className="text-sm font-semibold text-text-primary">Production KPIs & Analytics</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Units Produced */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Units Produced</span>
            <Package size={14} className="text-brand-accent" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold text-text-primary">{unitsProduced.toLocaleString()}</span>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={10} className="text-status-ok" />
              <span className="text-[10px] text-status-ok font-mono">+12% vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Daily Goal</span>
            <Target size={14} className="text-status-warning" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold text-text-primary">{dailyGoal.toLocaleString()}</span>
            <div className="w-full bg-bg-base h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-brand-accent transition-all duration-500" 
                style={{ width: `${progressPct}%` }} 
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{remaining.toLocaleString()} remaining</p>
          </div>
        </div>

        {/* OEE */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">OEE</span>
            <Activity size={14} className={oee > 85 ? 'text-status-ok' : 'text-status-warning'} />
          </div>
          <div>
            <span className={clsx(
              "text-2xl font-mono font-bold", 
              oee > 85 ? "text-status-ok" : "text-status-warning"
            )}>
              {oee.toFixed(1)}%
            </span>
            <div className="flex gap-2 mt-1">
              <span className="text-[9px] text-text-muted">A: {availability.toFixed(0)}%</span>
              <span className="text-[9px] text-text-muted">P: {performance.toFixed(0)}%</span>
              <span className="text-[9px] text-text-muted">Q: {quality.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Downtime */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Downtime</span>
            <Clock size={14} className="text-status-critical" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold text-status-critical">42m</span>
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle size={10} className="text-status-critical" />
              <span className="text-[10px] text-text-muted font-mono">2 events today</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Efficiency Report Summary */}
      <div className="bg-black/20 border border-white/5 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-text-primary mb-3">Efficiency Report Summary</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-status-ok shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Energy consumption per unit is optimal. The main drive is operating at 94% efficiency.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Slight bottleneck detected in out-valve throughput during peak load. Consider adjusting parameters.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp size={14} className="text-brand-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Yield is tracking slightly ahead of weekly targets. Keep {machineName} running at current mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
