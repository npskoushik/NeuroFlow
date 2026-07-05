import { db, DB_PATHS, writeData, readData, updateData, deleteData, generateId, queryData } from './firebase'
import type { MachineTemplate, SignalTemplate } from '../data/machineTemplates'
import type { ChatMessage, Alarm } from '../types'

// ──────────────────────────────────────────────────────────────
// Machine Operations
// ──────────────────────────────────────────────────────────────

/**
 * Save/Create a new machine configuration
 */
export const saveMachine = async (machine: MachineTemplate, userId: string) => {
  const machineId = machine.id || generateId()
  const path = `${DB_PATHS.MACHINES}/${userId}/${machineId}`
  
  const machineData = {
    ...machine,
    id: machineId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastModifiedBy: userId,
  }

  const success = await writeData(path, machineData)
  return success ? machineId : null
}

/**
 * Load all machines for a user
 */
export const loadUserMachines = async (userId: string) => {
  const path = `${DB_PATHS.MACHINES}/${userId}`
  const machines = await readData(path)
  return machines ? Object.values(machines) : []
}

/**
 * Load a specific machine
 */
export const loadMachine = async (userId: string, machineId: string) => {
  const path = `${DB_PATHS.MACHINES}/${userId}/${machineId}`
  return await readData(path)
}

/**
 * Update machine configuration
 */
export const updateMachine = async (userId: string, machineId: string, updates: any) => {
  const path = `${DB_PATHS.MACHINES}/${userId}/${machineId}`
  return await updateData(path, {
    ...updates,
    updatedAt: Date.now(),
  })
}

/**
 * Delete a machine
 */
export const deleteMachine = async (userId: string, machineId: string) => {
  const path = `${DB_PATHS.MACHINES}/${userId}/${machineId}`
  return await deleteData(path)
}

// ──────────────────────────────────────────────────────────────
// Alarm Operations
// ──────────────────────────────────────────────────────────────

/**
 * Save a new alarm event
 */
export const saveAlarm = async (machineId: string, alarm: Alarm) => {
  const alarmId = alarm.id || generateId()
  const path = `${DB_PATHS.ALARMS}/${machineId}/${alarmId}`

  const alarmData = {
    ...alarm,
    id: alarmId,
    createdAt: Date.now(),
    timestamp: alarm.timestamp || new Date().toISOString(),
  }

  const success = await writeData(path, alarmData)
  return success ? alarmId : null
}

/**
 * Load all alarms for a machine
 */
export const loadMachineAlarms = async (machineId: string, limit = 100) => {
  const path = `${DB_PATHS.ALARMS}/${machineId}`
  const alarms = await readData(path)
  
  if (!alarms) return []
  
  // Sort by timestamp descending and limit
  const sorted = Object.values(alarms)
    .sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit)
  
  return sorted
}

/**
 * Acknowledge an alarm
 */
export const acknowledgeAlarm = async (machineId: string, alarmId: string) => {
  const path = `${DB_PATHS.ALARMS}/${machineId}/${alarmId}`
  return await updateData(path, {
    acknowledged: true,
    acknowledgedAt: Date.now(),
  })
}

/**
 * Get unacknowledged alarms count
 */
export const getUnacknowledgedCount = async (machineId: string) => {
  const alarms = await loadMachineAlarms(machineId)
  return alarms.filter((a: any) => !a.acknowledged).length
}

/**
 * Delete old alarms (cleanup)
 */
export const deleteAlarm = async (machineId: string, alarmId: string) => {
  const path = `${DB_PATHS.ALARMS}/${machineId}/${alarmId}`
  return await deleteData(path)
}

// ──────────────────────────────────────────────────────────────
// Chat History Operations
// ──────────────────────────────────────────────────────────────

/**
 * Save a chat message to database
 */
export const saveChatMessage = async (machineId: string, message: ChatMessage) => {
  const messageId = message.id || generateId()
  const path = `${DB_PATHS.CHAT_HISTORY}/${machineId}/${messageId}`

  const messageData = {
    ...message,
    id: messageId,
    savedAt: Date.now(),
  }

  const success = await writeData(path, messageData)
  return success ? messageId : null
}

/**
 * Load chat history for a machine
 */
