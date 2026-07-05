import { useState } from 'react'
import { Settings2, ChevronDown, ChevronUp, Activity, AlertTriangle, Wrench, Droplets, Wind, Thermometer, Gauge, ShieldAlert, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { getControlDefs } from '../../hooks/useSimulator'
import type { LiveSignal } from '../../hooks/useSimulator'
import type { ComponentTemplate } from '../../data/machineTemplates'

// ── Helpers ────────────────────────────────────────────────────────────
function getCompIcon(comp: ComponentTemplate): string {
  const k = (comp.id + ' ' + comp.label).toLowerCase()
  if (k.includes('pump'))                             return '🔄'
  if (k.includes('valve'))                            return '🔧'
  if (k.includes('motor') || k.includes('drive'))     return '⚙️'
  if (k.includes('fan') || k.includes('blower'))      return '💨'
  if (k.includes('conveyor') || k.includes('belt'))   return '🏭'
  if (k.includes('boiler') || k.includes('heater') || k.includes('burner')) return '🔥'
  if (k.includes('compressor'))                       return '💨'
  if (k.includes('mixer') || k.includes('agitator'))  return '🌀'
  if (k.includes('robot') || k.includes('arm'))       return '🦾'
  if (k.includes('cnc') || k.includes('spindle'))     return '⚙️'
  if (k.includes('tank') || k.includes('vessel'))     return '🏺'
  if (k.includes('filter'))                           return '🔹'
  if (k.includes('hopper') || k.includes('feeder'))   return '🏗️'
  if (k.includes('gauge') || k.includes('sensor'))    return '📡'
  if (k.includes('heat exchanger'))                   return '♨️'
  if (k.includes('chiller') || k.includes('cooler'))  return '❄️'
  if (k.includes('accumulator') || k.includes('receiver')) return '🫙'
  if (k.includes('separator') || k.includes('cyclone')) return '🌪️'
  return '📡'
}

// ── Comprehensive component → signal mapping ────────────────────────
// Each entry: component keywords → signal keywords it physically affects
// Physics rationale documented inline
const COMPONENT_SIGNAL_MAP: Array<{
  compKeys: string[]      // any of these in component name/id → match
  signalKeys: string[]    // signals whose names contain any of these
  reason: string          // why this component affects those signals
}> = [
  // ── PUMP (all types) ────────────────────────────────────────────
  // Speed → pressure (affinity law: P∝N²), flow (F∝N), vibration (bearing), power (P∝N³)
  // Friction heat → bearing temp, winding temp
  {
    compKeys: ['pump'],
    signalKeys: ['rpm', 'speed', 'flow', 'rate', 'pressure', 'discharge pressure',
                 'vibration', 'power', 'current', 'throughput',
                 'temp', 'bearing', 'coolant', 'inlet temp', 'outlet temp'],
    reason: 'Pump speed drives flow, pressure, vibration, power draw, and bearing temperature',
  },

  // ── MOTOR / DRIVE / ENGINE / SERVO ──────────────────────────────
  // Speed → RPM, vibration, current, power; friction → winding/bearing temp
  {
    compKeys: ['motor', 'drive', 'engine', 'servo'],
    signalKeys: ['rpm', 'speed', 'motor speed', 'current', 'motor current',
                 'power', 'vibration', 'temp', 'motor temp', 'bearing', 'winding',
                 'torque', 'load'],
    reason: 'Motor speed controls RPM and current; friction raises winding and bearing temperature',
  },

  // ── FAN / BLOWER / EXHAUST ──────────────────────────────────────
  // Fan speed → air flow, power; cooling effect → surrounding/drum temperature
  {
    compKeys: ['fan', 'blower', 'exhaust'],
    signalKeys: ['fan speed', 'fan rpm', 'rpm', 'speed', 'air flow', 'flow',
                 'power', 'current', 'temp', 'humidity'],
    reason: 'Fan speed sets airflow; airflow directly influences temperature and humidity',
  },

  // ── VALVE (all subtypes) ────────────────────────────────────────
  // Opening position → flow rate, downstream pressure, tank level
  {
    compKeys: ['valve', 'gate', 'damper', 'prv', 'relief'],
    signalKeys: ['flow', 'rate', 'pressure', 'inlet pressure', 'outlet pressure',
                 'level', 'basin', 'differential', 'steam pressure', 'water level'],
    reason: 'Valve opening controls flow rate, modifies line pressure, and affects tank levels',
  },

  // ── COMPRESSOR ──────────────────────────────────────────────────
  // Speed → discharge pressure, temperature (compression heat), power
  {
    compKeys: ['compressor'],
    signalKeys: ['discharge pressure', 'outlet pressure', 'pressure', 'rpm', 'speed',
                 'discharge temp', 'temp', 'power', 'current', 'motor current',
                 'oil pressure', 'inlet temp', 'air flow'],
    reason: 'Compressor speed raises discharge pressure and temperature; power rises with load',
  },

  // ── CONVEYOR / BELT ─────────────────────────────────────────────
  // Belt speed → motor current (load), power, temperature of motor; mechanical tension
  {
    compKeys: ['conveyor', 'belt'],
    signalKeys: ['belt speed', 'speed', 'line speed', 'motor temp', 'temp',
                 'load', 'weight', 'current', 'motor current', 'power',
                 'tension', 'oee', 'throughput'],
    reason: 'Belt speed determines throughput and motor load; load raises motor current and temperature',
  },

  // ── BOILER / HEATER / BURNER / OVEN / DRYER / FURNACE ──────────
  // Power/fuel → temperature, steam pressure; water consumption → water level
  {
    compKeys: ['boiler', 'heater', 'burner', 'oven', 'dryer', 'furnace'],
    signalKeys: ['temp', 'zone', 'drum', 'steam pressure', 'pressure', 'steam',
                 'water level', 'fuel', 'combustion', 'efficiency', 'flue',
                 'moisture', 'power'],
    reason: 'Heater power directly raises temperature and steam pressure; burns fuel and consumes feed water',
  },

  // ── REACTOR / FERMENTER / AUTOCLAVE / CHAMBER ───────────────────
  // Internal reactions → temperature, pressure, pH, CO₂, level changes
  {
    compKeys: ['reactor', 'fermenter', 'autoclave', 'chamber'],
    signalKeys: ['temp', 'pressure', 'level', 'ph', 'co2', 'dissolved',
                 'oxygen', 'conductivity', 'turbidity', 'specific gravity'],
    reason: 'Reactor conditions (temp, pressure, pH) are coupled — changing one affects others',
  },

  // ── MIXER / AGITATOR / IMPELLER ─────────────────────────────────
  // Agitation speed → mixing temp (friction), power, level fluctuation, viscosity
  {
    compKeys: ['mixer', 'agitator', 'impeller'],
    signalKeys: ['rpm', 'speed', 'agitator', 'temp', 'level',
                 'viscosity', 'power', 'current'],
    reason: 'Agitator speed creates frictional heat, affects level measurement, and draws power proportional to viscosity',
  },

  // ── ROBOT / ARM / GRIPPER ───────────────────────────────────────
  // Joint motors → angles, torque, temperature per joint, cycle time
  {
    compKeys: ['robot', 'arm', 'gripper'],
    signalKeys: ['joint', 'angle', 'j1', 'j2', 'j3', 'j4', 'j5', 'j6',
                 'torque', 'force', 'end effector', 'cycle', 'speed',
                 'temp', 'motor temp', 'payload', 'current'],
    reason: 'Each robot joint motor produces heat and torque; speed affects cycle time and payload capacity',
  },

  // ── CNC / SPINDLE / LATHE / MILLING / TURRET ────────────────────
  // Spindle speed → cutting force, vibration, spindle temp, tool wear
  {
    compKeys: ['cnc', 'spindle', 'lathe', 'milling', 'turret'],
    signalKeys: ['spindle speed', 'spindle rpm', 'rpm', 'cutting force', 'force',
                 'spindle temp', 'temp', 'tool wear', 'vibration', 'feed rate',
                 'power', 'load', 'current', 'chuck'],
    reason: 'Spindle speed drives cutting forces; high speed raises spindle temperature and accelerates tool wear',
  },

  // ── FILLING / CAPPER / BOTTLE ────────────────────────────────────
  // Machine speed → fill volume consistency, line speed, reject rate
  {
    compKeys: ['fill', 'capper', 'bottle', 'nozzle'],
    signalKeys: ['fill', 'volume', 'line speed', 'bpm', 'bottles',
                 'torque', 'capping', 'reject', 'temp', 'level'],
    reason: 'Filler speed controls output volume and line throughput; temperature affects seal quality',
  },

  // ── FILTER / STRAINER / SCREEN ───────────────────────────────────
  // Clogging → differential pressure rises; turbidity of outlet drops (passive output)
  {
    compKeys: ['filter', 'strainer', 'screen'],
    signalKeys: ['differential', 'filter dp', 'dp', 'pressure drop',
                 'turbidity', 'flow', 'backwash'],
    reason: 'Filter media fouling raises differential pressure; clean filter reduces turbidity in outlet stream',
  },

  // ── HOPPER / FEEDER / BIN ────────────────────────────────────────
  // Discharge rate → hopper level drops; material throughput; moisture tracked
  {
    compKeys: ['hopper', 'feeder', 'bin'],
    signalKeys: ['hopper', 'level', 'silo', 'feed rate', 'rate',
                 'moisture', 'throughput', 'discharge', 'amplitude'],
    reason: 'Discharge rate depletes hopper level and sets feed throughput; moisture content affects flow behaviour',
  },

  // ── HEAT EXCHANGER / COOLER / CONDENSER / EVAPORATOR ────────────
  // Hot-side flow → outlet temperatures on both sides; fouling degrades performance
  {
    compKeys: ['heat exchanger', 'exchanger', 'cooler', 'condenser', 'evaporator', 'intercooler'],
    signalKeys: ['hot inlet', 'hot outlet', 'cold inlet', 'cold outlet',
                 'temp', 'fouling', 'flow', 'pressure', 'cop'],
    reason: 'Heat exchanger duty sets both hot and cold outlet temperatures; fouling reduces heat transfer efficiency',
  },

  // ── COOLING TOWER ────────────────────────────────────────────────
  // Fan speed + water flow → inlet/outlet temperatures, basin level
  {
    compKeys: ['cooling tower', 'tower'],
    signalKeys: ['inlet temp', 'outlet temp', 'temp', 'basin',
                 'level', 'fan', 'conductivity', 'flow'],
    reason: 'Tower performance sets approach temperature; evaporation raises conductivity and lowers basin level',
  },

  // ── HYDRAULIC ACCUMULATOR / CYLINDER / PRESS ─────────────────────
  // Hydraulic pressure → force on cylinder, oil temperature from compression
  {
    compKeys: ['accumulator', 'cylinder', 'press', 'hydraulic'],
    signalKeys: ['hydraulic pressure', 'pressure', 'force', 'oil temp',
                 'temp', 'stroke', 'cycle'],
    reason: 'Hydraulic pressure determines press force; repeated cycling raises oil temperature',
  },

  // ── SEPARATOR / CYCLONE / CLASSIFIER ─────────────────────────────
  // Feed flow → separation efficiency, recovery rate, pressure drop
  {
    compKeys: ['separator', 'cyclone', 'classifier', 'hydrocyclone'],
    signalKeys: ['recovery', 'efficiency', 'flow', 'pressure', 'level', 'turbidity'],
    reason: 'Feed rate and geometry determine separation efficiency and recovery; higher flow increases pressure drop',
  },

  // ── TANK / VESSEL / SILO / STORAGE ───────────────────────────────
  // Purely passive — shows result signals (level, temp if heated, pressure if sealed)
  {
    compKeys: ['tank', 'vessel', 'silo', 'storage', 'receiver', 'buffer'],
    signalKeys: ['level', 'water level', 'tank level', 'basin', 'temp',
                 'pressure', 'ph', 'conductivity'],
    reason: 'Tank holds process fluid — level, temperature, and chemistry are directly observed here',
  },

  // ── REACTOR → DOSING / CHEMICAL SECTION ──────────────────────────
  // Dosing pump → pH, conductivity, chlorine
  {
    compKeys: ['dosing', 'chemical', 'reagent'],
    signalKeys: ['ph', 'conductivity', 'chlorine', 'turbidity',
                 'dissolved', 'chemical', 'alkalinity'],
    reason: 'Dosing pump rate directly changes chemical concentrations (pH, chlorine, conductivity)',
  },

  // ── GENERATOR / ALTERNATOR / INVERTER ────────────────────────────
  // Engine/turbine → voltage, frequency, output power, fuel consumption
  {
    compKeys: ['generator', 'alternator', 'inverter', 'ups'],
    signalKeys: ['voltage', 'frequency', 'output', 'power', 'fuel',
                 'current', 'temp', 'load', 'rpm', 'battery', 'soc'],
    reason: 'Generator speed sets output voltage and frequency; load affects fuel consumption and temperature',
  },

  // ── CHILLER / REFRIGERANT COMPRESSOR ─────────────────────────────
  // Compressor load → chilled water temp, refrigerant pressure, COP
  {
    compKeys: ['chiller', 'refrigerant'],
    signalKeys: ['chilled', 'temp', 'condenser', 'evaporator',
                 'pressure', 'cop', 'load', 'current'],
    reason: 'Chiller compressor load sets refrigerant pressure and ultimately chilled water temperature',
  },
]

/** Find all signals that a component physically drives or affects */
function getAffectedSignals(comp: ComponentTemplate, signals: LiveSignal[]): LiveSignal[] {
  const compKey = (comp.id + ' ' + comp.label).toLowerCase()

  // Find which rule entries match this component
  const matchedSignalKeys = new Set<string>()
  for (const rule of COMPONENT_SIGNAL_MAP) {
    if (rule.compKeys.some(ck => compKey.includes(ck))) {
      rule.signalKeys.forEach(sk => matchedSignalKeys.add(sk))
    }
  }

  if (matchedSignalKeys.size === 0) return []

  // Match machine's live signals against collected signal keywords
  return signals.filter(s => {
    const sigName = s.name.toLowerCase()
    return [...matchedSignalKeys].some(keyword => sigName.includes(keyword))
  })
}

/** Get the human-readable reason text for the first matching rule */
function getComponentPhysicsReason(comp: ComponentTemplate): string {
  const compKey = (comp.id + ' ' + comp.label).toLowerCase()
  const rule = COMPONENT_SIGNAL_MAP.find(r => r.compKeys.some(ck => compKey.includes(ck)))
  return rule?.reason ?? 'Sensor or passive component — monitors process conditions'
}

function signalStatusColor(s: string) {
  if (s === 'critical') return 'text-status-critical'
  if (s === 'warning')  return 'text-status-warning'
  return 'text-status-ok'
}
function barColorClass(s: string) {
  if (s === 'critical') return 'bg-status-critical'
  if (s === 'warning')  return 'bg-status-warning'
  return 'bg-status-ok'
}

// ── Passive Component Status ────────────────────────────────────────────
// Returns a rich status object for passive components based on type
interface PassiveStatus {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  severity: 'ok' | 'warning' | 'critical'
  action?: string
}

function getPassiveStatus(comp: ComponentTemplate, signals: LiveSignal[], running: boolean): PassiveStatus {
  const k = (comp.id + ' ' + comp.label).toLowerCase()
  const randomSeed = comp.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const pseudo = (randomSeed % 100) / 100  // 0–1 deterministic per component

  // ── Tank / Vessel / Buffer ──────────────────────────────────────────
  if (k.includes('tank') || k.includes('vessel') || k.includes('buffer') || k.includes('storage') ||
      k.includes('silo') || k.includes('receiver') || k.includes('accumulator')) {
    const levelSig = signals.find(s => s.name.toLowerCase().includes('level'))
    const level = levelSig
      ? Math.round(((levelSig.value - levelSig.min) / (levelSig.max - levelSig.min)) * 100)
      : Math.round(45 + pseudo * 40)
    const severity = level > 90 ? 'critical' : level > 80 ? 'warning' : 'ok'
    return {
      icon: <Droplets size={14} />,
      label: 'Fill level',
      value: `${level}%`,
      subtext: level > 90 ? 'Overflow risk — open drain valve' :
               level > 80 ? 'High level — monitor closely' :
               level < 15 ? 'Low level — check inlet feed' :
               'Level normal',
      severity,
      action: level > 90 ? 'Open drain valve immediately' :
              level < 15 ? 'Check inlet valve' : undefined,
    }
  }

  // ── Filter / Strainer / Cartridge / Bag ────────────────────────────
  if (k.includes('filter') || k.includes('strainer') || k.includes('cartridge') || k.includes('bag filter')) {
    // Simulate filter hours (based on seed, 0–100% fouled)
    const fouldPct = Math.round(38 + pseudo * 55)
    const dpSig = signals.find(s => s.name.toLowerCase().includes('differential') || s.name.toLowerCase().includes(' dp'))
    const dp = dpSig ? dpSig.value.toFixed(1) : (1.2 + pseudo * 2.5).toFixed(1)
    const severity = fouldPct > 85 ? 'critical' : fouldPct > 65 ? 'warning' : 'ok'
    return {
      icon: <Wrench size={14} />,
      label: 'Filter condition',
      value: `${fouldPct}% fouled`,
      subtext: fouldPct > 85 ? `ΔP ${dp} bar — replace filter now` :
               fouldPct > 65 ? `ΔP ${dp} bar — schedule replacement` :
               `ΔP ${dp} bar — filter clean`,
      severity,
      action: fouldPct > 85 ? 'Replace filter element now' :
              fouldPct > 65 ? 'Schedule filter change within 48h' : undefined,
    }
  }

  // ── Heat Exchanger / Chiller / Cooler ──────────────────────────────
  if (k.includes('heat exchanger') || k.includes('chiller') || k.includes('cooler') || k.includes('condenser')) {
    const tempSig = signals.find(s => s.name.toLowerCase().includes('temp'))
    const inletTemp  = tempSig ? (tempSig.value * 0.4).toFixed(1) : (15 + pseudo * 10).toFixed(1)
    const outletTemp = tempSig ? (tempSig.value * 0.7).toFixed(1) : (28 + pseudo * 15).toFixed(1)
    const efficiencyPct = Math.round(72 + (1 - pseudo) * 20)
    const severity = efficiencyPct < 65 ? 'critical' : efficiencyPct < 80 ? 'warning' : 'ok'
    return {
      icon: <Thermometer size={14} />,
      label: 'Heat transfer eff.',
      value: `${efficiencyPct}%`,
      subtext: `Inlet ${inletTemp}°C → Outlet ${outletTemp}°C`,
      severity,
      action: efficiencyPct < 65 ? 'Inspect fouling / scale buildup on tubes' : undefined,
    }
  }

  // ── Gauge / Pressure Indicator ─────────────────────────────────────
  if (k.includes('gauge') || k.includes('pressure gauge') || k.includes('indicator')) {
    const pressSig = signals.find(s => s.name.toLowerCase().includes('pressure'))
    const val = pressSig ? pressSig.value.toFixed(1) : (2.5 + pseudo * 5).toFixed(1)
    const unit = pressSig?.unit ?? 'bar'
    const pct = pressSig
      ? ((pressSig.value - pressSig.min) / (pressSig.max - pressSig.min)) * 100
      : pseudo * 100
    const severity = pct > 90 ? 'critical' : pct > 75 ? 'warning' : 'ok'
    return {
      icon: <Gauge size={14} />,
      label: 'Pressure reading',
      value: `${val} ${unit}`,
      subtext: `${Math.round(pct)}% of rated capacity`,
      severity,
    }
  }

  // ── Sensor node (temperature, level, flow sensor, etc.) ────────────
  if (k.includes('sensor') || k.includes('transmitter') || k.includes('transducer') ||
      k.includes('probe') || k.includes('meter') || k.includes('detector')) {
    const lastCal = Math.round(14 + pseudo * 160)
    const severity = lastCal > 90 ? 'warning' : 'ok'
    return {
      icon: <Activity size={14} />,
      label: 'Sensor health',
      value: 'Online',
      subtext: `Last calibrated: ${lastCal} days ago`,
      severity,
      action: lastCal > 90 ? 'Schedule sensor recalibration' : undefined,
    }
  }

  // ── Separator / Cyclone ────────────────────────────────────────────
  if (k.includes('separator') || k.includes('cyclone') || k.includes('centrifuge')) {
    const efficiency = Math.round(78 + (1 - pseudo) * 18)
    const severity = efficiency < 70 ? 'critical' : efficiency < 82 ? 'warning' : 'ok'
    return {
      icon: <Wind size={14} />,
      label: 'Separation efficiency',
      value: `${efficiency}%`,
      subtext: efficiency < 80 ? 'Below target — check inlet distribution' : 'Operating within spec',
      severity,
      action: efficiency < 70 ? 'Inspect vortex finder and inlet geometry' : undefined,
    }
  }

  // ── Reactor / Autoclave / Chamber ─────────────────────────────────
  if (k.includes('reactor') || k.includes('autoclave') || k.includes('chamber') || k.includes('fermenter')) {
    const tempSig = signals.find(s => s.name.toLowerCase().includes('temp'))
    const pressSig = signals.find(s => s.name.toLowerCase().includes('pressure'))
    const stability = running ? (pressSig && pressSig.status === 'ok' && (!tempSig || tempSig.status === 'ok') ? 'Stable' : 'Unstable') : 'Idle'
    const severity = stability === 'Unstable' ? 'warning' : 'ok'
    return {
      icon: <ShieldAlert size={14} />,
      label: 'Reaction status',
      value: stability,
      subtext: `T: ${tempSig ? tempSig.value.toFixed(1) + ' ' + tempSig.unit : 'N/A'} · P: ${pressSig ? pressSig.value.toFixed(1) + ' ' + pressSig.unit : 'N/A'}`,
      severity,
    }
  }

  // ── Default for truly unknown passive parts ────────────────────────
  return {
    icon: <CheckCircle2 size={14} />,
    label: 'Status',
    value: running ? 'Online' : 'Idle',
    subtext: 'No controls — monitoring only',
    severity: 'ok',
  }
}

// ── Single Component Card ────────────────────────────────────────────
interface ComponentCardProps {
  comp: ComponentTemplate
  controls: Record<string, number>
  signals: LiveSignal[]
  running: boolean
  onSetControl: (key: string, value: number) => void
}

function ComponentCard({ comp, controls, signals, running, onSetControl }: ComponentCardProps) {
  const defs       = getControlDefs(comp)
  const isPassive  = defs.length === 0
  const [expanded, setExpanded] = useState(false)
  const affected   = getAffectedSignals(comp, signals)
  const passiveStatus = isPassive ? getPassiveStatus(comp, signals, running) : null

  const hasAlert    = isPassive
    ? passiveStatus!.severity !== 'ok'
    : affected.some(s => s.status === 'critical' || s.status === 'warning')
  const hasCritical = isPassive
    ? passiveStatus!.severity === 'critical'
    : affected.some(s => s.status === 'critical')

  return (
    <div className={clsx(
      'rounded-xl border transition-all',
      hasCritical ? 'border-status-critical/30 bg-status-critical/5' :
      hasAlert    ? 'border-status-warning/25  bg-status-warning/5' :
                    'border-bg-border          bg-bg-card'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="text-base shrink-0">{getCompIcon(comp)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-primary truncate">{comp.label}</p>
          {isPassive
            ? <p className="text-[10px] text-text-muted">Passive · read-only monitor</p>
            : <p className="text-[10px] text-text-muted">{defs.length} control{defs.length > 1 ? 's' : ''} · {affected.length} signal{affected.length !== 1 ? 's' : ''} affected</p>
          }
        </div>
        {hasAlert && (
          <span className={clsx(
            'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border shrink-0',
            hasCritical
              ? 'text-status-critical border-status-critical/30 bg-status-critical/10'
              : 'text-status-warning  border-status-warning/30  bg-status-warning/10'
          )}>
            {hasCritical ? 'critical' : 'warning'}
          </span>
        )}
        {(affected.length > 0 || isPassive) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 rounded-md border border-bg-border flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors shrink-0"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* ── Passive: rich status card ── */}
      {isPassive && passiveStatus && (
        <div className={clsx('mx-3 mb-3 rounded-lg border px-3 py-2.5', {
          'border-status-critical/20 bg-status-critical/5': passiveStatus.severity === 'critical',
          'border-status-warning/20  bg-status-warning/5':  passiveStatus.severity === 'warning',
          'border-bg-border          bg-bg-base':            passiveStatus.severity === 'ok',
        })}>
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx({
              'text-status-critical': passiveStatus.severity === 'critical',
              'text-status-warning':  passiveStatus.severity === 'warning',
              'text-status-ok':       passiveStatus.severity === 'ok',
            })}>{passiveStatus.icon}</span>
            <span className="text-[10px] font-mono uppercase text-text-muted tracking-wider">{passiveStatus.label}</span>
          </div>
          <p className={clsx('text-sm font-mono font-semibold', {
            'text-status-critical': passiveStatus.severity === 'critical',
            'text-status-warning':  passiveStatus.severity === 'warning',
            'text-text-primary':    passiveStatus.severity === 'ok',
          })}>{passiveStatus.value}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{passiveStatus.subtext}</p>
          {passiveStatus.action && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md border border-status-warning/20 bg-status-warning/5 px-2 py-1.5">
              <AlertTriangle size={10} className="text-status-warning mt-0.5 shrink-0" />
              <p className="text-[10px] text-status-warning leading-tight">{passiveStatus.action}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Controllable: sliders ── */}
      {!isPassive && (
        <div className="px-3 pb-3 space-y-2.5">
          {defs.map(def => {
            const value = running ? (controls[def.key] ?? def.default) : def.min
            const displayVal = def.unit === '%'
              ? `${Math.round(value)}%`
              : def.unit === '°'
              ? `${Math.round(value)}°`
              : `${value.toFixed(1)} ${def.unit}`

            let secondaryLabel = ''
            if (def.key === 'speed' && def.unit === '%') {
              const rpmSig = signals.find(s => ['rpm', 'speed'].some(k2 => s.name.toLowerCase().includes(k2)))
              if (rpmSig) secondaryLabel = `≈ ${Math.round(rpmSig.value)} ${rpmSig.unit}`
            }

            return (
              <div key={def.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-text-muted">{def.label}</span>
                  <div className="flex items-center gap-1.5">
                    {secondaryLabel && <span className="text-[10px] font-mono text-brand-cyan">{secondaryLabel}</span>}
                    <span className={clsx('text-[11px] font-mono font-semibold', !running ? 'text-text-muted' : 'text-text-secondary')}>
                      {running ? displayVal : '—'}
                    </span>
                  </div>
                </div>
                <input
                  type="range" min={def.min} max={def.max} step={1}
                  value={running ? value : def.min}
                  disabled={!running}
                  onChange={e => onSetControl(def.key, Number(e.target.value))}
                  className="w-full accent-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] font-mono text-text-muted">{def.min}{def.unit}</span>
                  <span className="text-[9px] font-mono text-text-muted">{def.max}{def.unit}</span>
                </div>
              </div>
            )
          })}
          {!running && (
            <p className="text-[10px] text-status-warning text-center py-1 border border-status-warning/20 rounded-lg bg-status-warning/5">
              Start machine to enable controls
            </p>
          )}
        </div>
      )}

      {/* Expanded: driven signals */}
      {expanded && affected.length > 0 && (
        <div className="border-t border-bg-border px-3 py-2.5 space-y-1.5">
          {/* Physics reason */}
          <div className="rounded-lg border border-brand-cyan/15 bg-brand-cyan/5 px-2.5 py-2 mb-2">
            <p className="text-[9px] font-mono uppercase text-brand-cyan tracking-wider mb-0.5">Why this component affects these signals</p>
            <p className="text-[10px] text-text-secondary leading-relaxed">{getComponentPhysicsReason(comp)}</p>
          </div>
          <p className="text-[10px] font-mono uppercase text-text-muted tracking-wider">
            {affected.length} signal{affected.length !== 1 ? 's' : ''} driven by this component
          </p>
          {affected.map(sig => {
            const pct = Math.min(100, Math.max(0, ((sig.value - sig.min) / (sig.max - sig.min)) * 100))
            return (
              <div key={sig.name}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-text-muted">{sig.name}</span>
                  <span className={clsx('text-[11px] font-mono font-semibold', signalStatusColor(sig.status))}>
                    {sig.value % 1 === 0 ? sig.value : sig.value.toFixed(1)} {sig.unit}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-bg-base">
                  <div className={clsx('h-full rounded-full transition-all duration-700', barColorClass(sig.status))} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Expanded for passives: explain monitoring role */}
      {expanded && isPassive && (
        <div className="border-t border-bg-border px-3 py-2 space-y-1">
          <div className="rounded-lg border border-bg-border bg-bg-base/60 px-2.5 py-2">
            <p className="text-[9px] font-mono uppercase text-text-muted tracking-wider mb-0.5">Role</p>
            <p className="text-[10px] text-text-secondary">{getComponentPhysicsReason(comp)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────
interface ComponentControlPanelProps {
  components: ComponentTemplate[]
  componentControls: Record<string, Record<string, number>>
  signals: LiveSignal[]
  running: boolean
  mode: 'Auto' | 'Manual' | 'Hold'
  lastUpdated: string
  noBorder?: boolean
  onSetControl: (compId: string, key: string, value: number) => void
  onStart: () => void
  onStop: () => void
  onHold: () => void
}

export default function ComponentControlPanel({
  components, componentControls, signals, running, mode, lastUpdated,
  noBorder = false,
  onSetControl, onStart, onStop, onHold,
}: ComponentControlPanelProps) {
  const controllable = components.filter(c => getControlDefs(c).length > 0)
  const passive      = components.filter(c => getControlDefs(c).length === 0)

  return (
    <section className={noBorder ? 'overflow-hidden' : 'bg-bg-card border border-bg-border rounded-xl overflow-hidden'}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-text-muted" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Equipment</p>
            <p className="text-sm font-semibold text-text-primary">Equipment Control</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted mr-1">
            <Activity size={9} className={clsx(running && 'text-status-ok animate-pulse')} />
            {lastUpdated}
          </div>
          <button onClick={onStart} className={clsx('flex items-center h-8 px-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all',
            running && mode === 'Auto' ? 'border-status-ok/50 bg-status-ok/20 text-status-ok' : 'border-status-ok/25 bg-status-ok/10 text-status-ok hover:bg-status-ok/20'
          )}>▶ Start</button>
          <button onClick={onHold} className={clsx('flex items-center h-8 px-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all',
            mode === 'Hold' ? 'border-status-warning/50 bg-status-warning/20 text-status-warning' : 'border-status-warning/25 bg-status-warning/10 text-status-warning hover:bg-status-warning/20'
          )}>⏸ Hold</button>
          <button onClick={onStop} className={clsx('flex items-center h-8 px-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all',
            !running && mode === 'Manual' ? 'border-status-critical/50 bg-status-critical/20 text-status-critical' : 'border-status-critical/25 bg-status-critical/10 text-status-critical hover:bg-status-critical/20'
          )}>■ Stop</button>
        </div>
      </div>

      <div className="px-4 py-2.5 border-b border-bg-border bg-brand-cyan/5 border-l-2 border-l-brand-cyan">
        <p className="text-[11px] text-brand-cyan font-semibold">How controls work</p>
        <p className="text-[11px] text-text-muted mt-0.5">
          Adjust component setpoints — signals update as physical result.
          <span className="text-brand-cyan"> Passive parts show their own live condition (level, fouling, efficiency, etc.)</span>
        </p>
      </div>

      <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {controllable.map(comp => (
          <ComponentCard
            key={comp.id}
            comp={comp}
            controls={componentControls[comp.id] ?? {}}
            signals={signals}
            running={running}
            onSetControl={(key, value) => onSetControl(comp.id, key, value)}
          />
        ))}
        {passive.map(comp => (
          <ComponentCard
            key={comp.id}
            comp={comp}
            controls={{}}
            signals={signals}
            running={running}
            onSetControl={() => {}}
          />
        ))}
      </div>
    </section>
  )
}
