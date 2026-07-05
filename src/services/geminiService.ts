// ============================================================
// DESTINATION: src/services/geminiService.ts
// REPLACE entire file
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SimAlarm, LiveSignal, TrendPoint } from '../hooks/useSimulator'
import type { MachineTemplate } from '../data/machineTemplates'

let genAI: GoogleGenerativeAI | null = null

function getClient() {
  if (!genAI) {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
    if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY not set in .env')
    genAI = new GoogleGenerativeAI(API_KEY)
  }
  return genAI
}

function getModel() {
  return getClient().getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
}

// ── Cache ────────────────────────────────────────────────────
const cache = new Map<string, { result: string; at: number }>()
const CACHE_TTL = 60_000

function getCached(key: string): string | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL) { cache.delete(key); return null }
  return hit.result
}
function setCached(key: string, result: string) {
  cache.set(key, { result, at: Date.now() })
}

// ── Full System Context Builder ──────────────────────────────
// This is the key upgrade: AI now knows EVERYTHING about the system
export interface FullSystemContext {
  // Machine identity
  machine: MachineTemplate

  // Live sim state
  signals: LiveSignal[]
  alarms: SimAlarm[]
  trendHistory: TrendPoint[]
  running: boolean
  mode: 'Auto' | 'Manual' | 'Hold'
  healthScore: number
  uptime: number
  lastUpdated: string

  // Controls state
  componentControls: Record<string, Record<string, number>>
  signalLimits: Record<string, { min: number; max: number }>
}

function buildSystemPrompt(ctx: FullSystemContext): string {
  const { machine, signals, alarms, trendHistory, running, mode, healthScore, uptime, componentControls, signalLimits } = ctx

  // ── Machine identity ──
  const machineInfo = `
MACHINE: ${machine.name} (${machine.category})
STATUS: ${running ? `Running — Mode: ${mode}` : 'STOPPED'}
HEALTH SCORE: ${healthScore}% | UPTIME: ${uptime}%
`

  // ── Components with their current control values ──
  const componentInfo = machine.components.map(comp => {
    const ctrl = componentControls[comp.id]
    if (!ctrl || Object.keys(ctrl).length === 0) return `  - ${comp.label} [passive/sensor]`
    const ctrlStr = Object.entries(ctrl).map(([k, v]) => `${k}=${v}`).join(', ')
    return `  - ${comp.label} [${ctrlStr}]`
  }).join('\n')

  // ── All signals with live values, limits, status ──
  const signalInfo = signals.map(sig => {
    const lim = signalLimits[sig.name] ?? { min: sig.min, max: sig.max }
    const pct = Math.round(((sig.value - lim.min) / (lim.max - lim.min)) * 100)
    const status = sig.status === 'ok' ? '✓' : sig.status === 'warning' ? '⚠' : '✗'
    return `  ${status} ${sig.name}: ${sig.value.toFixed(1)} ${sig.unit} (${pct}% of range ${lim.min}–${lim.max}, threshold=${sig.threshold})`
  }).join('\n')

  // ── Active alarms ──
  const activeAlarms = alarms.filter(a => !a.acknowledged)
  const alarmInfo = activeAlarms.length === 0
    ? '  [No active alarms]'
    : activeAlarms.map(a => {
        const age = Math.round((Date.now() - a.firstFiredAt) / 1000)
        const escalated = a.escalatedAt ? ' [ESCALATED]' : ''
        return `  [${a.severity.toUpperCase()}${escalated}] ${a.signalName}: ${a.value.toFixed(1)} ${a.unit} — ${a.message} (${age}s ago)`
      }).join('\n')

  // ── Trend analysis: compute slopes for top signals ──
  const trendInfo = (() => {
    if (trendHistory.length < 3) return '  [Not enough data yet — < 3 samples]'
    const recent = trendHistory.slice(-10)
    return signals.slice(0, 6).map(sig => {
      const vals = recent.map(pt => pt[sig.name]).filter((v): v is number => typeof v === 'number')
      if (vals.length < 2) return null
      const slope = (vals[vals.length - 1] - vals[0]) / vals.length
      const dir = Math.abs(slope) < 0.05 ? '→ stable' : slope > 0 ? `↑ +${slope.toFixed(2)}/tick` : `↓ ${slope.toFixed(2)}/tick`
      return `  ${sig.name}: ${dir} (last=${sig.value.toFixed(1)} ${sig.unit})`
    }).filter(Boolean).join('\n') || '  [No trend data]'
  })()

  // ── Signal→Component mapping for diagnostics ──
  const mappingInfo = machine.signals
    .filter(s => s.componentIds && s.componentIds.length > 0)
    .map(s => {
      const compLabels = s.componentIds!
        .map(id => machine.components.find(c => c.id === id)?.label)
        .filter(Boolean).join(', ')
      return `  ${s.name} ← driven by: ${compLabels}`
    }).join('\n') || '  [Auto-mapped — no explicit bindings]'

  return `You are NexAI, an expert industrial HMI assistant embedded in the NeuroFlow dashboard.
You have COMPLETE, REAL-TIME knowledge of this machine system. Use ALL the data below to give specific, accurate answers.
Be direct, use exact numbers, and speak like an experienced factory engineer. Max 4 sentences unless a list is clearer.

══════════════════════════════════════════
MACHINE STATE
══════════════════════════════════════════
${machineInfo}

COMPONENTS (${machine.components.length} total) — with active control values:
${componentInfo}

LIVE SIGNALS (${signals.length} total):
${signalInfo}

ACTIVE ALARMS (${activeAlarms.length}):
${alarmInfo}

SIGNAL TRENDS (last ${Math.min(trendHistory.length, 10)} readings):
${trendInfo}

SIGNAL→COMPONENT CAUSAL MAP:
${mappingInfo}
══════════════════════════════════════════
CAPABILITIES YOU HAVE:
- Explain any alarm with root cause tied to specific components
- Analyze trend slopes and predict degradation
- Suggest exact control adjustments (which component, which knob, which value)
- Compare current values against thresholds and safe operating ranges
- Identify correlated alarms and their common root cause
- Advise on start/stop/hold decisions
- Explain what each component does and how it affects signals
- Give maintenance recommendations based on current wear indicators
══════════════════════════════════════════`
}

