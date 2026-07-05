import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MachineTemplate, ComponentTemplate, MachineCategory } from '../data/machineTemplates'

let genAI: GoogleGenerativeAI | null = null

function getClient() {
  if (!genAI) {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
    if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY not set')
    genAI = new GoogleGenerativeAI(API_KEY)
  }
  return genAI
}

export interface AIGeneratedConfig {
  machineType: string
  components: Array<{ type: string; id: string }>
  signals: string[]
  controlSignals: string[]
  processFlow: string[]
  alarmThresholds: Record<string, { warning: number; critical: number }>
}

// All component types AI can name — maps to schematic SVG components
const COMPONENT_TYPES = [
  'Feed Tank', 'Storage Tank', 'Mixing Tank', 'Buffer Tank', 'Reactor Vessel', 'Silo',
  'Centrifugal Pump', 'Dosing Pump', 'Gear Pump', 'Submersible Pump',
  'Inlet Valve', 'Outlet Valve', 'Control Valve', 'Solenoid Valve', 'Pressure Relief Valve',
  'Drive Motor', 'Servo Motor', 'Stepper Motor', 'Variable Frequency Drive', 'Gearbox',
  'Belt Conveyor', 'Screw Conveyor', 'Hopper', 'Vibratory Feeder', 'Head Pulley',
  'Boiler', 'Heat Exchanger', 'Chiller', 'Cooling Tower', 'Industrial Dryer',
  'Air Compressor', 'Screw Compressor', 'Cooling Fan', 'Exhaust Fan', 'Pressure Accumulator',
  'Strainer Filter', 'Bag Filter', 'Separator', 'Agitator', 'Inline Mixer',
  'Pressure Gauge', 'Temperature Sensor', 'Level Sensor', 'Flow Meter', 'Encoder', 'Load Cell',
  'CNC Machine', 'Robot Arm', 'Filling Station',
  'Transformer', 'Electric Panel', 'Alarm Beacon',
]

// Map AI component label → schematic SVG type for rendering
const LABEL_TO_SVG_TYPE: Record<string, string> = {
  'feed tank': 'Tank', 'storage tank': 'Tank', 'mixing tank': 'Tank', 'buffer tank': 'Tank',
  'reactor vessel': 'Reactor', 'silo': 'Silo',
  'centrifugal pump': 'Pump', 'dosing pump': 'Pump', 'gear pump': 'Pump', 'submersible pump': 'Pump', 'pump': 'Pump',
  'inlet valve': 'Valve', 'outlet valve': 'Valve', 'valve': 'Valve',
  'control valve': 'ControlValve',
  'solenoid valve': 'SolenoidValve',
  'pressure relief valve': 'PressureRelief',
  'drive motor': 'Motor', 'servo motor': 'Motor', 'stepper motor': 'Motor', 'motor': 'Motor',
  'variable frequency drive': 'VFD', 'vfd': 'VFD',
  'gearbox': 'Gearbox',
  'belt conveyor': 'Conveyor', 'screw conveyor': 'Conveyor', 'conveyor': 'Conveyor',
  'hopper': 'Hopper', 'vibratory feeder': 'Hopper',
  'head pulley': 'Pulley',
  'boiler': 'Boiler',
  'heat exchanger': 'HeatExchanger',
  'chiller': 'Chiller',
  'cooling tower': 'CoolingTower',
  'industrial dryer': 'Dryer', 'dryer': 'Dryer',
  'air compressor': 'Compressor', 'screw compressor': 'Compressor', 'compressor': 'Compressor',
  'cooling fan': 'Fan', 'exhaust fan': 'Fan', 'fan': 'Fan',
  'pressure accumulator': 'Accumulator', 'accumulator': 'Accumulator',
  'strainer filter': 'Strainer', 'strainer': 'Strainer',
  'bag filter': 'Filter', 'filter': 'Filter',
  'separator': 'Separator',
  'agitator': 'Agitator', 'mixer': 'Mixer', 'inline mixer': 'Mixer',
  'pressure gauge': 'Gauge', 'gauge': 'Gauge',
  'temperature sensor': 'SensorNode', 'level sensor': 'SensorNode', 'sensor': 'SensorNode',
  'flow meter': 'Flowmeter', 'flowmeter': 'Flowmeter',
  'encoder': 'Encoder',
  'load cell': 'LoadCell',
  'cnc machine': 'CNCMachine', 'cnc': 'CNCMachine',
  'robot arm': 'RobotArm', 'robot': 'RobotArm',
  'filling station': 'FillingStation',
  'transformer': 'Transformer',
  'electric panel': 'ElectricPanel',
  'alarm beacon': 'AlarmBeacon',
}

