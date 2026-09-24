import { useLiveQuery } from 'dexie-react-hooks'
import { Check, CircleCheckBig, Clock, MapPin, Plane, Smartphone, Sparkles, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { db } from '../../core/db/schema'
import type { Mission } from '../../core/db/types'
import { feedback } from '../../core/feedback/feedback'
import { needsBet, scoreTier } from '../../core/missions/scoring'
import { bestScore, completeMission, findTemplate, placeBet, swapTodayMission } from '../../core/session/session'
import { loadSnapshot } from '../../core/stats/stats'
import { ALL_MISSIONS, ENABLED_MODULE_IDS, MODULE_BY_ID } from '../../modules/registry'
import { Button } from '../primitives/Button'
import { useCountUp } from '../useCountUp'
import { BetForm, BetTicket, ResultForm } from './MissionPlay'
import { resultLine } from './resultLine'

interface MissionText {
  title: string
  goal: string
  steps: string[]
  example: string
  done: string
  why: string
  bet?: string
  check?: string
}

/**
 * La misión del día con forma de pase de abordar: de qué muleta despegas, a dónde vas,
 * los pasos (que se pueden marcar) y, abajo, el talón con la acción. Muchas misiones se
 * juegan: primero anotas tu apuesta y al volver compruebas cuánto acertaste.
 *
 * onStart: lo que hay que hacer antes de ir a la pantalla de la misión (la sesión la
 * usa para cerrar la sesión y no dejarla a medias).
 */
export function MissionCard({ mission, onStart }: { mission: Mission; onStart?: () => Promise<void> }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const template = findTemplate(ALL_MISSIONS, mission.templateId)
  const [mode, setMode] = useState<'idle' | 'bet' | 'check'>('idle')
  // Se puede cambiar una vez al día: si hoy ya hay una misión descartada, no se ofrece más.
  const swappedToday = useLiveQuery(
    () => db.missions.where('assignedOn').equals(mission.assignedOn).filter((m) => m.status === 'skipped').count(),
    [mission.assignedOn],
  )

  const text: MissionText | undefined = template ? (t(`missions.${template.textKey}`, { returnObjects: true }) as MissionText) : undefined
  const module = MODULE_BY_ID[mission.moduleId]
  const Icon = module.icon
  const accent = mission.surprise ? 'var(--magenta)' : module.meta.accent
  const check = template?.check
  const hasScreen = Boolean(template?.to)
  const inApp = hasScreen && !template?.outside
  const betFirst = needsBet(check) && !hasScreen
  const done = mission.status === 'done'
  const stepsDone = new Set(mission.stepsDone ?? [])
  const labels = { bet: text?.bet, check: text?.check }

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

  async function start() {
    await onStart?.()
    navigate(template!.to!)
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-panel" aria-labelledby={`mission-${mission.id}`}>
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 text-on-accent" style={{ background: accent }}>
        <p className="flex items-center gap-2 font-display text-sm font-bold">
          {mission.surprise ? <Sparkles className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
          {mission.surprise ? t('missions.surpriseLabel') : t('missions.label')}: {t(`modules.${mission.moduleId}`)}
        </p>
        <p className="readout text-xs opacity-90" aria-hidden>
          HF {mission.assignedOn.slice(5).replace('-', '')}
        </p>
      </header>

      <div className="px-4 pt-4 pb-5">
        <h3 id={`mission-${mission.id}`} className="text-[1.4rem] leading-tight">
          {text?.title ?? t('missions.fallbackTitle')}
        </h3>
        {text && <p className="prose-text mt-1.5 text-ink-dim">{text.goal}</p>}

        {/* La «ruta» del pase: de la muleta a hacerlo por tu cuenta. */}
        <div className="mt-4 flex items-center gap-2" aria-label={t('missions.routeAria', { from: t(`crutch.${mission.moduleId}`), to: t(`own.${mission.moduleId}`) })} role="img">
          <span className="max-w-[40%] min-w-0 text-left">
            <span className="block text-xs text-ink-dim">{t('missions.from')}</span>
            <span className="block font-display leading-tight font-bold">{t(`crutch.${mission.moduleId}`)}</span>
          </span>
          <span aria-hidden className="relative flex h-6 min-w-12 flex-1 items-center">
            <span className="h-0 w-full border-t-2 border-dashed border-line" />
            <Plane className="absolute left-1/2 h-5 w-5 -translate-x-1/2 rotate-45" style={{ color: accent }} />
          </span>
          <span className="max-w-[40%] min-w-0 text-right">
            <span className="block text-xs text-ink-dim">{t('missions.to')}</span>
            <span className="block font-display leading-tight font-bold">{t(`own.${mission.moduleId}`)}</span>
          </span>
        </div>

        {template && (
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            <li className="flex items-center gap-1.5 rounded-full bg-panel-2 px-3 py-1">
              <Clock className="h-4 w-4 text-ink-dim" aria-hidden />
              {t('missions.minutesChip', { count: template.minutes })}
            </li>
            <li className="flex items-center gap-1.5 rounded-full bg-panel-2 px-3 py-1">
              {inApp ? <Smartphone className="h-4 w-4 text-ink-dim" aria-hidden /> : <MapPin className="h-4 w-4 text-ink-dim" aria-hidden />}
              {inApp ? t('missions.whereApp') : t('missions.whereLife')}
            </li>
            {check && (
              <li className="flex items-center gap-1.5 rounded-full bg-panel-2 px-3 py-1">
                <Trophy className="h-4 w-4 text-amber" aria-hidden />
                {t('missions.scored')}
              </li>
            )}
          </ul>
        )}

        {text && !done && (
          <>
            <h4 className="mt-5 mb-2 font-display font-bold">{t('missions.howTo')}</h4>
            <ol className="flex flex-col gap-2">
              {text.steps.map((step, i) => {
                const checked = stepsDone.has(i)
                return (
                  <li key={i}>
                    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl bg-panel-2 px-3 py-2.5 has-focus-visible:outline-3 has-focus-visible:outline-[var(--focus)]">
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => void toggleStep(i)} />
                      <span
                        aria-hidden
                        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-bold transition-colors ${
                          checked ? 'border-green bg-green text-on-accent' : 'border-accent text-accent'
                        }`}
                      >
                        {checked ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={checked ? 'text-ink-dim line-through decoration-1' : ''}>
                        <span className="sr-only">{t('missions.stepN', { n: i + 1 })} </span>
                        {step}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ol>

            <p className="mt-4 flex items-start gap-2">
              <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-green" aria-hidden />
              <span>
                <span className="font-bold">{t('missions.doneWhen')}</span> {text.done}
              </span>
            </p>

            <div className="mt-3 flex flex-col">
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer items-center font-bold text-accent">{t('missions.exampleLabel')}</summary>
                <p className="prose-text mb-2 border-l-4 border-accent pl-3">{text.example}</p>
              </details>
              <details>
                <summary className="flex min-h-11 cursor-pointer items-center font-bold text-accent">{t('missions.whyLabel')}</summary>
                <p className="prose-text text-ink-dim">{text.why}</p>
                <Link to={{ pathname: '/evidence', hash: mission.moduleId }} className="inline-block py-2 text-accent underline underline-offset-4">
                  {t('missions.evidenceLink')}
                </Link>
              </details>
            </div>
          </>
        )}
      </div>

      {/* Línea perforada del billete, con sus muescas. */}
      <div aria-hidden className="relative h-0 border-t-2 border-dashed border-line">
        <span className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-bg" />
        <span className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-bg" />
      </div>

      <div className="px-4 pt-5 pb-4">
        {done ? (
          <DoneStub mission={mission} />
        ) : mode === 'bet' && check ? (
          <BetForm
            check={check}
            labels={labels}
            onCancel={() => setMode('idle')}
            onSave={async (bet) => {
              await placeBet(mission, bet)
              setMode('idle')
            }}
          />
        ) : mode === 'check' && check ? (
          <ResultForm
            check={check}
            mission={mission}
            labels={labels}
            onCancel={() => setMode('idle')}
            onSubmit={(result) => void completeMission(mission, template, result)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {hasScreen ? (
              <>
                <Button block onClick={() => void start()}>
                  {t('missions.start')}
                </Button>
                <p className="text-center text-sm text-ink-dim">{t('missions.autoHint')}</p>
              </>
            ) : betFirst && !mission.bet ? (
              <>
                <Button block onClick={() => setMode('bet')}>
                  {t('missions.placeBet')}
                </Button>
                <p className="text-center text-sm text-ink-dim">{t('missions.betHint')}</p>
              </>
            ) : betFirst && mission.bet && check ? (
              <>
                <BetTicket bet={mission.bet} check={check} />
                <Button block className="mt-1" onClick={() => setMode('check')}>
                  {t('missions.checkNow')}
                </Button>
              </>
            ) : check ? (
              <Button block onClick={() => setMode('check')}>
                {t('missions.didIt')}
              </Button>
            ) : (
              <Button block onClick={() => void completeMission(mission, template)}>
                {t('missions.didIt')}
              </Button>
            )}
            {swappedToday === 0 && !mission.bet && (
              <Button variant="ghost" onClick={() => void swapTodayMission(mission, ALL_MISSIONS, ENABLED_MODULE_IDS)}>
                {t('missions.swap')}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

/** El talón sellado: puntuación, minutos sumados y cuánto falta para ascender. */
function DoneStub({ mission }: { mission: Mission }) {
  const { t, i18n } = useTranslation()
  const template = findTemplate(ALL_MISSIONS, mission.templateId)
  const snap = useLiveQuery(() => loadSnapshot(), [])
  const best = useLiveQuery(() => bestScore(mission.templateId, mission.id), [mission.templateId, mission.id])
  const score = mission.result?.score
  const shown = useCountUp(score ?? 0)
  const next = snap?.rank.next
  const pct = Math.round((snap?.rank.progress ?? 0) * 100)
  const line = resultLine(template?.check, mission, t, i18n.language)
  const record = score !== undefined && best !== undefined && score > best

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="hf-stamp -rotate-8 rounded-lg border-[3px] border-green px-3 py-1 font-display text-xl font-bold tracking-wide text-green uppercase">
          {t('missions.stamp')}
        </p>
        {score !== undefined && (
          <p className="text-right">
            <span className="block text-sm text-ink-dim">{t('missions.precision')}</span>
            <span className="readout block text-5xl leading-none">{shown}</span>
          </p>
        )}
      </div>

      {score !== undefined && (
        <div>
          <p className="font-display text-lg font-bold">
            {t(`missions.tier.${scoreTier(score)}`)}
            {record && <span className="ml-2 rounded-full bg-amber px-2 py-0.5 align-middle text-sm text-on-accent">{t('missions.newRecord')}</span>}
          </p>
          {line && <p className="text-ink-dim">{line}</p>}
          {best !== undefined && !record && <p className="text-sm text-ink-dim">{t('missions.bestSoFar', { best })}</p>}
        </div>
      )}

      <p className="font-bold">{mission.auto ? t('missions.doneLogged') : t('missions.doneMinutes', { count: template?.minutes ?? 10 })}</p>

      {snap && next && (
        <div>
          <p className="mb-1 text-sm text-ink-dim">{t('missions.towardRank', { rank: t(`ranks.${next.id}`), pct })}</p>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-panel-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={t('missions.towardRank', { rank: t(`ranks.${next.id}`), pct })}
          >
            <div className="h-full rounded-full bg-green transition-[width] duration-700" style={{ width: `${Math.max(4, pct)}%` }} />
          </div>
        </div>
      )}
      <p className="text-ink-dim">{t('missions.doneBye')}</p>
    </div>
  )
}
