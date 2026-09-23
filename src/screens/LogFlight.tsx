import { useLiveQuery } from 'dexie-react-hooks'
import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '../core/db/schema'
import type { ModuleId } from '../core/db/types'
import { feedback, toast } from '../core/feedback/feedback'
import { logFlight } from '../core/flight-log/flights'
import { afterActivity } from '../core/session/session'
import { dayKey, fromDayKey } from '../core/time'
import { MODULES } from '../modules/registry'
import { Button } from '../ui/primitives/Button'
import { TextField } from '../ui/primitives/Field'
import { Empty, Page, Rows, Section } from '../ui/primitives/Page'

/** Registro manual de un vuelo real: algo resuelto en la vida real sin IA, GPS o calculadora. */
export function LogFlight() {
  const { t, i18n } = useTranslation()
  const [title, setTitle] = useState('')
  const [moduleId, setModuleId] = useState<ModuleId>()
  const [minutes, setMinutes] = useState('10')
  const [date, setDate] = useState(dayKey())
  const recent = useLiveQuery(() => db.flights.where('kind').equals('real').reverse().sortBy('createdAt'), [])
  const fmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' })

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !moduleId) return
    await logFlight({ kind: 'real', moduleId, title: title.trim(), minutes: Math.max(1, Number(minutes) || 1), source: 'declared', date })
    feedback.land()
    toast(t('log.saved'), 'success')
    setTitle('')
    setModuleId(undefined)
    await afterActivity()
  }

  return (
    <Page title={t('log.title')} lead={t('log.lead')}>
      <form onSubmit={save} className="flex flex-col gap-6">
        <TextField label={t('log.what')} hint={t('log.whatHint')} value={title} onChange={(e) => setTitle(e.target.value)} required />
        <fieldset>
          <legend className="mb-2 font-display text-[0.95rem] font-bold">{t('log.which')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {MODULES.map(({ meta, icon: Icon }) => (
              <label key={meta.id} className="relative">
                <input type="radio" name="module" className="peer absolute inset-0 opacity-0" checked={moduleId === meta.id} onChange={() => setModuleId(meta.id)} />
                <span className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-sm peer-checked:border-accent peer-checked:bg-panel-2 peer-checked:font-bold peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--focus)]">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {t(`modules.${meta.id}`)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t('log.minutes')} type="number" inputMode="numeric" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          <TextField label={t('log.date')} type="date" max={dayKey()} value={date} onChange={(e) => setDate(e.target.value || dayKey())} />
        </div>
        <Button type="submit" block disabled={!title.trim() || !moduleId}>
          {t('log.save')}
        </Button>
      </form>

      <Section title={t('log.recent')}>
        {!recent?.length ? (
          <Empty>{t('log.empty')}</Empty>
        ) : (
          <Rows>
            {recent.slice(0, 15).map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-bold">{f.title}</span>
                  <span className="text-sm text-ink-dim">
                    {t(`modules.${f.moduleId}`)} · {fmt.format(fromDayKey(f.date))} · {t('log.minutesShort', { count: f.minutes })}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => db.flights.delete(f.id)}
                  aria-label={t('log.delete', { title: f.title })}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-dim hover:text-red"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </Rows>
        )}
      </Section>
    </Page>
  )
}
