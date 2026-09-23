import { useLiveQuery } from 'dexie-react-hooks'
import { Lightbulb, PlaneTakeoff } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { db } from '../core/db/schema'
import { ensureTodayMission } from '../core/session/session'
import { updateSettings, useSettings } from '../core/settings/settings'
import { countDue } from '../core/srs/scheduler'
import { loadSnapshot } from '../core/stats/stats'
import { dayKey, weekKey } from '../core/time'
import { ALL_MISSIONS, ENABLED_MODULE_IDS } from '../modules/registry'
import { Altimeter } from '../ui/instruments/Altimeter'
import { AttitudeIndicator } from '../ui/instruments/AttitudeIndicator'
import { MissionCard } from '../ui/MissionCard'
import { Button, ButtonLink } from '../ui/primitives/Button'
import { Section } from '../ui/primitives/Page'

export function Today() {
  const { t, i18n } = useTranslation()
  const settings = useSettings()
  const snap = useLiveQuery(() => loadSnapshot(), [])
  const due = useLiveQuery(() => countDue(), [])
  const session = useLiveQuery(() => db.sessions.get(dayKey()), [])
  const mission = useLiveQuery(
    async () => (await db.missions.where('assignedOn').equals(dayKey()).toArray()).find((m) => m.status !== 'skipped'),
    [],
  )
  // La misión existe desde que se abre la app: no hay que empezar la sesión para verla.
  useEffect(() => {
    void ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS)
  }, [])
  const openThinks = snap?.think.open ?? 0
  const hasWeeklyCheck = snap?.weeklyChecks.some((c) => c.week === weekKey())
  const weekday = new Date().getDay() // 0 domingo
  const suggestWeekly = !hasWeeklyCheck && (weekday === 0 || weekday >= 5)

  if (!snap) return null

  const hours = snap.realMinutes / 60
  // Por debajo de una hora se muestran minutos: «0 h» desanima justo al empezar.
  const readout =
    hours < 1 ? `${Math.round(snap.realMinutes)} min` : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(hours) + ' h'
  const sessionDone = Boolean(session?.completedAt)
  const reviewMin = Math.max(1, Math.round(Math.min(due ?? 0, settings.sessionSize) * 0.4))

  let horizonCaption = t('today.horizon.noData')
  if (snap.horizon.hasData) {
    horizonCaption = snap.horizon.pitch > 0.15 ? t('today.horizon.climbing') : snap.horizon.pitch < -0.15 ? t('today.horizon.descending') : t('today.horizon.level')
    if (snap.horizon.bank > 0.4) horizonCaption += ' ' + t('today.horizon.banked')
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4 pb-8">
      <header className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg font-bold">Handfly</p>
        <p className="text-sm text-ink-dim">
          {t(`ranks.${snap.rank.rank.id}`)} · {t('today.streakShort', { count: snap.streak.current })}
        </p>
      </header>

      {!settings.onboarded && (
        <section className="animate-pop mb-6 rounded-2xl border border-accent bg-panel p-5">
          <h1 className="mb-2 text-2xl">{t('onboarding.title')}</h1>
          <p className="prose-text mb-4">{t('onboarding.p1')}</p>
          <p className="mb-2 font-display font-bold">{t('onboarding.howTitle')}</p>
          <ol className="mb-4 flex flex-col gap-3">
            {(['b1', 'b2', 'b3'] as const).map((k, i) => (
              <li key={k} className="flex items-start gap-3">
                <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-accent font-display text-sm font-bold text-accent">
                  {i + 1}
                </span>
                <span className="prose-text">{t(`onboarding.${k}`)}</span>
              </li>
            ))}
          </ol>
          <p className="prose-text mb-4 text-sm text-ink-dim">{t('onboarding.privacy')}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                updateSettings({ onboarded: true })
                document.getElementById('mission-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {t('onboarding.cta')}
            </Button>
            <ButtonLink to="/about" variant="ghost">
              {t('onboarding.more')}
            </ButtonLink>
          </div>
        </section>
      )}

      {/* El panel de instrumentos: lo único llamativo de la pantalla. */}
      <section aria-labelledby="panel-title" className="rounded-3xl border border-line bg-panel p-4">
        <h2 id="panel-title" className="sr-only">
          {t('today.panelTitle')}
        </h2>
        <div className="flex items-center justify-center gap-4">
          <div className="w-[58%] max-w-[240px]">
            <AttitudeIndicator pitch={snap.horizon.pitch} bank={snap.horizon.bank} size={240} label={horizonCaption} />
          </div>
          <div className="flex w-[38%] max-w-[150px] flex-col items-center gap-1">
            <Altimeter minutes={snap.realMinutes} size={150} label={t('today.altimeterAria', { hours: readout })} readout={readout} />
            <span className="text-center text-xs text-ink-dim">{t('today.altimeterLabel')}</span>
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-ink-dim">{horizonCaption}</p>
      </section>

      {mission && (
        <Section id="mission-section" title={t('today.missionTitle')}>
          <MissionCard mission={mission} />
        </Section>
      )}

      {/* La sesión existe para los repasos: sin tarjetas pendientes no se muestra. */}
      {(sessionDone || Boolean(due)) && (
        <Section title={t('today.sessionTitle')}>
          {sessionDone ? (
            <div className="rounded-2xl border border-green bg-panel p-4">
              <p className="font-bold">{t('today.sessionDone')}</p>
              <p className="text-ink-dim">{t('today.sessionDoneHint')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="prose-text text-ink-dim">{t('today.sessionPlan', { count: due! > settings.sessionSize ? settings.sessionSize : due!, minutes: reviewMin })}</p>
              <ButtonLink to="/session" block>
                <PlaneTakeoff className="h-5 w-5" aria-hidden />
                {session ? t('today.resume') : t('today.start')}
              </ButtonLink>
            </div>
          )}
        </Section>
      )}

      {(openThinks > 0 || suggestWeekly) && (
        <Section title={t('today.pendingTitle')}>
          <ul className="flex flex-col gap-2">
            {openThinks > 0 && (
              <li>
                <Link to="/m/think-first" className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
                  <Lightbulb className="h-5 w-5 text-accent" aria-hidden />
                  {t('today.openThinks', { count: openThinks })}
                </Link>
              </li>
            )}
            {suggestWeekly && (
              <li>
                <Link to="/weekly" className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
                  {t('today.weeklyPrompt')}
                </Link>
              </li>
            )}
          </ul>
        </Section>
      )}
    </div>
  )
}
