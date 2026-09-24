import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'
import { feedback } from '../../core/feedback/feedback'

/** Contador grande con − y +: más rápido y más claro que escribir un número en el teléfono. */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  const id = useId()
  const set = (v: number) => {
    const next = Math.max(min, Math.min(max, v))
    if (next !== value) feedback.tick()
    onChange(next)
  }
  return (
    <div role="group" aria-labelledby={id} className="flex items-center justify-between gap-3">
      <span id={id} className="font-display text-[0.95rem] font-bold">
        {label}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={`${label}: −1`}
          className="grid h-11 w-11 place-items-center rounded-full border border-line bg-panel-2 disabled:opacity-40"
        >
          <Minus className="h-5 w-5" aria-hidden />
        </button>
        <output aria-live="polite" className="readout w-10 text-center text-2xl">
          {value}
        </output>
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`${label}: +1`}
          className="grid h-11 w-11 place-items-center rounded-full border border-accent bg-accent text-on-accent disabled:opacity-40"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>
      </span>
    </div>
  )
}
