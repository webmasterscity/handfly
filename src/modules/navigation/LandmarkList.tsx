import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Lista ordenada editable de puntos de referencia. */
export function LandmarkList({ value, onChange, legend }: { value: string[]; onChange: (v: string[]) => void; legend: string }) {
  const { t } = useTranslation('navigation')
  const update = (i: number, text: string) => onChange(value.map((v, j) => (j === i ? text : v)))
  const move = (i: number, d: -1 | 1) => {
    const next = [...value]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-display text-[0.95rem] font-bold">{legend}</legend>
      <ol className="flex flex-col gap-2">
        {value.map((v, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="readout w-6 shrink-0 text-right text-ink-dim">{i + 1}</span>
            <input
              value={v}
              onChange={(e) => update(i, e.target.value)}
              aria-label={t('landmarkN', { n: i + 1 })}
              className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-3 py-2.5 focus:border-accent focus:outline-none"
            />
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('moveUp', { n: i + 1 })} className="grid h-11 w-9 place-items-center rounded-lg disabled:opacity-30">
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={t('moveDown', { n: i + 1 })} className="grid h-11 w-9 place-items-center rounded-lg disabled:opacity-30">
              <ArrowDown className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} disabled={value.length === 1} aria-label={t('remove', { n: i + 1 })} className="grid h-11 w-9 place-items-center rounded-lg disabled:opacity-30">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => onChange([...value, ''])} className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-2 text-accent">
        <Plus className="h-4 w-4" aria-hidden />
        {t('addLandmark')}
      </button>
    </fieldset>
  )
}
