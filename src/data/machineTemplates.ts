// ============================================================
// DESTINATION: src/data/machineTemplates.ts
// ============================================================
// REPLACE entire file
// 45 machines total (39 fixed + 6 new)
// All components use new schematic library labels
// SignalTemplate includes optional componentIds[]
// autoMapSignalComponents() exported for App.tsx + SetupWizard.tsx
// ============================================================

export type MachineCategory =
  | 'Process & Fluid'
  | 'Manufacturing'
  | 'Material Handling'
  | 'Energy & Power'
  | 'Food & Beverage'
  | 'Pharmaceutical'
  | 'Mining & Extraction'

export interface SignalTemplate {
  name: string
  unit: string
  min: number
  max: number
  threshold: number
  componentIds?: string[]   // explicit component → signal mapping
}

export interface ComponentTemplate {
  id: string
  label: string
}

export interface ControlSignal {
  id: string
  name: string
  type: 'control'
  defaultValue: number
}

export interface AlarmRule {
  signalId: string
  warningThreshold: number
  criticalThreshold: number
}

export interface MachineLayout {
  type: 'process_flow' | 'grid'
  processFlow?: string[]
}

export interface MachineTemplate {
  id: string
  name: string
  category: MachineCategory
  icon: string
  description: string
  components: ComponentTemplate[]
  signals: SignalTemplate[]
  controlSignals?: ControlSignal[]
  alarmRules?: AlarmRule[]
  layout?: MachineLayout
}

// ── Auto-map signal → component IDs using keyword heuristics ──────────
// Called in App.tsx and SetupWizard.tsx when machine is confirmed.
// Fills componentIds[] on any signal that doesn't already have them.
export function autoMapSignalComponents(machine: MachineTemplate): MachineTemplate {
  const mapped = machine.signals.map(sig => {
    if (sig.componentIds && sig.componentIds.length > 0) return sig

    const n = sig.name.toLowerCase()
    const ids: string[] = []

    for (const comp of machine.components) {
      const k = (comp.id + ' ' + comp.label).toLowerCase()
      let match = false

      // Speed / RPM → pumps, motors, drives, compressors, fans, conveyors, mixers, CNC
      if (n.includes('rpm') || (n.includes('speed') && !n.includes('belt') && !n.includes('line') && !n.includes('wind'))) {
        match = ['pump', 'motor', 'drive', 'engine', 'fan', 'blower', 'compressor',
          'mixer', 'agitator', 'cnc', 'spindle', 'turret', 'lathe', 'robot', 'conveyor'].some(x => k.includes(x))
      }
      // Flow / throughput → pumps + valves
      else if (n.includes('flow') || n.includes('throughput') || n.includes('mass flow')) {
        match = ['pump', 'valve', 'gate', 'fan', 'blower', 'flowmeter'].some(x => k.includes(x))
      }
      // Pressure → pumps, compressors, valves, accumulators
      else if (n.includes('pressure') || n.includes('vacuum')) {
        match = ['pump', 'compressor', 'valve', 'accumulator', 'relief'].some(x => k.includes(x))
      }
      // Temperature → heaters, boilers, coolers, heat exchangers, motors (friction)
      else if (n.includes('temp') || n.includes('heat')) {
        match = ['boiler', 'heater', 'burner', 'oven', 'dryer', 'furnace',
          'heat exchanger', 'chiller', 'cooler', 'exchanger'].some(x => k.includes(x))
          || (k.includes('motor') || k.includes('pump') || k.includes('spindle'))
      }
      // Vibration → rotating equipment
      else if (n.includes('vibration') || n.includes('displacement')) {
        match = ['pump', 'motor', 'compressor', 'fan', 'gearbox', 'bearing', 'mill'].some(x => k.includes(x))
      }
      // Power / current / load → motors, drives, VFDs
      else if (n.includes('power') || n.includes('current') || n.includes(' kw') || n.includes('load')) {
        match = ['motor', 'drive', 'vfd', 'compressor', 'pump', 'fan', 'spindle'].some(x => k.includes(x))
      }
      // Level → tanks, hoppers, silos
      else if (n.includes('level') || n.includes('silo') || n.includes('hopper')) {
        match = ['tank', 'hopper', 'silo', 'vessel', 'basin', 'receiver'].some(x => k.includes(x))
      }
      // Belt speed / tension → conveyors, pulleys
      else if (n.includes('belt') || n.includes('tension')) {
        match = ['conveyor', 'belt', 'pulley', 'idler'].some(x => k.includes(x))
      }
      // Oil / lubrication → gearbox, compressor
      else if (n.includes('oil') || n.includes('lubric')) {
        match = ['gearbox', 'compressor', 'pump', 'engine'].some(x => k.includes(x))
      }

      if (match) ids.push(comp.id)
    }

    if (ids.length === 0 && machine.components.length > 0) {
      ids.push(machine.components[0].id)
    }

    return { ...sig, componentIds: ids }
  })

  return { ...machine, signals: mapped }
}

export function autoGenerateSignalsForComponent(comp: ComponentTemplate): SignalTemplate[] {
  const k = (comp.id + ' ' + comp.label).toLowerCase()
  const signals: SignalTemplate[] = []
  
  if (k.includes('pump')) {
    signals.push({ name: `${comp.label} Pressure`, unit: 'bar', min: 0, max: 10, threshold: 8, componentIds: [comp.id] })
    signals.push({ name: `${comp.label} Flow`, unit: 'L/min', min: 0, max: 200, threshold: 180, componentIds: [comp.id] })
    signals.push({ name: `${comp.label} Power`, unit: 'kW', min: 0, max: 50, threshold: 45, componentIds: [comp.id] })
  } else if (k.includes('motor')) {
    signals.push({ name: `${comp.label} RPM`, unit: 'rpm', min: 0, max: 3000, threshold: 2800, componentIds: [comp.id] })
    signals.push({ name: `${comp.label} Temp`, unit: '°C', min: 20, max: 100, threshold: 85, componentIds: [comp.id] })
    signals.push({ name: `${comp.label} Current`, unit: 'A', min: 0, max: 100, threshold: 90, componentIds: [comp.id] })
  } else if (k.includes('valve') || k.includes('gate') || k.includes('damper')) {
    signals.push({ name: `${comp.label} Position`, unit: '%', min: 0, max: 100, threshold: 100, componentIds: [comp.id] })
  } else if (k.includes('tank') || k.includes('hopper') || k.includes('silo')) {
    signals.push({ name: `${comp.label} Level`, unit: '%', min: 0, max: 100, threshold: 90, componentIds: [comp.id] })
  } else if (k.includes('heater') || k.includes('boiler') || k.includes('burner') || k.includes('oven')) {
    signals.push({ name: `${comp.label} Temp`, unit: '°C', min: 20, max: 300, threshold: 250, componentIds: [comp.id] })
    signals.push({ name: `${comp.label} Power`, unit: '%', min: 0, max: 100, threshold: 90, componentIds: [comp.id] })
  } else if (k.includes('fan') || k.includes('blower') || k.includes('exhaust')) {
    signals.push({ name: `${comp.label} Speed`, unit: 'rpm', min: 0, max: 1500, threshold: 1400, componentIds: [comp.id] })
    signals.push({ name: `${comp.label} Flow`, unit: 'm3/h', min: 0, max: 5000, threshold: 4500, componentIds: [comp.id] })
  } else if (k.includes('compressor')) {
    signals.push({ name: `${comp.label} Pressure`, unit: 'bar', min: 0, max: 20, threshold: 18, componentIds: [comp.id] })
    signals.push({ name: `${comp.label} Temp`, unit: '°C', min: 20, max: 150, threshold: 130, componentIds: [comp.id] })
  } else if (k.includes('conveyor') || k.includes('belt')) {
    signals.push({ name: `${comp.label} Speed`, unit: 'm/s', min: 0, max: 5, threshold: 4.5, componentIds: [comp.id] })
    signals.push({ name: `${comp.label} Load`, unit: 'kg', min: 0, max: 500, threshold: 450, componentIds: [comp.id] })
  } else if (k.includes('robot') || k.includes('arm')) {
    signals.push({ name: `${comp.label} Cycle Time`, unit: 's', min: 0, max: 60, threshold: 50, componentIds: [comp.id] })
  } else if (k.includes('sensor') || k.includes('meter') || k.includes('gauge')) {
    if (k.includes('temp')) signals.push({ name: `${comp.label} Reading`, unit: '°C', min: 0, max: 150, threshold: 120, componentIds: [comp.id] })
    else if (k.includes('press')) signals.push({ name: `${comp.label} Reading`, unit: 'bar', min: 0, max: 10, threshold: 8, componentIds: [comp.id] })
    else if (k.includes('flow')) signals.push({ name: `${comp.label} Reading`, unit: 'L/min', min: 0, max: 100, threshold: 90, componentIds: [comp.id] })
    else signals.push({ name: `${comp.label} Output`, unit: '%', min: 0, max: 100, threshold: 90, componentIds: [comp.id] })
  } else if (k.includes('mixer') || k.includes('agitator')) {
    signals.push({ name: `${comp.label} Speed`, unit: 'rpm', min: 0, max: 500, threshold: 450, componentIds: [comp.id] })
  } else if (k.includes('chiller') || k.includes('cooler')) {
    signals.push({ name: `${comp.label} Temp`, unit: '°C', min: 0, max: 30, threshold: 25, componentIds: [comp.id] })
  }

  // Fallback if no specific type matched
  if (signals.length === 0) {
    signals.push({ name: `${comp.label} Status`, unit: '%', min: 0, max: 100, threshold: 90, componentIds: [comp.id] })
  }
  
  return signals
}

