import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../core/db/schema'
import { MODULE_IDS, type ModuleId, type WeeklyCheck as WeeklyCheckRow } from '../core/db/types'
import { feedback, toast } from '../core/feedback/feedback'
import { afterActivity } from '../core/session/session'
import { weekKey } from '../core/time'
import { Button } from '../ui/primitives/Button'
import { Page } from '../ui/primitives/Page'

type Answer = 'solo' | 'mixed' | 'crutch'
const ANSWERS: Answer[] = ['solo', 'mixed', 'crutch']

/**
 * Chequeo semanal con un toque por habilidad: esta semana, ¿lo hiciste tú, mitad y mitad,
 * o se lo dejaste a la muleta? Sin escribir nada. Se guarda como antes (una entrada por
 * habilidad en «solo» y/o en «muletas»), así el horizonte del panel no cambia.
 */
export function WeeklyCheck() {
  const week = weekKey()
  // null = no hay chequeo esta semana; undefined = todavía cargando.
  const existing = useLiveQuery(async () => (await db.weeklyChecks.get(week)) ?? null, [week])
  if (existing === undefined) return null
  return <WeeklyCheckForm key={week} week={week} existing={existing} />
}

function WeeklyCheckForm({ week, existing }: { week: string; existing: WeeklyCheckRow | null }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Partial<Record<ModuleId, Answer>>>(() => {
    // Rellena con lo guardado esta semana si ya se hizo el chequeo.
    const out: Partial<Record<ModuleId, Answer>> = {}
    for (const id of MODULE_IDS) {
      const label = t(`modules.${id}`)
      const solo = existing?.solo.includes(label)
      const crutch = existing?.crutches.includes(label)
      if (solo || crutch) out[id] = solo && crutch ? 'mixed' : solo ? 'solo' : 'crutch'
    }
    return out
  })

  async function save() {
    const solo: string[] = []
    const crutches: string[] = []
    for (const [id, a] of Object.entries(answers) as [ModuleId, Answer][]) {
      const label = t(`modules.${id}`)
      if (a !== 'crutch') solo.push(label)
      if (a !== 'solo') crutches.push(label)
    }
    await db.weeklyChecks.put({ week, crutches, solo, note: existing?.note ?? '', createdAt: new Date().toISOString() })
    feedback.good()
    toast(t('weekly.saved'), 'success')
    await afterActivity()
    navigate('/progress')
  }

  return (
    <Page title={t('weekly.title')} lead={t('weekly.lead')} back="/progress">
      <div className="flex flex-col gap-4">
        {MODULE_IDS.map((id) => (
          <fieldset key={id} className="rounded-2xl border border-line bg-panel p-4">
            <legend className="sr-only">{t(`weekly.q.${id}`)}</legend>
            <p aria-hidden className="mb-3 font-display font-bold">
              {t(`weekly.q.${id}`)}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ANSWERS.map((a) => (
                <label key={a} className="relative">
                  <input
                    type="radio"
                    name={id}
                    checked={answers[id] === a}
                    onChange={() => setAnswers({ ...answers, [id]: a })}
                    className="peer absolute inset-0 opacity-0"
                  />
                  <span
                    className={`flex min-h-12 items-center justify-center rounded-xl border-2 border-line px-1 text-center text-sm font-bold transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] ${
                      a === 'solo' ? 'peer-checked:border-green peer-checked:bg-green' : a === 'mixed' ? 'peer-checked:border-accent peer-checked:bg-accent' : 'peer-checked:border-amber peer-checked:bg-amber'
                    } peer-checked:text-on-accent`}
                  >
                    {t(`weekly.a.${a}`)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <p className="text-sm text-ink-dim">{t('weekly.skipHint')}</p>
        <Button block onClick={save} disabled={!Object.keys(answers).length}>
          {t('weekly.save')}
        </Button>
      </div>
    </Page>
  )
}