function labelToSvgType(label: string): string {
  return LABEL_TO_SVG_TYPE[label.toLowerCase()] ?? 'SensorNode'
}
const SIGNAL_TYPES = ['temperature', 'pressure', 'flow', 'rpm', 'vibration', 'level', 'voltage', 'current', 'humidity']

export async function generateMachineConfig(userDescription: string): Promise<AIGeneratedConfig> {
  const prompt = `You are an industrial automation engineer. User describes a machine/process. Generate ONLY valid JSON (no text before/after).

USER DESCRIPTION: "${userDescription}"

Requirements:
1. machineType: string (name of machine)
2. components: array of {type, id} where type is a SPECIFIC descriptive name chosen from: ${COMPONENT_TYPES.join(', ')} — use the EXACT name from the list (e.g. 'Centrifugal Pump' not just 'pump', 'Feed Tank' not 'tank', 'Drive Motor' not 'motor')
3. signals: array of signal names from: ${SIGNAL_TYPES.join(', ')} (pick realistic ones for this machine)
4. controlSignals: array of control signal names (e.g., pump_speed, valve_position)
5. processFlow: array showing component sequence (e.g., ["Tank", "Pump", "Filter"])
6. alarmThresholds: object with signal names as keys, each with {warning, critical} thresholds

RESPOND WITH ONLY VALID JSON, NO MARKDOWN OR EXPLANATION:

{
  "machineType": "string",
  "components": [{"type": "string", "id": "string"}],
  "signals": ["string"],
  "controlSignals": ["string"],
  "processFlow": ["string"],
  "alarmThresholds": {}
}`

  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    
    // Extract JSON (handle markdown code blocks)
    let jsonStr = text
    if (text.includes('```json')) {
      jsonStr = text.split('```json')[1].split('```')[0].trim()
    } else if (text.includes('```')) {
      jsonStr = text.split('```')[1].split('```')[0].trim()
    }
    
    const config = JSON.parse(jsonStr) as AIGeneratedConfig
    
    // Validate
    if (!config.machineType || !config.components || !config.signals) {
      throw new Error('Invalid config structure')
    }
    
    return config
  } catch (err) {
    console.error('[Gemini] generateMachineConfig error:', err)
    throw new Error('Failed to generate machine config. Check API key and try again.')
  }
}

export function convertConfigToMachineTemplate(config: AIGeneratedConfig): MachineTemplate {
  // Map Gemini config to MachineTemplate shape
  // ✅ FIX: Use the AI-given specific name as label (e.g. "Centrifugal Pump", not "pump")
  // Also store svgType so SchematicCanvas maps the right SVG component
  const components: ComponentTemplate[] = config.components.map(c => ({
    id: c.id,
    label: c.type,  // This is now "Centrifugal Pump", "Feed Tank", etc. — specific names
    svgType: labelToSvgType(c.type),  // Maps label → SVG component type
  }))

  // Default to 'Process & Fluid' since Gemini doesn't know categories
  const category: MachineCategory = 'Process & Fluid'

  return {
    id: `custom-${Date.now()}`,
    name: config.machineType,
    description: `AI-generated ${config.machineType}`,
    category,
    icon: '⚙️',
    components,
    signals: config.signals.map(name => ({
      name,
      unit: getUnitForSignal(name),
      min: 0,
      max: 100,
      threshold: 80,
    })),
    controlSignals: config.controlSignals.map(name => ({
      id: name,
      name,
      type: 'control',
      defaultValue: 0,
    })),
    layout: {
      type: 'process_flow',
      processFlow: config.processFlow,
    },
    alarmRules: Object.entries(config.alarmThresholds).map(([signal, thresholds]) => ({
      signalId: signal,
      warningThreshold: thresholds.warning,
      criticalThreshold: thresholds.critical,
    })),
  }
}

function getUnitForSignal(signal: string): string {
  const units: Record<string, string> = {
    temperature: '°C',
    pressure: 'bar',
    flow: 'm³/h',
    rpm: 'rpm',
    vibration: 'mm/s',
    level: '%',
    voltage: 'V',
    current: 'A',
    humidity: '%',
  }
  return units[signal] || 'unit'
}
