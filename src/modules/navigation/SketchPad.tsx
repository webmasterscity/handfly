import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Eraser, Undo2 } from 'lucide-react'

export interface SketchPadHandle {
  toDataUrl: () => string | undefined
  isEmpty: () => boolean
}

/** Coordenadas normalizadas 0-1: el dibujo sobrevive a cambios de tamaño o de orientación. */
type Point = [number, number]

/** Lienzo simple para dibujar el croquis con el dedo o el ratón. */
export const SketchPad = forwardRef<SketchPadHandle, { label: string }>(function SketchPad({ label }, ref) {
  const { t } = useTranslation('navigation')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Point[][]>([])
  const strokesRef = useRef(strokes)
  const drawing = useRef<Point[] | null>(null)
  strokesRef.current = strokes

  const redraw = () => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.width) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const styles = getComputedStyle(document.documentElement)
    const { width: w, height: h } = canvas
    ctx.fillStyle = styles.getPropertyValue('--panel').trim() || '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = styles.getPropertyValue('--ink').trim() || '#000'
    ctx.lineWidth = 3 * (window.devicePixelRatio || 1)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokesRef.current) {
      ctx.beginPath()
      s.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)))
      if (s.length === 1) ctx.lineTo(s[0][0] * w + 0.1, s[0][1] * h)
      ctx.stroke()
    }
  }

  // El lienzo puede montarse oculto (pestaña inactiva): se dimensiona cuando tiene tamaño real.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (!width) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      redraw()
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  useEffect(redraw, [strokes])

  useImperativeHandle(ref, () => ({
    toDataUrl: () => (strokes.length ? canvasRef.current?.toDataURL('image/png') : undefined),
    isEmpty: () => strokes.length === 0,
  }))

  const point = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height]
  }

  const btn = 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 disabled:opacity-40'

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="aspect-square w-full touch-none rounded-2xl border border-line bg-panel"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drawing.current = [point(e)]
          setStrokes((s) => [...s, [...drawing.current!]])
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return
          drawing.current.push(point(e))
          const current = [...drawing.current]
          setStrokes((s) => [...s.slice(0, -1), current])
        }}
        onPointerUp={() => (drawing.current = null)}
        onPointerCancel={() => (drawing.current = null)}
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length} className={btn}>
          <Undo2 className="h-4 w-4" aria-hidden />
          {t('undo')}
        </button>
        <button type="button" onClick={() => setStrokes([])} disabled={!strokes.length} className={btn}>
          <Eraser className="h-4 w-4" aria-hidden />
          {t('clear')}
        </button>
      </div>
    </div>
  )
})
