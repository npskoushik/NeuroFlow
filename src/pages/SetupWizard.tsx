import { useMemo, useRef, useState } from 'react'
import { Check, ChevronRight, Filter, Plus, Search, Trash2, X, Zap, Brain, Loader2, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import {
  MACHINE_CATEGORIES,
  MACHINE_TEMPLATES,
  ALL_PART_SUGGESTIONS,
  ALL_SIGNAL_SUGGESTIONS,
  type ComponentTemplate,
  type MachineCategory,
  type MachineTemplate,
  type SignalTemplate,
  autoGenerateSignalsForComponent,
} from '../data/machineTemplates'
import { generateMachineConfig, convertConfigToMachineTemplate } from '../services/geminiConfigService'
import TemplateSchematicPreview from '../components/setup/TemplateSchematicPreview'
import ComponentLibraryPanel, { type LibraryComponent } from '../components/setup/ComponentLibraryPanel'

interface SetupWizardProps {
  onComplete: (machine: MachineTemplate) => void
}

const CATEGORY_COLORS: Record<MachineCategory, string> = {
  'Process & Fluid': 'text-blue-400 bg-blue-400/10 border-blue-400/25',
  Manufacturing: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/25',
  'Material Handling': 'text-amber-400 bg-amber-400/10 border-amber-400/25',
  'Energy & Power': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
  'Food & Beverage': 'text-green-400 bg-green-400/10 border-green-400/25',
  Pharmaceutical: 'text-purple-400 bg-purple-400/10 border-purple-400/25',
  'Mining & Extraction': 'text-orange-400 bg-orange-400/10 border-orange-400/25',
}

const CATEGORY_ACTIVE: Record<MachineCategory, string> = {
  'Process & Fluid': 'bg-blue-400 text-bg-base border-blue-400',
  Manufacturing: 'bg-brand-cyan text-bg-base border-brand-cyan',
  'Material Handling': 'bg-amber-400 text-bg-base border-amber-400',
  'Energy & Power': 'bg-yellow-400 text-bg-base border-yellow-400',
  'Food & Beverage': 'bg-green-400 text-bg-base border-green-400',
  Pharmaceutical: 'bg-purple-400 text-bg-base border-purple-400',
  'Mining & Extraction': 'bg-orange-400 text-bg-base border-orange-400',
}

const emptySignal = { name: '', unit: '', min: '0', max: '100', threshold: '80' }

function cloneMachine(machine: MachineTemplate): MachineTemplate {
  return {
    ...machine,
    components: machine.components.map(c => ({ ...c })),
    signals: machine.signals.map(s => ({ ...s })),
  }
}

function normalizePartId(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom_part'
}

// ── Search Dropdown for Parts ─────────────────────────────────
function PartSearchInput({ value, onChange, onSelect, existingIds }: {
  value: string; onChange: (v: string) => void
  onSelect: (part: ComponentTemplate) => void; existingIds: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    return ALL_PART_SUGGESTIONS.filter(p =>
      !existingIds.has(p.id) && (q === '' || p.label.toLowerCase().includes(q))
    ).slice(0, 8)
  }, [value, existingIds])

  return (
    <div className="relative flex-1" ref={ref}>
      <input value={value} onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search or type part name..."
        className="w-full rounded-lg border border-bg-border bg-bg-card px-3 py-2 text-xs text-text-secondary outline-none focus:border-brand-cyan/40" />
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-bg-border bg-bg-card shadow-xl max-h-48 overflow-y-auto">
          {suggestions.length === 0 && value.trim() && (
            <div className="px-3 py-2 text-xs text-text-muted italic">"{value}" — press Add to create custom part</div>
          )}
          {suggestions.map(p => (
            <button key={p.id} onMouseDown={() => { onSelect(p); onChange(''); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-brand-cyan/10 hover:text-brand-cyan text-left transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/50 shrink-0" />{p.label}
            </button>
          ))}
          {value.trim() && !ALL_PART_SUGGESTIONS.some(p => p.label.toLowerCase() === value.trim().toLowerCase()) && (
            <div className="px-3 py-1.5 text-[10px] text-text-muted border-t border-bg-border">No exact match — press Add to create custom part</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Search Dropdown for Signals ───────────────────────────────
function SignalSearchInput({ value, onChange, onSelect, existingNames }: {
  value: string; onChange: (v: string) => void
  onSelect: (sig: SignalTemplate) => void; existingNames: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    return ALL_SIGNAL_SUGGESTIONS.filter(s =>
      !existingNames.has(s.name) && (q === '' || s.name.toLowerCase().includes(q))
    ).slice(0, 8)
  }, [value, existingNames])

  return (
    <div className="relative min-w-0 flex-1">
      <input value={value} onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search signal name..."
        className="w-full rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border border-bg-border bg-bg-card shadow-xl max-h-44 overflow-y-auto">
          {suggestions.length === 0 && value.trim() && (
            <div className="px-3 py-2 text-xs text-text-muted italic">"{value}" — fill fields and press Add</div>
          )}
          {suggestions.map(s => (
            <button key={s.name} onMouseDown={() => { onSelect(s); onChange(''); setOpen(false) }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-brand-cyan/10 hover:text-brand-cyan text-left transition-colors">
              <span className="text-text-secondary">{s.name}</span>
              <span className="text-text-muted font-mono">{s.unit}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Review Panel ───────────────────────────────────────────────
function ReviewPanel({ draftMachine, onUpdateSignal, onRemoveSignal, onAddSignal, onRemovePart, onAddPart, onClose, badge }: {
  draftMachine: MachineTemplate
  onUpdateSignal: (i: number, patch: Partial<SignalTemplate>) => void
  onRemoveSignal: (i: number) => void
  onAddSignal: (s: SignalTemplate) => void
  onRemovePart: (i: number) => void
  onAddPart: (p: ComponentTemplate) => void
  onClose?: () => void
  badge?: string
}) {
  const [newSignalName, setNewSignalName] = useState('')
  const [newSignal, setNewSignal] = useState(emptySignal)
  const [newPartLabel, setNewPartLabel] = useState('')

  const existingSignalNames = useMemo(() => new Set(draftMachine.signals.map(s => s.name)), [draftMachine.signals])
  const existingPartIds = useMemo(() => new Set(draftMachine.components.map(c => c.id)), [draftMachine.components])

  const handleAddSignalManual = () => {
    const name = newSignalName.trim() || newSignal.name.trim()
    if (!name) return
    onAddSignal({ name, unit: newSignal.unit.trim() || '-', min: Number(newSignal.min), max: Number(newSignal.max), threshold: Number(newSignal.threshold) })
    setNewSignalName(''); setNewSignal(emptySignal)
  }

  const handleAddPartManual = () => {
    const label = newPartLabel.trim()
    if (!label) return
    onAddPart({ id: normalizePartId(label), label })
    setNewPartLabel('')
  }

  return (
    <div className="bg-bg-card border border-brand-cyan/20 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {badge && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan">
                {badge}
              </span>
            )}
            <p className="text-[10px] font-mono uppercase tracking-wider text-brand-cyan">Review Configuration</p>
          </div>
          <h2 className="text-base font-semibold text-text-primary">{draftMachine.name}</h2>
          <p className="text-xs text-text-muted mt-1">Add or remove signals and parts before generating the HMI.</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-bg-border text-xs text-text-muted hover:text-text-secondary">
            Hide review
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Signals */}
        <div className="rounded-xl border border-bg-border bg-bg-base/60 p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Signals</h3>
            <span className="text-[10px] font-mono text-text-muted">{draftMachine.signals.length} configured</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {draftMachine.signals.map((signal, index) => (
              <div key={`${signal.name}-${index}`} className="grid grid-cols-[1fr_56px_56px_56px_30px] gap-1.5">
                <input value={signal.name} onChange={e => onUpdateSignal(index, { name: e.target.value })}
                  className="min-w-0 rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
                <input value={signal.unit} onChange={e => onUpdateSignal(index, { unit: e.target.value })}
                  className="rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
                <input type="number" value={signal.max} onChange={e => onUpdateSignal(index, { max: Number(e.target.value) })}
                  className="rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
                <input type="number" value={signal.threshold} onChange={e => onUpdateSignal(index, { threshold: Number(e.target.value) })}
                  className="rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
                <button onClick={() => onRemoveSignal(index)}
                  className="rounded-lg border border-status-critical/20 bg-status-critical/10 text-status-critical flex items-center justify-center">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex gap-1.5">
              <SignalSearchInput value={newSignalName}
                onChange={v => { setNewSignalName(v); setNewSignal(prev => ({ ...prev, name: v })) }}
                onSelect={s => onAddSignal(s)} existingNames={existingSignalNames} />
              <input value={newSignal.unit} onChange={e => setNewSignal(p => ({ ...p, unit: e.target.value }))}
                placeholder="Unit" className="w-16 rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
              <input type="number" value={newSignal.max} onChange={e => setNewSignal(p => ({ ...p, max: e.target.value }))}
                placeholder="Max" className="w-14 rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
              <input type="number" value={newSignal.threshold} onChange={e => setNewSignal(p => ({ ...p, threshold: e.target.value }))}
                placeholder="Limit" className="w-14 rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
              <button onClick={handleAddSignalManual}
                className="h-9 px-3 rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 text-xs font-semibold text-brand-cyan whitespace-nowrap">Add</button>
            </div>
            <p className="text-[10px] text-text-muted">Select from dropdown or type a custom name and press Add.</p>
          </div>
        </div>

        {/* Parts */}
        <div className="rounded-xl border border-bg-border bg-bg-base/60 p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Machine Parts</h3>
            <span className="text-[10px] font-mono text-text-muted">{draftMachine.components.length} configured</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {draftMachine.components.map((component, index) => (
              <div key={`${component.id}-${index}`} className="flex items-center gap-2 rounded-lg border border-bg-border bg-bg-card px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-text-primary">{component.label}</p>
                  <p className="truncate text-[10px] font-mono text-text-muted">{component.id}</p>
                </div>
                <button onClick={() => onRemovePart(index)}
                  className="h-7 w-7 rounded-lg border border-status-critical/20 bg-status-critical/10 text-status-critical flex items-center justify-center">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex gap-2">
              <PartSearchInput value={newPartLabel} onChange={setNewPartLabel}
                onSelect={p => onAddPart(p)} existingIds={existingPartIds} />
              <button onClick={handleAddPartManual}
                className="h-9 px-3 rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 text-xs font-semibold text-brand-cyan whitespace-nowrap">Add</button>
            </div>
            <p className="text-[10px] text-text-muted">Select from dropdown or type a custom part name and press Add.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Custom Machine Modal (3-step with ComponentLibraryPanel) ──
function CustomMachineModal({ onClose, onComplete }: { onClose: () => void; onComplete: (machine: MachineTemplate) => void }) {
  const [step, setStep] = useState<'info' | 'components' | 'signals'>('info')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<MachineCategory>('Process & Fluid')
  const [description, setDescription] = useState('')
  const [draftMachine, setDraftMachine] = useState<MachineTemplate | null>(null)

  const addedComponentIds = useMemo(
    () => new Set((draftMachine?.components ?? []).map(c => c.id)),
    [draftMachine?.components]
  )

  const handleContinueFromInfo = () => {
    if (!name.trim()) return
    setDraftMachine({
      id: normalizePartId(name),
      name: name.trim(),
      category,
      icon: '⚙️',
      description: description.trim() || name.trim(),
      components: [],
      signals: [],
    })
    setStep('components')
  }

  const handleAddComponent = (comp: LibraryComponent) => {
    setDraftMachine(prev => {
      if (!prev) return prev
      const newPart = { id: comp.id, label: comp.label }
      const newSignals = autoGenerateSignalsForComponent(newPart)
      return {
        ...prev,
        components: [...prev.components, newPart],
        signals: [...prev.signals, ...newSignals]
      }
    })
  }

  const handleRemoveComponent = (id: string) => {
    setDraftMachine(prev => prev ? {
      ...prev,
      components: prev.components.filter(c => c.id !== id),
    } : prev)
  }

  const updateSignal = (i: number, patch: Partial<SignalTemplate>) =>
    setDraftMachine(prev => prev ? { ...prev, signals: prev.signals.map((s, idx) => idx === i ? { ...s, ...patch } : s) } : prev)
  const removeSignal = (i: number) =>
    setDraftMachine(prev => prev ? { ...prev, signals: prev.signals.filter((_, idx) => idx !== i) } : prev)
  const addSignal = (s: SignalTemplate) =>
    setDraftMachine(prev => prev ? { ...prev, signals: [...prev.signals, s] } : prev)

  const canFinish = Boolean(draftMachine && draftMachine.signals.length > 0 && draftMachine.components.length > 0)

  const STEPS = [
    { key: 'info', label: '1 Machine Info' },
    { key: 'components', label: '2 Add Components' },
    { key: 'signals', label: '3 Add Signals' },
  ]

  return (
    <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Create Custom Machine</h2>
            <p className="text-xs text-text-muted mt-0.5">Build your own HMI from the component library</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Step breadcrumb */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1">
                  {i > 0 && <span className="text-text-muted">→</span>}
                  <span className={clsx('px-2 py-0.5 rounded', step === s.key ? 'text-brand-cyan bg-brand-cyan/10' : 'text-text-muted')}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg border border-bg-border flex items-center justify-center text-text-muted hover:text-text-secondary">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* ── STEP 1: Machine Info ── */}
          {step === 'info' && (
            <div className="max-w-lg mx-auto space-y-5">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Machine Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Batch Reactor Unit"
                  className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand-cyan/40" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as MachineCategory)}
                  className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand-cyan/40">
                  {MACHINE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of what this machine does..."
                  className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand-cyan/40 resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-bg-border text-text-muted text-sm font-semibold hover:text-text-secondary">Cancel</button>
                <button onClick={handleContinueFromInfo} disabled={!name.trim()}
                  className="flex-1 h-10 rounded-lg bg-brand-cyan text-bg-base text-sm font-semibold hover:bg-brand-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  Next: Add Components <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Component Library ── */}
          {step === 'components' && draftMachine && (
            <div className="space-y-4">
              {/* Selected components strip */}
              <div className="bg-bg-base rounded-xl border border-bg-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Your Machine: <span className="text-brand-cyan">{draftMachine.name}</span>
                  </h3>
                  <span className="text-[10px] font-mono text-text-muted">{draftMachine.components.length} components added</span>
                </div>
                {draftMachine.components.length === 0 ? (
                  <p className="text-xs text-text-muted italic text-center py-2">No components yet — browse the library below</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {draftMachine.components.map((comp) => (
                      <div key={comp.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/25">
                        <span className="text-[11px] font-medium text-brand-cyan">{comp.label}</span>
                        <button onClick={() => handleRemoveComponent(comp.id)}
                          className="text-brand-cyan/50 hover:text-status-critical transition-colors">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Library */}
              <div className="bg-bg-base rounded-xl border border-bg-border p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Component Library</h3>
                <ComponentLibraryPanel
                  addedIds={addedComponentIds}
                  onAdd={handleAddComponent}
                  onRemove={handleRemoveComponent}
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('info')} className="flex-1 h-10 rounded-lg border border-bg-border text-text-muted text-sm font-semibold hover:text-text-secondary">← Back</button>
                <button onClick={() => setStep('signals')} disabled={draftMachine.components.length === 0}
                  className="flex-1 h-10 rounded-lg bg-brand-cyan text-bg-base text-sm font-semibold hover:bg-brand-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  Next: Add Signals <ChevronRight size={15} />
                </button>
              </div>
              {draftMachine.components.length === 0 && (
                <p className="text-center text-xs text-text-muted">Add at least 1 component to continue.</p>
              )}
            </div>
          )}

          {/* ── STEP 3: Signals + Final Review ── */}
          {step === 'signals' && draftMachine && (
            <div className="space-y-4">
              {/* Signals panel */}
              <div className="rounded-xl border border-bg-border bg-bg-base/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">Signals</h3>
                  <span className="text-[10px] font-mono text-text-muted">{draftMachine.signals.length} configured</span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {draftMachine.signals.map((signal, index) => (
                    <div key={`${signal.name}-${index}`} className="grid grid-cols-[1fr_56px_56px_56px_30px] gap-1.5">
                      <input value={signal.name} onChange={e => updateSignal(index, { name: e.target.value })}
                        className="min-w-0 rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
                      <input value={signal.unit} onChange={e => updateSignal(index, { unit: e.target.value })}
                        className="rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
                      <input type="number" value={signal.max} onChange={e => updateSignal(index, { max: Number(e.target.value) })}
                        className="rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
                      <input type="number" value={signal.threshold} onChange={e => updateSignal(index, { threshold: Number(e.target.value) })}
                        className="rounded-lg border border-bg-border bg-bg-card px-2 py-2 text-[11px] text-text-secondary outline-none focus:border-brand-cyan/40" />
                      <button onClick={() => removeSignal(index)}
                        className="rounded-lg border border-status-critical/20 bg-status-critical/10 text-status-critical flex items-center justify-center">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                  {draftMachine.signals.length === 0 && (
                    <p className="text-xs text-text-muted italic text-center py-2">No signals yet — add from the dropdown below</p>
                  )}
                </div>

                {/* Signal add row */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-1.5">
                    <SignalSearchInput
                      value={''} onChange={() => {}} onSelect={addSignal}
                      existingNames={new Set(draftMachine.signals.map(s => s.name))} />
                  </div>
                  <p className="text-[10px] text-text-muted">Select from dropdown to add a signal with preset values.</p>
                </div>
              </div>

              {/* Component summary */}
              <div className="rounded-xl border border-bg-border bg-bg-base/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-text-primary">Components Summary</h3>
                  <button onClick={() => setStep('components')} className="text-[10px] text-brand-cyan hover:underline">← Edit</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draftMachine.components.map(c => (
                    <span key={c.id} className="text-[10px] px-2 py-1 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">{c.label}</span>
                  ))}
                </div>
              </div>

              {/* Schematic preview */}
              {draftMachine.components.length > 0 && (
                <TemplateSchematicPreview machine={draftMachine} />
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep('components')} className="flex-1 h-10 rounded-lg border border-bg-border text-text-muted text-sm font-semibold hover:text-text-secondary">← Back</button>
                <button disabled={!canFinish} onClick={() => draftMachine && onComplete(draftMachine)}
                  className="flex-1 h-10 rounded-lg bg-brand-cyan text-bg-base text-sm font-semibold hover:bg-brand-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  Generate HMI <ChevronRight size={15} />
                </button>
              </div>
              {!canFinish && <p className="text-center text-xs text-text-muted">Add at least 1 signal to generate.</p>}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── AI Machine Generator Modal ────────────────────────────────
// FIX #2 + #3: Full-screen modal with hero CTA + review panel BEFORE dashboard
function AIMachineModal({ onClose, onComplete }: { onClose: () => void; onComplete: (machine: MachineTemplate) => void }) {
  const [step, setStep] = useState<'describe' | 'review'>('describe')
  const [prompt, setPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [draftMachine, setDraftMachine] = useState<MachineTemplate | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const config = await generateMachineConfig(prompt)
      const template = convertConfigToMachineTemplate(config)
      setDraftMachine(template)
      setStep('review')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Generation failed. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const updateSignal = (i: number, patch: Partial<SignalTemplate>) =>
    setDraftMachine(prev => prev ? { ...prev, signals: prev.signals.map((s, idx) => idx === i ? { ...s, ...patch } : s) } : prev)
  const removeSignal = (i: number) =>
    setDraftMachine(prev => prev ? { ...prev, signals: prev.signals.filter((_, idx) => idx !== i) } : prev)
  const addSignal = (s: SignalTemplate) =>
    setDraftMachine(prev => prev ? { ...prev, signals: [...prev.signals, s] } : prev)
  const removePart = (i: number) =>
    setDraftMachine(prev => prev ? { ...prev, components: prev.components.filter((_, idx) => idx !== i) } : prev)
  const addPart = (p: ComponentTemplate) =>
    setDraftMachine(prev => {
      if (!prev) return prev
      const newSignals = autoGenerateSignalsForComponent(p)
      return {
        ...prev,
        components: [...prev.components, p],
        signals: [...prev.signals, ...newSignals]
      }
    })

  const canGenerate = Boolean(draftMachine && draftMachine.signals.length > 0 && draftMachine.components.length > 0)

  const EXAMPLE_PROMPTS = [
    'Cooling water system with 2 pumps, storage tank, heat exchanger',
    'CNC machining center with spindle, coolant and 3-axis drives',
    'Boiler system with feed pump, safety valves and steam header',
    'Pharmaceutical reactor with agitator, dosing pumps and pH control',
  ]

  return (
    <div className="fixed inset-0 bg-bg-base/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-brand-cyan/30 rounded-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center">
              <Brain size={15} className="text-brand-cyan" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">AI Machine Generator</h2>
              <p className="text-xs text-text-muted">Powered by Gemini 2.5 Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
              <span className={clsx('px-2 py-0.5 rounded', step === 'describe' ? 'text-brand-cyan bg-brand-cyan/10' : 'text-text-muted')}>1 Describe</span>
              <span className="text-text-muted">→</span>
              <span className={clsx('px-2 py-0.5 rounded', step === 'review' ? 'text-brand-cyan bg-brand-cyan/10' : 'text-text-muted')}>2 Review & Edit</span>
              <span className="text-text-muted">→</span>
              <span className="text-text-muted px-2 py-0.5">3 Generate HMI</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg border border-bg-border flex items-center justify-center text-text-muted hover:text-text-secondary">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* STEP 1: DESCRIBE */}
          {step === 'describe' && (
            <>
              {/* Hero section */}
              <div className="rounded-xl bg-brand-cyan/5 border border-brand-cyan/20 p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles size={14} className="text-brand-cyan" />
                  <span className="text-xs font-mono text-brand-cyan uppercase tracking-wider">Gemini AI understands your machine</span>
                </div>
                <p className="text-sm text-text-secondary max-w-xl mx-auto">
                  Describe your industrial machine or process in plain English. Gemini will analyze it, select the right components, signals, and generate a live HMI schematic automatically.
                </p>
              </div>

              {/* Input */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Describe your machine
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleGenerate()}
                  rows={4}
                  placeholder="Example: A cooling water circulation system with two centrifugal pumps running in parallel, a large storage tank, plate heat exchanger, and pressure control valves..."
                  className="w-full bg-bg-base border border-bg-border rounded-xl p-4 text-sm text-text-secondary placeholder:text-text-muted outline-none focus:border-brand-cyan/40 resize-none"
                />
                <p className="text-[10px] text-text-muted mt-1">Tip: Press Ctrl+Enter to generate</p>
              </div>

              {/* Example prompts */}
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Try an example:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_PROMPTS.map(ex => (
                    <button key={ex} onClick={() => setPrompt(ex)}
                      className="text-left px-3 py-2.5 rounded-lg border border-bg-border bg-bg-base hover:border-brand-cyan/30 hover:bg-brand-cyan/5 text-xs text-text-muted hover:text-brand-cyan transition-all">
                      <span className="text-brand-cyan/60 mr-1">→</span> {ex}
                    </button>
                  ))}
                </div>
              </div>

              {aiError && (
                <div className="rounded-lg bg-status-critical/10 border border-status-critical/20 p-3">
                  <p className="text-xs text-status-critical">{aiError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="px-5 h-11 rounded-lg border border-bg-border text-text-muted text-sm font-semibold hover:text-text-secondary">
                  Cancel
                </button>
                <button onClick={handleGenerate} disabled={!prompt.trim() || aiLoading}
                  className="flex-1 h-11 rounded-lg bg-brand-cyan text-bg-base text-sm font-semibold hover:bg-brand-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {aiLoading
                    ? <><Loader2 size={15} className="animate-spin" /> Gemini is analyzing your machine...</>
                    : <><Brain size={15} /> Generate Machine Config</>
                  }
                </button>
              </div>
            </>
          )}

          {/* STEP 2: REVIEW — same as template review, add/edit before dashboard */}
          {step === 'review' && draftMachine && (
            <>
              {/* AI result summary */}
              <div className="rounded-xl bg-brand-cyan/5 border border-brand-cyan/20 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} className="text-brand-cyan" />
                  <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider">Gemini Generated</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Gemini identified <strong className="text-text-primary">{draftMachine.components.length} components</strong> and <strong className="text-text-primary">{draftMachine.signals.length} signals</strong> for your <strong className="text-text-primary">{draftMachine.name}</strong>. Review and adjust below before generating the HMI.
                </p>
              </div>

              {/* Review panel — FULL edit capability */}
              <ReviewPanel
                draftMachine={draftMachine}
                onUpdateSignal={updateSignal}
                onRemoveSignal={removeSignal}
                onAddSignal={addSignal}
                onRemovePart={removePart}
                onAddPart={addPart}
                badge="AI Generated"
              />

              {/* Schematic Preview */}
              {draftMachine.components.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap size={11} className="text-brand-cyan" /> Schematic Preview
                  </p>
                  <TemplateSchematicPreview machine={draftMachine} />
                </div>
              ) : (
                <div className="rounded-xl border border-bg-border bg-bg-base/60 p-4 text-center text-sm text-text-muted">
                  Add at least one part above to see schematic preview.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => { setStep('describe'); setAiError('') }}
                  className="px-5 h-11 rounded-lg border border-bg-border text-text-muted text-sm font-semibold hover:text-text-secondary">
                  ← Re-describe
                </button>
                <button disabled={!canGenerate} onClick={() => draftMachine && onComplete(draftMachine)}
                  className="flex-1 h-11 rounded-lg bg-brand-cyan text-bg-base text-sm font-semibold hover:bg-brand-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  Generate HMI Dashboard <ChevronRight size={15} />
                </button>
              </div>
              {!canGenerate && <p className="text-center text-xs text-status-warning">Add at least 1 signal and 1 part to generate.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main SetupWizard ───────────────────────────────────────────
export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<MachineCategory | null>(null)
  const [selected, setSelected] = useState<MachineTemplate | null>(null)
  const [draftMachine, setDraftMachine] = useState<MachineTemplate | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showGrid, setShowGrid] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return MACHINE_TEMPLATES.filter(machine => {
      const matchSearch = !query ||
        machine.name.toLowerCase().includes(query) ||
        machine.category.toLowerCase().includes(query) ||
        machine.description.toLowerCase().includes(query)
      const matchCategory = !activeCategory || machine.category === activeCategory
      return matchSearch && matchCategory
    })
  }, [search, activeCategory])

  const handleSelect = (machine: MachineTemplate) => {
    if (selected?.id === machine.id) { setSelected(null); setDraftMachine(null); setReviewOpen(false); return }
    setSelected(machine); setDraftMachine(cloneMachine(machine)); setReviewOpen(true)
  }

  const updateSignal = (i: number, patch: Partial<SignalTemplate>) =>
    setDraftMachine(prev => prev ? { ...prev, signals: prev.signals.map((s, idx) => idx === i ? { ...s, ...patch } : s) } : prev)
  const removeSignal = (i: number) =>
    setDraftMachine(prev => prev ? { ...prev, signals: prev.signals.filter((_, idx) => idx !== i) } : prev)
  const addSignal = (s: SignalTemplate) =>
    setDraftMachine(prev => prev ? { ...prev, signals: [...prev.signals, s] } : prev)
  const removePart = (i: number) =>
    setDraftMachine(prev => prev ? { ...prev, components: prev.components.filter((_, idx) => idx !== i) } : prev)
  const addPart = (p: ComponentTemplate) =>
    setDraftMachine(prev => {
      if (!prev) return prev
      const newSignals = autoGenerateSignalsForComponent(p)
      return {
        ...prev,
        components: [...prev.components, p],
        signals: [...prev.signals, ...newSignals]
      }
    })

  const canGenerate = Boolean(draftMachine?.signals.length && draftMachine?.components.length)

  return (
    <div className="h-screen overflow-hidden bg-transparent flex flex-col relative z-10">
      {/* Header */}
      <header className="shrink-0 h-14 bg-black/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3 min-w-[72px]">
          <div className="w-7 h-7 rounded bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center">
            <span className="text-brand-cyan text-xs font-mono font-bold">N</span>
          </div>
        </div>
        <div className="flex items-center justify-center flex-1">
          <span className="font-neuroflow text-sm sm:text-base font-bold text-brand-cyan tracking-[0.28em] uppercase drop-shadow-[0_0_10px_rgba(0,229,255,0.35)]">
            Setup
          </span>
        </div>
        <div className="min-w-[72px]" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-36">

        {/* Hero */}
        <section className="pt-8 pb-5 text-center max-w-2xl mx-auto w-full">
          <div className="flex justify-center items-end gap-2 mb-5 select-none">
            <span className="font-neuroflow text-5xl sm:text-6xl md:text-7xl font-bold tracking-[0.08em] text-transparent bg-gradient-to-r from-brand-cyan via-sky-300 to-blue-500 bg-clip-text drop-shadow-[0_0_18px_rgba(0,229,255,0.25)] transform -rotate-1">
              Neuro
            </span>
            <span className="font-neuroflow text-5xl sm:text-6xl md:text-7xl font-bold tracking-[0.08em] text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-brand-cyan bg-clip-text drop-shadow-[0_0_18px_rgba(0,229,255,0.22)] transform rotate-2 translate-y-1">
              Flow
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/20 bg-brand-cyan/5 mb-4">
            <Zap size={11} className="text-brand-cyan" />
            <span className="text-[11px] font-mono text-brand-cyan uppercase tracking-wider">AI-Powered HMI Configuration</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary leading-tight">What machine are you connecting?</h1>
          <p className="text-sm text-text-muted mt-2">
            Select from 45 industrial templates, or let Gemini AI generate a custom machine from your description.
          </p>
        </section>

        {/* Quick Create Custom Machine CTA (placed under AI card for discoverability) */}
        <section className="max-w-6xl mx-auto w-full mb-6 flex justify-center">
          <button onClick={() => setShowCustom(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-lg border border-bg-border bg-bg-base text-text-muted text-sm font-semibold hover:text-text-secondary hover:border-brand-cyan/30 transition-colors">
            <Plus size={14} /> Create Custom Machine
          </button>
        </section>
        {/* Big visible AI CTA card */}
        <section className="max-w-6xl mx-auto w-full mb-6">
          <button
            onClick={() => setShowAI(true)}
            className="w-full group rounded-2xl border border-brand-cyan/30 glass-card p-5 flex items-center gap-5 transition-all hover:border-brand-cyan/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)]"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center shrink-0 group-hover:bg-brand-cyan/30 transition-colors">
              <Brain size={22} className="text-brand-cyan" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-text-primary">Don't see your machine? Let Gemini AI build it</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan uppercase tracking-wider">NEW</span>
              </div>
              <p className="text-xs text-text-muted">
                Describe your machine in plain English → Gemini selects components & signals → Review & edit → Generate live HMI
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-brand-cyan">Try AI Generation</span>
              <ChevronRight size={16} className="text-brand-cyan group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </section>

        {/* Template filters & View All Button */}
        <section className="max-w-6xl mx-auto w-full space-y-3">
          {!showGrid ? (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowGrid(true)}
                className="px-6 py-3 rounded-xl border border-white/10 glass-card hover:border-brand-cyan/30 text-sm font-semibold text-text-secondary hover:text-brand-cyan transition-all flex items-center gap-2 shadow-lg"
              >
                <Search size={16} />
                View all inbuilt Machines and generate HMI
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-bg-card border border-bg-border rounded-xl px-4 h-11 max-w-xl">
                <Search size={15} className="text-text-muted shrink-0" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search 45 machines, categories, keywords..."
                  className="flex-1 bg-transparent text-sm text-text-secondary placeholder:text-text-muted outline-none font-sans" />
                {search && <button onClick={() => setSearch('')} className="text-text-muted hover:text-text-secondary"><X size={13} /></button>}
              </div>
      
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-wider shrink-0">
                  <Filter size={10} />Filter
                </div>
                <button onClick={() => setActiveCategory(null)}
                  className={clsx('h-7 px-3 rounded-full border text-xs font-semibold transition-all',
                    activeCategory === null ? 'bg-text-primary text-bg-base border-text-primary' : 'border-bg-border text-text-muted hover:text-text-secondary hover:border-text-muted')}>
                  All ({MACHINE_TEMPLATES.length})
                </button>
                {MACHINE_CATEGORIES.map(cat => {
                  const count = MACHINE_TEMPLATES.filter(m => m.category === cat).length
                  const isActive = activeCategory === cat
                  return (
                    <button key={cat} onClick={() => setActiveCategory(isActive ? null : cat)}
                      className={clsx('h-7 px-3 rounded-full border text-xs font-semibold transition-all',
                        isActive ? CATEGORY_ACTIVE[cat] : `${CATEGORY_COLORS[cat]} hover:opacity-80`)}>
                      {cat} ({count})
                    </button>
                  )
                })}
              </div>

              <p className="text-[11px] text-text-muted font-mono">
                {filtered.length} machine{filtered.length !== 1 ? 's' : ''} found
                {search && <span> for "<span className="text-text-secondary">{search}</span>"</span>}
                {activeCategory && <span> in <span className="text-text-secondary">{activeCategory}</span></span>}
              </p>
              {/* Add quick access for creating a custom machine while browsing templates */}
              <div className="flex justify-end mt-2">
                <button onClick={() => setShowCustom(true)}
                  className="h-9 px-4 rounded-lg border border-bg-border text-text-muted text-xs font-semibold hover:text-text-secondary">
                  <Plus size={12} /> Custom Machine
                </button>
              </div>
            </>
          )}
        </section>

        {/* Review panel */}
        {draftMachine && reviewOpen && (
          <section className="max-w-6xl mx-auto w-full mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <ReviewPanel draftMachine={draftMachine} onUpdateSignal={updateSignal} onRemoveSignal={removeSignal}
              onAddSignal={addSignal} onRemovePart={removePart} onAddPart={addPart} onClose={() => setReviewOpen(false)} />
            <TemplateSchematicPreview machine={draftMachine} />
          </section>
        )}

        {/* Machine grid — FIX #1: all 45 machines */}
        {showGrid && (
        <section className="max-w-6xl mx-auto w-full mt-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-text-secondary font-semibold">No templates match</p>
              <p className="text-text-muted text-sm mt-1">Try AI generation or create a custom machine</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowAI(true)}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-semibold hover:bg-brand-cyan/20">
                  <Brain size={13} />AI Generation
                </button>
                <button onClick={() => setShowCustom(true)}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg border border-bg-border text-text-muted text-xs font-semibold hover:text-text-secondary">
                  <Plus size={13} />Custom Machine
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filtered.map(machine => {
                const isSelected = selected?.id === machine.id
                return (
                  <button key={machine.id} onClick={() => handleSelect(machine)}
                    className={clsx('group relative flex flex-col items-start text-left rounded-xl border p-3 transition-all duration-300',
                      isSelected
                        ? 'border-brand-cyan/60 bg-brand-cyan/10 ring-1 ring-brand-cyan/30 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                        : 'border-white/5 glass-card hover:border-brand-cyan/20 hover:-translate-y-1 hover:shadow-lg')}>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-cyan flex items-center justify-center">
                        <Check size={10} className="text-bg-base" />
                      </div>
                    )}
                    <div className={clsx('text-2xl mb-2 w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                      isSelected ? 'bg-brand-cyan/15' : 'bg-bg-base group-hover:bg-bg-card')}>
                      {machine.icon}
                    </div>
                    <p className={clsx('text-[12px] font-semibold leading-tight mb-1.5 pr-4',
                      isSelected ? 'text-brand-cyan' : 'text-text-primary')}>
                      {machine.name}
                    </p>
                    <span className={clsx('text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
                      CATEGORY_COLORS[machine.category])}>
                      {machine.category}
                    </span>
                    <p className="text-[10px] text-text-muted mt-1.5 font-mono">
                      {machine.signals.length} signals / {machine.components.length} parts
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </section>
        )}
      </main>

      {/* Bottom bar */}
      <div className={clsx('fixed bottom-0 left-0 right-0 transition-all duration-300 z-50',
        draftMachine ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none')}>
        <div className="glass-panel border-t border-white/10 border-x-0 border-b-0 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-xl shrink-0">{draftMachine?.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{draftMachine?.name}</p>
                <p className="text-xs text-text-muted">Review signals and parts before generating.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-4 text-[11px] text-text-muted font-mono">
                <span>{draftMachine?.components.length ?? 0} parts</span>
                <span>{draftMachine?.signals.length ?? 0} signals</span>
                <span className="flex items-center gap-1 text-brand-cyan"><Zap size={10} />AI suggested</span>
              </div>
              <button onClick={() => setReviewOpen(true)}
                className="h-10 px-4 rounded-lg border border-bg-border text-xs font-semibold text-text-secondary hover:border-brand-cyan/30 hover:text-brand-cyan">
                Review & Preview
              </button>
              <button disabled={!canGenerate} onClick={() => draftMachine && onComplete(draftMachine)}
                className="flex items-center gap-2 h-10 px-5 rounded-lg bg-brand-cyan text-bg-base text-sm font-semibold hover:bg-brand-glow disabled:opacity-40 disabled:cursor-not-allowed">
                Generate HMI <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal — FIX #2 + #3 */}
      {showAI && (
        <AIMachineModal
          onClose={() => setShowAI(false)}
          onComplete={(machine) => { setShowAI(false); onComplete(machine) }}
        />
      )}

      {/* Custom modal */}
      {showCustom && (
        <CustomMachineModal
          onClose={() => setShowCustom(false)}
          onComplete={(machine) => { setShowCustom(false); onComplete(machine) }}
        />
      )}
    </div>
  )
}
