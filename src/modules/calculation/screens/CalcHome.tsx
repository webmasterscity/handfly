import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { db } from '../../../core/db/schema'
import { useSettings } from '../../../core/settings/settings'
import { ButtonLink } from '../../../ui/primitives/Button'
import { EvidenceBadge } from '../../../ui/primitives/EvidenceBadge'
import { Empty, Page, Rows, Section } from '../../../ui/primitives/Page'
import { meta } from '../meta'

export function CalcHome() {
  const { t } = useTranslation('calculation')
  const settings = useSettings()
  const attempts = useLiveQuery(() => db.calcAttempts.orderBy('createdAt').reverse().limit(30).toArray(), [])
  const estimates = attempts?.filter((a) => a.mode === 'estimate') ?? []

  return (
    <Page title={t('title')} lead={t('lead')} back="/practice">
      <div className="mb-6">
        <EvidenceBadge level={meta.evidence.level} moduleId={meta.id} />
      </div>
      <div className="flex flex-col gap-3">
        <ButtonLink to="/m/calculation/practice" block>
          {t('practiceCta')}
        </ButtonLink>
        <p className="text-center text-sm text-ink-dim">
          {t('game.level', { level: settings.calcLevel ?? 1 })}
          {settings.calcBest && ` · ${t('bestRound', { correct: settings.calcBest.correct, seconds: settings.calcBest.seconds })}`}
        </p>
        <ButtonLink to="/m/calculation/estimate" variant="secondary" block>
          {t('estimateCta')}
        </ButtonLink>
      </div>
      <p className="mt-4 text-sm text-ink-dim">{t('realWorldNote')}</p>

      <Section title={t('estimatesTitle')}>
        {!estimates.length ? (
          <Empty>{t('estimatesEmpty')}</Empty>
        ) : (
          <Rows>
            {estimates.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-bold">{e.prompt}</span>
                  <span className="readout text-sm text-ink-dim">
                    {e.userAnswer} / {e.correctAnswer}
                  </span>
                </span>
                <span className="readout shrink-0 text-lg">{Math.round(e.error * 100)} %</span>
              </li>
            ))}
          </Rows>
        )}
      </Section>
    </Page>
  )
}
