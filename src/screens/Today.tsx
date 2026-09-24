import { useLiveQuery } from 'dexie-react-hooks'
import { Calculator, Layers, Lightbulb, PlaneTakeoff, Shield } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { db } from '../core/db/schema'
import { rankIndex } from '../core/flight-log/flights'
import { ensureTodayMission } from '../core/session/session'
import { useSettings } from '../core/settings/settings'
import { countDue } from '../core/srs/scheduler'
import { loadSnapshot } from '../core/stats/stats'
import { dayKey, fromDayKey, weekKey } from '../core/time'
import { ALL_MISSIONS, ENABLED_MODULE_IDS } from '../modules/registry'
import { Altimeter } from '../ui/instruments/Altimeter'
import { AttitudeIndicator } from '../ui/instruments/AttitudeIndicator'
import { Wings } from '../ui/instruments/Wings'
import { MissionCard } from '../ui/mission/MissionCard'
import { ButtonLink } from '../ui/primitives/Button'
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
    if (settings.onboarded) void ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS)
  }, [settings.onboarded])

  if (!settings.onboarded) return <Navigate to="/welcome" replace />
  if (!snap) return null

  const openThinks = snap.think.open
  const hasWeeklyCheck = snap.weeklyChecks.some((c) => c.week === weekKey())
  const weekday = new Date().getDay() // 0 domingo
  const suggestWeekly = !hasWeeklyCheck && (weekday === 0 || weekday >= 5)
  const hours = snap.realMinutes / 60
  // Por debajo de una hora se muestran minutos: «0 h» desanima justo al empezar.
  const readout =
    hours < 1 ? `${Math.round(snap.realMinutes)} min` : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(hours) + ' h'
  const sessionDone = Boolean(session?.completedAt)
  const dueNow = Math.min(due ?? 0, settings.sessionSize)
  const reviewMin = Math.max(1, Math.round(dueNow * 0.4))
  const rank = snap.rank
  const pct = Math.round(rank.progress * 100)
  const dayLetter = new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' })
  const dayLong = new Intl.DateTimeFormat(i18n.language, { weekday: 'long' })

  let horizonCaption = t('today.horizon.noData')
  if (snap.horizon.hasData) {
    horizonCaption = snap.horizon.pitch > 0.15 ? t('today.horizon.climbing') : snap.horizon.pitch < -0.15 ? t('today.horizon.descending') : t('today.horizon.level')
    if (snap.horizon.bank > 0.4) horizonCaption += ' ' + t('today.horizon.banked')
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4 pb-8">
      <h1 className="sr-only">{t('nav.today')}</h1>
      {/* Cabecera: quién eres hoy (rango) y cuánto falta para el siguiente. */}
      <header className="mb-4">
        <Link to="/progress" className="flex items-center gap-3 rounded-2xl py-1">
          <Wings rankIndex={rankIndex(rank.rank.id)} size={76} />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg leading-tight font-bold">{t(`ranks.${rank.rank.id}`)}</span>
            {rank.next ? (
              <>
                <span
                  className="mt-1.5 block h-2 overflow-hidden rounded-full bg-panel-2"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-label={t('missions.towardRank', { rank: t(`ranks.${rank.next.id}`), pct })}
                >
                  <span className="block h-full rounded-full bg-amber transition-[width] duration-700" style={{ width: `${Math.max(3, pct)}%` }} />
                </span>
                <span className="mt-1 block text-sm text-ink-dim">{t('today.nextRank', { rank: t(`ranks.${rank.next.id}`) })}</span>
              </>
            ) : (
              <span className="block text-sm text-ink-dim">{t('celebrate.topRank')}</span>
            )}
          </span>
        </Link>
      </header>

      {/* La semana de un vistazo: cada día con práctica se enciende. */}
      <section aria-labelledby="week-title" className="mb-4 rounded-2xl border border-line bg-panel px-4 py-3">
        <h2 id="week-title" className="mb-2 text-base">
          {t('today.streak', { count: snap.streak.current })}
        </h2>
        <ol className="grid grid-cols-7 gap-1.5">
          {snap.weekDays.map((d) => {
            const date = fromDayKey(d.date)
            return (
              <li key={d.date} className="flex flex-col items-center gap-1">
                <span className={`text-xs ${d.today ? 'font-bold text-ink' : 'text-ink-dim'}`} aria-hidden>
                  {dayLetter.format(date)}
                </span>
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 ${
                    d.active ? 'border-amber bg-amber text-on-accent' : d.today ? 'border-accent border-dashed' : d.future ? 'border-line/50' : 'border-line'
                  }`}
                >
                  {d.active && <PlaneTakeoff className="h-4 w-4" aria-hidden />}
                  <span className="sr-only">
                    {dayLong.format(date)}: {d.active ? t('today.dayActive') : d.future ? t('today.dayFuture') : t('today.dayEmpty')}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-dim">
          <Shield className="h-4 w-4 shrink-0" aria-hidden />
          {snap.streak.restUsedThisWeek ? t('today.restUsed') : t('today.restFree')}
        </p>
      </section>

      {mission && (
        <Section id="mission-section" title={t('today.missionTitle')}>
          <MissionCard mission={mission} />
        </Section>
      )}

      {/* Repasos del día: aparecen solo si hay tarjetas pendientes. */}
      {(sessionDone || dueNow > 0) && (
        <Section title={t('today.sessionTitle')}>
          {sessionDone ? (
            <div className="rounded-2xl border border-green bg-panel p-4">
              <p className="font-bold">{t('today.sessionDone')}</p>
              <p className="text-ink-dim">{t('today.sessionDoneHint')}</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-panel-2 text-green">
                <Layers className="h-6 w-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{t('today.reviewsDue', { count: dueNow })}</span>
                <span className="block text-sm text-ink-dim">{t('today.reviewsHint', { minutes: reviewMin })}</span>
              </span>
              <ButtonLink to="/session" className="shrink-0 px-4">
                {session ? t('today.resume') : t('today.review')}
              </ButtonLink>
            </div>
          )}
        </Section>
      )}

      {/* El panel de instrumentos: cómo va tu autonomía y tus horas de vuelo real. */}
      <Section title={t('today.panelTitle')}>
        <div className="rounded-3xl border border-line bg-panel p-4">
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
        </div>
      </Section>

      {/* Práctica extra, corta y con final: cuenta como simulador, no como vuelo real. */}
      <Section title={t('today.extraTitle')}>
        <Link to="/m/calculation/practice" className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-green text-on-accent">
            <Calculator className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{t('today.extraCalc')}</span>
            <span className="block text-sm text-ink-dim">{t('today.extraCalcHint')}</span>
          </span>
        </Link>
      </Section>

      {(openThinks > 0 || suggestWeekly) && (
        <Section title={t('today.pendingTitle')}>
          <ul className="flex flex-col gap-2">
            {openThinks > 0 && (
              <li>
                <Link to="/m/think-first" className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
                  <Lightbulb className="h-5 w-5 shrink-0 text-accent" aria-hidden />
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
