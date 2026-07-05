import { useState, useEffect } from 'react'
import { initializeAuth } from './services/firebase'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import AIPanel from './components/layout/AIPanel'
import Dashboard from './pages/Dashboard'
import SetupWizard from './pages/SetupWizard'
import { useSimulator } from './hooks/useSimulator'
import { useFirebaseAlarms } from './hooks/useFirebase'
import type { MachineTemplate } from './data/machineTemplates'
import { autoMapSignalComponents } from './data/machineTemplates'
import { HighlightProvider } from './context/HighlightContext'

// Generate or retrieve user ID (persisted in localStorage)
const getUserId = () => {
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('userId', userId)
  }
  return userId
}

function AppShell({
  configuredMachine,
  onReset,
  userId,
}: {
  configuredMachine: MachineTemplate
  onReset: () => void
  userId: string
}) {
  const [role, setRole] = useState<string>('operator')
  const [activePage, setActivePage] = useState<string>('dashboard')
  const [aiCollapsed, setAiCollapsed] = useState<boolean>(false)

  const sim = useSimulator(configuredMachine)
  const { saveAlarm } = useFirebaseAlarms(configuredMachine.id || '')

  // Auto-save alarms when they occur
  useEffect(() => {
    if (sim.alarms.length > 0) {
      const latestAlarm = sim.alarms[0]
      saveAlarm({
        id: latestAlarm.id,
        machineId: configuredMachine.id,
        machineName: configuredMachine.name,
        severity: latestAlarm.severity,
        message: latestAlarm.message,
        sensorName: latestAlarm.signalName,
        value: latestAlarm.value,
        unit: latestAlarm.unit,
        timestamp: latestAlarm.timestamp,
        acknowledged: latestAlarm.acknowledged,
        aiInsight: latestAlarm.aiInsight,
      }).catch(err => console.error('Failed to save alarm:', err))
    }
  }, [sim.alarms, saveAlarm])

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard configuredMachine={configuredMachine} sim={sim} role={role} />
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-text-muted text-sm font-mono uppercase tracking-wider">{activePage}</p>
              <p className="text-text-secondary text-xs mt-1">Coming in next phase</p>
            </div>
          </div>
        )
    }
  }

  return (
    <HighlightProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-bg-base">
        <Navbar
          role={role}
          onRoleChange={setRole}
          machineName={configuredMachine.name}
          onReset={onReset}
          sim={sim}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activePage={activePage}
            onNavigate={setActivePage}
            unackedCount={sim.alarms.filter(a => !a.acknowledged).length}
          />
          <main className="flex-1 overflow-hidden bg-bg-base">{renderPage()}</main>

          <AIPanel
            collapsed={aiCollapsed}
            onToggle={() => setAiCollapsed(!aiCollapsed)}
            machine={configuredMachine}
            sim={sim}
          />
        </div>
      </div>
    </HighlightProvider>
  )
}

export default function App() {
  const [userId, setUserId] = useState<string>('')
  const [configuredMachine, setConfiguredMachine] = useState<MachineTemplate | null>(null)
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [firebaseStatus, setFirebaseStatus] = useState<'loading' | 'ready' | 'offline'>('loading')

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth()
        setUserId(getUserId())
        setFirebaseReady(true)
        setFirebaseStatus('ready')
      } catch (error) {
        console.error('Firebase init error:', error)
        setUserId(getUserId())
        setFirebaseReady(true)
        setFirebaseStatus('offline')
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (firebaseReady && userId) {
      const loadLastMachine = async () => {
        try {
          const lastMachineId = localStorage.getItem('lastMachineId')
          if (lastMachineId) {
            const savedMachineJson = localStorage.getItem(`machine_${lastMachineId}`)
            if (savedMachineJson) {
              const machine = JSON.parse(savedMachineJson)
              const mapped = autoMapSignalComponents(machine)
              setConfiguredMachine(mapped)
            }
          }
        } catch (error) {
          console.error('Failed to load last machine:', error)
        }
      }

      loadLastMachine()
    }
  }, [firebaseReady, userId])

  const handleComplete = (machine: MachineTemplate) => {
    const mapped = autoMapSignalComponents(machine)
    setConfiguredMachine(mapped)

    if (mapped.id) {
      localStorage.setItem('lastMachineId', mapped.id)
      localStorage.setItem(`machine_${mapped.id}`, JSON.stringify(mapped))
    }
  }

  if (!firebaseReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-base">
        <div className="text-center">
          <p className="text-text-secondary font-mono">Initializing NeuroFlow...</p>
        </div>
      </div>
    )
  }

  if (!configuredMachine) {
    return <SetupWizard onComplete={handleComplete} />
  }

  return (
    <AppShell
      configuredMachine={configuredMachine}
      onReset={() => setConfiguredMachine(null)}
      userId={userId}
    />
  )
}
