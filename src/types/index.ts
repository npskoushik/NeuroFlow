export type Severity = 'critical' | 'warning' | 'ok' | 'info'
export type MachineStatus = 'online' | 'warning' | 'critical' | 'offline'
export type UserRole = 'operator' | 'engineer' | 'supervisor'

export interface Sensor {
  id: string
  name: string
  value: number
  unit: string
  min: number
  max: number
  threshold: number
  status: Severity
}

export interface Machine {
  id: string
  name: string
  type: string
  location: string
  status: MachineStatus
  healthScore: number
  uptime: number
  sensors: Sensor[]
  lastUpdated: string
}

export interface Alarm {
  id: string
  machineId: string
  machineName: string
  severity: Severity
  message: string
  sensorName: string
  value: number
  unit: string
  timestamp: string
  acknowledged: boolean
  aiInsight?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: string
}

export interface KPIData {
  criticalAlarms: number
  machinesOnline: number
  avgHealthScore: number
  uptime: number
}
