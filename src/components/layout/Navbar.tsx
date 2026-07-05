import { Bell, Search, ChevronDown, Wifi, RotateCcw, AlertTriangle, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import type { SimulatorOutput } from '../../hooks/useSimulator'

interface NavbarProps {
  role: string
  onRoleChange: (role: string) => void
  machineName?: string
  onReset?: () => void
  sim?: SimulatorOutput
}

export default function Navbar({ role, onRoleChange, machineName, onReset, sim }: NavbarProps) {
  // Live counts from simulator — fall back to 0 if no sim yet
  const unacked       = sim ? sim.alarms.filter(a => !a.acknowledged).length : 0
  const criticalCount = sim ? sim.alarms.filter(a => a.severity === 'critical' && !a.acknowledged).length : 0
  const warningCount  = sim ? sim.alarms.filter(a => a.severity === 'warning'  && !a.acknowledged).length : 0
  const healthScore   = sim?.healthScore ?? 100
  const running       = sim?.running ?? false
  const mode          = sim?.mode ?? 'Auto'

  const healthColor =
    healthScore < 50 ? 'text-status-critical border-status-critical/30 bg-status-critical/10' :
    healthScore < 80 ? 'text-status-warning  border-status-warning/30  bg-status-warning/10' :
                       'text-status-ok       border-status-ok/30        bg-status-ok/10'

  const modeColor =
    !running        ? 'text-status-critical border-status-critical/25 bg-status-critical/8' :
    mode === 'Hold' ? 'text-status-warning  border-status-warning/25  bg-status-warning/8'  :
                      'text-status-ok       border-status-ok/25        bg-status-ok/8'

  const modeLabel = !running ? 'STOPPED' : mode === 'Hold' ? 'HOLD' : 'RUNNING'

  return (
    <header className="h-14 bg-bg-panel backdrop-blur-md border-b border-white/5 flex items-center px-4 gap-3 shrink-0 z-50">

      {/* Logo */}
      <div className="flex items-center gap-2 w-[190px] shrink-0">
        <div className="w-7 h-7 rounded bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center">
          <span className="text-brand-cyan text-xs font-mono font-bold">N</span>
        </div>
        <div>
          <p className="font-neuroflow text-sm font-normal leading-none text-brand-cyan tracking-wide">NeuroFlow</p>
          {machineName
            ? <p className="text-text-muted text-[10px] font-mono truncate max-w-[130px]">{machineName}</p>
            : <p className="text-text-muted text-[10px] font-mono">v0.1 · DEMO MODE</p>
          }
        </div>
      </div>

      {/* Search */}
      <div className="w-52 shrink-0">
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-md px-3 h-8 shadow-inner shadow-black/50">
          <Search size={13} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search machines, alarms..."
            className="bg-transparent text-xs text-text-secondary placeholder:text-text-muted outline-none flex-1 font-sans"
          />
          <kbd className="text-[10px] text-text-muted bg-white/5 border border-white/10 rounded px-1.5 shadow-sm">⌘K</kbd>
        </div>
      </div>

      {/* ── Live KPI Pills ── */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">

        {/* Machine status — always visible */}
        {sim && (
          <div className={clsx(
            'flex items-center gap-1.5 px-2.5 h-7 rounded-full border text-[11px] font-mono font-semibold shrink-0',
            modeColor
          )}>
            <span className={clsx(
              'w-1.5 h-1.5 rounded-full shrink-0',
              !running        ? 'bg-status-critical' :
              mode === 'Hold' ? 'bg-status-warning animate-pulse' :
                                'bg-status-ok animate-pulse'
            )} />
            {modeLabel}
          </div>
        )}

        {/* Critical alarms — only show if any */}
        {criticalCount > 0 && (
          <div className="flex items-center gap-1 px-2 h-7 rounded-full border border-status-critical/30 bg-status-critical/10 shrink-0">
            <AlertTriangle size={10} className="text-status-critical" />
            <span className="text-[11px] font-bold text-status-critical font-mono">{criticalCount}</span>
            <span className="text-[10px] text-status-critical/70 hidden lg:inline">critical</span>
          </div>
        )}

        {/* Warning alarms — only show if any */}
        {warningCount > 0 && (
          <div className="flex items-center gap-1 px-2 h-7 rounded-full border border-status-warning/30 bg-status-warning/10 shrink-0">
            <AlertCircle size={10} className="text-status-warning" />
            <span className="text-[11px] font-bold text-status-warning font-mono">{warningCount}</span>
            <span className="text-[10px] text-status-warning/70 hidden lg:inline">warning</span>
          </div>
        )}

        {/* Health score — always visible, color changes live */}
        {sim && (
          <div className={clsx(
            'hidden sm:flex items-center gap-1.5 px-2.5 h-7 rounded-full border text-[11px] font-mono font-semibold shrink-0',
            healthColor
          )}>
            <span>Health</span>
            <span>{healthScore}%</span>
          </div>
        )}

        {/* Signals OK pill */}
        {sim && (
          <div className="hidden xl:flex items-center gap-1 px-2 h-7 rounded-full border border-status-ok/25 bg-status-ok/8 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-status-ok" />
            <span className="text-[11px] font-mono text-status-ok">
              {sim.signals.filter(s => s.status === 'ok').length}/{sim.signals.length} ok
            </span>
          </div>
        )}

        {/* Uptime — only when running */}
        {sim && running && (
          <div className="hidden 2xl:flex items-center gap-1 px-2 h-7 rounded-full border border-brand-cyan/20 bg-brand-cyan/5 shrink-0">
            <span className="text-[11px] font-mono text-brand-cyan">↑ {sim.uptime}% uptime</span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">

        {/* LIVE indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-status-ok font-mono">
          <Wifi size={12} />
          <span>LIVE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-status-ok animate-pulse-slow" />
        </div>

        {/* Bell with live badge */}
        <button className="relative p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
          <Bell size={16} className="text-text-secondary" />
          {unacked > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-status-critical text-[9px] font-bold text-white flex items-center justify-center pulse-ring">
              {criticalCount || unacked}
            </span>
          )}
        </button>

        {/* Role switcher */}
        <button
          onClick={() => onRoleChange(role === 'operator' ? 'engineer' : role === 'engineer' ? 'supervisor' : 'operator')}
          className="flex items-center gap-1.5 bg-black/30 border border-white/5 rounded-md px-3 h-8 text-xs text-text-secondary hover:border-brand-cyan/40 hover:text-brand-cyan transition-all shadow-inner shadow-black/50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
          {role.charAt(0).toUpperCase() + role.slice(1)}
          <ChevronDown size={11} />
        </button>

        {onReset && (
          <button
            onClick={onReset}
            title="Change machine"
            className="w-8 h-8 rounded-lg border border-bg-border flex items-center justify-center text-text-muted hover:text-brand-cyan hover:border-brand-cyan/30 transition-all"
          >
            <RotateCcw size={13} />
          </button>
        )}

        <div className="w-7 h-7 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-[11px] font-semibold text-brand-cyan">
          K
        </div>
      </div>
    </header>
  )
}
