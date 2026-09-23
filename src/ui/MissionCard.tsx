import { useLiveQuery } from 'dexie-react-hooks'
import { Check, CircleCheckBig, Clock, MapPin, Smartphone, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { db } from '../core/db/schema'
import type { Mission } from '../core/db/types'
import { feedback } from '../core/feedback/feedback'
import { completeMission, findTemplate, swapTodayMission } from '../core/session/session'
import { loadSnapshot } from '../core/stats/stats'
import { ALL_MISSIONS, ENABLED_MODULE_IDS } from '../modules/registry'
import { Button } from './primitives/Button'
import { TextField } from './primitives/Field'

interface MissionText {
  title: string
  goal: string
  steps: string[]
  example: string
  done: string
  why: string
}

/**
 * La misión del día como instrucción completa: qué lograr, pasos que se pueden marcar,
 * un ejemplo, cuándo está cumplida y por qué sirve. Las que se hacen en la app llevan
 * a la pantalla correcta y se cumplen solas; las de fuera se marcan con «¡La cumplí!».
 *
 * onStart: lo que hay que hacer antes de ir a la pantalla de la misión (la sesión la
 * usa para cerrar la sesión y no dejarla a medias).
 */
export function MissionCard({ mission, onStart }: { mission: Mission; onStart?: () => Promise<void> }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const template = findTemplate(ALL_MISSIONS, mission.templateId)
  const [reporting, setReporting] = useState(false)
  const [minutes, setMinutes] = useState(String(template?.minutes ?? 10))
  const [note, setNote] = useState('')
  // Se puede cambiar una vez al día: si hoy ya hay una misión descartada, no se ofrece más.
  const swappedToday = useLiveQuery(
    () => db.missions.where('assignedOn').equals(mission.assignedOn).filter((m) => m.status === 'skipped').count(),
    [mission.assignedOn],
  )

  const text: MissionText | undefined = template ? t(`missions.${template.textKey}`, { returnObjects: true }) as MissionText : undefined
  const inApp = Boolean(template?.to)
  const stepsDone = new Set(mission.stepsDone ?? [])
  const allSteps = Boolean(text && text.steps.every((_, i) => stepsDone.has(i)))

  async function toggleStep(i: number) {
    if (!stepsDone.has(i)) feedback.tick()
    // Se modifica sobre lo guardado, no sobre lo que se pintó: con dos toques rápidos,
    // el segundo aún vería la lista vieja y borraría el primero.
    await db.missions
      .where('id')
      .equals(mission.id)
      .modify((m) => {
        const next = new Set(m.stepsDone ?? [])
        if (next.has(i)) next.delete(i)
        else next.add(i)
        m.stepsDone = [...next].sort()
      })
  }

  async function done() {
    await completeMission(mission, template, Math.max(1, Number(minutes) || 1), note.trim())
    setReporting(false)
  }

  async function start() {
    await onStart?.()
    navigate(template!.to!)
  }

  const border = mission.status === 'done' ? 'border-green' : mission.surprise ? 'border-magenta' : 'border-line'

  return (
    <article className={`rounded-2xl border bg-panel p-4 ${border}`} aria-labelledby={`mission-${mission.id}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-ink-dim">
        <p className="flex items-center gap-1.5">
          {mission.surprise && <Sparkles className="h-4 w-4 text-magenta" aria-hidden />}
          {mission.surprise ? t('missions.surpriseLabel') : t('missions.label')}: {t(`modules.${mission.moduleId}`)}
        </p>
        {template && (
          <p className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden />
              {t('missions.minutesChip', { count: template.minutes })}
            </span>
            <span className="flex items-center gap-1">
              {inApp ? <Smartphone className="h-4 w-4" aria-hidden /> : <MapPin className="h-4 w-4" aria-hidden />}
              {inApp ? t('missions.whereApp') : t('missions.whereLife')}
            </span>
          </p>
        )}
      </div>

      <h3 id={`mission-${mission.id}`} className="text-xl leading-snug font-bold">
        {text?.title ?? t('missions.fallbackTitle')}
      </h3>
      {text && <p className="prose-text mt-1">{text.goal}</p>}

      {mission.status === 'done' ? (
        <Celebration mission={mission} />
      ) : reporting ? (
        <form
          className="animate-pop mt-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void done()
          }}
        >
          <p className="font-bold">{t('missions.reportTitle')}</p>
          <TextField label={t('missions.minutes')} type="number" inputMode="numeric" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          <TextField label={t('missions.note')} hint={t('missions.noteHint')} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setReporting(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('missions.logIt')}</Button>
          </div>
        </form>
      ) : (
        <>
          {text && (
            <>
              <h4 className="mt-4 mb-2 font-display font-bold">{t('missions.howTo')}</h4>
              <ol className="flex flex-col gap-2">
                {text.steps.map((step, i) => {
                  const checked = stepsDone.has(i)
                  return (
                    <li key={i}>
                      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-line bg-panel-2 px-3 py-2.5 has-focus-visible:outline-2 has-focus-visible:outline-accent">
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => void toggleStep(i)} />
                        <span
                          aria-hidden
                          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-bold transition-colors ${
                            checked ? 'border-green bg-green text-on-accent' : 'border-accent text-accent'
                          }`}
                        >
                          {checked ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                        </span>
                        <span className={checked ? 'text-ink-dim' : ''}>
                          <span className="sr-only">{t('missions.stepN', { n: i + 1 })} </span>
                          {step}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ol>

              <div className="mt-4 border-l-4 border-accent pl-3">
                <p className="text-sm font-bold text-ink-dim">{t('missions.exampleLabel')}</p>
                <p className="prose-text">{text.example}</p>
              </div>

              <p className="mt-4 flex items-start gap-2">
                <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-green" aria-hidden />
                <span>
                  <span className="font-bold">{t('missions.doneWhen')}</span> {text.done}
                </span>
              </p>

              <details className="mt-3 text-ink-dim">
                <summary className="min-h-11 cursor-pointer py-2 font-bold text-ink">{t('missions.whyLabel')}</summary>
                <p className="prose-text">{text.why}</p>
                <Link to={{ pathname: '/evidence', hash: mission.moduleId }} className="mt-1 inline-block py-2 text-accent underline underline-offset-4">
                  {t('missions.evidenceLink')}
                </Link>
              </details>
            </>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {allSteps && !inApp && <p className="animate-pop text-center font-bold text-green">{t('missions.allSteps')}</p>}
            {inApp ? (
              <Button block onClick={() => void start()}>
                {t('missions.start')}
              </Button>
            ) : (
              <Button block className={allSteps ? 'animate-pop' : ''} onClick={() => setReporting(true)}>
                {t('missions.didIt')}
              </Button>
            )}
            {inApp && <p className="text-center text-sm text-ink-dim">{t('missions.autoHint')}</p>}
            {swappedToday === 0 && (
              <Button variant="ghost" onClick={() => void swapTodayMission(mission, ALL_MISSIONS, ENABLED_MODULE_IDS)}>
                {t('missions.swap')}
              </Button>
            )}
          </div>
        </>
      )}
    </article>
  )
}

