import { useLiveQuery } from 'dexie-react-hooks'
import { Award, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ACHIEVEMENTS } from '../core/achievements/achievements'
import { db } from '../core/db/schema'
import { loadSnapshot } from '../core/stats/stats'
import { Bars } from '../ui/charts/Bars'
import { Arc } from '../ui/instruments/Arc'
import { Page, Rows, Section } from '../ui/primitives/Page'

export function Progress() {
  const { t, i18n } = useTranslation()
  const snap = useLiveQuery(() => loadSnapshot(), [])
  const unlocked = useLiveQuery(() => db.achievements.toArray(), [])
  if (!snap || !unlocked) return null

  const nf = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 })
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
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-panel p-4">
          <dt className="text-sm text-ink-dim">{t('progress.realHours')}</dt>
          <dd className="readout text-3xl">{nf.format(snap.realMinutes / 60)} h</dd>
          <dd className="text-sm text-ink-dim">{t('progress.realFlights', { count: snap.realFlights })}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <dt className="text-sm text-ink-dim">{t('progress.simHours')}</dt>
          <dd className="readout text-3xl text-ink-dim">{nf.format(snap.simMinutes / 60)} h</dd>
          <dd className="text-sm text-ink-dim">{t('progress.simHint')}</dd>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4">
          <Arc value={snap.rank.progress} label={t('progress.rankProgressAria', { pct: Math.round(snap.rank.progress * 100) })} />
          <div>
            <dt className="text-sm text-ink-dim">{t('progress.rank')}</dt>
            <dd className="font-display font-bold">{t(`ranks.${snap.rank.rank.id}`)}</dd>
            {snap.rank.next && (
              <dd className="text-xs text-ink-dim">
                {t('progress.nextRank', { rank: t(`ranks.${snap.rank.next.id}`), hours: snap.rank.next.hours, flights: snap.rank.next.flights })}
              </dd>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4">
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
