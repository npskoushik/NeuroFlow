// ============================================================
// DESTINATION: src/components/setup/ComponentLibraryPanel.tsx
// NEW FILE — create this in src/components/setup/
// ============================================================

import { useState, useMemo } from 'react'
import { Search, X, Plus, Check, ZoomIn, Eye } from 'lucide-react'
import clsx from 'clsx'
import type { ComponentTemplate } from '../../data/machineTemplates'

// ── Full component library with type tags for filtering ──────
export interface LibraryComponent extends ComponentTemplate {
  svgType: string   // maps to which schematic SVG to render
  category: string
  description: string
  emoji: string
}

const COMPONENT_LIBRARY: LibraryComponent[] = [
  // Pumps
  { id: 'pump_centrifugal', label: 'Centrifugal Pump', svgType: 'Pump', category: 'Pumps', description: 'High-flow centrifugal pump for liquid transfer', emoji: '🔄' },
  { id: 'pump_dosing', label: 'Dosing Pump', svgType: 'Pump', category: 'Pumps', description: 'Precision metering pump for chemicals', emoji: '💉' },
  { id: 'pump_gear', label: 'Gear Pump', svgType: 'Pump', category: 'Pumps', description: 'Positive displacement for viscous fluids', emoji: '⚙️' },
  { id: 'pump_submersible', label: 'Submersible Pump', svgType: 'Pump', category: 'Pumps', description: 'Submerged pump for tank draining', emoji: '🔄' },

  // Tanks & Vessels
  { id: 'tank_feed', label: 'Feed Tank', svgType: 'Tank', category: 'Vessels', description: 'Primary feed storage vessel', emoji: '🏺' },
  { id: 'tank_storage', label: 'Storage Tank', svgType: 'Tank', category: 'Vessels', description: 'Bulk liquid storage with level monitoring', emoji: '🛢️' },
  { id: 'tank_mixing', label: 'Mixing Tank', svgType: 'Tank', category: 'Vessels', description: 'Agitated vessel for blending', emoji: '🏺' },
  { id: 'tank_buffer', label: 'Buffer Tank', svgType: 'Tank', category: 'Vessels', description: 'Surge/buffer vessel for flow stabilization', emoji: '🫙' },
  { id: 'reactor_vessel', label: 'Reactor Vessel', svgType: 'Reactor', category: 'Vessels', description: 'Jacketed reaction vessel with controls', emoji: '⚗️' },
  { id: 'silo_unit', label: 'Silo', svgType: 'Silo', category: 'Vessels', description: 'Bulk solid storage silo', emoji: '🏗️' },

  // Valves
  { id: 'valve_inlet', label: 'Inlet Valve', svgType: 'Valve', category: 'Valves', description: 'On/off feed control valve', emoji: '🔧' },
  { id: 'valve_outlet', label: 'Outlet Valve', svgType: 'Valve', category: 'Valves', description: 'Discharge isolation valve', emoji: '🔧' },
  { id: 'valve_control', label: 'Control Valve', svgType: 'ControlValve', category: 'Valves', description: 'Modulating valve with actuator', emoji: '⚙️' },
  { id: 'valve_solenoid', label: 'Solenoid Valve', svgType: 'SolenoidValve', category: 'Valves', description: 'Electrically-operated quick shutoff', emoji: '⚡' },
  { id: 'valve_relief', label: 'Pressure Relief Valve', svgType: 'PressureRelief', category: 'Valves', description: 'Safety pressure relief device', emoji: '🛡️' },

  // Motors & Drives
  { id: 'motor_drive', label: 'Drive Motor', svgType: 'Motor', category: 'Drives', description: 'AC induction drive motor', emoji: '⚡' },
  { id: 'motor_servo', label: 'Servo Motor', svgType: 'Motor', category: 'Drives', description: 'Precision servo with encoder feedback', emoji: '🎯' },
  { id: 'motor_stepper', label: 'Stepper Motor', svgType: 'Motor', category: 'Drives', description: 'Step-controlled positioning motor', emoji: '🔩' },
  { id: 'vfd_unit', label: 'Variable Frequency Drive', svgType: 'VFD', category: 'Drives', description: 'VFD for speed control of AC motors', emoji: '📊' },
  { id: 'gearbox_unit', label: 'Gearbox', svgType: 'Gearbox', category: 'Drives', description: 'Speed reduction gearbox assembly', emoji: '⚙️' },

  // Conveying
  { id: 'conveyor_belt', label: 'Belt Conveyor', svgType: 'Conveyor', category: 'Conveying', description: 'Flat belt material conveyor', emoji: '🏭' },
  { id: 'conveyor_screw', label: 'Screw Conveyor', svgType: 'Conveyor', category: 'Conveying', description: 'Auger conveyor for bulk solids', emoji: '🌀' },
  { id: 'hopper_main', label: 'Hopper', svgType: 'Hopper', category: 'Conveying', description: 'Gravity-fed material hopper', emoji: '📦' },
  { id: 'hopper_vibro', label: 'Vibratory Feeder', svgType: 'Hopper', category: 'Conveying', description: 'Vibration-driven powder feeder', emoji: '〰️' },
  { id: 'pulley_head', label: 'Head Pulley', svgType: 'Pulley', category: 'Conveying', description: 'Drive pulley for conveyor system', emoji: '⭕' },

  // Heat & Process
  { id: 'boiler_unit', label: 'Boiler', svgType: 'Boiler', category: 'Heat & Process', description: 'Steam generation boiler', emoji: '🔥' },
  { id: 'heat_exchanger', label: 'Heat Exchanger', svgType: 'HeatExchanger', category: 'Heat & Process', description: 'Shell & tube heat exchanger', emoji: '♨️' },
  { id: 'chiller_unit', label: 'Chiller', svgType: 'Chiller', category: 'Heat & Process', description: 'Refrigeration-based liquid chiller', emoji: '❄️' },
  { id: 'cooling_tower', label: 'Cooling Tower', svgType: 'CoolingTower', category: 'Heat & Process', description: 'Evaporative cooling tower', emoji: '🗼' },
  { id: 'dryer_unit', label: 'Industrial Dryer', svgType: 'Dryer', category: 'Heat & Process', description: 'Rotary or spray dryer for solids', emoji: '💨' },

  // Air & Gas
  { id: 'compressor_air', label: 'Air Compressor', svgType: 'Compressor', category: 'Air & Gas', description: 'Reciprocating air compressor', emoji: '💨' },
  { id: 'compressor_screw', label: 'Screw Compressor', svgType: 'Compressor', category: 'Air & Gas', description: 'Rotary screw compressor for plant air', emoji: '🌀' },
  { id: 'fan_cooling', label: 'Cooling Fan', svgType: 'Fan', category: 'Air & Gas', description: 'Forced-air cooling fan', emoji: '🌬️' },
  { id: 'fan_exhaust', label: 'Exhaust Fan', svgType: 'Fan', category: 'Air & Gas', description: 'Ventilation exhaust fan', emoji: '💨' },
  { id: 'accumulator_unit', label: 'Pressure Accumulator', svgType: 'Accumulator', category: 'Air & Gas', description: 'Hydraulic/pneumatic accumulator', emoji: '🫙' },

  // Separators & Filtration
  { id: 'filter_strainer', label: 'Strainer Filter', svgType: 'Strainer', category: 'Filtration', description: 'Y-strainer for pipeline filtration', emoji: '🔹' },
  { id: 'filter_bag', label: 'Bag Filter', svgType: 'Filter', category: 'Filtration', description: 'Bag-type filter housing', emoji: '🎒' },
  { id: 'separator_unit', label: 'Separator', svgType: 'Separator', category: 'Filtration', description: 'Gas-liquid separator vessel', emoji: '🌪️' },
  { id: 'mixer_agitator', label: 'Agitator', svgType: 'Agitator', category: 'Mixing', description: 'Top-entry tank agitator', emoji: '🌀' },
  { id: 'mixer_inline', label: 'Inline Mixer', svgType: 'Mixer', category: 'Mixing', description: 'Static inline mixing element', emoji: '🌀' },

  // Instrumentation
  { id: 'gauge_pressure', label: 'Pressure Gauge', svgType: 'Gauge', category: 'Instruments', description: 'Analog pressure indicator', emoji: '🎯' },
  { id: 'sensor_temp', label: 'Temperature Sensor', svgType: 'SensorNode', category: 'Instruments', description: 'RTD/thermocouple temperature sensor', emoji: '🌡️' },
  { id: 'sensor_level', label: 'Level Sensor', svgType: 'SensorNode', category: 'Instruments', description: 'Ultrasonic or float level sensor', emoji: '📊' },
  { id: 'sensor_flow', label: 'Flow Meter', svgType: 'Flowmeter', category: 'Instruments', description: 'Magnetic or vortex flow meter', emoji: '〰️' },
  { id: 'encoder_unit', label: 'Encoder', svgType: 'Encoder', category: 'Instruments', description: 'Rotary encoder for position feedback', emoji: '📡' },
  { id: 'load_cell', label: 'Load Cell', svgType: 'LoadCell', category: 'Instruments', description: 'Weighing load cell', emoji: '⚖️' },

  // Manufacturing
  { id: 'cnc_machine', label: 'CNC Machine', svgType: 'CNCMachine', category: 'Manufacturing', description: 'CNC machining center', emoji: '⚙️' },
  { id: 'robot_arm', label: 'Robot Arm', svgType: 'RobotArm', category: 'Manufacturing', description: '6-axis industrial robot arm', emoji: '🦾' },
  { id: 'filling_station', label: 'Filling Station', svgType: 'FillingStation', category: 'Manufacturing', description: 'Automated product filling station', emoji: '🏭' },

  // Electrical
  { id: 'transformer_unit', label: 'Transformer', svgType: 'Transformer', category: 'Electrical', description: 'Power distribution transformer', emoji: '⚡' },
  { id: 'electric_panel', label: 'Electric Panel', svgType: 'ElectricPanel', category: 'Electrical', description: 'Motor control center panel', emoji: '🔌' },
  { id: 'alarm_beacon', label: 'Alarm Beacon', svgType: 'AlarmBeacon', category: 'Electrical', description: 'Visual alarm indicator beacon', emoji: '🚨' },
]

