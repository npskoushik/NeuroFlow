import { useState, useEffect, useCallback, useRef } from 'react'
import type { MachineTemplate, SignalTemplate, ComponentTemplate } from '../data/machineTemplates'
import type { Severity } from '../types'

// ── Types ─────────────────────────────────────────────────────────────
export interface LiveSignal {
  name: string
  value: number
  unit: string
  min: number
  max: number
  threshold: number
  status: Severity
}

export interface SignalLimits {
  min: number
  max: number
}

export interface SimAlarm {
  id: string
  signalName: string
  severity: Severity
  message: string
  value: number
  unit: string
  timestamp: string
  acknowledged: boolean
  aiInsight: string
  causeComponents: string[]
  firstFiredAt: number
  escalatedAt: number | null
  silencedUntil: number | null
}

export interface TrendPoint {
  time: string
  [signalName: string]: number | string
}

export interface ControlDef {
  key: string
  label: string
  unit: string
  min: number
  max: number
  default: number
}

export interface SimulatorOutput {
  signals: LiveSignal[]
  running: boolean
  mode: 'Auto' | 'Manual' | 'Hold'
  alarms: SimAlarm[]
  trendHistory: TrendPoint[]
  healthScore: number
  uptime: number
  lastUpdated: string
  componentControls: Record<string, Record<string, number>>
  signalLimits: Record<string, SignalLimits>
  setRunning: (r: boolean) => void
  setMode: (m: 'Auto' | 'Manual' | 'Hold') => void
  acknowledgeAlarm: (id: string) => void
  silenceAlarm: (id: string, durationMs: number) => void
  setComponentControl: (compId: string, key: string, value: number) => void
  setSignalLimit: (name: string, limits: Partial<SignalLimits>) => void
  // Legacy compat
  setpoint: Record<string, number>
  setSetpoint: (name: string, value: number) => void
}

// ── Control definitions per component type ────────────────────────────
export function getControlDefs(component: ComponentTemplate): ControlDef[] {
  const k = (component.id + ' ' + component.label).toLowerCase()

  const isSpeed   = ['pump', 'motor', 'drive', 'engine', 'fan', 'blower', 'exhaust',
    'conveyor', 'belt', 'compressor', 'mixer', 'agitator', 'impeller',
    'cnc', 'spindle', 'turret', 'lathe', 'milling'].some(x => k.includes(x))
  const isValve   = k.includes('valve') || k.includes('gate') || k.includes('damper')
  const isHeater  = ['boiler', 'heater', 'burner', 'oven', 'dryer', 'furnace'].some(x => k.includes(x))
  const isRobot   = k.includes('robot') || k.includes('arm') || k.includes('gripper')
  const isHopper  = k.includes('hopper') || k.includes('feeder') || k.includes('bin')

  if (isValve)  return [{ key: 'open',      label: 'Open Position', unit: '%', min: 0, max: 100, default: 100 }]
  if (isHeater) return [{ key: 'power',     label: 'Power Output',  unit: '%', min: 0, max: 100, default: 70  }]
  if (isHopper) return [{ key: 'discharge', label: 'Discharge Rate', unit: '%', min: 0, max: 100, default: 60 }]
  if (isRobot)  return [
    { key: 'speed', label: 'Arm Speed', unit: '%', min: 0,    max: 100, default: 70  },
    { key: 'j1',    label: 'Joint 1',   unit: '°', min: -180, max: 180, default: 45  },
    { key: 'j2',    label: 'Joint 2',   unit: '°', min: -90,  max: 90,  default: -22 },
  ]
  if (isSpeed)  return [{ key: 'speed', label: 'Speed', unit: '%', min: 0, max: 100, default: 75 }]

  return []
}

function initComponentControls(components: ComponentTemplate[]): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {}
  for (const comp of components) {
    const defs = getControlDefs(comp)
    if (defs.length > 0) {
      result[comp.id] = Object.fromEntries(defs.map(d => [d.key, d.default]))
    }
  }
  return result
}

