import { useState, useEffect, useCallback } from 'react'
import * as firebaseDB from "../services/firebaseDatabase"
import type { MachineTemplate } from '../data/machineTemplates'
import type { ChatMessage, Alarm } from '../types'

// ──────────────────────────────────────────────────────────────
// Machine Hook
// ──────────────────────────────────────────────────────────────

export const useFirebaseMachines = (userId: string) => {
  const [machines, setMachines] = useState<MachineTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all machines
  useEffect(() => {
    const loadMachines = async () => {
      try {
        setLoading(true)
        const data = await firebaseDB.loadUserMachines(userId)
        setMachines(data as MachineTemplate[])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load machines')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadMachines()
    }
  }, [userId])

  // Save machine
  const saveMachine = useCallback(async (machine: MachineTemplate) => {
    try {
      const id = await firebaseDB.saveMachine(machine, userId)
      if (id) {
        setMachines(prev => [...prev.filter(m => m.id !== id), { ...machine, id }])
        return id
      }
      throw new Error('Failed to save machine')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving machine')
      return null
    }
  }, [userId])

  // Delete machine
  const deleteMachine = useCallback(async (machineId: string) => {
    try {
      const success = await firebaseDB.deleteMachine(userId, machineId)
      if (success) {
        setMachines(prev => prev.filter(m => m.id !== machineId))
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting machine')
      return false
    }
  }, [userId])

  return { machines, loading, error, saveMachine, deleteMachine }
}

// ──────────────────────────────────────────────────────────────
// Alarms Hook
// ──────────────────────────────────────────────────────────────

export const useFirebaseAlarms = (machineId: string, pollInterval = 5000) => {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load alarms on mount and poll
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const loadAlarms = async () => {
      try {
        const data = await firebaseDB.loadMachineAlarms(machineId)
        setAlarms(data as Alarm[])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alarms')
      } finally {
        setLoading(false)
      }
    }

    if (machineId) {
      loadAlarms()
      // Poll for new alarms
      intervalId = setInterval(loadAlarms, pollInterval)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [machineId, pollInterval])

  // Save alarm
  const saveAlarm = useCallback(async (alarm: Alarm) => {
    try {
      const id = await firebaseDB.saveAlarm(machineId, alarm)
      if (id) {
        setAlarms(prev => [{ ...alarm, id }, ...prev])
        return id
      }
      throw new Error('Failed to save alarm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving alarm')
      return null
    }
  }, [machineId])

  // Acknowledge alarm
  const acknowledgeAlarm = useCallback(async (alarmId: string) => {
    try {
      const success = await firebaseDB.acknowledgeAlarm(machineId, alarmId)
      if (success) {
        setAlarms(prev =>
          prev.map(a => a.id === alarmId ? { ...a, acknowledged: true } : a)
        )
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error acknowledging alarm')
      return false
    }
  }, [machineId])

  // Delete alarm
  const deleteAlarm = useCallback(async (alarmId: string) => {
    try {
      const success = await firebaseDB.deleteAlarm(machineId, alarmId)
      if (success) {
        setAlarms(prev => prev.filter(a => a.id !== alarmId))
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting alarm')
      return false
    }
  }, [machineId])

  const unacknowledgedCount = alarms.filter(a => !a.acknowledged).length

  return {
    alarms,
    loading,
    error,
    unacknowledgedCount,
    saveAlarm,
    acknowledgeAlarm,
    deleteAlarm,
  }
}

// ──────────────────────────────────────────────────────────────
// Chat History Hook
// ──────────────────────────────────────────────────────────────

export const useFirebaseChatHistory = (machineId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load chat history
  useEffect(() => {
    const loadChat = async () => {
      try {
        setLoading(true)
        const data = await firebaseDB.loadChatHistory(machineId)
        setMessages(data as ChatMessage[])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat history')
      } finally {
        setLoading(false)
      }
    }

    if (machineId) {
      loadChat()
    }
  }, [machineId])

  // Add message
  const addMessage = useCallback(async (message: ChatMessage) => {
    try {
      const id = await firebaseDB.saveChatMessage(machineId, message)
      if (id) {
        setMessages(prev => [...prev, { ...message, id }])
        return id
      }
      throw new Error('Failed to save message')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving message')
      return null
    }
  }, [machineId])

  // Clear history
  const clearHistory = useCallback(async () => {
    try {
      const success = await firebaseDB.clearChatHistory(machineId)
      if (success) {
        setMessages([])
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error clearing history')
      return false
    }
  }, [machineId])

  return { messages, loading, error, addMessage, clearHistory }
}

// ──────────────────────────────────────────────────────────────
// User Session Hook
// ──────────────────────────────────────────────────────────────

export const useFirebaseSession = (userId: string) => {
  const [session, setSession] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await firebaseDB.loadUserSession(userId)
        setSession(data)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadSession()
    }
  }, [userId])

  const updateSession = useCallback(async (updates: any) => {
    try {
      const success = await firebaseDB.saveUserSession(userId, {
        ...session,
        ...updates,
      })
      if (success) {
        setSession(prev => ({ ...(prev ?? {}), ...updates }))
      }
      return success
    } catch (err) {
      console.error('Error updating session:', err)
      return false
    }
  }, [userId, session])

  return { session, loading, updateSession }
}

// ──────────────────────────────────────────────────────────────
// Settings Hook
// ──────────────────────────────────────────────────────────────

export const useFirebaseSettings = (userId: string, machineId: string) => {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await firebaseDB.loadSettings(userId, machineId)
        setSettings(data || {})
      } finally {
        setLoading(false)
      }
    }

    if (userId && machineId) {
      loadSettings()
    }
  }, [userId, machineId])

  const updateSettings = useCallback(async (updates: any) => {
    try {
      const success = await firebaseDB.saveSettings(userId, machineId, {
        ...settings,
        ...updates,
      })
      if (success) {
        setSettings(prev => ({ ...(prev ?? {}), ...updates }))
      }
      return success
    } catch (err) {
      console.error('Error updating settings:', err)
      return false
    }
  }, [userId, machineId, settings])

  return { settings, loading, updateSettings }
}