const CATEGORIES = ['All', ...Array.from(new Set(COMPONENT_LIBRARY.map(c => c.category)))]

// ── Mini SVG Previews for each type ─────────────────────────
function ComponentSVGPreview({ svgType, status = 'running', scale = 0.55 }: { svgType: string; status?: string; scale?: number }) {
  const color = status === 'running' ? '#00E676' : '#00D4FF'
  const dim = Math.round(120 * scale)

  const shapes: Record<string, JSX.Element> = {
    Pump: (
      <>
        <circle cx="60" cy="60" r="28" fill="none" stroke={color} strokeWidth="2" opacity="0.8" />
        <circle cx="60" cy="60" r="5" fill={color} />
        <path d="M60 53 C72 40 80 42 82 50 C74 51 68 55 63 60Z" fill={color} opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1.5s" repeatCount="indefinite" />
        </path>
        <path d="M60 67 C48 80 40 78 38 70 C46 69 52 65 57 60Z" fill={color} opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1.5s" repeatCount="indefinite" />
        </path>
        <line x1="20" y1="58" x2="32" y2="58" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <line x1="88" y1="58" x2="100" y2="58" stroke={color} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    Tank: (
      <>
        <rect x="30" y="20" width="60" height="75" rx="6" fill="none" stroke={color} strokeWidth="2" />
        <rect x="32" y="65" width="56" height="28" rx="2" fill={color} opacity="0.2">
          <animate attributeName="height" values="28;35;28" dur="3s" repeatCount="indefinite" />
          <animate attributeName="y" values="65;58;65" dur="3s" repeatCount="indefinite" />
        </rect>
        <line x1="55" y1="95" x2="55" y2="108" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <rect x="40" y="18" width="40" height="6" rx="2" fill={color} opacity="0.4" />
      </>
    ),
    Valve: (
      <>
        <polygon points="40,44 80,44 60,60" fill={color} opacity="0.7" />
        <polygon points="40,76 80,76 60,60" fill={color} opacity="0.7" />
        <line x1="10" y1="60" x2="40" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <line x1="80" y1="60" x2="110" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <line x1="60" y1="44" x2="60" y2="25" stroke={color} strokeWidth="3" />
        <rect x="50" y="18" width="20" height="9" rx="2" fill={color} opacity="0.6" />
      </>
    ),
    ControlValve: (
      <>
        <polygon points="38,42 82,42 60,60" fill={color} opacity="0.7" />
        <polygon points="38,78 82,78 60,60" fill={color} opacity="0.7" />
        <line x1="8" y1="60" x2="38" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <line x1="82" y1="60" x2="112" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <line x1="60" y1="42" x2="60" y2="28" stroke={color} strokeWidth="3" />
        <ellipse cx="60" cy="22" rx="14" ry="10" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
        <circle cx="60" cy="22" r="4" fill={color} opacity="0.8">
          <animate attributeName="cy" values="22;18;22" dur="2s" repeatCount="indefinite" />
        </circle>
      </>
    ),
    Motor: (
      <>
        <rect x="25" y="35" width="70" height="50" rx="6" fill="none" stroke={color} strokeWidth="2" />
        <rect x="95" y="47" width="18" height="26" rx="3" fill="none" stroke={color} strokeWidth="2" />
        <line x1="113" y1="60" x2="125" y2="60" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <circle cx="60" cy="60" r="14" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <path d="M56 54 L64 54 L68 60 L64 66 L56 66 L52 60 Z" fill={color} opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1s" repeatCount="indefinite" />
        </path>
      </>
    ),
    Conveyor: (
      <>
        <rect x="10" y="52" width="100" height="16" rx="3" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="22" cy="60" r="10" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="98" cy="60" r="10" fill="none" stroke={color} strokeWidth="2" />
        <rect x="30" y="50" width="14" height="20" rx="2" fill={color} opacity="0.5">
          <animateTransform attributeName="transform" type="translate" from="0" to="70 0" dur="2s" repeatCount="indefinite" />
        </rect>
        <circle cx="22" cy="60" r="4" fill={color} opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 22 60" to="360 22 60" dur="2s" repeatCount="indefinite" />
        </circle>
      </>
    ),
    Boiler: (
      <>
        <ellipse cx="60" cy="60" rx="35" ry="40" fill="none" stroke={color} strokeWidth="2" />
        <line x1="60" y1="20" x2="60" y2="8" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <circle cx="60" cy="8" r="3" fill={color} opacity="0.6">
          <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <path d="M42 72 Q55 60 42 50 Q55 40 42 30" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
      </>
    ),
    Fan: (
      <>
        <circle cx="60" cy="60" r="38" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
        <g>
          <ellipse cx="60" cy="38" rx="8" ry="16" fill={color} opacity="0.7" />
          <ellipse cx="60" cy="38" rx="8" ry="16" fill={color} opacity="0.7" transform="rotate(90 60 60)" />
          <ellipse cx="60" cy="38" rx="8" ry="16" fill={color} opacity="0.7" transform="rotate(180 60 60)" />
          <ellipse cx="60" cy="38" rx="8" ry="16" fill={color} opacity="0.7" transform="rotate(270 60 60)" />
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="0.8s" repeatCount="indefinite" />
        </g>
        <circle cx="60" cy="60" r="7" fill={color} />
      </>
    ),
    Compressor: (
      <>
        <rect x="25" y="35" width="70" height="50" rx="6" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="60" r="16" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <line x1="60" y1="44" x2="60" y2="50" stroke={color} strokeWidth="3">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="0.6s" repeatCount="indefinite" />
        </line>
        <line x1="60" y1="85" x2="60" y2="100" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="25" y1="60" x2="10" y2="60" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    Filter: (
      <>
        <rect x="35" y="20" width="50" height="80" rx="6" fill="none" stroke={color} strokeWidth="2" />
        <line x1="42" y1="40" x2="78" y2="40" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <line x1="42" y1="50" x2="78" y2="50" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <line x1="42" y1="60" x2="78" y2="60" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <line x1="42" y1="70" x2="78" y2="70" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <line x1="60" y1="0" x2="60" y2="20" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1="100" x2="60" y2="120" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    Strainer: (
      <>
        <path d="M25 45 L45 45 L60 75 L75 45 L95 45" fill="none" stroke={color} strokeWidth="2" />
        <rect x="45" y="45" width="30" height="35" rx="3" fill="none" stroke={color} strokeWidth="2" />
        <line x1="50" y1="55" x2="70" y2="55" stroke={color} strokeWidth="1" opacity="0.7" />
        <line x1="50" y1="63" x2="70" y2="63" stroke={color} strokeWidth="1" opacity="0.7" />
        <line x1="50" y1="71" x2="70" y2="71" stroke={color} strokeWidth="1" opacity="0.7" />
        <line x1="8" y1="45" x2="25" y2="45" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <line x1="95" y1="45" x2="112" y2="45" stroke={color} strokeWidth="7" strokeLinecap="round" />
      </>
    ),
    Hopper: (
      <>
        <polygon points="25,15 95,15 75,70 45,70" fill="none" stroke={color} strokeWidth="2" />
        <rect x="45" y="70" width="30" height="15" rx="3" fill="none" stroke={color} strokeWidth="2" />
        <line x1="60" y1="85" x2="60" y2="100" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <rect x="30" y="25" width="60" height="25" rx="2" fill={color} opacity="0.15" />
      </>
    ),
    Reactor: (
      <>
        <rect x="30" y="20" width="60" height="70" rx="8" fill="none" stroke={color} strokeWidth="2" />
        <ellipse cx="60" cy="90" rx="30" ry="12" fill="none" stroke={color} strokeWidth="2" />
        <line x1="60" y1="20" x2="60" y2="8" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="60" y1="40" x2="60" y2="75" stroke={color} strokeWidth="2">
          <animateTransform attributeName="transform" type="rotate" from="0 60 55" to="360 60 55" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="45" y1="55" x2="75" y2="55" stroke={color} strokeWidth="2">
          <animateTransform attributeName="transform" type="rotate" from="0 60 55" to="360 60 55" dur="2s" repeatCount="indefinite" />
        </line>
      </>
    ),
    Mixer: (
      <>
        <line x1="60" y1="10" x2="60" y2="90" stroke={color} strokeWidth="3" />
        <line x1="35" y1="45" x2="85" y2="45" stroke={color} strokeWidth="3" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 60 55" to="360 60 55" dur="1.5s" repeatCount="indefinite" />
        </line>
        <line x1="40" y1="65" x2="80" y2="65" stroke={color} strokeWidth="3" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 60 55" to="360 60 55" dur="1.5s" repeatCount="indefinite" />
        </line>
        <circle cx="60" cy="20" r="8" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="90" r="5" fill={color} opacity="0.5" />
      </>
    ),
    Agitator: (
      <>
        <rect x="50" y="10" width="20" height="20" rx="3" fill="none" stroke={color} strokeWidth="2" />
        <line x1="60" y1="30" x2="60" y2="55" stroke={color} strokeWidth="3" />
        <line x1="30" y1="55" x2="90" y2="55" stroke={color} strokeWidth="3">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1.2s" repeatCount="indefinite" />
        </line>
        <line x1="35" y1="70" x2="85" y2="70" stroke={color} strokeWidth="2.5">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="-360 60 60" dur="1.2s" repeatCount="indefinite" />
        </line>
      </>
    ),
    SensorNode: (
      <>
        <circle cx="60" cy="55" r="20" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="55" r="8" fill={color} opacity="0.6" />
        <circle cx="60" cy="55" r="30" fill="none" stroke={color} strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values="20;35;20" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="60" y1="35" x2="60" y2="20" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <rect x="45" y="15" width="30" height="8" rx="2" fill={color} opacity="0.4" />
      </>
    ),
    Gauge: (
      <>
        <circle cx="60" cy="60" r="35" fill="none" stroke={color} strokeWidth="2" />
        <path d="M32 75 A35 35 0 1 1 88 75" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
        <line x1="60" y1="60" x2="40" y2="42" stroke={color} strokeWidth="3" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="-30 60 60" to="30 60 60" dur="3s" repeatCount="indefinite" additive="sum" />
        </line>
        <circle cx="60" cy="60" r="4" fill={color} />
        <line x1="60" y1="30" x2="60" y2="25" stroke={color} strokeWidth="2" />
        <line x1="82" y1="38" x2="86" y2="34" stroke={color} strokeWidth="2" />
        <line x1="38" y1="38" x2="34" y2="34" stroke={color} strokeWidth="2" />
      </>
    ),
    Flowmeter: (
      <>
        <line x1="10" y1="60" x2="110" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <rect x="35" y="42" width="50" height="36" rx="6" fill="#0D1421" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="60" r="12" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <circle cx="60" cy="60" r="4" fill={color} opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1s" repeatCount="indefinite" />
        </circle>
      </>
    ),
    HeatExchanger: (
      <>
        <rect x="20" y="35" width="80" height="50" rx="5" fill="none" stroke={color} strokeWidth="2" />
        <line x1="30" y1="45" x2="30" y2="75" stroke="#FF6B6B" strokeWidth="2.5" />
        <line x1="42" y1="45" x2="42" y2="75" stroke={color} strokeWidth="2.5" />
        <line x1="54" y1="45" x2="54" y2="75" stroke="#FF6B6B" strokeWidth="2.5" />
        <line x1="66" y1="45" x2="66" y2="75" stroke={color} strokeWidth="2.5" />
        <line x1="78" y1="45" x2="78" y2="75" stroke="#FF6B6B" strokeWidth="2.5" />
        <line x1="90" y1="45" x2="90" y2="75" stroke={color} strokeWidth="2.5" />
        <line x1="8" y1="40" x2="20" y2="40" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="8" y1="80" x2="20" y2="80" stroke="#FF6B6B" strokeWidth="5" strokeLinecap="round" />
        <line x1="100" y1="40" x2="112" y2="40" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="100" y1="80" x2="112" y2="80" stroke="#FF6B6B" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    Chiller: (
      <>
        <rect x="20" y="25" width="80" height="70" rx="6" fill="none" stroke="#64B5F6" strokeWidth="2" />
        <path d="M40 55 L60 40 L80 55 L80 75 L40 75Z" fill="none" stroke="#64B5F6" strokeWidth="1.5" opacity="0.6" />
        <circle cx="60" cy="57" r="10" fill="none" stroke="#64B5F6" strokeWidth="2" opacity="0.8">
          <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="60" y="110" textAnchor="middle" fill="#64B5F6" fontSize="11" fontFamily="monospace">❄ CHILLER</text>
      </>
    ),
    CoolingTower: (
      <>
        <path d="M30 100 L25 20 L95 20 L90 100Z" fill="none" stroke={color} strokeWidth="2" />
        <line x1="35" y1="60" x2="85" y2="60" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <line x1="28" y1="80" x2="92" y2="80" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <circle cx="50" cy="40" r="3" fill={color} opacity="0.7">
          <animate attributeName="cy" values="40;15;40" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="45" r="3" fill={color} opacity="0.7">
          <animate attributeName="cy" values="45;15;45" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </>
    ),
    Dryer: (
      <>
        <ellipse cx="60" cy="60" rx="40" ry="35" fill="none" stroke={color} strokeWidth="2" />
        <ellipse cx="60" cy="60" rx="28" ry="24" fill="none" stroke={color} strokeWidth="1" opacity="0.4">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="3s" repeatCount="indefinite" />
        </ellipse>
        <line x1="10" y1="60" x2="20" y2="60" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="100" y1="60" x2="110" y2="60" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    VFD: (
      <>
        <rect x="20" y="20" width="80" height="80" rx="6" fill="none" stroke={color} strokeWidth="2" />
        <rect x="30" y="30" width="60" height="35" rx="3" fill={color} opacity="0.08" />
        <line x1="35" y1="50" x2="35" y2="58" stroke={color} strokeWidth="2" />
        <line x1="45" y1="40" x2="45" y2="58" stroke={color} strokeWidth="2" />
        <line x1="55" y1="45" x2="55" y2="58" stroke={color} strokeWidth="2" />
        <line x1="65" y1="35" x2="65" y2="58" stroke={color} strokeWidth="2" />
        <line x1="75" y1="42" x2="75" y2="58" stroke={color} strokeWidth="2" />
        <rect x="30" y="75" width="60" height="16" rx="3" fill={color} opacity="0.15" />
      </>
    ),
    Gearbox: (
      <>
        <rect x="25" y="35" width="70" height="50" rx="5" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="48" cy="60" r="14" fill="none" stroke={color} strokeWidth="1.5">
          <animateTransform attributeName="transform" type="rotate" from="0 48 60" to="360 48 60" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="48" cy="60" r="5" fill={color} opacity="0.5" />
        <circle cx="78" cy="60" r="10" fill="none" stroke={color} strokeWidth="1.5">
          <animateTransform attributeName="transform" type="rotate" from="0 78 60" to="-360 78 60" dur="1.43s" repeatCount="indefinite" />
        </circle>
        <circle cx="78" cy="60" r="4" fill={color} opacity="0.5" />
        <line x1="5" y1="60" x2="25" y2="60" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="95" y1="60" x2="115" y2="60" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    Accumulator: (
      <>
        <ellipse cx="60" cy="30" rx="30" ry="15" fill="none" stroke={color} strokeWidth="2" />
        <rect x="30" y="30" width="60" height="60" fill="none" stroke={color} strokeWidth="2" />
        <ellipse cx="60" cy="90" rx="30" ry="15" fill="none" stroke={color} strokeWidth="2" />
        <line x1="30" y1="60" x2="90" y2="60" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="4 3" />
        <circle cx="60" cy="60" r="6" fill={color} opacity="0.4">
          <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="60" y1="105" x2="60" y2="120" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    Separator: (
      <>
        <rect x="30" y="20" width="60" height="80" rx="6" fill="none" stroke={color} strokeWidth="2" />
        <line x1="30" y1="65" x2="90" y2="65" stroke={color} strokeWidth="1" opacity="0.5" strokeDasharray="4 3" />
        <circle cx="55" cy="45" r="5" fill={color} opacity="0.4">
          <animate attributeName="cy" values="45;38;45" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="50" r="4" fill={color} opacity="0.3">
          <animate attributeName="cy" values="50;40;50" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <rect x="33" y="68" width="54" height="29" rx="3" fill={color} opacity="0.1" />
        <line x1="10" y1="35" x2="30" y2="35" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="90" y1="35" x2="110" y2="35" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1="100" x2="60" y2="115" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    Silo: (
      <>
        <rect x="30" y="15" width="60" height="65" rx="3" fill="none" stroke={color} strokeWidth="2" />
        <polygon points="30,80 90,80 75,105 45,105" fill="none" stroke={color} strokeWidth="2" />
        <line x1="60" y1="105" x2="60" y2="118" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <rect x="33" y="18" width="54" height="35" rx="2" fill={color} opacity="0.12" />
        <line x1="30" y1="18" x2="90" y2="18" stroke={color} strokeWidth="3" opacity="0.5" />
      </>
    ),
    SolenoidValve: (
      <>
        <polygon points="38,42 82,42 60,60" fill={color} opacity="0.7" />
        <polygon points="38,78 82,78 60,60" fill={color} opacity="0.7" />
        <line x1="8" y1="60" x2="38" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <line x1="82" y1="60" x2="112" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <rect x="48" y="28" width="24" height="18" rx="3" fill="none" stroke={color} strokeWidth="2" />
        <line x1="55" y1="32" x2="65" y2="32" stroke={color} strokeWidth="1.5" />
        <line x1="55" y1="37" x2="65" y2="37" stroke={color} strokeWidth="1.5" />
        <line x1="55" y1="42" x2="65" y2="42" stroke={color} strokeWidth="1.5" />
      </>
    ),
    PressureRelief: (
      <>
        <polygon points="38,42 82,42 60,60" fill={color} opacity="0.7" />
        <polygon points="38,78 82,78 60,60" fill={color} opacity="0.7" />
        <line x1="8" y1="60" x2="38" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <line x1="82" y1="60" x2="112" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <line x1="60" y1="42" x2="60" y2="25" stroke={color} strokeWidth="3" />
        <path d="M50 18 Q60 8 70 18" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="25" r="3" fill={color} opacity="0.8" />
      </>
    ),
    RobotArm: (
      <>
        <rect x="45" y="90" width="30" height="12" rx="3" fill={color} opacity="0.5" />
        <line x1="60" y1="90" x2="60" y2="72" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1="72" x2="82" y2="52" stroke={color} strokeWidth="4" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="-10 60 72" to="10 60 72" dur="2s" repeatCount="indefinite" additive="sum" />
        </line>
        <line x1="82" y1="52" x2="70" y2="30" stroke={color} strokeWidth="3" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="5 82 52" to="-5 82 52" dur="1.5s" repeatCount="indefinite" additive="sum" />
        </line>
        <circle cx="60" cy="72" r="5" fill={color} opacity="0.8" />
        <circle cx="82" cy="52" r="4" fill={color} opacity="0.7" />
        <circle cx="70" cy="30" r="4" fill={color} opacity="0.6" />
      </>
    ),
    CNCMachine: (
      <>
        <rect x="15" y="25" width="90" height="75" rx="5" fill="none" stroke={color} strokeWidth="2" />
        <rect x="25" y="35" width="70" height="50" rx="3" fill={color} opacity="0.05" />
        <circle cx="60" cy="60" r="8" fill="none" stroke={color} strokeWidth="2" />
        <line x1="60" y1="45" x2="60" y2="52" stroke={color} strokeWidth="4" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="0.5s" repeatCount="indefinite" />
        </line>
        <line x1="60" y1="60" x2="60" y2="78" stroke={color} strokeWidth="2" />
        <rect x="55" y="78" width="10" height="6" rx="1" fill={color} opacity="0.6" />
      </>
    ),
    FillingStation: (
      <>
        <rect x="15" y="15" width="90" height="80" rx="5" fill="none" stroke={color} strokeWidth="2" />
        <line x1="60" y1="30" x2="60" y2="55" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <rect x="48" y="55" width="24" height="30" rx="3" fill="none" stroke={color} strokeWidth="2" />
        <rect x="52" y="58" width="16" height="20" rx="2" fill={color} opacity="0.3">
          <animate attributeName="height" values="5;20;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="y" values="73;58;73" dur="2s" repeatCount="indefinite" />
        </rect>
      </>
    ),
    Transformer: (
      <>
        <rect x="20" y="20" width="80" height="80" rx="5" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="43" cy="60" r="20" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
        <circle cx="77" cy="60" r="20" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
        <line x1="20" y1="48" x2="8" y2="48" stroke={color} strokeWidth="3" />
        <line x1="20" y1="60" x2="8" y2="60" stroke={color} strokeWidth="3" />
        <line x1="20" y1="72" x2="8" y2="72" stroke={color} strokeWidth="3" />
        <line x1="100" y1="55" x2="112" y2="55" stroke={color} strokeWidth="3" />
        <line x1="100" y1="65" x2="112" y2="65" stroke={color} strokeWidth="3" />
      </>
    ),
    ElectricPanel: (
      <>
        <rect x="20" y="15" width="80" height="90" rx="4" fill="none" stroke={color} strokeWidth="2" />
        <rect x="28" y="25" width="64" height="50" rx="2" fill={color} opacity="0.07" />
        <circle cx="40" cy="38" r="5" fill="#FF3B3B" opacity="0.8" />
        <circle cx="60" cy="38" r="5" fill="#FFB800" opacity="0.8" />
        <circle cx="80" cy="38" r="5" fill={color} opacity="0.8" />
        <rect x="32" y="52" width="56" height="4" rx="2" fill={color} opacity="0.4" />
        <rect x="32" y="62" width="40" height="4" rx="2" fill={color} opacity="0.4" />
        <rect x="32" y="72" width="50" height="4" rx="2" fill={color} opacity="0.4" />
        <rect x="35" y="88" width="50" height="10" rx="2" fill={color} opacity="0.2" />
      </>
    ),
    AlarmBeacon: (
      <>
        <rect x="45" y="75" width="30" height="25" rx="3" fill="none" stroke={color} strokeWidth="2" />
        <line x1="60" y1="75" x2="60" y2="55" stroke={color} strokeWidth="3" />
        <circle cx="60" cy="45" r="18" fill="#FF3B3B" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.15;0.6" dur="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="45" r="28" fill="none" stroke="#FF3B3B" strokeWidth="1.5" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0;0.4" dur="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="45" r="10" fill="#FF3B3B" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.8s" repeatCount="indefinite" />
        </circle>
      </>
    ),
    Pulley: (
      <>
        <circle cx="60" cy="60" r="35" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="60" r="22" fill="none" stroke={color} strokeWidth="3" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="60" r="6" fill={color} />
        <line x1="60" y1="38" x2="60" y2="30" stroke={color} strokeWidth="2">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="2s" repeatCount="indefinite" />
        </line>
      </>
    ),
    Encoder: (
      <>
        <circle cx="60" cy="60" r="30" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="60" r="8" fill={color} opacity="0.6" />
        {[0,45,90,135,180,225,270,315].map((a, i) => (
          <line key={i} x1={60 + 20*Math.cos(a*Math.PI/180)} y1={60 + 20*Math.sin(a*Math.PI/180)}
            x2={60 + 28*Math.cos(a*Math.PI/180)} y2={60 + 28*Math.sin(a*Math.PI/180)}
            stroke={color} strokeWidth="2" opacity="0.7" />
        ))}
        <line x1="60" y1="60" x2="82" y2="48" stroke={color} strokeWidth="2" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1s" repeatCount="indefinite" />
        </line>
        <line x1="60" y1="90" x2="60" y2="105" stroke={color} strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    LoadCell: (
      <>
        <rect x="30" y="30" width="60" height="60" rx="5" fill="none" stroke={color} strokeWidth="2" />
        <line x1="40" y1="55" x2="80" y2="55" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <line x1="40" y1="65" x2="80" y2="65" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <path d="M45 55 Q60 45 75 55" fill="none" stroke={color} strokeWidth="2" opacity="0.8">
          <animate attributeName="d" values="M45 55 Q60 45 75 55;M45 55 Q60 50 75 55;M45 55 Q60 45 75 55" dur="3s" repeatCount="indefinite" />
        </path>
        <line x1="60" y1="30" x2="60" y2="15" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1="90" x2="60" y2="105" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  }

  const shape = shapes[svgType] ?? shapes['SensorNode']

  return (
    <svg viewBox="0 0 120 120" width={dim} height={dim} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={`glow-${svgType}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#glow-${svgType})`}>
        {shape}
      </g>
    </svg>
  )
}

// ── Main Component Library Panel ─────────────────────────────
interface ComponentLibraryPanelProps {
  addedIds: Set<string>
  onAdd: (comp: LibraryComponent) => void
  onRemove: (id: string) => void
}

export default function ComponentLibraryPanel({ addedIds, onAdd, onRemove }: ComponentLibraryPanelProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [preview, setPreview] = useState<LibraryComponent | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return COMPONENT_LIBRARY.filter(c => {
      const matchCat = activeCategory === 'All' || c.category === activeCategory
      const matchSearch = !q || c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [search, activeCategory])

  return (
    <div className="space-y-3">
      {/* Search + filter */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full bg-bg-base border border-bg-border rounded-lg pl-8 pr-3 py-2 text-xs text-text-secondary placeholder:text-text-muted outline-none focus:border-brand-cyan/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
              <X size={11} />
            </button>
          )}
        </div>
        {/* Category pills */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={clsx('text-[10px] px-2 py-0.5 rounded-full border transition-all', 
                activeCategory === cat
                  ? 'border-brand-cyan/50 bg-brand-cyan/15 text-brand-cyan'
                  : 'border-bg-border text-text-muted hover:border-brand-cyan/30 hover:text-brand-cyan'
              )}>
              {cat}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-text-muted font-mono">{filtered.length} components</p>
      </div>

      {/* Grid — 5 per row */}
      <div className="grid gap-2 max-h-[360px] overflow-y-auto pr-1"
        style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        {filtered.map(comp => {
          const added = addedIds.has(comp.id)
          return (
            <div key={comp.id}
              className={clsx(
                'relative group rounded-xl border transition-all cursor-pointer flex flex-col items-center py-3 px-1 gap-1.5',
                added
                  ? 'border-brand-cyan/50 bg-brand-cyan/10'
                  : 'border-bg-border bg-bg-base hover:border-brand-cyan/30 hover:bg-brand-cyan/5'
              )}>
              {/* SVG preview */}
              <div className="w-full flex items-center justify-center h-14 pointer-events-none">
                <ComponentSVGPreview svgType={comp.svgType} status={added ? 'running' : 'idle'} scale={0.5} />
              </div>

              {/* Label */}
              <p className="text-[9px] text-center text-text-secondary leading-tight line-clamp-2 font-medium">{comp.label}</p>

              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-xl bg-bg-base/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                <button onClick={() => setPreview(comp)}
                  className="flex items-center gap-1 text-[9px] text-brand-cyan border border-brand-cyan/30 rounded-md px-2 py-1 hover:bg-brand-cyan/15 transition-colors">
                  <Eye size={9} /> Preview
                </button>
                {added ? (
                  <button onClick={() => onRemove(comp.id)}
                    className="flex items-center gap-1 text-[9px] text-status-ok border border-status-ok/30 rounded-md px-2 py-1 hover:bg-status-ok/15 transition-colors">
                    <Check size={9} /> Added
                  </button>
                ) : (
                  <button onClick={() => onAdd(comp)}
                    className="flex items-center gap-1 text-[9px] text-brand-cyan border border-brand-cyan/30 rounded-md px-2 py-1 hover:bg-brand-cyan/15 transition-colors">
                    <Plus size={9} /> Add
                  </button>
                )}
              </div>

              {/* Added badge */}
              {added && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-status-ok flex items-center justify-center">
                  <Check size={8} className="text-bg-base" />
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-5 py-8 text-center text-xs text-text-muted">
            No components match "{search}"
          </div>
        )}
      </div>

      {/* Preview popup */}
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-base/80 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setPreview(null) }}>
          <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-bg-border">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{preview.emoji}</span>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{preview.label}</h3>
                  <p className="text-[10px] text-brand-cyan font-mono">{preview.category}</p>
                </div>
              </div>
              <button onClick={() => setPreview(null)} className="w-7 h-7 rounded-lg border border-bg-border flex items-center justify-center text-text-muted hover:text-text-secondary">
                <X size={13} />
              </button>
            </div>

            {/* Zoomable SVG */}
            <div className="flex items-center justify-center bg-bg-base py-8">
              <div className="relative">
                <ComponentSVGPreview svgType={preview.svgType} status="running" scale={1.8} />
                <div className="absolute top-2 right-2 text-[9px] text-text-muted flex items-center gap-0.5">
                  <ZoomIn size={9} /> Live animation
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed">{preview.description}</p>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-text-muted font-mono">SVG Component: <span className="text-brand-cyan">{preview.svgType}</span></span>
                <span className="text-text-muted font-mono">ID: {preview.id}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setPreview(null)} className="flex-1 h-9 rounded-lg border border-bg-border text-xs text-text-muted hover:text-text-secondary">
                  Close
                </button>
                {addedIds.has(preview.id) ? (
                  <button onClick={() => { onRemove(preview.id); setPreview(null) }}
                    className="flex-1 h-9 rounded-lg border border-status-ok/30 bg-status-ok/10 text-xs text-status-ok font-semibold flex items-center justify-center gap-1.5">
                    <Check size={12} /> Added — Remove
                  </button>
                ) : (
                  <button onClick={() => { onAdd(preview); setPreview(null) }}
                    className="flex-1 h-9 rounded-lg bg-brand-cyan text-bg-base text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Plus size={12} /> Add to Machine
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
