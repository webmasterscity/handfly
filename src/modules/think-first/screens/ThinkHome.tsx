import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { db } from '../../../core/db/schema'
import { ButtonLink } from '../../../ui/primitives/Button'
import { EvidenceBadge } from '../../../ui/primitives/EvidenceBadge'
import { Empty, Page, Rows, Section } from '../../../ui/primitives/Page'
import { meta } from '../meta'

export function ThinkHome() {
  const { t } = useTranslation('think-first')
  const entries = useLiveQuery(() => db.thinkEntries.orderBy('createdAt').reverse().toArray(), [])
  const open = entries?.filter((e) => e.status === 'open') ?? []
  const closed = entries?.filter((e) => e.status === 'closed') ?? []

  return (
    <Page title={t('title')} lead={t('lead')} back="/practice">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <EvidenceBadge level={meta.evidence.level} moduleId={meta.id} />
      </div>
      <ButtonLink to="/m/think-first/new" block>
        <Plus className="h-5 w-5" aria-hidden />
        {t('newQuestion')}
      </ButtonLink>

      <Section title={t('openTitle')}>
        {open.length === 0 ? (
          <Empty>{t('openEmpty')}</Empty>
        ) : (
          <Rows>
            {open.map((e) => (
              <li key={e.id}>
                <Link to={`/m/think-first/close/${e.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-panel-2">
                  <span className="font-bold">{e.question}</span>
                  <span className="text-sm text-ink-dim">{t('openRowHint')}</span>
                </Link>
              </li>
            ))}
          </Rows>
        )}
      </Section>

      <Section title={t('closedTitle')}>
        {closed.length === 0 ? (
          <Empty>{t('closedEmpty')}</Empty>
        ) : (
          <Rows>
            {closed.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{e.question}</p>
                  {e.learned && <p className="line-clamp-2 text-sm text-ink-dim">{e.learned}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${(e.closeness ?? 0) >= 4 ? 'bg-green text-on-accent' : 'bg-panel-2'}`}>
                  {t(`closedLabel.${(e.closeness ?? 0) >= 4 ? 'yes' : (e.closeness ?? 0) >= 3 ? 'partly' : 'no'}`)}
                </span>
              </li>
            ))}
          </Rows>
        )}
      </Section>
    </Page>
  )
}