// ──────────────────────────────────────────────────────────────
// Health Metrics Hook
// ──────────────────────────────────────────────────────────────

export const useFirebaseHealthMetrics = (machineId: string) => {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await firebaseDB.loadHealthMetrics(machineId)
        setMetrics(data)
      } finally {
        setLoading(false)
      }
    }

    if (machineId) {
      loadMetrics()
    }
  }, [machineId])

  const updateMetrics = useCallback(async (newMetrics: any) => {
    try {
      const success = await firebaseDB.saveHealthMetrics(machineId, newMetrics)
      if (success) {
        setMetrics(newMetrics)
      }
      return success
    } catch (err) {
      console.error('Error updating metrics:', err)
      return false
    }
  }, [machineId])

  return { metrics, loading, updateMetrics }
}

// ──────────────────────────────────────────────────────────────
// Predictive Maintenance Hook
// ──────────────────────────────────────────────────────────────

export const useFirebasePredictions = (machineId: string) => {
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPreds = async () => {
      try {
        const data = await firebaseDB.loadPredictions(machineId)
        setPredictions(data)
      } finally {
        setLoading(false)
      }
    }

    if (machineId) {
      loadPreds()
    }
  }, [machineId])

  const addPrediction = useCallback(async (prediction: any) => {
    try {
      const id = await firebaseDB.savePredictiveData(machineId, prediction)
      if (id) {
        setPredictions(prev => [{ ...prediction, id }, ...prev])
        return id
      }
      return null
    } catch (err) {
      console.error('Error saving prediction:', err)
      return null
    }
  }, [machineId])

  return { predictions, loading, addPrediction }
}
