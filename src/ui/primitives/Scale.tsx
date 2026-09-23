import { useId } from 'react'

/** Escala 1-5 accesible: radios nativos con aspecto de selector segmentado. */
export function Scale({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  name,
}: {
  label: string
  value: number | undefined
  onChange: (v: number) => void
  lowLabel: string
  highLabel: string
  name?: string
}) {
  const auto = useId()
  const group = name ?? auto
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-display text-[0.95rem] font-bold">{label}</legend>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="relative">
            <input
              type="radio"
              name={group}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer absolute inset-0 opacity-0"
            />
            <span className="readout flex h-12 items-center justify-center rounded-xl border border-line bg-panel text-lg transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
              {n}
            </span>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-sm text-ink-dim">
        <span>1 · {lowLabel}</span>
        <span>5 · {highLabel}</span>
      </div>
    </fieldset>
  )
}