export const MACHINE_TEMPLATES: MachineTemplate[] = [

  // ════════════════════════════════════════════════════════════
  // PROCESS & FLUID (10 machines)
  // ════════════════════════════════════════════════════════════

  {
    id: 'centrifugal_pump',
    name: 'Centrifugal Pump System',
    category: 'Process & Fluid',
    icon: '🔄',
    description: 'High-flow liquid transfer with pressure and temperature monitoring',
    components: [
      { id: 'pump_main',    label: 'Centrifugal Pump' },
      { id: 'motor_main',   label: 'Drive Motor' },
      { id: 'vfd_main',     label: 'Variable Frequency Drive' },
      { id: 'tank_feed',    label: 'Feed Tank' },
      { id: 'valve_in',     label: 'Inlet Valve' },
      { id: 'valve_out',    label: 'Outlet Valve' },
      { id: 'strainer',     label: 'Suction Strainer' },
      { id: 'gauge_p',      label: 'Discharge Pressure Gauge' },
      { id: 'flowmeter',    label: 'Inline Flowmeter' },
    ],
    signals: [
      { name: 'Pump Temperature',  unit: '°C',    min: 20,  max: 100,  threshold: 85,  componentIds: ['pump_main', 'motor_main'] },
      { name: 'Discharge Pressure',unit: 'bar',   min: 0,   max: 10,   threshold: 7,   componentIds: ['pump_main', 'valve_out'] },
      { name: 'Flow Rate',         unit: 'L/min', min: 0,   max: 150,  threshold: 120, componentIds: ['pump_main', 'valve_in', 'valve_out'] },
      { name: 'Motor RPM',         unit: 'rpm',   min: 0,   max: 2000, threshold: 1800,componentIds: ['motor_main', 'vfd_main'] },
      { name: 'Vibration',         unit: 'mm/s',  min: 0,   max: 10,   threshold: 7,   componentIds: ['pump_main', 'motor_main'] },
      { name: 'Power Draw',        unit: 'kW',    min: 0,   max: 30,   threshold: 25,  componentIds: ['motor_main', 'vfd_main'] },
    ],
  },

  {
    id: 'boiler_control',
    name: 'Boiler Control System',
    category: 'Process & Fluid',
    icon: '🔥',
    description: 'Steam generation and pressure control with safety interlocks',
    components: [
      { id: 'boiler_unit',   label: 'Boiler Vessel' },
      { id: 'burner',        label: 'Burner Assembly' },
      { id: 'valve_steam',   label: 'Steam Control Valve' },
      { id: 'valve_feed',    label: 'Feed Water Valve' },
      { id: 'tank_feed',     label: 'Feed Water Tank' },
      { id: 'pump_feed',     label: 'Feed Water Pump' },
      { id: 'relief_valve',  label: 'Pressure Relief Valve' },
      { id: 'gauge_steam',   label: 'Steam Pressure Gauge' },
      { id: 'sensor_level',  label: 'Drum Level Sensor' },
    ],
    signals: [
      { name: 'Steam Pressure',       unit: 'bar',  min: 0,   max: 20,  threshold: 16,  componentIds: ['boiler_unit', 'valve_steam', 'relief_valve'] },
      { name: 'Water Temperature',    unit: '°C',   min: 80,  max: 200, threshold: 180, componentIds: ['boiler_unit', 'burner'] },
      { name: 'Drum Water Level',     unit: '%',    min: 0,   max: 100, threshold: 20,  componentIds: ['sensor_level', 'pump_feed', 'valve_feed'] },
      { name: 'Fuel Flow',            unit: 'kg/h', min: 0,   max: 50,  threshold: 40,  componentIds: ['burner'] },
      { name: 'Flue Gas Temp',        unit: '°C',   min: 150, max: 400, threshold: 350, componentIds: ['burner', 'boiler_unit'] },
      { name: 'Combustion Efficiency',unit: '%',    min: 0,   max: 100, threshold: 70,  componentIds: ['burner'] },
    ],
  },

  {
    id: 'water_treatment',
    name: 'Water Treatment Plant',
    category: 'Process & Fluid',
    icon: '💧',
    description: 'Multi-stage water purification with chemical dosing control',
    components: [
      { id: 'tank_raw',      label: 'Raw Water Tank' },
      { id: 'pump_raw',      label: 'Raw Water Pump' },
      { id: 'filter_media',  label: 'Multi-Media Filter' },
      { id: 'pump_dose',     label: 'Chemical Dosing Pump' },
      { id: 'tank_treated',  label: 'Treated Water Tank' },
      { id: 'valve_bw',      label: 'Backwash Valve' },
      { id: 'sensor_ph',     label: 'pH Sensor' },
      { id: 'sensor_turb',   label: 'Turbidity Sensor' },
      { id: 'flowmeter',     label: 'Effluent Flowmeter' },
    ],
    signals: [
      { name: 'pH Level',     unit: 'pH',   min: 0,   max: 14,  threshold: 8.5, componentIds: ['sensor_ph', 'pump_dose'] },
      { name: 'Turbidity',    unit: 'NTU',  min: 0,   max: 100, threshold: 5,   componentIds: ['sensor_turb', 'filter_media'] },
      { name: 'Chlorine Level',unit: 'mg/L',min: 0,   max: 5,   threshold: 3,   componentIds: ['pump_dose'] },
      { name: 'Flow Rate',    unit: 'L/min',min: 0,   max: 200, threshold: 180, componentIds: ['pump_raw', 'valve_bw'] },
      { name: 'Filter DP',    unit: 'bar',  min: 0,   max: 8,   threshold: 6,   componentIds: ['filter_media', 'valve_bw'] },
    ],
  },

  {
    id: 'cooling_tower',
    name: 'Cooling Tower System',
    category: 'Process & Fluid',
    icon: '❄️',
    description: 'Industrial heat rejection with fan and pump monitoring',
    components: [
      { id: 'tower_body',    label: 'Cooling Tower' },
      { id: 'fan_main',      label: 'Cooling Tower Fan' },
      { id: 'motor_fan',     label: 'Fan Motor' },
      { id: 'pump_circ',     label: 'Circulation Pump' },
      { id: 'tank_basin',    label: 'Cold Water Basin' },
      { id: 'valve_makeup',  label: 'Makeup Water Valve' },
      { id: 'sensor_cond',   label: 'Conductivity Sensor' },
      { id: 'strainer_in',   label: 'Basin Strainer' },
    ],
    signals: [
      { name: 'Hot Water Inlet Temp', unit: '°C',    min: 20,  max: 60,   threshold: 50,   componentIds: ['tower_body'] },
      { name: 'Cold Water Outlet Temp',unit: '°C',   min: 15,  max: 40,   threshold: 35,   componentIds: ['tower_body', 'fan_main'] },
      { name: 'Fan Speed',            unit: 'rpm',   min: 0,   max: 1500, threshold: 1400, componentIds: ['fan_main', 'motor_fan'] },
      { name: 'Basin Level',          unit: '%',     min: 0,   max: 100,  threshold: 20,   componentIds: ['tank_basin', 'valve_makeup'] },
      { name: 'Conductivity',         unit: 'µS/cm', min: 0,   max: 3000, threshold: 2500, componentIds: ['sensor_cond'] },
      { name: 'Pump Flow',            unit: 'L/min', min: 0,   max: 500,  threshold: 450,  componentIds: ['pump_circ'] },
    ],
  },

  {
    id: 'chemical_mixing',
    name: 'Chemical Mixing Unit',
    category: 'Process & Fluid',
    icon: '⚗️',
    description: 'Precise chemical blending with agitation and temperature control',
    components: [
      { id: 'tank_mix',      label: 'Mixing Tank' },
      { id: 'agitator',      label: 'Agitator' },
      { id: 'motor_agit',    label: 'Agitator Motor' },
      { id: 'pump_a',        label: 'Dosing Pump A' },
      { id: 'pump_b',        label: 'Dosing Pump B' },
      { id: 'valve_drain',   label: 'Drain Valve' },
      { id: 'sensor_ph',     label: 'pH Sensor' },
      { id: 'sensor_temp',   label: 'Temperature Sensor' },
      { id: 'heater',        label: 'Jacket Heater' },
    ],
    signals: [
      { name: 'Temperature',    unit: '°C',  min: 15, max: 90,   threshold: 75,  componentIds: ['heater', 'sensor_temp', 'motor_agit'] },
      { name: 'pH Level',       unit: 'pH',  min: 0,  max: 14,   threshold: 9,   componentIds: ['sensor_ph', 'pump_a', 'pump_b'] },
      { name: 'Agitator Speed', unit: 'rpm', min: 0,  max: 500,  threshold: 450, componentIds: ['agitator', 'motor_agit'] },
      { name: 'Tank Level',     unit: '%',   min: 0,  max: 100,  threshold: 90,  componentIds: ['tank_mix', 'valve_drain'] },
      { name: 'Viscosity',      unit: 'cP',  min: 0,  max: 10000,threshold: 8000,componentIds: ['agitator', 'motor_agit'] },
    ],
  },

  {
    id: 'filtration',
    name: 'Filtration System',
    category: 'Process & Fluid',
    icon: '🔹',
    description: 'Multi-media filtration with automatic backwash cycles',
    components: [
      { id: 'filter_vessel', label: 'Filter Vessel' },
      { id: 'pump_feed',     label: 'Feed Pump' },
      { id: 'valve_in',      label: 'Inlet Control Valve' },
      { id: 'valve_bw',      label: 'Backwash Valve' },
      { id: 'strainer',      label: 'Inlet Strainer' },
      { id: 'tank_filtrate', label: 'Filtrate Tank' },
      { id: 'sensor_dp',     label: 'Differential Pressure Sensor' },
      { id: 'sensor_turb',   label: 'Outlet Turbidity Sensor' },
    ],
    signals: [
      { name: 'Differential Pressure', unit: 'bar',  min: 0,   max: 5,   threshold: 3.5, componentIds: ['filter_vessel', 'sensor_dp'] },
      { name: 'Flow Rate',             unit: 'L/min',min: 0,   max: 120, threshold: 100, componentIds: ['pump_feed', 'valve_in'] },
      { name: 'Outlet Turbidity',      unit: 'NTU',  min: 0,   max: 10,  threshold: 1,   componentIds: ['filter_vessel', 'sensor_turb'] },
      { name: 'Backwash Pressure',     unit: 'bar',  min: 0,   max: 8,   threshold: 6,   componentIds: ['pump_feed', 'valve_bw'] },
    ],
  },

  {
    id: 'heat_exchanger',
    name: 'Heat Exchanger System',
    category: 'Process & Fluid',
    icon: '♨️',
    description: 'Shell & tube heat transfer with fouling detection',
    components: [
      { id: 'hex_unit',      label: 'Shell & Tube Heat Exchanger' },
      { id: 'pump_hot',      label: 'Hot Side Pump' },
      { id: 'pump_cold',     label: 'Cold Side Pump' },
      { id: 'valve_bypass',  label: 'Bypass Valve' },
      { id: 'valve_hot_in',  label: 'Hot Inlet Valve' },
      { id: 'valve_cold_in', label: 'Cold Inlet Valve' },
      { id: 'sensor_hot_in', label: 'Hot Inlet Sensor' },
      { id: 'sensor_hot_out',label: 'Hot Outlet Sensor' },
      { id: 'sensor_cold_out',label: 'Cold Outlet Sensor' },
    ],
    signals: [
      { name: 'Hot Inlet Temp',  unit: '°C',   min: 50,  max: 200, threshold: 180, componentIds: ['pump_hot', 'sensor_hot_in'] },
      { name: 'Hot Outlet Temp', unit: '°C',   min: 40,  max: 120, threshold: 100, componentIds: ['hex_unit', 'sensor_hot_out'] },
      { name: 'Cold Inlet Temp', unit: '°C',   min: 10,  max: 50,  threshold: 45,  componentIds: ['pump_cold', 'valve_cold_in'] },
      { name: 'Cold Outlet Temp',unit: '°C',   min: 30,  max: 90,  threshold: 80,  componentIds: ['hex_unit', 'sensor_cold_out'] },
      { name: 'Hot Side Flow',   unit: 'L/min',min: 0,   max: 200, threshold: 180, componentIds: ['pump_hot', 'valve_hot_in'] },
      { name: 'Fouling Factor',  unit: 'index',min: 0,   max: 1,   threshold: 0.8, componentIds: ['hex_unit'] },
    ],
  },

  {
    id: 'compressor_station',
    name: 'Compressor Station',
    category: 'Process & Fluid',
    icon: '💨',
    description: 'Multi-stage air/gas compression with intercooling',
    components: [
      { id: 'compressor',    label: 'Screw Compressor' },
      { id: 'motor_comp',    label: 'Compressor Motor' },
      { id: 'vfd_comp',      label: 'Variable Frequency Drive' },
      { id: 'intercooler',   label: 'Intercooler' },
      { id: 'tank_receiver', label: 'Air Receiver Tank' },
      { id: 'valve_safety',  label: 'Safety Relief Valve' },
      { id: 'valve_out',     label: 'Outlet Isolation Valve' },
      { id: 'separator',     label: 'Oil-Air Separator' },
      { id: 'filter_air',    label: 'Air Intake Filter' },
    ],
    signals: [
      { name: 'Discharge Pressure', unit: 'bar', min: 0,  max: 12,  threshold: 10,  componentIds: ['compressor', 'tank_receiver', 'valve_safety'] },
      { name: 'Inlet Temp',         unit: '°C',  min: 20, max: 50,  threshold: 45,  componentIds: ['filter_air', 'compressor'] },
      { name: 'Discharge Temp',     unit: '°C',  min: 50, max: 180, threshold: 160, componentIds: ['compressor', 'intercooler'] },
      { name: 'Motor Current',      unit: 'A',   min: 0,  max: 100, threshold: 90,  componentIds: ['motor_comp', 'vfd_comp'] },
      { name: 'Oil Pressure',       unit: 'bar', min: 0,  max: 6,   threshold: 1.5, componentIds: ['compressor', 'separator'] },
      { name: 'Vibration',          unit: 'mm/s',min: 0,  max: 10,  threshold: 7,   componentIds: ['compressor', 'motor_comp'] },
    ],
  },

  {
    id: 'steam_distribution',
    name: 'Steam Distribution System',
    category: 'Process & Fluid',
    icon: '🌫️',
    description: 'Steam header management with trap monitoring and pressure reducing',
    components: [
      { id: 'tank_steam',    label: 'Steam Header Tank' },
      { id: 'valve_prv',     label: 'Pressure Reducing Valve' },
      { id: 'valve_iso',     label: 'Isolation Valve' },
      { id: 'valve_control', label: 'Steam Control Valve' },
      { id: 'relief_valve',  label: 'Safety Relief Valve' },
      { id: 'sensor_flow',   label: 'Steam Flow Sensor' },
      { id: 'sensor_cond',   label: 'Condensate Sensor' },
      { id: 'pipe_main',     label: 'Main Steam Header' },
    ],
    signals: [
      { name: 'Header Pressure',   unit: 'bar',  min: 0,   max: 15,  threshold: 12,  componentIds: ['tank_steam', 'valve_prv', 'relief_valve'] },
      { name: 'Header Temperature',unit: '°C',   min: 100, max: 220, threshold: 200, componentIds: ['tank_steam'] },
      { name: 'Steam Flow Rate',   unit: 'kg/h', min: 0,   max: 500, threshold: 450, componentIds: ['valve_control', 'sensor_flow'] },
      { name: 'Condensate Temp',   unit: '°C',   min: 80,  max: 110, threshold: 105, componentIds: ['sensor_cond'] },
      { name: 'Reduced Pressure',  unit: 'bar',  min: 0,   max: 8,   threshold: 6,   componentIds: ['valve_prv'] },
    ],
  },

  {
    id: 'industrial_chiller',
    name: 'Industrial Chiller System',
    category: 'Process & Fluid',
    icon: '🧊',
    description: 'Refrigeration-based process cooling with COP monitoring',
    components: [
      { id: 'chiller_unit',  label: 'Centrifugal Chiller' },
      { id: 'compressor',    label: 'Refrigerant Compressor' },
      { id: 'condenser',     label: 'Condenser' },
      { id: 'evaporator',    label: 'Evaporator' },
      { id: 'pump_chw',      label: 'Chilled Water Pump' },
      { id: 'pump_cw',       label: 'Condenser Water Pump' },
      { id: 'valve_exp',     label: 'Expansion Valve' },
      { id: 'vfd_comp',      label: 'Compressor VFD' },
    ],
    signals: [
      { name: 'Chilled Water Supply Temp', unit: '°C',  min: 0,  max: 20,  threshold: 15,  componentIds: ['evaporator', 'pump_chw'] },
      { name: 'Condenser Leaving Temp',    unit: '°C',  min: 20, max: 50,  threshold: 45,  componentIds: ['condenser', 'pump_cw'] },
      { name: 'Compressor Load',           unit: '%',   min: 0,  max: 100, threshold: 95,  componentIds: ['compressor', 'vfd_comp'] },
      { name: 'Refrigerant Pressure',      unit: 'bar', min: 0,  max: 25,  threshold: 20,  componentIds: ['compressor', 'valve_exp'] },
      { name: 'COP',                       unit: 'ratio',min: 0, max: 7,   threshold: 2.5, componentIds: ['chiller_unit'] },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // MANUFACTURING & AUTOMATION (11 machines)
  // ════════════════════════════════════════════════════════════

  {
    id: 'cnc_milling',
    name: 'CNC Milling Machine',
    category: 'Manufacturing',
    icon: '⚙️',
    description: '3-axis machining center with tool wear and coolant monitoring',
    components: [
      { id: 'cnc_machine',   label: 'CNC Machining Center' },
      { id: 'spindle',       label: 'Spindle Motor' },
      { id: 'drive_x',       label: 'X-Axis Servo Drive' },
      { id: 'drive_y',       label: 'Y-Axis Servo Drive' },
      { id: 'drive_z',       label: 'Z-Axis Servo Drive' },
      { id: 'motor_coolant', label: 'Coolant Pump Motor' },
      { id: 'encoder_sp',    label: 'Spindle Encoder' },
      { id: 'sensor_vib',    label: 'Vibration Sensor' },
      { id: 'electric_panel',label: 'CNC Control Panel' },
    ],
    signals: [
      { name: 'Spindle Speed', unit: 'rpm',    min: 0,  max: 12000,threshold: 11000,componentIds: ['spindle', 'encoder_sp'] },
      { name: 'Spindle Load',  unit: '%',      min: 0,  max: 100,  threshold: 85,   componentIds: ['spindle'] },
      { name: 'Feed Rate',     unit: 'mm/min', min: 0,  max: 5000, threshold: 4500, componentIds: ['drive_x', 'drive_y', 'drive_z'] },
      { name: 'Coolant Flow',  unit: 'L/min',  min: 0,  max: 20,   threshold: 3,    componentIds: ['motor_coolant'] },
      { name: 'Vibration',     unit: 'mm/s',   min: 0,  max: 10,   threshold: 7,    componentIds: ['spindle', 'sensor_vib'] },
      { name: 'Tool Wear Index',unit: '%',     min: 0,  max: 100,  threshold: 80,   componentIds: ['cnc_machine'] },
    ],
  },

  {
    id: 'cnc_lathe',
    name: 'CNC Lathe Machine',
    category: 'Manufacturing',
    icon: '🔩',
    description: 'Precision turning with live tooling and chuck monitoring',
    components: [
      { id: 'cnc_lathe',     label: 'CNC Lathe' },
      { id: 'spindle_main',  label: 'Main Spindle' },
      { id: 'motor_main',    label: 'Spindle Motor' },
      { id: 'turret',        label: 'Tool Turret' },
      { id: 'tailstock',     label: 'Tailstock Assembly' },
      { id: 'gearbox',       label: 'Headstock Gearbox' },
      { id: 'encoder_main',  label: 'Spindle Encoder' },
      { id: 'pump_coolant',  label: 'Coolant Pump' },
    ],
    signals: [
      { name: 'Spindle RPM',   unit: 'rpm', min: 0,  max: 6000, threshold: 5500, componentIds: ['spindle_main', 'motor_main', 'encoder_main'] },
      { name: 'Cutting Force', unit: 'N',   min: 0,  max: 5000, threshold: 4000, componentIds: ['spindle_main', 'turret'] },
      { name: 'Chuck Pressure',unit: 'bar', min: 0,  max: 60,   threshold: 10,   componentIds: ['spindle_main'] },
      { name: 'Spindle Temp',  unit: '°C',  min: 20, max: 80,   threshold: 70,   componentIds: ['spindle_main', 'motor_main'] },
      { name: 'Gearbox Temp',  unit: '°C',  min: 20, max: 70,   threshold: 65,   componentIds: ['gearbox'] },
    ],
  },

  {
    id: 'robotic_assembly',
    name: 'Robotic Assembly Cell',
    category: 'Manufacturing',
    icon: '🦾',
    description: '6-axis industrial robot with force/torque sensing and safety zones',
    components: [
      { id: 'robot_arm',     label: '6-Axis Robot Arm' },
      { id: 'gripper',       label: 'End Effector Gripper' },
      { id: 'controller',    label: 'Robot Controller' },
      { id: 'electric_panel',label: 'Safety & Power Panel' },
      { id: 'sensor_force',  label: 'Force/Torque Sensor' },
      { id: 'encoder_j1',    label: 'Joint 1 Encoder' },
      { id: 'encoder_j2',    label: 'Joint 2 Encoder' },
    ],
    signals: [
      { name: 'Joint 1 Angle',      unit: '°',  min: -180,max: 180, threshold: 170, componentIds: ['robot_arm', 'encoder_j1'] },
      { name: 'Joint 2 Angle',      unit: '°',  min: -90, max: 90,  threshold: 85,  componentIds: ['robot_arm', 'encoder_j2'] },
      { name: 'End Effector Force',  unit: 'N',  min: 0,   max: 200, threshold: 150, componentIds: ['gripper', 'sensor_force'] },
      { name: 'Cycle Time',          unit: 's',  min: 0,   max: 30,  threshold: 25,  componentIds: ['robot_arm', 'controller'] },
      { name: 'Joint 1 Motor Temp',  unit: '°C', min: 20,  max: 80,  threshold: 70,  componentIds: ['robot_arm'] },
      { name: 'Payload',             unit: 'kg', min: 0,   max: 20,  threshold: 18,  componentIds: ['robot_arm', 'gripper'] },
    ],
  },

  {
    id: 'pick_place',
    name: 'Pick-and-Place Robot',
    category: 'Manufacturing',
    icon: '🤖',
    description: 'Delta robot for high-speed sorting and placement operations',
    components: [
      { id: 'robot_delta',   label: 'Delta Robot' },
      { id: 'gripper_vac',   label: 'Vacuum Gripper' },
      { id: 'conveyor_in',   label: 'Infeed Conveyor' },
      { id: 'conveyor_out',  label: 'Outfeed Conveyor' },
      { id: 'motor_r1',      label: 'Robot Axis 1 Motor' },
      { id: 'motor_r2',      label: 'Robot Axis 2 Motor' },
      { id: 'sensor_vision', label: 'Machine Vision Sensor' },
    ],
    signals: [
      { name: 'Cycles/Minute',  unit: 'cpm',min: 0,   max: 120, threshold: 110, componentIds: ['robot_delta', 'motor_r1', 'motor_r2'] },
      { name: 'Vacuum Pressure',unit: 'kPa',min: -100,max: 0,   threshold: -30, componentIds: ['gripper_vac'] },
      { name: 'Vision Accuracy',unit: '%',  min: 0,   max: 100, threshold: 90,  componentIds: ['sensor_vision'] },
      { name: 'Robot Arm Temp', unit: '°C', min: 20,  max: 70,  threshold: 65,  componentIds: ['robot_delta', 'motor_r1'] },
      { name: 'Belt Speed',     unit: 'm/s',min: 0,   max: 2,   threshold: 1.8, componentIds: ['conveyor_in', 'conveyor_out'] },
    ],
  },

  {
    id: 'conveyor_belt',
    name: 'Conveyor Belt System',
    category: 'Manufacturing',
    icon: '🏭',
    description: 'Variable-speed belt conveyor with load and tension monitoring',
    components: [
      { id: 'conveyor_main', label: 'Main Belt Conveyor' },
      { id: 'motor_drive',   label: 'Drive Motor' },
      { id: 'vfd_belt',      label: 'Variable Frequency Drive' },
      { id: 'gearbox',       label: 'Drive Gearbox' },
      { id: 'pulley_head',   label: 'Head Pulley' },
      { id: 'pulley_tail',   label: 'Tail Pulley' },
      { id: 'load_cell',     label: 'Belt Load Cell' },
      { id: 'encoder_belt',  label: 'Belt Speed Encoder' },
    ],
    signals: [
      { name: 'Belt Speed',  unit: 'm/s', min: 0,  max: 3,   threshold: 2.8, componentIds: ['conveyor_main', 'vfd_belt', 'encoder_belt'] },
      { name: 'Motor Temp',  unit: '°C',  min: 20, max: 90,  threshold: 80,  componentIds: ['motor_drive'] },
      { name: 'Load Weight', unit: 'kg',  min: 0,  max: 500, threshold: 450, componentIds: ['load_cell'] },
      { name: 'Belt Tension',unit: 'kN',  min: 0,  max: 20,  threshold: 18,  componentIds: ['pulley_head', 'pulley_tail'] },
      { name: 'Power Draw',  unit: 'kW',  min: 0,  max: 15,  threshold: 13,  componentIds: ['motor_drive', 'vfd_belt'] },
      { name: 'Gearbox Temp',unit: '°C',  min: 20, max: 80,  threshold: 70,  componentIds: ['gearbox'] },
    ],
  },

  {
    id: 'packaging_line',
    name: 'Packaging Line',
    category: 'Manufacturing',
    icon: '📦',
    description: 'End-of-line packaging with wrapping, sealing and labeling',
    components: [
      { id: 'conveyor_main', label: 'Takeaway Conveyor' },
      { id: 'motor_wrap',    label: 'Film Wrapper Motor' },
      { id: 'heater_seal',   label: 'Heat Sealer' },
      { id: 'motor_label',   label: 'Label Applicator Motor' },
      { id: 'sensor_count',  label: 'Product Counter Sensor' },
      { id: 'vfd_line',      label: 'Line Speed VFD' },
    ],
    signals: [
      { name: 'Line Speed',  unit: 'ppm', min: 0,  max: 200, threshold: 190, componentIds: ['conveyor_main', 'vfd_line'] },
      { name: 'Sealer Temp', unit: '°C',  min: 100,max: 220, threshold: 210, componentIds: ['heater_seal'] },
      { name: 'Film Tension',unit: 'N',   min: 0,  max: 50,  threshold: 45,  componentIds: ['motor_wrap'] },
      { name: 'OEE',         unit: '%',   min: 0,  max: 100, threshold: 75,  componentIds: ['conveyor_main'] },
      { name: 'Label Motor Speed',unit: 'rpm',min: 0,max: 1500,threshold: 1400,componentIds: ['motor_label'] },
    ],
  },

  {
    id: 'bottle_filling',
    name: 'Bottle Filling Station',
    category: 'Manufacturing',
    icon: '🍶',
    description: 'Volumetric bottle filling with capping and level inspection',
    components: [
      { id: 'filler',        label: 'Rotary Filling Station' },
      { id: 'motor_fill',    label: 'Filler Drive Motor' },
      { id: 'capper',        label: 'Capper Unit' },
      { id: 'conveyor_btl',  label: 'Bottle Conveyor' },
      { id: 'sensor_level',  label: 'Fill Level Inspector' },
      { id: 'pump_product',  label: 'Product Feed Pump' },
      { id: 'valve_fill',    label: 'Fill Control Valve' },
      { id: 'flowmeter',     label: 'Volumetric Flowmeter' },
    ],
    signals: [
      { name: 'Fill Volume',  unit: 'mL',  min: 0,   max: 1000, threshold: 980, componentIds: ['filler', 'valve_fill', 'flowmeter'] },
      { name: 'Line Speed',   unit: 'bpm', min: 0,   max: 300,  threshold: 290, componentIds: ['motor_fill', 'conveyor_btl'] },
      { name: 'Fill Temp',    unit: '°C',  min: 2,   max: 80,   threshold: 75,  componentIds: ['pump_product'] },
      { name: 'Capping Torque',unit: 'Nm', min: 0,   max: 10,   threshold: 9,   componentIds: ['capper'] },
      { name: 'Reject Rate',  unit: '%',   min: 0,   max: 10,   threshold: 2,   componentIds: ['sensor_level'] },
    ],
  },

  {
    id: 'injection_molding',
    name: 'Injection Molding Machine',
    category: 'Manufacturing',
    icon: '🔧',
    description: 'Plastic injection with barrel temp and clamp force monitoring',
    components: [
      { id: 'barrel',        label: 'Heated Barrel' },
      { id: 'heater_z1',     label: 'Barrel Heater Zone 1' },
      { id: 'heater_z2',     label: 'Barrel Heater Zone 2' },
      { id: 'motor_screw',   label: 'Screw Drive Motor' },
      { id: 'clamp_unit',    label: 'Hydraulic Clamp Unit' },
      { id: 'pump_hydraulic',label: 'Hydraulic Pump' },
      { id: 'mold',          label: 'Injection Mold Tool' },
      { id: 'valve_inject',  label: 'Injection Valve' },
    ],
    signals: [
      { name: 'Barrel Zone 1 Temp',unit: '°C', min: 150,max: 350,  threshold: 320,  componentIds: ['heater_z1', 'barrel'] },
      { name: 'Barrel Zone 2 Temp',unit: '°C', min: 150,max: 350,  threshold: 320,  componentIds: ['heater_z2', 'barrel'] },
      { name: 'Injection Pressure',unit: 'bar',min: 0,  max: 2000, threshold: 1800, componentIds: ['pump_hydraulic', 'valve_inject'] },
      { name: 'Clamp Force',       unit: 'kN', min: 0,  max: 5000, threshold: 4800, componentIds: ['clamp_unit', 'pump_hydraulic'] },
      { name: 'Cycle Time',        unit: 's',  min: 0,  max: 60,   threshold: 50,   componentIds: ['mold', 'motor_screw'] },
      { name: 'Screw RPM',         unit: 'rpm',min: 0,  max: 200,  threshold: 180,  componentIds: ['motor_screw'] },
    ],
  },

  {
    id: 'automated_sorting',
    name: 'Automated Sorting System',
    category: 'Manufacturing',
    icon: '🔀',
    description: 'Vision-guided sorting with divert actuators and throughput tracking',
    components: [
      { id: 'conveyor_main', label: 'Main Sorting Conveyor' },
      { id: 'motor_belt',    label: 'Belt Drive Motor' },
      { id: 'vfd_sort',      label: 'Conveyor VFD' },
      { id: 'sensor_vision', label: 'Machine Vision Camera' },
      { id: 'sensor_barcode',label: 'Barcode Scanner' },
      { id: 'actuator_div',  label: 'Divert Actuator' },
      { id: 'encoder_spd',   label: 'Belt Speed Encoder' },
    ],
    signals: [
      { name: 'Throughput',    unit: 'items/h',min: 0,   max: 5000, threshold: 4800, componentIds: ['conveyor_main', 'motor_belt'] },
      { name: 'Sort Accuracy', unit: '%',      min: 0,   max: 100,  threshold: 95,   componentIds: ['sensor_vision', 'sensor_barcode'] },
      { name: 'Belt Speed',    unit: 'm/s',    min: 0,   max: 2.5,  threshold: 2.4,  componentIds: ['conveyor_main', 'vfd_sort', 'encoder_spd'] },
      { name: 'Reject Count',  unit: 'items',  min: 0,   max: 1000, threshold: 50,   componentIds: ['actuator_div'] },
      { name: 'Motor Current', unit: 'A',      min: 0,   max: 30,   threshold: 27,   componentIds: ['motor_belt'] },
    ],
  },

  {
    id: 'pcb_line',
    name: 'PCB Manufacturing Line',
    category: 'Manufacturing',
    icon: '💡',
    description: 'SMT line with reflow oven profile and AOI monitoring',
    components: [
      { id: 'printer_paste', label: 'Solder Paste Printer' },
      { id: 'motor_printer', label: 'Stencil Printer Motor' },
      { id: 'placer_smd',    label: 'SMD Pick & Place Machine' },
      { id: 'oven_reflow',   label: 'Reflow Oven' },
      { id: 'heater_z1',     label: 'Reflow Zone 1 Heater' },
      { id: 'heater_z2',     label: 'Reflow Zone 2 Heater' },
      { id: 'conveyor_pcb',  label: 'PCB Transport Conveyor' },
      { id: 'sensor_aoi',    label: 'AOI Inspection Camera' },
    ],
    signals: [
      { name: 'Reflow Zone 1 Temp',  unit: '°C', min: 150,max: 280, threshold: 265, componentIds: ['heater_z1', 'oven_reflow'] },
      { name: 'Reflow Zone 2 Temp',  unit: '°C', min: 200,max: 300, threshold: 285, componentIds: ['heater_z2', 'oven_reflow'] },
      { name: 'Placement Accuracy',  unit: 'µm', min: 0,  max: 100, threshold: 50,  componentIds: ['placer_smd', 'sensor_aoi'] },
      { name: 'PCB Throughput',      unit: 'pph',min: 0,  max: 500, threshold: 480, componentIds: ['conveyor_pcb', 'motor_printer'] },
      { name: 'Defect Rate',         unit: '%',  min: 0,  max: 5,   threshold: 1,   componentIds: ['sensor_aoi'] },
    ],
  },

  {
    id: 'welding_cell',
    name: 'Robotic Welding Cell',
    category: 'Manufacturing',
    icon: '🔦',
    description: 'MIG/TIG robotic welding with arc monitoring and fume extraction',
    components: [
      { id: 'robot_weld',    label: 'Welding Robot' },
      { id: 'torch',         label: 'Welding Torch' },
      { id: 'wire_feeder',   label: 'Wire Feeder Motor' },
      { id: 'fan_fume',      label: 'Fume Extraction Fan' },
      { id: 'cooler_torch',  label: 'Torch Water Cooler' },
      { id: 'sensor_arc',    label: 'Arc Voltage Sensor' },
      { id: 'positioner',    label: 'Part Positioner' },
    ],
    signals: [
      { name: 'Weld Current',      unit: 'A',    min: 0,  max: 400, threshold: 380, componentIds: ['torch', 'sensor_arc'] },
      { name: 'Arc Voltage',       unit: 'V',    min: 0,  max: 50,  threshold: 40,  componentIds: ['torch', 'sensor_arc'] },
      { name: 'Wire Feed Speed',   unit: 'm/min',min: 0,  max: 20,  threshold: 18,  componentIds: ['wire_feeder'] },
      { name: 'Torch Coolant Temp',unit: '°C',   min: 15, max: 50,  threshold: 45,  componentIds: ['cooler_torch'] },
      { name: 'Cycle Time',        unit: 's',    min: 0,  max: 120, threshold: 100, componentIds: ['robot_weld', 'positioner'] },
      { name: 'Fume Fan Speed',    unit: 'rpm',  min: 0,  max: 3000,threshold: 2800,componentIds: ['fan_fume'] },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // MATERIAL HANDLING (8 machines)
  // ════════════════════════════════════════════════════════════

  {
    id: 'hopper_feed',
    name: 'Hopper Feeding System',
    category: 'Material Handling',
    icon: '🏗️',
    description: 'Gravity-fed hopper with level monitoring and flow control',
    components: [
      { id: 'hopper_main',   label: 'Feed Hopper' },
      { id: 'motor_vib',     label: 'Vibratory Feeder Motor' },
      { id: 'valve_gate',    label: 'Discharge Gate Valve' },
      { id: 'sensor_level',  label: 'Ultrasonic Level Sensor' },
      { id: 'sensor_moisture',label: 'Moisture Sensor' },
      { id: 'conveyor_dis',  label: 'Discharge Conveyor' },
      { id: 'load_cell',     label: 'Hopper Load Cell' },
    ],
    signals: [
      { name: 'Hopper Level',      unit: '%',    min: 0,  max: 100, threshold: 15,  componentIds: ['hopper_main', 'sensor_level', 'load_cell'] },
      { name: 'Feed Rate',         unit: 'kg/h', min: 0,  max: 1000,threshold: 950, componentIds: ['motor_vib', 'valve_gate'] },
      { name: 'Feeder Amplitude',  unit: 'mm',   min: 0,  max: 5,   threshold: 4.5, componentIds: ['motor_vib'] },
      { name: 'Moisture Content',  unit: '%',    min: 0,  max: 30,  threshold: 20,  componentIds: ['sensor_moisture'] },
      { name: 'Discharge Speed',   unit: 'm/s',  min: 0,  max: 2,   threshold: 1.8, componentIds: ['conveyor_dis'] },
    ],
  },

  {
    id: 'bulk_conveyor',
    name: 'Bulk Material Conveyor',
    category: 'Material Handling',
    icon: '🚛',
    description: 'Heavy-duty belt conveyor for bulk solids with spillage detection',
    components: [
      { id: 'conveyor_bulk', label: 'Bulk Belt Conveyor' },
      { id: 'motor_drive',   label: 'Drive Motor' },
      { id: 'vfd_bulk',      label: 'Variable Frequency Drive' },
      { id: 'gearbox',       label: 'Drive Gearbox' },
      { id: 'pulley_drive',  label: 'Drive Pulley' },
      { id: 'pulley_tension',label: 'Tension Pulley' },
      { id: 'load_cell',     label: 'Belt Weigher' },
      { id: 'sensor_slip',   label: 'Belt Slip Sensor' },
    ],
    signals: [
      { name: 'Belt Speed',    unit: 'm/s',min: 0,  max: 5,   threshold: 4.8, componentIds: ['conveyor_bulk', 'vfd_bulk'] },
      { name: 'Material Flow', unit: 't/h',min: 0,  max: 200, threshold: 190, componentIds: ['load_cell', 'conveyor_bulk'] },
      { name: 'Motor Current', unit: 'A',  min: 0,  max: 150, threshold: 140, componentIds: ['motor_drive', 'vfd_bulk'] },
      { name: 'Belt Tension',  unit: 'kN', min: 0,  max: 50,  threshold: 45,  componentIds: ['pulley_tension'] },
      { name: 'Gearbox Temp',  unit: '°C', min: 20, max: 80,  threshold: 70,  componentIds: ['gearbox'] },
    ],
  },

  {
    id: 'grain_processing',
    name: 'Grain Processing System',
    category: 'Material Handling',
    icon: '🌾',
    description: 'Grain cleaning, drying and storage with moisture and temperature tracking',
    components: [
      { id: 'pre_cleaner',   label: 'Pre-Cleaner' },
      { id: 'dryer_main',    label: 'Grain Dryer' },
      { id: 'fan_dryer',     label: 'Dryer Exhaust Fan' },
      { id: 'elevator',      label: 'Bucket Elevator' },
      { id: 'motor_elev',    label: 'Elevator Motor' },
      { id: 'silo_main',     label: 'Storage Silo' },
      { id: 'sensor_moisture',label: 'Grain Moisture Sensor' },
      { id: 'conveyor_out',  label: 'Discharge Conveyor' },
    ],
    signals: [
      { name: 'Grain Moisture', unit: '%',    min: 0,  max: 30,  threshold: 14,  componentIds: ['sensor_moisture', 'dryer_main'] },
      { name: 'Dryer Temp',     unit: '°C',   min: 40, max: 120, threshold: 100, componentIds: ['dryer_main', 'fan_dryer'] },
      { name: 'Throughput',     unit: 't/h',  min: 0,  max: 50,  threshold: 48,  componentIds: ['elevator', 'motor_elev'] },
      { name: 'Silo Level',     unit: '%',    min: 0,  max: 100, threshold: 95,  componentIds: ['silo_main'] },
      { name: 'Elevator Speed', unit: 'rpm',  min: 0,  max: 1500,threshold: 1400,componentIds: ['motor_elev'] },
    ],
  },

  {
    id: 'cement_mixing',
    name: 'Cement Mixing Plant',
    category: 'Material Handling',
    icon: '🏛️',
    description: 'Batch concrete production with aggregate weighing and mixer control',
    components: [
      { id: 'mixer_twin',    label: 'Twin-Shaft Mixer' },
      { id: 'motor_mixer',   label: 'Mixer Drive Motor' },
      { id: 'hopper_agg',    label: 'Aggregate Hopper' },
      { id: 'hopper_cement', label: 'Cement Silo Hopper' },
      { id: 'silo_cement',   label: 'Cement Silo' },
      { id: 'load_cell',     label: 'Batch Weighing System' },
      { id: 'pump_water',    label: 'Water Dosing Pump' },
      { id: 'valve_water',   label: 'Water Control Valve' },
    ],
    signals: [
      { name: 'Mixer Load',         unit: '%',   min: 0,    max: 100, threshold: 90,  componentIds: ['mixer_twin', 'motor_mixer'] },
      { name: 'Batch Weight',       unit: 'kg',  min: 0,    max: 3000,threshold: 2900,componentIds: ['load_cell'] },
      { name: 'Water/Cement Ratio', unit: 'ratio',min: 0.3, max: 0.8, threshold: 0.7, componentIds: ['pump_water', 'valve_water'] },
      { name: 'Mixer Temp',         unit: '°C',  min: 15,   max: 50,  threshold: 45,  componentIds: ['mixer_twin', 'motor_mixer'] },
      { name: 'Batches/Hour',       unit: 'b/h', min: 0,    max: 30,  threshold: 28,  componentIds: ['mixer_twin'] },
    ],
  },

  {
    id: 'industrial_dryer',
    name: 'Industrial Rotary Dryer',
    category: 'Material Handling',
    icon: '🌡️',
    description: 'Rotary dryer with exhaust air and moisture control',
    components: [
      { id: 'dryer_drum',    label: 'Rotary Drying Drum' },
      { id: 'motor_drum',    label: 'Drum Drive Motor' },
      { id: 'gearbox',       label: 'Drum Drive Gearbox' },
      { id: 'burner',        label: 'Gas Burner Unit' },
      { id: 'fan_exhaust',   label: 'Exhaust Fan' },
      { id: 'motor_fan',     label: 'Fan Motor' },
      { id: 'conveyor_out',  label: 'Discharge Conveyor' },
      { id: 'sensor_moisture',label: 'Outlet Moisture Sensor' },
    ],
    signals: [
      { name: 'Drum Inlet Temp',   unit: '°C', min: 80,  max: 300, threshold: 280, componentIds: ['burner', 'dryer_drum'] },
      { name: 'Drum Outlet Temp',  unit: '°C', min: 40,  max: 120, threshold: 100, componentIds: ['dryer_drum', 'fan_exhaust'] },
      { name: 'Product Moisture',  unit: '%',  min: 0,   max: 20,  threshold: 5,   componentIds: ['sensor_moisture', 'dryer_drum'] },
      { name: 'Drum RPM',          unit: 'rpm',min: 0,   max: 20,  threshold: 18,  componentIds: ['dryer_drum', 'motor_drum'] },
      { name: 'Fan Speed',         unit: 'rpm',min: 0,   max: 1500,threshold: 1400,componentIds: ['fan_exhaust', 'motor_fan'] },
      { name: 'Gearbox Temp',      unit: '°C', min: 20,  max: 80,  threshold: 70,  componentIds: ['gearbox'] },
    ],
  },

  {
    id: 'hydraulic_press',
    name: 'Hydraulic Press Machine',
    category: 'Material Handling',
    icon: '🏋️',
    description: 'High-force pressing and forming with pressure and stroke monitoring',
    components: [
      { id: 'cylinder_main', label: 'Main Hydraulic Cylinder' },
      { id: 'pump_hydraulic',label: 'Hydraulic Pump' },
      { id: 'motor_pump',    label: 'Pump Drive Motor' },
      { id: 'valve_dir',     label: 'Directional Control Valve' },
      { id: 'accumulator',   label: 'Hydraulic Accumulator' },
      { id: 'valve_relief',  label: 'Pressure Relief Valve' },
      { id: 'tank_oil',      label: 'Hydraulic Oil Reservoir' },
      { id: 'cooler_oil',    label: 'Oil Cooler' },
      { id: 'sensor_stroke', label: 'Linear Position Sensor' },
    ],
    signals: [
      { name: 'Press Force',        unit: 'kN',  min: 0,  max: 5000, threshold: 4800, componentIds: ['cylinder_main'] },
      { name: 'Hydraulic Pressure', unit: 'bar', min: 0,  max: 350,  threshold: 320,  componentIds: ['pump_hydraulic', 'accumulator', 'valve_relief'] },
      { name: 'Oil Temperature',    unit: '°C',  min: 30, max: 70,   threshold: 65,   componentIds: ['tank_oil', 'cooler_oil'] },
      { name: 'Stroke Position',    unit: 'mm',  min: 0,  max: 500,  threshold: 490,  componentIds: ['cylinder_main', 'sensor_stroke'] },
      { name: 'Cycle Time',         unit: 's',   min: 0,  max: 30,   threshold: 25,   componentIds: ['valve_dir', 'pump_hydraulic'] },
      { name: 'Pump Motor Current', unit: 'A',   min: 0,  max: 80,   threshold: 75,   componentIds: ['motor_pump'] },
    ],
  },

  {
    id: 'vacuum_transfer',
    name: 'Vacuum Transfer System',
    category: 'Material Handling',
    icon: '🌀',
    description: 'Pneumatic conveying of powders and granules under vacuum',
    components: [
      { id: 'pump_vacuum',   label: 'Vacuum Pump' },
      { id: 'motor_vac',     label: 'Vacuum Pump Motor' },
      { id: 'receiver',      label: 'Receiver Vessel' },
      { id: 'filter_bag',    label: 'Bag Filter Unit' },
      { id: 'valve_inlet',   label: 'Inlet Solenoid Valve' },
      { id: 'valve_discharge',label: 'Discharge Valve' },
      { id: 'sensor_level',  label: 'Receiver Level Sensor' },
    ],
    signals: [
      { name: 'Vacuum Level',  unit: 'kPa', min: -100,max: 0,   threshold: -20, componentIds: ['pump_vacuum', 'receiver'] },
      { name: 'Transfer Rate', unit: 'kg/h',min: 0,   max: 500, threshold: 480, componentIds: ['pump_vacuum', 'valve_inlet'] },
      { name: 'Filter DP',     unit: 'kPa', min: 0,   max: 20,  threshold: 15,  componentIds: ['filter_bag'] },
      { name: 'Pump Motor Temp',unit: '°C', min: 20,  max: 80,  threshold: 70,  componentIds: ['motor_vac', 'pump_vacuum'] },
      { name: 'Receiver Level',unit: '%',   min: 0,   max: 100, threshold: 90,  componentIds: ['receiver', 'sensor_level'] },
    ],
  },

  {
    id: 'screw_conveyor',
    name: 'Screw Conveyor System',
    category: 'Material Handling',
    icon: '🌀',
    description: 'Enclosed screw conveyor for powder and granule transport',
    components: [
      { id: 'screw_conv',    label: 'Screw Conveyor' },
      { id: 'motor_screw',   label: 'Screw Drive Motor' },
      { id: 'gearbox',       label: 'Reduction Gearbox' },
      { id: 'hopper_in',     label: 'Inlet Hopper' },
      { id: 'valve_outlet',  label: 'Outlet Gate Valve' },
      { id: 'load_cell',     label: 'In-Line Load Cell' },
      { id: 'sensor_temp',   label: 'Bearing Temperature Sensor' },
    ],
    signals: [
      { name: 'Screw Speed',    unit: 'rpm',  min: 0,  max: 200, threshold: 180, componentIds: ['screw_conv', 'motor_screw'] },
      { name: 'Motor Current',  unit: 'A',    min: 0,  max: 50,  threshold: 45,  componentIds: ['motor_screw'] },
      { name: 'Throughput',     unit: 'kg/h', min: 0,  max: 5000,threshold: 4800,componentIds: ['screw_conv', 'load_cell'] },
      { name: 'Bearing Temp',   unit: '°C',   min: 20, max: 80,  threshold: 70,  componentIds: ['sensor_temp', 'gearbox'] },
      { name: 'Gearbox Oil Temp',unit: '°C',  min: 20, max: 80,  threshold: 70,  componentIds: ['gearbox'] },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // ENERGY & POWER (5 machines)
  // ════════════════════════════════════════════════════════════

  {
    id: 'diesel_generator',
    name: 'Diesel Generator Set',
    category: 'Energy & Power',
    icon: '⚡',
    description: 'Standby/prime power generation with engine and alternator monitoring',
    components: [
      { id: 'engine_diesel', label: 'Diesel Engine' },
      { id: 'alternator',    label: 'AC Alternator' },
      { id: 'radiator',      label: 'Engine Cooling Radiator' },
      { id: 'fan_cooling',   label: 'Radiator Cooling Fan' },
      { id: 'ats',           label: 'Automatic Transfer Switch' },
      { id: 'panel_main',    label: 'Generator Control Panel' },
      { id: 'tank_fuel',     label: 'Day Fuel Tank' },
      { id: 'filter_air',    label: 'Air Intake Filter' },
    ],
    signals: [
      { name: 'Output Voltage', unit: 'V',   min: 0,  max: 480,  threshold: 420,  componentIds: ['alternator', 'panel_main'] },
      { name: 'Output Frequency',unit: 'Hz', min: 45, max: 55,   threshold: 51,   componentIds: ['alternator', 'engine_diesel'] },
      { name: 'Engine RPM',     unit: 'rpm', min: 0,  max: 1800, threshold: 1750, componentIds: ['engine_diesel'] },
      { name: 'Coolant Temp',   unit: '°C',  min: 60, max: 100,  threshold: 95,   componentIds: ['radiator', 'fan_cooling'] },
      { name: 'Oil Pressure',   unit: 'bar', min: 0,  max: 6,    threshold: 1.5,  componentIds: ['engine_diesel'] },
      { name: 'Fuel Level',     unit: '%',   min: 0,  max: 100,  threshold: 15,   componentIds: ['tank_fuel'] },
    ],
  },

  {
    id: 'solar_inverter',
    name: 'Solar Inverter System',
    category: 'Energy & Power',
    icon: '☀️',
    description: 'Grid-tied PV inverter with MPPT tracking and grid monitoring',
    components: [
      { id: 'inverter_main', label: 'Grid-Tie Inverter' },
      { id: 'transformer',   label: 'Step-Up Transformer' },
      { id: 'panel_electric',label: 'DC Combiner Box' },
      { id: 'sensor_energy', label: 'Bidirectional Energy Meter' },
      { id: 'sensor_dc',     label: 'DC Input Sensor' },
      { id: 'fan_inv',       label: 'Inverter Cooling Fan' },
    ],
    signals: [
      { name: 'DC Input Voltage', unit: 'V',   min: 0,  max: 1000, threshold: 950, componentIds: ['panel_electric', 'sensor_dc'] },
      { name: 'AC Output Power',  unit: 'kW',  min: 0,  max: 100,  threshold: 98,  componentIds: ['inverter_main', 'transformer'] },
      { name: 'Inverter Temp',    unit: '°C',  min: 20, max: 75,   threshold: 70,  componentIds: ['inverter_main', 'fan_inv'] },
      { name: 'Grid Voltage',     unit: 'V',   min: 200,max: 250,  threshold: 245, componentIds: ['transformer', 'sensor_energy'] },
      { name: 'Total Energy',     unit: 'kWh', min: 0,  max: 10000,threshold: 9900,componentIds: ['sensor_energy'] },
    ],
  },

  {
    id: 'wind_turbine',
    name: 'Wind Turbine System',
    category: 'Energy & Power',
    icon: '💨',
    description: 'Variable-speed wind turbine with pitch, yaw and power monitoring',
    components: [
      { id: 'rotor_blades',  label: 'Rotor Blades' },
      { id: 'gearbox',       label: 'Nacelle Gearbox' },
      { id: 'generator',     label: 'Wind Generator' },
      { id: 'vfd_gen',       label: 'Power Converter' },
      { id: 'transformer',   label: 'Step-Up Transformer' },
      { id: 'sensor_vib',    label: 'Nacelle Vibration Sensor' },
      { id: 'panel_control', label: 'Turbine Control Panel' },
    ],
    signals: [
      { name: 'Wind Speed',     unit: 'm/s',  min: 0,  max: 30,   threshold: 25,  componentIds: ['rotor_blades'] },
      { name: 'Rotor RPM',      unit: 'rpm',  min: 0,  max: 20,   threshold: 18,  componentIds: ['rotor_blades', 'gearbox'] },
      { name: 'Output Power',   unit: 'kW',   min: 0,  max: 2000, threshold: 1950,componentIds: ['generator', 'vfd_gen'] },
      { name: 'Gearbox Temp',   unit: '°C',   min: 20, max: 80,   threshold: 75,  componentIds: ['gearbox'] },
      { name: 'Nacelle Vibration',unit: 'mm/s',min: 0, max: 10,   threshold: 7,   componentIds: ['sensor_vib'] },
      { name: 'Generator Temp', unit: '°C',   min: 20, max: 90,   threshold: 85,  componentIds: ['generator'] },
    ],
  },

  {
    id: 'ups_system',
    name: 'UPS Power System',
    category: 'Energy & Power',
    icon: '🔋',
    description: 'Uninterruptible power supply with battery health and load monitoring',
    components: [
      { id: 'rectifier',     label: 'AC-DC Rectifier' },
      { id: 'inverter_ups',  label: 'DC-AC Inverter' },
      { id: 'battery_bank',  label: 'Battery Bank' },
      { id: 'bypass_switch', label: 'Static Bypass Switch' },
      { id: 'transformer',   label: 'Isolation Transformer' },
      { id: 'panel_ups',     label: 'UPS Control Panel' },
      { id: 'fan_ups',       label: 'Cabinet Cooling Fan' },
    ],
    signals: [
      { name: 'Battery Voltage', unit: 'V',   min: 0,  max: 500, threshold: 420, componentIds: ['battery_bank', 'rectifier'] },
      { name: 'Battery SOC',     unit: '%',   min: 0,  max: 100, threshold: 20,  componentIds: ['battery_bank'] },
      { name: 'Load %',          unit: '%',   min: 0,  max: 100, threshold: 90,  componentIds: ['inverter_ups', 'panel_ups'] },
      { name: 'Battery Temp',    unit: '°C',  min: 15, max: 40,  threshold: 35,  componentIds: ['battery_bank', 'fan_ups'] },
      { name: 'Runtime',         unit: 'min', min: 0,  max: 60,  threshold: 10,  componentIds: ['battery_bank'] },
    ],
  },

  {
    id: 'hvac_system',
    name: 'HVAC System',
    category: 'Energy & Power',
    icon: '🌬️',
    description: 'Heating, ventilation and cooling with zone-based control',
    components: [
      { id: 'ahu',           label: 'Air Handling Unit' },
      { id: 'fan_supply',    label: 'Supply Air Fan' },
      { id: 'fan_return',    label: 'Return Air Fan' },
      { id: 'chiller_unit',  label: 'Chiller' },
      { id: 'cooling_tower', label: 'Cooling Tower' },
      { id: 'pump_chw',      label: 'Chilled Water Pump' },
      { id: 'valve_chw',     label: 'Chilled Water Valve' },
      { id: 'sensor_temp',   label: 'Zone Temperature Sensor' },
      { id: 'sensor_humid',  label: 'Humidity Sensor' },
    ],
    signals: [
      { name: 'Supply Air Temp',  unit: '°C',  min: 10, max: 30,   threshold: 26,  componentIds: ['ahu', 'fan_supply', 'chiller_unit'] },
      { name: 'Return Air Temp',  unit: '°C',  min: 15, max: 35,   threshold: 28,  componentIds: ['sensor_temp', 'fan_return'] },
      { name: 'Humidity',         unit: '%RH', min: 20, max: 80,   threshold: 65,  componentIds: ['sensor_humid', 'ahu'] },
      { name: 'Chiller Load',     unit: '%',   min: 0,  max: 100,  threshold: 90,  componentIds: ['chiller_unit', 'pump_chw'] },
      { name: 'Energy Consumption',unit: 'kWh',min: 0,  max: 10000,threshold: 9500,componentIds: ['fan_supply', 'chiller_unit'] },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // FOOD & BEVERAGE (3 machines)
  // ════════════════════════════════════════════════════════════

  {
    id: 'pasteurizer',
    name: 'Pasteurization System',
    category: 'Food & Beverage',
    icon: '🥛',
    description: 'HTST pasteurizer with precise temperature profile and flow diversion',
    components: [
      { id: 'hex_paster',    label: 'Plate Heat Exchanger' },
      { id: 'heater_steam',  label: 'Steam Heater Section' },
      { id: 'cooler_regen',  label: 'Regenerative Cooler' },
      { id: 'pump_product',  label: 'Product Pump' },
      { id: 'valve_divert',  label: 'Flow Diversion Valve' },
      { id: 'sensor_temp',   label: 'Hold Tube Temp Sensor' },
      { id: 'flowmeter',     label: 'Magnetic Flowmeter' },
    ],
    signals: [
      { name: 'Pasteurize Temp',  unit: '°C',   min: 60, max: 100, threshold: 72,  componentIds: ['heater_steam', 'sensor_temp'] },
      { name: 'Hold Time',        unit: 's',    min: 0,  max: 30,  threshold: 14,  componentIds: ['sensor_temp'] },
      { name: 'Flow Rate',        unit: 'L/h',  min: 0,  max: 5000,threshold: 4800,componentIds: ['pump_product', 'valve_divert', 'flowmeter'] },
      { name: 'CIP Conductivity', unit: 'mS/cm',min: 0,  max: 20,  threshold: 18,  componentIds: ['sensor_temp'] },
      { name: 'Pump Speed',       unit: 'rpm',  min: 0,  max: 1500,threshold: 1400,componentIds: ['pump_product'] },
    ],
  },

  {
    id: 'brewery',
    name: 'Brewery Process System',
    category: 'Food & Beverage',
    icon: '🍺',
    description: 'Fermentation vessel monitoring with temperature and pressure control',
    components: [
      { id: 'tank_ferm',     label: 'Fermentation Tank' },
      { id: 'cooler_glycol', label: 'Glycol Cooling Jacket' },
      { id: 'pump_glycol',   label: 'Glycol Pump' },
      { id: 'pump_transfer', label: 'Transfer Pump' },
      { id: 'valve_vent',    label: 'CO2 Vent Valve' },
      { id: 'sensor_sg',     label: 'Density/SG Sensor' },
      { id: 'sensor_co2',    label: 'CO2 Sensor' },
      { id: 'agitator',      label: 'Gentle Agitator' },
    ],
    signals: [
      { name: 'Fermentation Temp', unit: '°C',  min: 0,    max: 30,  threshold: 22,  componentIds: ['cooler_glycol', 'pump_glycol'] },
      { name: 'Tank Pressure',     unit: 'bar',  min: 0,    max: 3,   threshold: 2.5, componentIds: ['tank_ferm', 'valve_vent'] },
      { name: 'CO2 Level',         unit: '%',    min: 0,    max: 5,   threshold: 3,   componentIds: ['sensor_co2', 'valve_vent'] },
      { name: 'Specific Gravity',  unit: 'SG',   min: 0.99, max: 1.1, threshold: 1.08,componentIds: ['sensor_sg'] },
      { name: 'Glycol Temp',       unit: '°C',   min: -10,  max: 5,   threshold: 0,   componentIds: ['cooler_glycol', 'pump_glycol'] },
    ],
  },

  {
    id: 'baking_oven',
    name: 'Industrial Baking Oven',
    category: 'Food & Beverage',
    icon: '🍞',
    description: 'Multi-zone tunnel oven with humidity and baking profile control',
    components: [
      { id: 'oven_tunnel',   label: 'Tunnel Oven' },
      { id: 'conveyor_band', label: 'Band Conveyor' },
      { id: 'motor_band',    label: 'Band Drive Motor' },
      { id: 'burner_z1',     label: 'Zone 1 Gas Burner' },
      { id: 'burner_z2',     label: 'Zone 2 Gas Burner' },
      { id: 'fan_circ',      label: 'Circulation Fan' },
      { id: 'fan_exhaust',   label: 'Exhaust Fan' },
      { id: 'sensor_humid',  label: 'Oven Humidity Sensor' },
    ],
    signals: [
      { name: 'Zone 1 Temp',       unit: '°C',     min: 100, max: 300, threshold: 260, componentIds: ['burner_z1', 'oven_tunnel'] },
      { name: 'Zone 2 Temp',       unit: '°C',     min: 150, max: 320, threshold: 290, componentIds: ['burner_z2', 'oven_tunnel'] },
      { name: 'Band Speed',        unit: 'm/min',  min: 0,   max: 10,  threshold: 9.5, componentIds: ['conveyor_band', 'motor_band'] },
      { name: 'Oven Humidity',     unit: '%',      min: 0,   max: 100, threshold: 85,  componentIds: ['sensor_humid', 'fan_circ'] },
      { name: 'Gas Consumption',   unit: 'Nm³/h',  min: 0,   max: 50,  threshold: 48,  componentIds: ['burner_z1', 'burner_z2'] },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // PHARMACEUTICAL (2 machines)
  // ════════════════════════════════════════════════════════════

  {
    id: 'tablet_press',
    name: 'Tablet Press Machine',
    category: 'Pharmaceutical',
    icon: '💊',
    description: 'Rotary tablet compression with weight, hardness and thickness control',
    components: [
      { id: 'press_rotary',  label: 'Rotary Tablet Press' },
      { id: 'motor_turret',  label: 'Turret Drive Motor' },
      { id: 'feeder_force',  label: 'Force Feeder' },
      { id: 'motor_feeder',  label: 'Feeder Motor' },
      { id: 'cam_comp',      label: 'Compression Cams' },
      { id: 'collector_dust',label: 'Dust Extractor' },
      { id: 'sensor_weight', label: 'In-Line Weight Sensor' },
    ],
    signals: [
      { name: 'Tablet Weight',     unit: 'mg',  min: 0,  max: 1000, threshold: 980, componentIds: ['press_rotary', 'sensor_weight', 'feeder_force'] },
      { name: 'Compression Force', unit: 'kN',  min: 0,  max: 50,   threshold: 45,  componentIds: ['press_rotary', 'cam_comp'] },
      { name: 'Turret Speed',      unit: 'rpm', min: 0,  max: 60,   threshold: 58,  componentIds: ['press_rotary', 'motor_turret'] },
      { name: 'Tablet Hardness',   unit: 'N',   min: 0,  max: 200,  threshold: 180, componentIds: ['cam_comp', 'press_rotary'] },
      { name: 'Rejection Rate',    unit: '%',   min: 0,  max: 5,    threshold: 1,   componentIds: ['sensor_weight'] },
    ],
  },

  {
    id: 'autoclave',
    name: 'Autoclave Sterilizer',
    category: 'Pharmaceutical',
    icon: '🧪',
    description: 'Steam sterilization with pressure, temperature and F0 validation',
    components: [
      { id: 'chamber',       label: 'Pressure Chamber' },
      { id: 'generator_stm', label: 'Steam Generator' },
      { id: 'pump_vacuum',   label: 'Vacuum Pump' },
      { id: 'motor_vac',     label: 'Vacuum Pump Motor' },
      { id: 'valve_steam',   label: 'Steam Inlet Valve' },
      { id: 'valve_vent',    label: 'Vent Valve' },
      { id: 'sensor_f0',     label: 'F0 Validation Sensor' },
      { id: 'door_seal',     label: 'Door Seal System' },
    ],
    signals: [
      { name: 'Chamber Temp',     unit: '°C',  min: 100, max: 140, threshold: 121, componentIds: ['chamber', 'generator_stm', 'sensor_f0'] },
      { name: 'Chamber Pressure', unit: 'bar', min: 0,   max: 3,   threshold: 2.2, componentIds: ['chamber', 'valve_steam', 'valve_vent'] },
      { name: 'F0 Value',         unit: 'min', min: 0,   max: 20,  threshold: 12,  componentIds: ['sensor_f0'] },
      { name: 'Cycle Time',       unit: 'min', min: 0,   max: 120, threshold: 110, componentIds: ['chamber', 'pump_vacuum'] },
      { name: 'Vacuum Depth',     unit: 'mbar',min: 0,   max: 1013,threshold: 50,  componentIds: ['pump_vacuum', 'motor_vac'] },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // MINING & EXTRACTION (2 machines)
  // ════════════════════════════════════════════════════════════

  {
    id: 'ball_mill',
    name: 'Ball Mill System',
    category: 'Mining & Extraction',
    icon: '⛏️',
    description: 'Grinding mill for ore processing with load and speed control',
    components: [
      { id: 'mill_shell',    label: 'Ball Mill Shell' },
      { id: 'motor_main',    label: 'Mill Drive Motor' },
      { id: 'gearbox',       label: 'Ring-Pinion Gearbox' },
      { id: 'feeder_ore',    label: 'Ore Belt Feeder' },
      { id: 'motor_feeder',  label: 'Feeder Motor' },
      { id: 'classifier',    label: 'Hydrocyclone Classifier' },
      { id: 'pump_slurry',   label: 'Slurry Pump' },
      { id: 'sensor_vib',    label: 'Mill Body Vibration Sensor' },
    ],
    signals: [
      { name: 'Mill Load',       unit: '%',   min: 0,  max: 100, threshold: 90,  componentIds: ['mill_shell', 'motor_main'] },
      { name: 'Rotational Speed',unit: 'rpm', min: 0,  max: 30,  threshold: 28,  componentIds: ['mill_shell', 'gearbox'] },
      { name: 'Motor Power',     unit: 'kW',  min: 0,  max: 2000,threshold: 1900,componentIds: ['motor_main'] },
      { name: 'Feed Rate',       unit: 't/h', min: 0,  max: 100, threshold: 95,  componentIds: ['feeder_ore', 'motor_feeder'] },
      { name: 'Bearing Temp',    unit: '°C',  min: 20, max: 80,  threshold: 70,  componentIds: ['mill_shell', 'sensor_vib'] },
      { name: 'Mill Vibration',  unit: 'mm/s',min: 0,  max: 10,  threshold: 7,   componentIds: ['sensor_vib', 'mill_shell'] },
    ],
  },

  {
    id: 'flotation_cell',
    name: 'Flotation Cell System',
    category: 'Mining & Extraction',
    icon: '🪨',
    description: 'Mineral flotation with reagent dosing and froth level control',
    components: [
      { id: 'cell_vessel',   label: 'Flotation Cell' },
      { id: 'motor_imp',     label: 'Impeller Motor' },
      { id: 'impeller',      label: 'Rotor-Stator Impeller' },
      { id: 'pump_reagent',  label: 'Reagent Dosing Pump' },
      { id: 'valve_air',     label: 'Air Control Valve' },
      { id: 'sensor_froth',  label: 'Froth Level Sensor' },
      { id: 'pump_tails',    label: 'Tailings Pump' },
    ],
    signals: [
      { name: 'Froth Level',    unit: 'mm',   min: 0,  max: 500, threshold: 450, componentIds: ['cell_vessel', 'sensor_froth'] },
      { name: 'Impeller Speed', unit: 'rpm',  min: 0,  max: 400, threshold: 380, componentIds: ['impeller', 'motor_imp'] },
      { name: 'Air Flow Rate',  unit: 'Nm³/h',min: 0,  max: 20,  threshold: 18,  componentIds: ['valve_air'] },
      { name: 'pH Level',       unit: 'pH',   min: 6,  max: 12,  threshold: 10,  componentIds: ['pump_reagent'] },
      { name: 'Recovery Rate',  unit: '%',    min: 0,  max: 100, threshold: 80,  componentIds: ['cell_vessel', 'pump_tails'] },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // 6 NEW INDUSTRY-STANDARD MACHINES
  // ════════════════════════════════════════════════════════════

  // NEW 1: Reverse Osmosis Plant (water-intensive industries, pharma, food)
  {
    id: 'reverse_osmosis',
    name: 'Reverse Osmosis Plant',
    category: 'Process & Fluid',
    icon: '🔬',
    description: 'High-pressure membrane filtration for ultrapure water production',
    components: [
      { id: 'pump_hp',       label: 'High-Pressure Pump' },
      { id: 'motor_hp',      label: 'HP Pump Motor' },
      { id: 'vfd_hp',        label: 'Variable Frequency Drive' },
      { id: 'membrane_1',    label: 'RO Membrane Bank 1' },
      { id: 'membrane_2',    label: 'RO Membrane Bank 2' },
      { id: 'filter_pre',    label: '5-Micron Prefilter' },
      { id: 'valve_conc',    label: 'Concentrate Control Valve' },
      { id: 'valve_perm',    label: 'Permeate Valve' },
      { id: 'tank_product',  label: 'Product Water Tank' },
      { id: 'sensor_cond',   label: 'Permeate Conductivity Sensor' },
      { id: 'flowmeter_perm',label: 'Permeate Flowmeter' },
      { id: 'flowmeter_feed',label: 'Feed Flowmeter' },
    ],
    signals: [
      { name: 'Feed Pressure',       unit: 'bar',   min: 0,  max: 70,   threshold: 60,  componentIds: ['pump_hp', 'motor_hp', 'vfd_hp'] },
      { name: 'Permeate Flow',       unit: 'L/h',   min: 0,  max: 5000, threshold: 4800,componentIds: ['membrane_1', 'membrane_2', 'flowmeter_perm'] },
      { name: 'Permeate Conductivity',unit: 'µS/cm',min: 0,  max: 500,  threshold: 100, componentIds: ['sensor_cond', 'membrane_1'] },
      { name: 'Recovery Rate',       unit: '%',     min: 0,  max: 100,  threshold: 80,  componentIds: ['valve_conc', 'valve_perm'] },
      { name: 'Salt Rejection',      unit: '%',     min: 80, max: 100,  threshold: 97,  componentIds: ['membrane_1', 'membrane_2'] },
      { name: 'SDI (Fouling Index)', unit: 'index', min: 0,  max: 6,    threshold: 4,   componentIds: ['filter_pre', 'membrane_1'] },
    ],
  },

  // NEW 2: Gas Turbine Compressor (oil & gas, power plants)
  {
    id: 'gas_turbine_compressor',
    name: 'Gas Turbine Compressor',
    category: 'Energy & Power',
    icon: '🌪️',
    description: 'Centrifugal gas compressor driven by industrial gas turbine',
    components: [
      { id: 'turbine',       label: 'Gas Turbine' },
      { id: 'compressor_c', label: 'Centrifugal Compressor' },
      { id: 'gearbox',       label: 'Speed Increasing Gearbox' },
      { id: 'inlet_filter',  label: 'Turbine Inlet Air Filter' },
      { id: 'cooler_lube',   label: 'Lube Oil Cooler' },
      { id: 'separator_oil', label: 'Oil-Gas Separator' },
      { id: 'valve_igv',     label: 'Inlet Guide Vanes' },
      { id: 'relief_valve',  label: 'Anti-Surge Valve' },
      { id: 'sensor_vib',    label: 'Shaft Vibration Probe' },
    ],
    signals: [
      { name: 'Turbine Speed',      unit: 'rpm',  min: 0,   max: 15000,threshold: 14500,componentIds: ['turbine', 'gearbox'] },
      { name: 'Compressor Discharge Pressure',unit: 'bar',min: 0,max: 80,threshold: 70, componentIds: ['compressor_c', 'relief_valve'] },
      { name: 'Exhaust Gas Temp',   unit: '°C',   min: 400, max: 700,  threshold: 650,  componentIds: ['turbine'] },
      { name: 'Lube Oil Pressure',  unit: 'bar',  min: 0,   max: 6,    threshold: 1.5,  componentIds: ['cooler_lube', 'separator_oil'] },
      { name: 'Shaft Vibration',    unit: 'µm pp',min: 0,   max: 200,  threshold: 100,  componentIds: ['sensor_vib', 'gearbox'] },
      { name: 'Power Output',       unit: 'MW',   min: 0,   max: 30,   threshold: 28,   componentIds: ['turbine'] },
    ],
  },

  // NEW 3: Cooling Water System (power stations, steel plants, petrochemical)
  {
    id: 'cooling_water_system',
    name: 'Cooling Water System',
    category: 'Process & Fluid',
    icon: '💦',
    description: 'Closed-loop industrial cooling water with chemical treatment',
    components: [
      { id: 'pump_a',        label: 'Cooling Water Pump A' },
      { id: 'pump_b',        label: 'Cooling Water Pump B' },
      { id: 'motor_a',       label: 'Pump A Motor' },
      { id: 'motor_b',       label: 'Pump B Motor' },
      { id: 'tower_ct',      label: 'Cooling Tower' },
      { id: 'fan_ct',        label: 'Cooling Tower Fan' },
      { id: 'strainer_main', label: 'Duplex Strainer' },
      { id: 'exchanger',     label: 'Heat Exchanger' },
      { id: 'pump_chem',     label: 'Chemical Treatment Pump' },
      { id: 'sensor_cond',   label: 'Conductivity/TDS Sensor' },
      { id: 'valve_bypass',  label: 'Temperature Bypass Valve' },
    ],
    signals: [
      { name: 'Supply Header Pressure',unit: 'bar',  min: 0,  max: 8,    threshold: 6,    componentIds: ['pump_a', 'pump_b'] },
      { name: 'Cooling Water Flow',    unit: 'm³/h', min: 0,  max: 500,  threshold: 480,  componentIds: ['pump_a', 'pump_b', 'strainer_main'] },
      { name: 'Supply Temp',           unit: '°C',   min: 15, max: 40,   threshold: 35,   componentIds: ['tower_ct', 'fan_ct', 'exchanger'] },
      { name: 'Return Temp',           unit: '°C',   min: 20, max: 50,   threshold: 45,   componentIds: ['exchanger'] },
      { name: 'Conductivity',          unit: 'µS/cm',min: 0,  max: 3000, threshold: 2500, componentIds: ['sensor_cond', 'pump_chem'] },
      { name: 'Strainer DP',           unit: 'bar',  min: 0,  max: 2,    threshold: 1.5,  componentIds: ['strainer_main'] },
    ],
  },

  // NEW 4: Wastewater Treatment (municipal, industrial ETP)
  {
    id: 'wastewater_treatment',
    name: 'Wastewater Treatment Plant',
    category: 'Process & Fluid',
    icon: '♻️',
    description: 'Biological wastewater treatment with aeration, clarification and sludge handling',
    components: [
      { id: 'tank_equalize',  label: 'Equalization Tank' },
      { id: 'pump_feed',      label: 'Feed Pump' },
      { id: 'tank_aeration',  label: 'Aeration Basin' },
      { id: 'blower_air',     label: 'Diffused Air Blower' },
      { id: 'motor_blower',   label: 'Blower Motor' },
      { id: 'clarifier',      label: 'Secondary Clarifier' },
      { id: 'pump_sludge',    label: 'Sludge Return Pump' },
      { id: 'filter_final',   label: 'Tertiary Filter' },
      { id: 'sensor_do',      label: 'Dissolved Oxygen Probe' },
      { id: 'sensor_ph',      label: 'Effluent pH Sensor' },
    ],
    signals: [
      { name: 'Dissolved Oxygen',   unit: 'mg/L',min: 0,  max: 10,  threshold: 1.5, componentIds: ['sensor_do', 'blower_air', 'motor_blower'] },
      { name: 'Effluent pH',        unit: 'pH',  min: 0,  max: 14,  threshold: 9.0, componentIds: ['sensor_ph'] },
      { name: 'Aeration Flow',      unit: 'm³/h',min: 0,  max: 200, threshold: 190, componentIds: ['blower_air', 'motor_blower'] },
      { name: 'MLSS',               unit: 'mg/L',min: 0,  max: 6000,threshold: 5000,componentIds: ['tank_aeration', 'clarifier'] },
      { name: 'Sludge Level',       unit: '%',   min: 0,  max: 100, threshold: 80,  componentIds: ['clarifier', 'pump_sludge'] },
      { name: 'Influent Flow',      unit: 'L/s', min: 0,  max: 500, threshold: 480, componentIds: ['pump_feed', 'tank_equalize'] },
    ],
  },

  // NEW 5: Paint Spray Booth (automotive, metal fabrication)
  {
    id: 'paint_spray_booth',
    name: 'Paint Spray Booth',
    category: 'Manufacturing',
    icon: '🎨',
    description: 'Automated spray painting with air supply, exhaust and booth climate control',
    components: [
      { id: 'robot_spray',   label: 'Paint Robot' },
      { id: 'motor_robot',   label: 'Robot Drive Motor' },
      { id: 'pump_paint',    label: 'Paint Circulation Pump' },
      { id: 'fan_supply',    label: 'Air Supply Fan' },
      { id: 'fan_exhaust',   label: 'Exhaust Fan' },
      { id: 'motor_supply',  label: 'Supply Fan Motor' },
      { id: 'motor_exhaust', label: 'Exhaust Fan Motor' },
      { id: 'filter_paint',  label: 'Overspray Arrestor Filter' },
      { id: 'heater_air',    label: 'Air Make-Up Heater' },
      { id: 'sensor_solvent',label: 'Solvent Vapour Sensor' },
    ],
    signals: [
      { name: 'Booth Temperature',   unit: '°C',   min: 15, max: 35,  threshold: 28,  componentIds: ['heater_air', 'fan_supply'] },
      { name: 'Air Velocity',        unit: 'm/s',  min: 0,  max: 1,   threshold: 0.5, componentIds: ['fan_supply', 'fan_exhaust'] },
      { name: 'Paint Pressure',      unit: 'bar',  min: 0,  max: 6,   threshold: 4,   componentIds: ['pump_paint', 'robot_spray'] },
      { name: 'Solvent Vapour LEL',  unit: '%LEL', min: 0,  max: 100, threshold: 25,  componentIds: ['sensor_solvent'] },
      { name: 'Filter DP',           unit: 'Pa',   min: 0,  max: 300, threshold: 200, componentIds: ['filter_paint'] },
      { name: 'Robot Cycle Time',    unit: 's',    min: 0,  max: 120, threshold: 100, componentIds: ['robot_spray', 'motor_robot'] },
    ],
  },

  // NEW 6: Natural Gas Pipeline Station (oil & gas, utilities)
  {
    id: 'gas_pipeline_station',
    name: 'Gas Pipeline Metering Station',
    category: 'Energy & Power',
    icon: '🏭',
    description: 'Gas custody transfer with pressure regulation, metering and odorisation',
    components: [
      { id: 'valve_main',    label: 'Main Isolation Valve' },
      { id: 'filter_gas',    label: 'Gas Coalescing Filter' },
      { id: 'valve_prv_hp',  label: 'HP Pressure Regulator' },
      { id: 'valve_prv_lp',  label: 'LP Pressure Regulator' },
      { id: 'meter_gas',     label: 'Turbine Gas Meter' },
      { id: 'flowmeter',     label: 'Ultrasonic Flowmeter' },
      { id: 'heater_gas',    label: 'Gas Pre-Heater' },
      { id: 'pump_odor',     label: 'Odorant Injection Pump' },
      { id: 'relief_valve',  label: 'Slam-Shut Valve' },
      { id: 'sensor_ch4',    label: 'Gas Leak Detector' },
    ],
    signals: [
      { name: 'Inlet Pressure',       unit: 'bar',  min: 0,  max: 100, threshold: 90,  componentIds: ['valve_main', 'filter_gas', 'valve_prv_hp'] },
      { name: 'Outlet Pressure',      unit: 'bar',  min: 0,  max: 10,  threshold: 7,   componentIds: ['valve_prv_lp'] },
      { name: 'Gas Flow Rate',        unit: 'Nm³/h',min: 0,  max: 5000,threshold: 4800,componentIds: ['meter_gas', 'flowmeter'] },
      { name: 'Gas Temperature',      unit: '°C',   min: -10,max: 50,  threshold: 40,  componentIds: ['heater_gas'] },
      { name: 'Filter DP',            unit: 'mbar', min: 0,  max: 200, threshold: 100, componentIds: ['filter_gas'] },
      { name: 'CH4 Leak Concentration',unit: '%LEL',min: 0,  max: 100, threshold: 20,  componentIds: ['sensor_ch4', 'relief_valve'] },
    ],
  },
]

// ── Category list ──────────────────────────────────────────────────────
export const MACHINE_CATEGORIES: MachineCategory[] = [
  'Process & Fluid',
  'Manufacturing',
  'Material Handling',
  'Energy & Power',
  'Food & Beverage',
  'Pharmaceutical',
  'Mining & Extraction',
]

// ── Suggestion libraries for custom machine builder ────────────────────
export const ALL_PART_SUGGESTIONS: ComponentTemplate[] = [
  // Pumps
  { id: 'pump',        label: 'Centrifugal Pump' },
  { id: 'pump2',       label: 'Dosing Pump' },
  { id: 'pump3',       label: 'Gear Pump' },
  { id: 'pump4',       label: 'Submersible Pump' },
  { id: 'pump5',       label: 'Vacuum Pump' },
  { id: 'pump6',       label: 'Hydraulic Pump' },
  // Tanks & Vessels
  { id: 'tank',        label: 'Feed Tank' },
  { id: 'tank2',       label: 'Storage Tank' },
  { id: 'tank3',       label: 'Mixing Tank' },
  { id: 'tank4',       label: 'Buffer Tank' },
  { id: 'tank5',       label: 'Receiver Tank' },
  // Hoppers & Silos
  { id: 'hopper',      label: 'Feed Hopper' },
  { id: 'hopper2',     label: 'Vibratory Hopper' },
  { id: 'silo',        label: 'Storage Silo' },
  // Valves
  { id: 'valve',       label: 'Inlet Valve' },
  { id: 'valve2',      label: 'Outlet Valve' },
  { id: 'valve3',      label: 'Control Valve' },
  { id: 'valve4',      label: 'Solenoid Valve' },
  { id: 'valve5',      label: 'Safety Relief Valve' },
  { id: 'valve6',      label: 'Gate Valve' },
  // Filters & Separators
  { id: 'filter',      label: 'Strainer Filter' },
  { id: 'filter2',     label: 'Bag Filter' },
  { id: 'filter3',     label: 'Cartridge Filter' },
  { id: 'strainer',    label: 'Suction Strainer' },
  { id: 'separator',   label: 'Separator Unit' },
  // Motors & Drives
  { id: 'motor',       label: 'Drive Motor' },
  { id: 'motor2',      label: 'Servo Motor' },
  { id: 'motor3',      label: 'Stepper Motor' },
  { id: 'vfd',         label: 'Variable Frequency Drive' },
  // Conveyors
  { id: 'conveyor',    label: 'Belt Conveyor' },
  { id: 'conveyor2',   label: 'Screw Conveyor' },
  { id: 'conveyor3',   label: 'Roller Conveyor' },
  // Fans & Blowers
  { id: 'fan',         label: 'Cooling Fan' },
  { id: 'fan2',        label: 'Exhaust Fan' },
  { id: 'fan3',        label: 'Centrifugal Blower' },
  // Compressors
  { id: 'compressor',  label: 'Screw Compressor' },
  { id: 'compressor2', label: 'Centrifugal Compressor' },
  // Heat Equipment
  { id: 'boiler',      label: 'Boiler Unit' },
  { id: 'burner',      label: 'Burner Assembly' },
  { id: 'heater',      label: 'Electric Heater' },
  { id: 'heat_exchanger',label: 'Heat Exchanger' },
  { id: 'chiller',     label: 'Chiller Unit' },
  { id: 'cooler',      label: 'Cooler Unit' },
  { id: 'cooling_tower',label: 'Cooling Tower' },
  // Agitation & Mixing
  { id: 'mixer',       label: 'Agitator Mixer' },
  { id: 'agitator',    label: 'Agitator' },
  // Reactors & Specialty
  { id: 'reactor',     label: 'Reactor Vessel' },
  { id: 'accumulator', label: 'Pressure Accumulator' },
  { id: 'dryer',       label: 'Industrial Dryer' },
  // Motion & Robotics
  { id: 'robot',       label: 'Robot Arm' },
  { id: 'cnc',         label: 'CNC Machine' },
  { id: 'gearbox',     label: 'Gearbox' },
  { id: 'pulley',      label: 'Drive Pulley' },
  // Instrumentation
  { id: 'gauge',       label: 'Pressure Gauge' },
  { id: 'flowmeter',   label: 'Inline Flowmeter' },
  { id: 'load_cell',   label: 'Load Cell' },
  { id: 'encoder',     label: 'Shaft Encoder' },
  { id: 'sensor',      label: 'Temperature Sensor' },
  { id: 'sensor2',     label: 'Level Sensor' },
  { id: 'sensor3',     label: 'Flow Sensor' },
  // Electrical
  { id: 'electric_panel',label: 'Electric Control Panel' },
  { id: 'transformer', label: 'Transformer' },
]

export const ALL_SIGNAL_SUGGESTIONS: SignalTemplate[] = [
  { name: 'Temperature',           unit: '°C',    min: 0,    max: 150,  threshold: 120 },
  { name: 'Pressure',              unit: 'bar',   min: 0,    max: 10,   threshold: 8 },
  { name: 'Flow Rate',             unit: 'L/min', min: 0,    max: 200,  threshold: 180 },
  { name: 'RPM',                   unit: 'rpm',   min: 0,    max: 3000, threshold: 2800 },
  { name: 'Vibration',             unit: 'mm/s',  min: 0,    max: 15,   threshold: 10 },
  { name: 'Power Draw',            unit: 'kW',    min: 0,    max: 100,  threshold: 90 },
  { name: 'Motor Current',         unit: 'A',     min: 0,    max: 100,  threshold: 90 },
  { name: 'Voltage',               unit: 'V',     min: 0,    max: 480,  threshold: 450 },
  { name: 'Level',                 unit: '%',     min: 0,    max: 100,  threshold: 90 },
  { name: 'pH Level',              unit: 'pH',    min: 0,    max: 14,   threshold: 9 },
  { name: 'Torque',                unit: 'Nm',    min: 0,    max: 500,  threshold: 450 },
  { name: 'Belt Speed',            unit: 'm/s',   min: 0,    max: 10,   threshold: 9 },
  { name: 'Humidity',              unit: '%RH',   min: 0,    max: 100,  threshold: 85 },
  { name: 'Differential Pressure', unit: 'bar',   min: 0,    max: 5,    threshold: 3.5 },
  { name: 'Dissolved Oxygen',      unit: 'mg/L',  min: 0,    max: 20,   threshold: 15 },
  { name: 'Conductivity',          unit: 'µS/cm', min: 0,    max: 5000, threshold: 4000 },
  { name: 'Turbidity',             unit: 'NTU',   min: 0,    max: 100,  threshold: 5 },
  { name: 'Noise Level',           unit: 'dB',    min: 0,    max: 120,  threshold: 85 },
  { name: 'CO2 Level',             unit: 'ppm',   min: 0,    max: 5000, threshold: 1000 },
  { name: 'Bearing Temperature',   unit: '°C',    min: 20,   max: 100,  threshold: 80 },
  { name: 'Oil Pressure',          unit: 'bar',   min: 0,    max: 8,    threshold: 6 },
  { name: 'Steam Pressure',        unit: 'bar',   min: 0,    max: 25,   threshold: 20 },
  { name: 'Motor Load',            unit: '%',     min: 0,    max: 100,  threshold: 90 },
  { name: 'Feed Rate',             unit: 'kg/h',  min: 0,    max: 1000, threshold: 950 },
  { name: 'Stroke Position',       unit: 'mm',    min: 0,    max: 1000, threshold: 950 },
  { name: 'Vacuum Level',          unit: 'kPa',   min: -100, max: 0,    threshold: -20 },
  { name: 'Gas Concentration',     unit: '%LEL',  min: 0,    max: 100,  threshold: 25 },
  { name: 'Gearbox Temperature',   unit: '°C',    min: 20,   max: 90,   threshold: 75 },
]
