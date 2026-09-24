import { useLiveQuery } from 'dexie-react-hooks'
import { Award, Lock, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ACHIEVEMENTS } from '../core/achievements/achievements'
import { db } from '../core/db/schema'
import { rankIndex } from '../core/flight-log/flights'
import { findTemplate, missionTitle } from '../core/session/session'
import { useSettings } from '../core/settings/settings'
import { ALL_MISSIONS } from '../modules/registry'
import { Wings } from '../ui/instruments/Wings'
import { loadSnapshot } from '../core/stats/stats'
import { Bars } from '../ui/charts/Bars'
import { Page, Rows, Section } from '../ui/primitives/Page'

export function Progress() {
  const { t, i18n } = useTranslation()
  const snap = useLiveQuery(() => loadSnapshot(), [])
  const unlocked = useLiveQuery(() => db.achievements.toArray(), [])
  const settings = useSettings()
  // Mejor puntuación por misión jugada («apuesta y comprueba»).
  const bests = useLiveQuery(async () => {
    const best = new Map<string, number>()
    for (const m of await db.missions.filter((m) => m.result !== undefined).toArray()) {
      best.set(m.templateId, Math.max(best.get(m.templateId) ?? 0, m.result!.score))
    }
    return [...best.entries()].sort((a, b) => b[1] - a[1])
  }, [])
  if (!snap || !unlocked) return null

  const nf = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 })
  // Por debajo de una hora, minutos: «0 h» tras la primera misión desanima.
  const flightTime = (min: number) => (min < 60 ? `${Math.round(min)} min` : `${nf.format(min / 60)} h`)
  const pct = (x?: number) => (x === undefined ? '—' : `${Math.round(x * 100)} %`)
  const dayFmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'numeric' })
  const unlockedIds = new Set(unlocked.map((a) => a.id))
  const hiddenLocked = ACHIEVEMENTS.filter((a) => a.hidden && !unlockedIds.has(a.id)).length

  const metrics: { label: string; value: string; hint?: string }[] = [
    { label: t('progress.m.thinkCloseness'), value: snap.think.avgCloseness ? `${nf.format(snap.think.avgCloseness)} / 5` : '—', hint: t('progress.m.thinkClosenessHint', { count: snap.think.closed }) },
    { label: t('progress.m.calibration'), value: snap.think.calibrationGap === undefined ? '—' : nf.format(snap.think.calibrationGap), hint: t('progress.m.calibrationHint') },
    { label: t('progress.m.recall'), value: pct(snap.recall.accuracy30), hint: t('progress.m.recallHint', { count: snap.recall.reviews30 }) },
    { label: t('progress.m.names'), value: pct(snap.recall.byKind.person), hint: t('progress.m.namesHint', { count: snap.people.count }) },
    { label: t('progress.m.routes'), value: String(snap.navigation.flownNoGps), hint: t('progress.m.routesHint', { recall: pct(snap.navigation.avgRecall) }) },
    { label: t('progress.m.writing'), value: String(snap.writing.drafts), hint: t('progress.m.writingHint', { count: snap.writing.minutes }) },
    { label: t('progress.m.calc'), value: pct(snap.calculation.accuracy), hint: t('progress.m.calcHint', { count: snap.calculation.problems }) },
    {
      label: t('progress.m.estimate'),
      value: snap.calculation.medianEstimateError === undefined ? '—' : pct(snap.calculation.medianEstimateError),
      hint: t('progress.m.estimateHint', { count: snap.calculation.estimates }),
    },
  ]

  const lastWeeks = snap.weeks.map((w) => ({ label: dayFmt.format(w.start), primary: w.real, secondary: w.sim }))
  const chartSummary = t('progress.chartSummary', { thisWeek: snap.weeks[7].real, lastWeek: snap.weeks[6].real })

  return (
    <Page title={t('progress.title')} lead={t('progress.lead')}>
      <section className="mb-4 flex flex-col items-center rounded-3xl border border-line bg-panel px-4 pt-5 pb-4 text-center" aria-labelledby="rank-title">
        <Wings rankIndex={rankIndex(snap.rank.rank.id)} size={180} />
        <h2 id="rank-title" className="mt-2 text-2xl">
          {t(`ranks.${snap.rank.rank.id}`)}
        </h2>
        {snap.rank.next ? (
          <>
            <div
              className="mt-3 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-panel-2"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(snap.rank.progress * 100)}
              aria-label={t('progress.rankProgressAria', { pct: Math.round(snap.rank.progress * 100) })}
            >
              <div className="h-full rounded-full bg-amber" style={{ width: `${Math.max(3, Math.round(snap.rank.progress * 100))}%` }} />
            </div>
            <p className="mt-2 text-sm text-ink-dim">
              {t('progress.toNext', {
                rank: t(`ranks.${snap.rank.next.id}`),
                needs: [
                  snap.rank.next.flights > snap.realFlights && t('progress.needFlights', { count: snap.rank.next.flights - snap.realFlights }),
                  snap.rank.next.hours * 60 > snap.realMinutes && t('progress.needMinutes', { count: Math.ceil(snap.rank.next.hours * 60 - snap.realMinutes) }),
                ]
                  .filter(Boolean)
                  .join(t('progress.and')),
              })}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-dim">{t('celebrate.topRank')}</p>
        )}
      </section>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-panel p-4">
          <dt className="text-sm text-ink-dim">{t('progress.realHours')}</dt>
          <dd className="readout text-3xl">{flightTime(snap.realMinutes)}</dd>
          <dd className="text-sm text-ink-dim">{t('progress.realFlights', { count: snap.realFlights })}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <dt className="text-sm text-ink-dim">{t('progress.simHours')}</dt>
          <dd className="readout text-3xl text-ink-dim">{flightTime(snap.simMinutes)}</dd>
          <dd className="text-sm text-ink-dim">{t('progress.simHint')}</dd>
        </div>
        <div className="col-span-2 rounded-2xl border border-line bg-panel p-4">
          <dt className="text-sm text-ink-dim">{t('progress.streak')}</dt>
          <dd className="readout text-3xl">{snap.streak.current}</dd>
          <dd className="text-sm text-ink-dim">
            {t('progress.bestStreak', { count: snap.streak.best })}
            {snap.streak.restUsedThisWeek ? ` · ${t('progress.restUsed')}` : ` · ${t('progress.restAvailable')}`}
          </dd>
        </div>
      </dl>

      <Section title={t('progress.chartTitle')}>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <Bars data={lastWeeks} primaryLabel={t('progress.legendReal')} secondaryLabel={t('progress.legendSim')} summary={chartSummary} />
        </div>
      </Section>

      <Section
        title={t('progress.autonomyTitle')}
        aside={
          <Link to="/weekly" className="text-sm text-accent underline underline-offset-4">
            {t('progress.doWeekly')}
          </Link>
        }
      >
        {snap.weeklyChecks.length ? (
          <Rows>
            {snap.weeklyChecks
              .slice(-6)
              .reverse()
              .map((c) => (
                <li key={c.week} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="readout">{c.week}</span>
                  <span className="text-sm">
                    <span className="text-green">{t('progress.solo', { count: c.solo.length })}</span> ·{' '}
                    <span className="text-amber">{t('progress.crutch', { count: c.crutches.length })}</span>
                  </span>
                </li>
              ))}
          </Rows>
        ) : (
          <p className="text-ink-dim">{t('progress.noWeekly')}</p>
        )}
      </Section>

      <Section title={t('progress.recordsTitle')}>
        {!bests?.length && !settings.calcBest && settings.compassBest === undefined ? (
          <p className="text-ink-dim">{t('progress.recordsEmpty')}</p>
        ) : (
          <Rows>
            {settings.calcBest && (
              <RecordRow label={t('progress.recordCalc')} value={t('progress.recordCalcValue', { correct: settings.calcBest.correct, seconds: settings.calcBest.seconds })} />
            )}
            {settings.compassBest !== undefined && <RecordRow label={t('progress.recordCompass')} value={String(settings.compassBest)} />}
            {bests?.map(([templateId, score]) => (
              <RecordRow key={templateId} label={missionTitle(findTemplate(ALL_MISSIONS, templateId))} value={String(score)} />
            ))}
          </Rows>
        )}
      </Section>

      <Section title={t('progress.modulesTitle')}>
        <Rows>
          {metrics.map((m) => (
            <li key={m.label} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block font-bold">{m.label}</span>
                {m.hint && <span className="text-sm text-ink-dim">{m.hint}</span>}
              </span>
              <span className="readout shrink-0 text-lg">{m.value}</span>
            </li>
          ))}
        </Rows>
      </Section>

      <Section title={t('progress.achievementsTitle')}>
        <ul className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.filter((a) => !a.hidden || unlockedIds.has(a.id)).map((a) => {
            const got = unlockedIds.has(a.id)
            return (
              <li key={a.id} className={`rounded-xl border p-3 ${got ? 'border-green bg-panel' : 'border-line opacity-70'}`}>
                <p className="flex items-center gap-2 font-bold">
                  {got ? <Award className="h-4 w-4 text-green" aria-hidden /> : <Lock className="h-4 w-4 text-ink-dim" aria-hidden />}
                  {t(`achievements.items.${a.id}.name`)}
                </p>
                <p className="text-sm text-ink-dim">{t(`achievements.items.${a.id}.desc`)}</p>
                <span className="sr-only">{got ? t('achievements.unlockedSr') : t('achievements.lockedSr')}</span>
              </li>
            )
          })}
        </ul>
        {hiddenLocked > 0 && <p className="mt-3 text-sm text-ink-dim">{t('achievements.hiddenLeft', { count: hiddenLocked })}</p>}
      </Section>
    </Page>
  )
}

function RecordRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex min-w-0 items-center gap-2">
        <Trophy className="h-4 w-4 shrink-0 text-amber" aria-hidden />
        <span className="truncate font-bold">{label}</span>
      </span>
      <span className="readout shrink-0 text-lg">{value}</span>
    </li>
  )
}
