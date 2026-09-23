import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { db } from '../../../core/db/schema'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { EvidenceBadge } from '../../../ui/primitives/EvidenceBadge'
import { Empty, Page, Rows, Section } from '../../../ui/primitives/Page'
import { meta } from '../meta'

export function RecallHome() {
  const { t, i18n } = useTranslation('recall')
  const cards = useLiveQuery(() => db.cards.orderBy('due').toArray(), [])
  const now = new Date().toISOString()
  const due = cards?.filter((c) => !c.suspended && c.due <= now).length ?? 0
  const fmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' })

  return (
    <Page title={t('title')} lead={t('lead')} back="/practice">
      <div className="mb-6">
        <EvidenceBadge level={meta.evidence.level} moduleId={meta.id} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {due ? (
          <ButtonLink to="/m/recall/review" block>
            {t('reviewNow', { count: due })}
          </ButtonLink>
        ) : (
          <Button block disabled>
            {t('reviewNow', { count: 0 })}
          </Button>
        )}
        <ButtonLink to="/m/recall/new" variant="secondary" block>
          <Plus className="h-5 w-5" aria-hidden />
          {t('newCard')}
        </ButtonLink>
      </div>

      <Section title={t('allCards', { count: cards?.length ?? 0 })}>
        {!cards?.length ? (
          <Empty>{t('empty')}</Empty>
        ) : (
          <Rows>
            {cards.map((c) => (
              <li key={c.id}>
                <Link to={`/m/recall/card/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-panel-2">
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{c.kind === 'person' ? t('personCard') : c.front}</span>
                    <span className="text-sm text-ink-dim">{t(`kinds.${c.kind}`)}</span>
                  </span>
                  <span className="shrink-0 text-sm text-ink-dim">
                    {c.suspended ? t('suspended') : c.due <= now ? t('dueNow') : fmt.format(new Date(c.due))}
                  </span>
                </Link>
              </li>
            ))}
          </Rows>
        )}
      </Section>
    </Page>
  )
}