export const loadChatHistory = async (machineId: string, limit = 50) => {
  const path = `${DB_PATHS.CHAT_HISTORY}/${machineId}`
  const messages = await readData(path)
  
  if (!messages) return []
  
  // Sort by timestamp ascending (oldest first) and limit
  const sorted = Object.values(messages)
    .sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .slice(-limit) // Get last N messages
  
  return sorted
}

/**
 * Clear all chat history for a machine
 */
export const clearChatHistory = async (machineId: string) => {
  const path = `${DB_PATHS.CHAT_HISTORY}/${machineId}`
  return await deleteData(path)
}

// ──────────────────────────────────────────────────────────────
// Settings/Session Operations
// ──────────────────────────────────────────────────────────────

/**
 * Save user session/preferences
 */
export const saveUserSession = async (userId: string, sessionData: any) => {
  const path = `${DB_PATHS.USER_SESSIONS}/${userId}`
  
  const data = {
    ...sessionData,
    lastSeen: Date.now(),
    updatedAt: Date.now(),
  }

  return await writeData(path, data)
}

/**
 * Load user session/preferences
 */
export const loadUserSession = async (userId: string) => {
  const path = `${DB_PATHS.USER_SESSIONS}/${userId}`
  return await readData(path)
}

/**
 * Save settings
 */
export const saveSettings = async (userId: string, machineId: string, settings: any) => {
  const path = `${DB_PATHS.SETTINGS}/${userId}/${machineId}`
  
  const data = {
    ...settings,
    updatedAt: Date.now(),
  }

  return await writeData(path, data)
}

/**
 * Load settings
 */
export const loadSettings = async (userId: string, machineId: string) => {
  const path = `${DB_PATHS.SETTINGS}/${userId}/${machineId}`
  return await readData(path)
}

// ──────────────────────────────────────────────────────────────
// Signal Limits/Configuration Storage
// ──────────────────────────────────────────────────────────────

/**
 * Save customized signal limits/thresholds
 */
export const saveSignalLimits = async (machineId: string, signalId: string, limits: any) => {
  const path = `${DB_PATHS.MACHINES}/${machineId}/signalLimits/${signalId}`
  return await writeData(path, {
    ...limits,
    updatedAt: Date.now(),
  })
}

/**
 * Load signal limits
 */
export const loadSignalLimits = async (machineId: string, signalId: string) => {
  const path = `${DB_PATHS.MACHINES}/${machineId}/signalLimits/${signalId}`
  return await readData(path)
}

/**
 * Save all signal limits for a machine at once
 */
export const saveAllSignalLimits = async (machineId: string, allLimits: Record<string, any>) => {
  const updates: Record<string, any> = {}
  
  Object.entries(allLimits).forEach(([signalId, limits]) => {
    updates[`machines/${machineId}/signalLimits/${signalId}`] = {
      ...limits,
      updatedAt: Date.now(),
    }
  })

  return await writeData('', updates) // Root write with multiple paths
}

// ──────────────────────────────────────────────────────────────
// Analytics/Metrics
// ──────────────────────────────────────────────────────────────

/**
 * Save equipment health metrics
 */
export const saveHealthMetrics = async (machineId: string, metrics: any) => {
  const path = `${DB_PATHS.MACHINES}/${machineId}/healthMetrics`
  return await updateData(path, {
    ...metrics,
    recordedAt: Date.now(),
  })
}

/**
 * Load health metrics
 */
export const loadHealthMetrics = async (machineId: string) => {
  const path = `${DB_PATHS.MACHINES}/${machineId}/healthMetrics`
  return await readData(path)
}

/**
 * Save predictive maintenance data
 */
export const savePredictiveData = async (machineId: string, prediction: any) => {
  const predictionId = generateId()
  const path = `${DB_PATHS.MACHINES}/${machineId}/predictions/${predictionId}`
  
  return await writeData(path, {
    ...prediction,
    id: predictionId,
    createdAt: Date.now(),
  })
}

/**
 * Load predictive maintenance history
 */
export const loadPredictions = async (machineId: string, limit = 20) => {
  const path = `${DB_PATHS.MACHINES}/${machineId}/predictions`
  const predictions = await readData(path)
  
  if (!predictions) return []
  
  const sorted = Object.values(predictions)
    .sort((a: any, b: any) => b.createdAt - a.createdAt)
    .slice(0, limit)
  
  return sorted
}