function initSignalLimits(signals: SignalTemplate[]): Record<string, SignalLimits> {
  return Object.fromEntries(signals.map(s => [s.name, { min: s.min, max: s.max }]))
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function getSeverity(value: number, sig: SignalTemplate, limits: SignalLimits): Severity {
  const threshold = limits.max
  if (value >= threshold * 1.10) return 'critical'
  if (value >= threshold * 0.95) return 'warning'
  return 'ok'
}

function initialValue(sig: SignalTemplate): number {
  return parseFloat((sig.min + (sig.threshold - sig.min) * 0.68).toFixed(2))
}

function driftNoise(sig: SignalTemplate): number {
  return (sig.max - sig.min) * 0.008 * (Math.random() - 0.5)
}

function formatTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

// ── Cause-component mapping ───────────────────────────────────────────
function getCauseComponents(sigName: string, components: ComponentTemplate[]): string[] {
  const n = sigName.toLowerCase()
  return components
    .filter(comp => {
      const k = (comp.id + ' ' + comp.label).toLowerCase()
      if (n.includes('rpm') || n.includes('speed') || n.includes('vibration') || n.includes('power') || n.includes('current'))
        return ['pump','motor','drive','fan','blower','compressor','mixer','agitator','cnc','spindle','conveyor','belt','robot'].some(x => k.includes(x))
      if (n.includes('pressure'))
        return k.includes('pump') || k.includes('compressor') || k.includes('valve') || k.includes('gate')
      if (n.includes('flow') || n.includes('throughput'))
        return k.includes('valve') || k.includes('gate') || k.includes('pump') || k.includes('fan')
      if (n.includes('temp') || n.includes('heat'))
        return ['boiler','heater','burner','oven','dryer','furnace'].some(x => k.includes(x)) || k.includes('pump') || k.includes('fan')
      if (n.includes('level'))
        return k.includes('valve') || k.includes('pump') || k.includes('hopper') || k.includes('feeder')
      return false
    })
    .map(c => c.label)
    .slice(0, 3)
}

function buildInsight(sig: LiveSignal, causeComps: string[]): string {
  const n   = sig.name.toLowerCase()
  const val = sig.value % 1 === 0 ? sig.value.toFixed(0) : sig.value.toFixed(1)
  const compHint = causeComps.length > 0
    ? ` Responsible components: ${causeComps.join(', ')}.`
    : ''

  if (n.includes('temp'))
    return `${sig.name} at ${val} ${sig.unit} exceeds limit. Reduce heater power, increase coolant flow, or lower pump speed.${compHint}`
  if (n.includes('pressure'))
    return `${sig.name} at ${val} ${sig.unit} above limit. Open outlet valve to relieve pressure or reduce pump/compressor speed.${compHint}`
  if (n.includes('vibration'))
    return `Excessive vibration at ${val} ${sig.unit}. Reduce motor speed and inspect bearing lubrication.${compHint}`
  if (n.includes('flow') || n.includes('throughput'))
    return `${sig.name} at ${val} ${sig.unit} outside safe range. Check valve positions and inlet strainer blockage.${compHint}`
  if (n.includes('rpm') || n.includes('speed'))
    return `${sig.name} at ${val} ${sig.unit} outside safe range. Adjust drive setpoint and verify load conditions.${compHint}`
  if (n.includes('level'))
    return `${sig.name} at ${val} ${sig.unit}. Balance inflow/outflow — check inlet and outlet valve positions.${compHint}`
  if (n.includes('power') || n.includes('current'))
    return `High ${sig.name} at ${val} ${sig.unit}. Possible overload — reduce speed setpoint or check for mechanical binding.${compHint}`
  if (n.includes('efficiency') || n.includes('oee'))
    return `${sig.name} dropped to ${val} ${sig.unit}. Inspect for partial blockage, wear, or suboptimal setpoint.${compHint}`
  if (n.includes('differential') || n.includes(' dp'))
    return `Filter/differential pressure at ${val} ${sig.unit}. Check for clogged filter element or blocked strainer.${compHint}`
  return `${sig.name} at ${val} ${sig.unit} requires attention. Inspect related components and verify setpoints.${compHint}`
}

function extractControlFactors(
  componentControls: Record<string, Record<string, number>>,
  components: ComponentTemplate[],
) {
  let primarySpeed  = 0.75
  let heaterPower   = 0.70
  let dischargeRate = 0.60
  let inValveOpen   = 1.0   // inlet valve fraction 0-1
  let outValveOpen  = 1.0   // outlet valve fraction 0-1
  let valveSum = 0, valveCount = 0

  for (const comp of components) {
    const k    = (comp.id + ' ' + comp.label).toLowerCase()
    const ctrl = componentControls[comp.id]
    if (!ctrl) continue

    const isSpeedComp = ['pump', 'motor', 'drive', 'fan', 'blower', 'conveyor', 'belt',
      'compressor', 'mixer', 'agitator', 'cnc', 'spindle', 'robot'].some(x => k.includes(x))
    const isValve  = k.includes('valve') || k.includes('damper') || k.includes('gate')
    const isHeater = ['boiler', 'heater', 'burner', 'oven', 'dryer'].some(x => k.includes(x))
    const isHopper = k.includes('hopper') || k.includes('feeder')

    if (isSpeedComp && ctrl.speed     !== undefined) primarySpeed  = ctrl.speed  / 100
    if (isHeater    && ctrl.power     !== undefined) heaterPower   = ctrl.power  / 100
    if (isHopper    && ctrl.discharge !== undefined) dischargeRate = ctrl.discharge / 100

    if (isValve && ctrl.open !== undefined) {
      const frac = ctrl.open / 100
      valveSum += frac; valveCount++
      // classify inlet vs outlet by label
      const isInlet  = k.includes('inlet') || k.includes('inlet') || k.includes('supply') || k.includes('suction') || k.includes('feed') || k.includes('makeup') || k.includes('in valve') || k.includes('in-valve')
      const isOutlet = k.includes('outlet') || k.includes('discharge') || k.includes('drain') || k.includes('bypass') || k.includes('exhaust') || k.includes('out valve') || k.includes('out-valve') || k.includes('backwash')
      if (isInlet)  inValveOpen  = frac
      if (isOutlet) outValveOpen = frac
    }
  }

  const avgValveOpen = valveCount > 0 ? valveSum / valveCount : 1.0
  return { primarySpeed, avgValveOpen, heaterPower, dischargeRate, inValveOpen, outValveOpen }
}

function computeSignalTarget(
  sig: SignalTemplate,
  componentControls: Record<string, Record<string, number>>,
  components: ComponentTemplate[],
  limitMax: number,
): number {
  const { primarySpeed, avgValveOpen, heaterPower, dischargeRate, inValveOpen, outValveOpen } =
    extractControlFactors(componentControls, components)
  const name  = sig.name.toLowerCase()
  // range spans slightly beyond limitMax so full throttle can trigger alarms
  const range = limitMax - sig.min
  const overRange = range * 1.15  // allows overshooting the limit at full throttle

  // ── RPM / Speed ─────────────────────────────────────────────────────
  // Full speed → reaches and slightly exceeds limit; realistic slip ~2-3%
  if (name.includes('rpm') || name.includes('spindle speed') ||
      (name.includes('speed') && !name.includes('belt') && !name.includes('line') && !name.includes('wind')))
    return sig.min + primarySpeed * overRange

  // ── Flow / Throughput ───────────────────────────────────────────────
  // Flow = speed × inlet_supply × outlet_clearance
  // Both valves fully open + full speed → max flow; closed outlet → no flow
  if (name.includes('flow') || name.includes('throughput') || name.includes('mass flow') ||
      name.includes('fuel flow') || name.includes('belt speed') || name.includes('line speed')) {
    const flowFactor = primarySpeed * inValveOpen * outValveOpen
    return sig.min + flowFactor * overRange
  }

  // ── Pressure ────────────────────────────────────────────────────────
  // Pressure builds with speed and inlet, drops as outlet opens (relief)
  // Closed outlet + full speed = dangerously high pressure
  if (name.includes('pressure') || name.includes('discharge pressure') ||
      name.includes('steam pressure') || name.includes('outlet pressure') ||
      name.includes('hydraulic') || name.includes('vacuum level')) {
    // pressurisation factor: speed × inlet drives pressure, outlet opening relieves it
    const buildUp  = Math.pow(primarySpeed, 1.3) * inValveOpen
    const relief   = outValveOpen * 0.6   // open outlet bleeds pressure
    const pf       = Math.max(0, buildUp - relief)
    return sig.min + pf * overRange
  }

  // ── Temperature ─────────────────────────────────────────────────────
  // Heater power drives temp; speed and open valves (cooling flow) reduce it
  if (name.includes('temp') || name.includes('heat')) {
    const heatIn   = heaterPower * 0.60
    const motorHeat= primarySpeed * 0.25   // friction/motor heat
    const cooling  = avgValveOpen * 0.15   // coolant flow
    const tf       = heatIn + motorHeat - cooling
    return sig.min + Math.max(0, tf) * overRange
  }

  // ── Vibration / Displacement ─────────────────────────────────────────
  // High speed + low valve damping = high vibration
  if (name.includes('vibration') || name.includes('displacement')) {
    const vf = Math.pow(primarySpeed, 1.4) * (1.1 - avgValveOpen * 0.15)
    return sig.min + vf * overRange
  }

  // ── Power / Current / kW ─────────────────────────────────────────────
  // Power ∝ speed³ (affinity laws) — small speed increase = large power jump
  if (name.includes('power') || name.includes('current') || name.includes(' kw') ||
      name.includes('motor current') || name.includes('current draw'))
    return sig.min + Math.pow(primarySpeed, 2.5) * overRange

  // ── Tank / Basin Level ───────────────────────────────────────────────
  // Level rises when inlet > outlet flow
  if (name.includes('level') || name.includes('water level') || name.includes('basin')) {
    const netFill = inValveOpen - outValveOpen * 0.8
    return sig.min + Math.max(0, Math.min(1, 0.50 + netFill * 0.6)) * range
  }

  // ── Hopper / Silo ────────────────────────────────────────────────────
  // Level drops as discharge increases
  if (name.includes('hopper') || name.includes('silo') || name.includes('grain'))
    return sig.min + (1 - dischargeRate) * overRange

  // ── Efficiency / OEE / COP ───────────────────────────────────────────
  // Peaks at ~75-80% speed (affinity law optimum), drops at extremes
  if (name.includes('efficiency') || name.includes('oee') || name.includes('cop') ||
      name.includes('combustion') || name.includes('recovery')) {
    const eff = 1 - Math.pow(primarySpeed - 0.78, 2) * 2.5
    return sig.min + Math.max(0.1, Math.min(1, eff)) * range
  }

  // ── Differential Pressure / Filter DP ───────────────────────────────
  // DP rises with flow (speed × inlet), drops as outlet opens
  if (name.includes('differential') || name.includes('filter') || name.includes(' dp')) {
    const dpf = primarySpeed * inValveOpen * (1.2 - outValveOpen * 0.4)
    return sig.min + dpf * overRange
  }

  // ── Water Quality (pH, conductivity, turbidity) ──────────────────────
  // Relatively stable; slight variation with flow rate
  if (name.includes('ph') || name.includes('conductivity') || name.includes('turbidity') ||
      name.includes('chlorine') || name.includes('dissolved'))
    return sig.min + (0.45 + primarySpeed * 0.15) * range

  // ── Fuel / Gas Flow ──────────────────────────────────────────────────
  if (name.includes('fuel') || name.includes('gas flow') || name.includes('gas consumption'))
    return sig.min + heaterPower * overRange

  // ── Default ──────────────────────────────────────────────────────────
  return sig.min + primarySpeed * overRange
}

// ── Physics reason per component type ─────────────────────────────────
export function getComponentPhysicsReason(comp: ComponentTemplate): string {
  const k = (comp.id + ' ' + comp.label).toLowerCase()
  if (['pump', 'motor', 'drive', 'engine', 'fan', 'blower', 'exhaust',
       'conveyor', 'belt', 'compressor', 'mixer', 'agitator', 'impeller',
       'cnc', 'spindle', 'turret', 'lathe', 'milling'].some(x => k.includes(x)))
    return 'Rotational speed drives flow and mechanical output'
  if (k.includes('valve') || k.includes('gate') || k.includes('damper'))
    return 'Open position regulates flow rate through the line'
  if (['boiler', 'heater', 'burner', 'oven', 'dryer', 'furnace'].some(x => k.includes(x)))
    return 'Heat input raises process temperature toward setpoint'
  if (k.includes('robot') || k.includes('arm') || k.includes('gripper'))
    return 'Axis speed determines cycle time and positional accuracy'
  if (k.includes('hopper') || k.includes('feeder') || k.includes('bin'))
    return 'Feed rate controls material throughput downstream'
  return 'Sensor or passive component — monitors process conditions'
}

// ── Main Hook ──────────────────────────────────────────────────────────
export function useSimulator(machine: MachineTemplate): SimulatorOutput {
  const [running, setRunning]   = useState(true)
  const [mode,    setMode]      = useState<'Auto' | 'Manual' | 'Hold'>('Auto')
  const [alarms,  setAlarms]    = useState<SimAlarm[]>([])
  const [trendHistory, setTrendHistory] = useState<TrendPoint[]>([])
  const [lastUpdated,  setLastUpdated]  = useState('just now')

  const [componentControls, setComponentControlsState] = useState<Record<string, Record<string, number>>>(
    () => initComponentControls(machine.components)
  )

  // ── Shared signal limits (lifted from chart/cards) ─────────────────
  const [signalLimits, setSignalLimitsState] = useState<Record<string, SignalLimits>>(
    () => initSignalLimits(machine.signals)
  )

  const setSignalLimit = useCallback((name: string, limits: Partial<SignalLimits>) => {
    setSignalLimitsState(prev => ({
      ...prev,
      [name]: { ...(prev[name] ?? { min: 0, max: 100 }), ...limits },
    }))
  }, [])

  // Legacy setpoint
  const [setpoint, setSetpointState] = useState<Record<string, number>>({})

  const valuesRef = useRef<Record<string, number>>(
    Object.fromEntries(machine.signals.map(s => [s.name, initialValue(s)]))
  )
  const [signals, setSignals] = useState<LiveSignal[]>(
    machine.signals.map(s => ({
      name: s.name, value: initialValue(s), unit: s.unit,
      min: s.min, max: s.max, threshold: s.threshold, status: 'ok' as Severity,
    }))
  )

  // Re-init on machine change
  useEffect(() => {
    const initial = Object.fromEntries(machine.signals.map(s => [s.name, initialValue(s)]))
    valuesRef.current = initial
    setSignals(machine.signals.map(s => ({
      name: s.name, value: initialValue(s), unit: s.unit,
      min: s.min, max: s.max, threshold: s.threshold, status: 'ok',
    })))
    setAlarms([])
    setTrendHistory([])
    setComponentControlsState(initComponentControls(machine.components))
    setSignalLimitsState(initSignalLimits(machine.signals))
    setSetpointState({})
  }, [machine.id])

  const ctrlRef = useRef(componentControls)
  useEffect(() => { ctrlRef.current = componentControls }, [componentControls])
  const runRef  = useRef(running)
  useEffect(() => { runRef.current = running }, [running])
  const modeRef = useRef(mode)
  useEffect(() => { modeRef.current = mode }, [mode])
  // limitsRef so tick sees latest limits without restart
  const limitsRef = useRef(signalLimits)
  useEffect(() => { limitsRef.current = signalLimits }, [signalLimits])

  // ── Tick (1s) ──────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now    = formatTime()
      const ctrl   = ctrlRef.current
      const run    = runRef.current
      const mod    = modeRef.current
      const limits = limitsRef.current
      const prev   = valuesRef.current
      const newValues: Record<string, number> = {}

      for (const sig of machine.signals) {
        const lim     = limits[sig.name] ?? { min: sig.min, max: sig.max }
        const current = prev[sig.name] ?? initialValue(sig)
        const isHolding = !run || mod === 'Hold'
        const target  = isHolding
          ? lim.min + (lim.max - lim.min) * 0.22
          : computeSignalTarget(sig, ctrl, machine.components, lim.max)
        // faster lag for better responsiveness: 0.18 running, 0.08 holding
        const lag  = isHolding ? 0.08 : 0.18
        const noise = (lim.max - lim.min) * 0.004 * (Math.random() - 0.5)
        const next = current + (target - current) * lag + noise
        // allow 15% overshoot above limitMax so alarms can fire; hard floor at lim.min
        newValues[sig.name] = parseFloat(clamp(next, lim.min, lim.max * 1.15).toFixed(2))
      }

      valuesRef.current = newValues

      const newSignals: LiveSignal[] = machine.signals.map(s => {
        const lim = limits[s.name] ?? { min: s.min, max: s.max }
        return {
          name: s.name, value: newValues[s.name], unit: s.unit,
          min: lim.min, max: lim.max, threshold: lim.max,
          status: getSeverity(newValues[s.name], s, lim),
        }
      })
      setSignals(newSignals)

      setAlarms(prev => {
        const nowMs   = Date.now()
        const updated = [...prev]

        for (const sig of newSignals) {
          const isAlarming = sig.status === 'critical' || sig.status === 'warning'
          const existIdx   = updated.findIndex(a => a.signalName === sig.name && !a.acknowledged)
          const existing   = existIdx !== -1 ? updated[existIdx] : null

          if (isAlarming) {
            // silenced — skip until silence window expires
            if (existing?.silencedUntil && nowMs < existing.silencedUntil) continue

            const causeComps = getCauseComponents(sig.name, machine.components)

            if (!existing) {
              // brand-new alarm
              updated.push({
                id:              `sim-${sig.name}-${nowMs}`,
                signalName:      sig.name,
                severity:        sig.status,
                message:         `${sig.name} exceeded ${sig.status} threshold: ${sig.value.toFixed(1)} ${sig.unit}`,
                value:           sig.value,
                unit:            sig.unit,
                timestamp:       now,
                acknowledged:    false,
                aiInsight:       buildInsight(sig, causeComps),
                causeComponents: causeComps,
                firstFiredAt:    nowMs,
                escalatedAt:     null,
                silencedUntil:   null,
              })
            } else {
              // update live value + message on existing alarm
              updated[existIdx] = {
                ...existing,
                value:   sig.value,
                message: `${sig.name} at ${sig.value.toFixed(1)} ${sig.unit} — ${sig.status}`,
              }

              // escalate warning → critical after 30 s
              if (
                existing.severity === 'warning' &&
                sig.status === 'critical' &&
                !existing.escalatedAt
              ) {
                updated[existIdx] = {
                  ...updated[existIdx],
                  severity:    'critical',
                  escalatedAt: nowMs,
                  message:     `ESCALATED: ${sig.name} reached critical — ${sig.value.toFixed(1)} ${sig.unit}`,
                  aiInsight:   buildInsight(sig, causeComps),
                }
              } else if (
                existing.severity === 'warning' &&
                sig.status === 'warning' &&
                !existing.escalatedAt &&
                (nowMs - existing.firstFiredAt) > 30_000
              ) {
                // warning persisted >30s without operator action → escalate to critical
                updated[existIdx] = {
                  ...updated[existIdx],
                  severity:    'critical',
                  escalatedAt: nowMs,
                  message:     `ESCALATED: ${sig.name} warning unacknowledged for 30s — ${sig.value.toFixed(1)} ${sig.unit}`,
                  aiInsight:   buildInsight(sig, causeComps),
                }
              }
            }
          } else {
            // signal back to normal — auto-clear warning alarms, keep critical (need ack)
            if (existing && existing.severity === 'warning') {
              updated.splice(existIdx, 1)
            }
          }
        }
        // keep last 30, most recent first
        return updated
          .sort((a, b) => b.firstFiredAt - a.firstFiredAt)
          .slice(0, 30)
      })

      setTrendHistory(prev => {
        const point: TrendPoint = { time: now }
        for (const sig of newSignals) point[sig.name] = sig.value
        const next = [...prev, point]
        return next.length > 30 ? next.slice(-30) : next
      })

      setLastUpdated(now)
    }, 1000)

    return () => clearInterval(interval)
  }, [machine])

  const acknowledgeAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
  }, [])

  const silenceAlarm = useCallback((id: string, durationMs: number) => {
    setAlarms(prev => prev.map(a =>
      a.id === id ? { ...a, silencedUntil: Date.now() + durationMs } : a
    ))
  }, [])

  const setComponentControl = useCallback((compId: string, key: string, value: number) => {
    setComponentControlsState(prev => ({
      ...prev,
      [compId]: { ...(prev[compId] ?? {}), [key]: value },
    }))
  }, [])

  const setSetpoint = useCallback((name: string, value: number) => {
    setSetpointState(prev => ({ ...prev, [name]: value }))
  }, [])

  const okCount     = signals.filter(s => s.status === 'ok').length
  const healthScore = signals.length ? Math.round((okCount / signals.length) * 100) : 100
  const uptime      = running ? 99.4 : 0

  return {
    signals, running, mode, alarms, trendHistory,
    healthScore, uptime, lastUpdated,
    componentControls,
    signalLimits,
    setRunning, setMode, acknowledgeAlarm, silenceAlarm,
    setComponentControl,
    setSignalLimit,
    setpoint, setSetpoint,
  }
}