// ── 1. Full-context Chat (primary function) ─────────────────
export async function chatWithAI(
  userMessage: string,
  ctx: FullSystemContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx)

  const prompt = `${systemPrompt}

USER QUESTION: "${userMessage}"

Answer specifically using the real data above. Reference exact signal values, component names, and alarm details.`

  try {
    const model = getModel()
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (err) {
    console.error('[Gemini] chatWithAI error:', err)
    return 'NexAI is temporarily unavailable. Please check your API key or try again.'
  }
}

// ── 3. Predictive Maintenance ────────────────────────────────
export async function predictFailure(
  machineName: string,
  signals: LiveSignal[],
  trendHistory: TrendPoint[],
  ctx?: FullSystemContext
): Promise<string> {
  if (!trendHistory.length) return 'Not enough trend data yet.'

  const recent = trendHistory.slice(-10)
  const signalTrends = signals.slice(0, 6).map(sig => {
    const values = recent
      .map(pt => pt[sig.name])
      .filter(v => typeof v === 'number') as number[]
    if (values.length < 2) return null
    const slope = ((values[values.length - 1] - values[0]) / values.length).toFixed(3)
    const pctOfThreshold = ((sig.value / sig.threshold) * 100).toFixed(1)
    return `- ${sig.name}: current=${sig.value}${sig.unit} (${pctOfThreshold}% of threshold), trend=${Number(slope) > 0 ? '+' : ''}${slope}/tick, threshold=${sig.threshold}${sig.unit}`
  }).filter(Boolean).join('\n')

  const componentBlock = ctx
    ? `Components under load: ${ctx.machine.components.map(c => {
        const ctrl = ctx.componentControls[c.id]
        if (!ctrl) return c.label
        return `${c.label}(${Object.entries(ctrl).map(([k, v]) => `${k}=${v}`).join(',')})`
      }).join(', ')}`
    : ''

  const key = `predict:${machineName}:${signalTrends}`
  const cached = getCached(key)
  if (cached) return cached

  const prompt = `You are a predictive maintenance AI for industrial equipment.
Machine: ${machineName}
${componentBlock}
Signal trends (last ${Math.min(trendHistory.length, 10)} readings):
${signalTrends}

Respond in this EXACT format (3 lines only, no extra text):
HEALTH STATUS: <Good / Degrading / Critical>
ESTIMATED FAILURE: <time estimate or "No imminent failure">
RECOMMENDATION: <one maintenance action>`

  try {
    const model = getModel()
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    setCached(key, text)
    return text
  } catch (err) {
    console.error('[Gemini] predictFailure error:', err)
    return 'Prediction unavailable. Check API key or rate limit.'
  }
}

