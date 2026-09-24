import { useLiveQuery } from 'dexie-react-hooks'
import { Compass, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { db } from '../../../core/db/schema'
import type { RouteMission } from '../../../core/db/types'
import { ButtonLink } from '../../../ui/primitives/Button'
import { EvidenceBadge } from '../../../ui/primitives/EvidenceBadge'
import { Empty, Page, Rows, Section } from '../../../ui/primitives/Page'
import { meta } from '../meta'

function nextStep(r: RouteMission) {
  if (r.status === 'planned') return `/m/navigation/r/${r.id}/fly`
  if (r.status === 'flown') return `/m/navigation/r/${r.id}/recall`
  return undefined
}

export function NavHome() {
  const { t } = useTranslation('navigation')
  const routes = useLiveQuery(() => db.routes.orderBy('createdAt').reverse().toArray(), [])
  const pending = routes?.filter((r) => r.status !== 'recalled') ?? []
  const done = routes?.filter((r) => r.status === 'recalled') ?? []

  return (
    <Page title={t('title')} lead={t('lead')} back="/practice">
      <div className="mb-6">
        <EvidenceBadge level={meta.evidence.level} moduleId={meta.id} />
      </div>
      <div className="flex flex-col gap-3">
        <ButtonLink to="/m/navigation/new" block>
          <Plus className="h-5 w-5" aria-hidden />
          {t('plan')}
        </ButtonLink>
        <ButtonLink to="/m/navigation/compass" variant="secondary" block>
          <Compass className="h-5 w-5" aria-hidden />
          {t('compass.title')}
        </ButtonLink>
      </div>

      <Section title={t('pendingTitle')}>
        {!pending.length ? (
          <Empty>{t('pendingEmpty')}</Empty>
        ) : (
          <Rows>
            {pending.map((r) => (
              <li key={r.id}>
                <Link to={nextStep(r)!} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-panel-2">
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{r.title}</span>
                    <span className="block truncate text-sm text-ink-dim">
                      {r.from} → {r.to}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-accent">
                    {r.status === 'planned' ? t('toFly') : t('toRecall')}
                  </span>
                </Link>
              </li>
            ))}
          </Rows>
        )}
      </Section>

      <Section title={t('doneTitle')}>
        {!done.length ? (
          <Empty>{t('doneEmpty')}</Empty>
        ) : (
          <Rows>
            {done.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-bold">{r.title}</span>
                  <span className="text-sm text-ink-dim">{t(`gps.${r.usedGps ?? 'no'}`)}</span>
                </span>
                <span className="readout shrink-0 text-lg" aria-label={t('recallScoreAria', { pct: Math.round((r.recallScore ?? 0) * 100) })}>
                  {Math.round((r.recallScore ?? 0) * 100)} %
                </span>
              </li>
            ))}
          </Rows>
        )}
      </Section>
    </Page>
  )
}
