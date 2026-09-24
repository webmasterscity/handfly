import { useLiveQuery } from 'dexie-react-hooks'
import { CircleHelp as HelpCircle, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { db } from '../../../core/db/schema'
import { fromDayKey } from '../../../core/time'
import { ButtonLink } from '../../../ui/primitives/Button'
import { EvidenceBadge } from '../../../ui/primitives/EvidenceBadge'
import { Empty, Page, Rows, Section } from '../../../ui/primitives/Page'
import { meta } from '../meta'

export function PeopleHome() {
  const { t, i18n } = useTranslation('people')
  const people = useLiveQuery(() => db.people.orderBy('createdAt').reverse().toArray(), [])
  const fmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' })

  return (
    <Page title={t('title')} lead={t('lead')} back="/practice">
      <div className="mb-6">
        <EvidenceBadge level={meta.evidence.level} moduleId={meta.id} />
      </div>
      <div className="flex flex-col gap-3">
        <ButtonLink to="/m/people/new" block>
          <Plus className="h-5 w-5" aria-hidden />
          {t('add')}
        </ButtonLink>
        {Boolean(people?.length) && (
          <ButtonLink to="/m/people/quiz" variant="secondary" block>
            <HelpCircle className="h-5 w-5" aria-hidden />
            {t('quiz.cta')}
          </ButtonLink>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-dim">{t('privacy')}</p>

      <Section title={t('listTitle', { count: people?.length ?? 0 })}>
        {!people?.length ? (
          <Empty>{t('empty')}</Empty>
        ) : (
          <Rows>
            {people.map((p) => (
              <li key={p.id}>
                <Link to={`/m/people/p/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-panel-2">
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{p.name}</span>
                    <span className="block truncate text-sm text-ink-dim">{p.whereMet}</span>
                  </span>
                  <span className="shrink-0 text-sm text-ink-dim">{fmt.format(fromDayKey(p.metOn))}</span>
                </Link>
              </li>
            ))}
          </Rows>
        )}
      </Section>
    </Page>
  )
}
