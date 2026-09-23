import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { db } from '../../../core/db/schema'
import type { RouteMission } from '../../../core/db/types'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity } from '../../../core/session/session'
import { Button } from '../../../ui/primitives/Button'
import { TextField, Toggle } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'

export function RouteFly() {
  const { t } = useTranslation('navigation')
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const route = useLiveQuery(() => db.routes.get(id), [id])
  const [usedGps, setUsedGps] = useState<RouteMission['usedGps']>()
  const [gotLost, setGotLost] = useState(false)
  const [minutes, setMinutes] = useState('20')

  if (route === undefined) return null
  if (!route || route.status !== 'planned') return <Page title={t('notFound')} back="/m/navigation" />

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!route || !usedGps) return
    const mins = Math.max(1, Number(minutes) || 1)
    await db.routes.update(route.id, { status: 'flown', flownAt: new Date().toISOString(), usedGps, gotLost, minutes: mins })
    // Un vistazo al GPS aún cuenta como vuelo manual; seguirlo de principio a fin no.
    if (usedGps !== 'yes') {
      await logFlight({ kind: 'real', moduleId: 'navigation', title: route.title, minutes: mins, source: 'declared', refId: route.id })
    }
    feedback.good()
    await afterActivity()
    navigate(`/m/navigation/r/${route.id}/recall`)
  }

  return (
    <Page title={t('flyTitle')} lead={t('flyLead')} back="/m/navigation">
      <div className="mb-6 rounded-2xl border border-line bg-panel p-4">
        <p className="font-bold">{route.title}</p>
        <p className="text-ink-dim">
          {route.from} → {route.to}
        </p>
        <p className="mt-2 text-sm text-ink-dim">{t('flyNoPeek')}</p>
      </div>
      <form onSubmit={save} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display text-[0.95rem] font-bold">{t('usedGpsLegend')}</legend>
          {(['no', 'glance', 'yes'] as const).map((v) => (
            <label key={v} className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-panel px-4 has-[:checked]:border-accent">
              <input type="radio" name="gps" value={v} checked={usedGps === v} onChange={() => setUsedGps(v)} className="h-5 w-5 accent-[var(--accent)]" />
              {t(`gps.${v}`)}
            </label>
          ))}
        </fieldset>
        <Toggle label={t('gotLost')} hint={t('gotLostHint')} checked={gotLost} onChange={setGotLost} />
        <TextField label={t('minutes')} type="number" inputMode="numeric" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <Button type="submit" block disabled={!usedGps}>
          {t('saveFlight')}
        </Button>
      </form>
    </Page>
  )
}