/** Recompensa al cumplir: minutos sumados y cuánto falta para el siguiente rango. */
function Celebration({ mission }: { mission: Mission }) {
  const { t } = useTranslation()
  const snap = useLiveQuery(() => loadSnapshot(), [])
  const flight = useLiveQuery(() => db.flights.where('date').equals(mission.assignedOn).filter((f) => f.refId === mission.id).first(), [mission.id])
  const next = snap?.rank.next
  const pct = Math.round((snap?.rank.progress ?? 0) * 100)

  return (
    <div className="animate-pop mt-4 flex flex-col gap-3">
      <p className="flex items-center gap-2 text-lg font-bold text-green">
        <CircleCheckBig className="h-6 w-6" aria-hidden />
        {t('missions.doneLabel')}
      </p>
      <p>{flight ? t('missions.doneMinutes', { count: flight.minutes }) : t('missions.doneLogged')}</p>
      {snap && next && (
        <div>
          <p className="mb-1 text-sm text-ink-dim">{t('missions.towardRank', { rank: t(`ranks.${next.id}`), pct })}</p>
          <div className="h-2.5 overflow-hidden rounded-full bg-panel-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t('missions.towardRank', { rank: t(`ranks.${next.id}`), pct })}>
            <div className="h-full rounded-full bg-green transition-[width] duration-700" style={{ width: `${Math.max(4, pct)}%` }} />
          </div>
        </div>
      )}
      <p className="text-ink-dim">{t('missions.doneBye')}</p>
    </div>
  )
}
