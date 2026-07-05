import { LayoutDashboard, Cpu, Bell, BarChart2, History, Settings, Zap } from 'lucide-react'
import clsx from 'clsx'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  unackedCount?: number
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'machines',  label: 'Machines',  icon: Cpu },
  { id: 'alarms',    label: 'Alarms',    icon: Bell, badge: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'history',   label: 'History',   icon: History },
]

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ activePage, onNavigate, unackedCount = 0 }: SidebarProps) {
  return (
    <aside className="w-[220px] shrink-0 bg-black/20 backdrop-blur-xl border-r border-white/5 flex flex-col h-full z-40">
      {/* Nav items */}
      <nav className="flex-1 p-2 pt-3 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activePage === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group',
                isActive
                  ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              )}
            >
              <Icon size={15} className={isActive ? 'text-brand-cyan' : 'text-text-muted group-hover:text-text-secondary'} />
              <span className="flex-1 text-left font-medium">{label}</span>
              {badge && unackedCount > 0 && (
                <span className="ml-auto bg-status-critical text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[20px]">
                  {unackedCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Machine quick status */}
      <div className="p-3 border-t border-white/5 bg-black/10">
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">Quick Status</p>
        <div className="space-y-1.5">
          {[
            { name: 'Pump #1', status: 'critical' },
            { name: 'Conveyor #2', status: 'warning' },
            { name: 'Compressor #3', status: 'ok' },
            { name: 'Robot #4', status: 'ok' },
          ].map(m => (
            <div key={m.name} className="flex items-center gap-2 text-[11px]">
              <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', {
                'bg-status-critical': m.status === 'critical',
                'bg-status-warning animate-pulse': m.status === 'warning',
                'bg-status-ok': m.status === 'ok',
              })} />
              <span className="text-text-secondary truncate">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom items */}
      <div className="p-2 border-t border-white/5 bg-black/10 space-y-0.5">
        {bottomItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all"
          >
            <Icon size={15} className="text-text-muted" />
            <span>{label}</span>
          </button>
        ))}
        <div className="px-3 py-2 flex items-center gap-2">
          <Zap size={13} className="text-brand-cyan" />
          <span className="text-[10px] font-mono text-text-muted">AI-Powered HMI</span>
        </div>
      </div>
    </aside>
  )
}
