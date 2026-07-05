// ============================================================
// DESTINATION: src/components/layout/AIPanel.tsx
// REPLACE entire file
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, ChevronRight, ChevronLeft, Sparkles, Loader2, RefreshCw, Brain } from 'lucide-react'
import type { ChatMessage } from '../../types'
import type { SimulatorOutput } from '../../hooks/useSimulator'
import type { MachineTemplate } from '../../data/machineTemplates'
import { chatWithAI, getSmartQuickPrompts, type FullSystemContext } from '../../services/geminiService'
import { useHighlight, parseHighlightTargets } from '../../context/HighlightContext'
import clsx from 'clsx'

interface AIPanelProps {
  collapsed: boolean
  onToggle: () => void
  machine: MachineTemplate
  sim: SimulatorOutput
}

function buildContext(machine: MachineTemplate, sim: SimulatorOutput): FullSystemContext {
  return {
    machine,
    signals: sim.signals,
    alarms: sim.alarms,
    trendHistory: sim.trendHistory,
    running: sim.running,
    mode: sim.mode,
    healthScore: sim.healthScore,
    uptime: sim.uptime,
    lastUpdated: sim.lastUpdated,
    componentControls: sim.componentControls,
    signalLimits: sim.signalLimits,
  }
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'ai',
  content: 'NexAI online. I have full visibility into your machine — signals, components, alarms, trends, and controls. Ask me anything.',
  timestamp: 'now',
}

export default function AIPanel({ collapsed, onToggle, machine, sim }: AIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickPrompts, setQuickPrompts] = useState<string[]>([])
  const { triggerHighlight } = useHighlight()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Regenerate smart prompts when system state changes meaningfully
  useEffect(() => {
    const ctx = buildContext(machine, sim)
    setQuickPrompts(getSmartQuickPrompts(ctx))
  }, [
    sim.alarms.length,
    sim.healthScore,
    sim.running,
    sim.mode,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    machine.id,
  ])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const ctx = buildContext(machine, sim)

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await chatWithAI(text, ctx)

      // ✅ Parse AI reply → trigger dashboard panel highlights
      const highlightTarget = parseHighlightTargets(
        reply,
        ctx.signals.map(s => s.name),
        ctx.machine.components.map(c => c.label)
      )
      if (highlightTarget) triggerHighlight(highlightTarget)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'NexAI temporarily unavailable. Check your API key.',
        timestamp: 'now',
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([INITIAL_MESSAGE])

  // ── Collapsed state ──
  if (collapsed) {
    return (
      <div className="w-10 shrink-0 bg-bg-card border-l border-bg-border flex flex-col items-center py-4 gap-4">
        <button onClick={onToggle} className="text-text-muted hover:text-brand-cyan transition-colors">
          <ChevronRight size={16} />
        </button>
        <Bot size={16} className="text-brand-cyan/60" />
        {sim.alarms.filter(a => !a.acknowledged).length > 0 && (
          <span className="w-2 h-2 rounded-full bg-status-critical animate-pulse" />
        )}
      </div>
    )
  }

  const activeAlarmCount = sim.alarms.filter(a => !a.acknowledged).length
  const criticalCount = sim.alarms.filter(a => !a.acknowledged && a.severity === 'critical').length

  return (
    <aside className="w-[288px] shrink-0 bg-bg-card border-l border-bg-border flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-brand-cyan/15 flex items-center justify-center">
            <Brain size={11} className="text-brand-cyan" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary">NexAI</span>
            <p className="text-[9px] text-text-muted font-mono leading-none mt-0.5 truncate max-w-[120px]">{machine.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Live status pill */}
          <div className={clsx(
            'flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border',
            criticalCount > 0
              ? 'text-status-critical border-status-critical/30 bg-status-critical/10'
              : activeAlarmCount > 0
              ? 'text-status-warning border-status-warning/30 bg-status-warning/10'
              : 'text-status-ok border-status-ok/30 bg-status-ok/10'
          )}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', {
              'bg-status-critical animate-pulse': criticalCount > 0,
              'bg-status-warning animate-pulse': !criticalCount && activeAlarmCount > 0,
              'bg-status-ok': !activeAlarmCount,
            })} />
            {activeAlarmCount > 0 ? `${activeAlarmCount} alarm${activeAlarmCount > 1 ? 's' : ''}` : 'nominal'}
          </div>
          <button onClick={clearChat} title="Clear chat" className="text-text-muted hover:text-text-secondary transition-colors p-1">
            <RefreshCw size={12} />
          </button>
          <button onClick={onToggle} className="text-text-muted hover:text-text-secondary transition-colors p-1">
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* ── System snapshot strip ── */}
      <div className="px-3 py-2 border-b border-bg-border bg-bg-base/50 grid grid-cols-4 gap-1 shrink-0">
        {[
          { label: 'Health', value: `${sim.healthScore}%`, warn: sim.healthScore < 80 },
          { label: 'Signals', value: `${sim.signals.filter(s => s.status === 'ok').length}/${sim.signals.length}`, warn: false },
          { label: 'Mode', value: sim.mode, warn: sim.mode !== 'Auto' },
          { label: 'Alarms', value: String(activeAlarmCount), warn: activeAlarmCount > 0 },
        ].map(item => (
          <div key={item.label} className="text-center">
            <p className="text-[8px] font-mono uppercase text-text-muted leading-none">{item.label}</p>
            <p className={clsx('text-[11px] font-semibold font-mono mt-0.5', item.warn ? 'text-status-warning' : 'text-text-secondary')}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={clsx(
              'max-w-[92%] rounded-lg px-3 py-2 text-[12px] leading-relaxed',
              msg.role === 'user'
                ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20'
                : 'bg-bg-hover text-text-secondary border border-bg-border'
            )}>
              {msg.role === 'ai' && (
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles size={9} className="text-brand-cyan" />
                  <span className="text-[9px] text-brand-cyan font-mono">NexAI · {msg.timestamp}</span>
                </div>
              )}
              <p className="whitespace-pre-line">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-hover text-text-secondary border border-bg-border rounded-lg px-3 py-2 text-[12px] flex items-center gap-2">
              <Sparkles size={9} className="text-brand-cyan" />
              <Loader2 size={11} className="text-brand-cyan animate-spin" />
              <span className="text-[10px] text-text-muted">Analyzing system...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Smart Quick Prompts ── */}
      <div className="px-3 pb-2 flex flex-wrap gap-1 shrink-0">
        {quickPrompts.map(p => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            disabled={loading}
            className="text-[10px] px-2 py-1 rounded-md bg-bg-base border border-bg-border text-text-muted hover:border-brand-cyan/30 hover:text-brand-cyan transition-all disabled:opacity-40 text-left"
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <div className="p-3 border-t border-bg-border shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask about signals, components, alarms..."
            disabled={loading}
            className="flex-1 bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-xs text-text-secondary placeholder:text-text-muted outline-none focus:border-brand-cyan/40 transition-colors disabled:opacity-40"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center hover:bg-brand-cyan/25 transition-colors disabled:opacity-40"
          >
            {loading
              ? <Loader2 size={12} className="text-brand-cyan animate-spin" />
              : <Send size={12} className="text-brand-cyan" />
            }
          </button>
        </div>
        <p className="text-[9px] text-text-muted mt-1.5 text-center font-mono">
          Powered by Gemini · Full system context
        </p>
      </div>
    </aside>
  )
}