// ── 3.5 Alarm Correlation & Root Cause Analysis ────────────────
export async function analyzeRootCause(
  ctx: FullSystemContext
): Promise<{ title: string; explanation: string; action: string }> {
  const activeAlarms = ctx.alarms.filter(a => !a.acknowledged)
  if (activeAlarms.length < 2) {
    return { title: 'Isolated Event', explanation: 'Not enough correlated alarms to determine a root cause.', action: 'Inspect the individual signal.' }
  }

  const prompt = `You are a Root Cause Analysis AI for industrial equipment.
Machine: ${ctx.machine.name}

Currently, there are ${activeAlarms.length} active alarms:
${activeAlarms.map(a => `- ${a.severity.toUpperCase()}: ${a.signalName} (${a.value.toFixed(1)} ${a.unit}) - ${a.message}`).join('\n')}

Based on industrial physics (e.g., if cooling fails, both temperature and pressure might rise; if a pump fails, flow drops and pressure fluctuates), what is the most likely single Root Cause?

Respond exactly in this JSON format (no markdown code blocks, just raw JSON):
{
  "title": "Short title of root cause (e.g. 'Coolant Pump Failure')",
  "explanation": "2-3 sentences explaining how this root cause created the specific cascading alarms seen above.",
  "action": "One specific actionable step for the engineer."
}
`
  try {
    const model = getModel()
    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim()
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim()
    }
    return JSON.parse(text)
  } catch (err) {
    console.error('[Gemini] analyzeRootCause error:', err)
    return {
      title: 'AI Analysis Unavailable',
      explanation: 'Could not connect to NexAI to analyze the correlated alarms.',
      action: 'Please check your API key and try again.'
    }
  }
}

// ── 4. Smart Quick Prompts (context-aware) ───────────────────
// Returns dynamic prompts based on current system state
export function getSmartQuickPrompts(ctx: FullSystemContext): string[] {
  const prompts: string[] = []
  const activeAlarms = ctx.alarms.filter(a => !a.acknowledged)
  const criticalSigs = ctx.signals.filter(s => s.status === 'critical')
  const warningSigs = ctx.signals.filter(s => s.status === 'warning')
  const highLoadComps = Object.entries(ctx.componentControls)
    .filter(([, ctrl]) => Object.values(ctrl).some(v => v > 85))
    .map(([id]) => ctx.machine.components.find(c => c.id === id)?.label)
    .filter(Boolean)

  // Alarm-driven prompts
  if (activeAlarms.length >= 3) {
    prompts.push(`Why are ${activeAlarms.length} alarms firing together?`)
  } else if (criticalSigs.length > 0) {
    prompts.push(`Why is ${criticalSigs[0].name} critical?`)
  } else if (warningSigs.length > 0) {
    prompts.push(`What's causing the ${warningSigs[0].name} warning?`)
  }

  // Component-driven prompts
  if (highLoadComps.length > 0) {
    prompts.push(`Is running ${highLoadComps[0]} at high load safe?`)
  }

  // Health-driven prompts
  if (ctx.healthScore < 60) {
    prompts.push('How do I recover machine health?')
  } else if (ctx.healthScore < 85) {
    prompts.push('Which signals are pulling health score down?')
  }

  // Mode/state prompts
  if (!ctx.running) {
    prompts.push('Is it safe to restart the machine now?')
  } else if (ctx.mode === 'Hold') {
    prompts.push('What should I check before resuming from Hold?')
  }

  // Trend prompts
  if (ctx.trendHistory.length >= 10) {
    prompts.push('Which signals are trending toward alarm?')
  }

  // Always-available prompts
  prompts.push('Give me a full system health report')
  prompts.push(`What does ${ctx.machine.components[0]?.label ?? 'this component'} do?`)
  prompts.push('What maintenance should I schedule?')

  // Return top 4 most relevant
  return prompts.slice(0, 4)
}
