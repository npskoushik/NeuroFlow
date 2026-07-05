// ============================================================
// DESTINATION: src/hooks/useDraggable.ts  (NEW FILE)
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'

interface Pos { x: number; y: number }

/**
 * Makes any panel draggable by its header.
 *
 * Usage:
 *   const { pos, onHeaderMouseDown } = useDraggable(768, 520)
 *
 *   // Backdrop (for click-outside-to-close):
 *   <div className="fixed inset-0 z-50 bg-bg-base/70 backdrop-blur-sm" onClick={onClose} />
 *
 *   // Floating panel:
 *   <div className="fixed z-[51] ..." style={{ left: pos.x, top: pos.y, width: panelW }}>
 *     // Header — drag handle:
 *     <div onMouseDown={onHeaderMouseDown} className="cursor-grab active:cursor-grabbing ...">
 *       ...header content...
 *     </div>
 *     // Scrollable body:
 *     <div className="overflow-y-auto" style={{ maxHeight: `calc(100vh - ${pos.y + 120}px)` }}>
 *       ...body...
 *     </div>
 *   </div>
 */
export function useDraggable(panelWidth = 768, panelHeight = 500) {
  const [pos, setPos] = useState<Pos>(() => ({
    x: Math.max(16, Math.min(window.innerWidth  - panelWidth  - 16, (window.innerWidth  - panelWidth)  / 2)),
    y: Math.max(16, Math.min(window.innerHeight - panelHeight - 16, (window.innerHeight - panelHeight) / 2)),
  }))

  // posRef keeps pos fresh inside event listeners (avoids stale closure)
  const posRef = useRef(pos)
  useEffect(() => { posRef.current = pos }, [pos])

  const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if user clicked a button/input inside the header
    if ((e.target as HTMLElement).closest('button,input,a,select')) return
    e.preventDefault()

    const offsetX = e.clientX - posRef.current.x
    const offsetY = e.clientY - posRef.current.y

    const MARGIN = 16 // keep panel away from viewport edges

    const onMove = (ev: MouseEvent) => {
      setPos({
        x: Math.max(MARGIN, Math.min(window.innerWidth  - panelWidth  - MARGIN, ev.clientX - offsetX)),
        y: Math.max(MARGIN, Math.min(window.innerHeight - 60           - MARGIN, ev.clientY - offsetY)),
      })
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }, [panelWidth])

  return { pos, onHeaderMouseDown }
}
