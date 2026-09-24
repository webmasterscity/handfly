import { useLiveQuery } from 'dexie-react-hooks'
import { PlaneLanding, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { db } from '../core/db/schema'
import type { MemoryCard } from '../core/db/types'
import { feedback } from '../core/feedback/feedback'
import { completeSession, ensureTodayMission, findTemplate, missionTitle, recordSessionReview, startSession } from '../core/session/session'
import { useSettings } from '../core/settings/settings'
import { dueCards } from '../core/srs/scheduler'
import { dayKey } from '../core/time'
import { ALL_MISSIONS, ENABLED_MODULE_IDS } from '../modules/registry'
import { MissionCard } from '../ui/mission/MissionCard'
import { Button } from '../ui/primitives/Button'
import { ReviewRunner, type RunnerResult } from '../ui/review/ReviewRunner'

type Phase = 'briefing' | 'reviews' | 'mission' | 'landing'

/**
 * Sesión diaria de 5-10 minutos: repasos pendientes (con tope) + una misión real.
 * Tiene final: al aterrizar, la app se despide. No hay "una más".
 */
export function Session() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sessionSize } = useSettings()
  const [phase, setPhase] = useState<Phase>('briefing')
  const [cards, setCards] = useState<MemoryCard[]>()
  const [result, setResult] = useState<RunnerResult>({ reviewed: 0, recalled: 0 })
  const mission = useLiveQuery(
    async () => (await db.missions.where('assignedOn').equals(dayKey()).toArray()).find((m) => m.status !== 'skipped'),
    [],
  )

  useEffect(() => {
    void (async () => {
      await startSession()
      await ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS)
      setCards(await dueCards(sessionSize))
    })()
  }, [sessionSize])

  async function land() {
    setPhase('landing')
    feedback.land()
    await completeSession()
  }

  const close = (
    <Link to="/" aria-label={t('session.exit')} className="grid h-11 w-11 place-items-center rounded-full text-ink-dim hover:text-ink">
      <X className="h-6 w-6" aria-hidden />
    </Link>
  )

  if (!cards) return null
  const template = mission ? findTemplate(ALL_MISSIONS, mission.templateId) : undefined

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-4 pb-8">
      <header className="mb-6 flex items-center justify-between">
        <p className="font-display font-bold">{t(`session.phase.${phase}`)}</p>
        {phase !== 'landing' && close}
      </header>

      {phase === 'briefing' && (
        <div className="flex flex-1 flex-col gap-6">
          <h1 className="text-[1.75rem]">{t('session.briefingTitle')}</h1>
          <ol className="flex flex-col gap-3">
            <li className="rounded-2xl border border-line bg-panel p-4">
              <p className="font-bold">{t('session.stepReviews', { count: cards.length })}</p>
              <p className="text-sm text-ink-dim">{cards.length ? t('session.stepReviewsHint') : t('session.noReviews')}</p>
            </li>
            <li className="rounded-2xl border border-line bg-panel p-4">
              <p className="font-bold">{t('session.stepMission')}</p>
              <p className="text-sm text-ink-dim">{template ? missionTitle(template) : '…'}</p>
            </li>
          </ol>
          <Button block className="mt-auto" onClick={() => setPhase(cards.length ? 'reviews' : 'mission')}>
            {t('session.takeoff')}
          </Button>
        </div>
      )}

      {phase === 'reviews' && (
        <ReviewRunner
          cards={cards}
          onReviewed={(ok) => recordSessionReview(ok)}
          onDone={(r) => {
            setResult(r)
            setPhase('mission')
          }}
        />
      )}

      {phase === 'mission' && (
        <div className="flex flex-1 flex-col gap-6">
          <h1 className="text-[1.75rem]">{t('session.missionTitle')}</h1>
          <p className="prose-text text-ink-dim">
            {mission?.status === 'done' ? t('session.missionLeadDone') : template?.to ? t('session.missionLeadApp') : t('session.missionLeadLife')}
          </p>
          {/* Si la misión se hace en la app, «Empezar» cierra la sesión antes de ir allá. */}
          {mission && <MissionCard mission={mission} onStart={completeSession} />}
          <Button block variant={mission?.status === 'done' || !template?.to ? 'primary' : 'secondary'} className="mt-auto" onClick={land}>
            <PlaneLanding className="h-5 w-5" aria-hidden />
            {t('session.land')}
          </Button>
        </div>
      )}

      {phase === 'landing' && (
        <div className="animate-pop flex flex-1 flex-col gap-5">
          <span aria-hidden className="hf-badge mx-auto grid h-24 w-24 place-items-center rounded-full bg-green text-on-accent">
            <PlaneLanding className="h-12 w-12" />
          </span>
          <h1 className="text-center text-[2rem]">{t('session.landedTitle')}</h1>
          {result.reviewed > 0 && (
            <p className="text-center">
              <span className="readout block text-5xl">
                {result.recalled}/{result.reviewed}
              </span>
              <span className="text-ink-dim">{t('session.landedReviewsShort')}</span>
            </p>
          )}
          <div className="rounded-2xl border border-line bg-panel p-5">
            <p className="mb-1 text-sm text-ink-dim">{t('session.applyLabel')}</p>
            <p className="text-lg font-bold">{template && mission?.status !== 'done' ? missionTitle(template) : t('session.applyGeneric')}</p>
            {template && mission?.status !== 'done' && <p className="text-ink-dim">{t('session.applyHint')}</p>}
          </div>
          <p className="text-ink-dim">{t('session.goodbye')}</p>
          <Button block className="mt-auto" onClick={() => navigate('/')}>
            {t('session.close')}
          </Button>
        </div>
      )}
    </div>
  )
}
