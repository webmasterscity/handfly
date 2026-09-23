import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { db } from '../../../core/db/schema'
import { newId } from '../../../core/time'
import { Button } from '../../../ui/primitives/Button'
import { EvidenceBadge } from '../../../ui/primitives/EvidenceBadge'
import { Empty, Page, Rows, Section } from '../../../ui/primitives/Page'
import { meta } from '../meta'

export function WritingHome() {
  const { t, i18n } = useTranslation('writing')
  const navigate = useNavigate()
  const drafts = useLiveQuery(() => db.drafts.orderBy('updatedAt').reverse().toArray(), [])
  const fmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' })

  async function create() {
    const now = new Date().toISOString()
    const id = newId()
    await db.drafts.add({ id, title: '', kind: 'message', body: '', words: 0, secondsWriting: 0, pasteAttempts: 0, createdAt: now, updatedAt: now })
    navigate(`/m/writing/d/${id}`)
  }

  return (
    <Page title={t('title')} lead={t('lead')} back="/practice">
      <div className="mb-6">
        <EvidenceBadge level={meta.evidence.level} moduleId={meta.id} />
      </div>
      <Button block onClick={create}>
        <Plus className="h-5 w-5" aria-hidden />
        {t('new')}
      </Button>
      <Section title={t('listTitle')}>
        {!drafts?.length ? (
          <Empty>{t('empty')}</Empty>
        ) : (
          <Rows>
            {drafts.map((d) => (
              <li key={d.id}>
                <Link to={`/m/writing/d/${d.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-panel-2">
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{d.title || t('untitled')}</span>
                    <span className="text-sm text-ink-dim">
                      {t(`kinds.${d.kind}`)} · {t('wordsCount', { count: d.words })}
                      {d.finishedAt ? '' : ` · ${t('inProgress')}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-ink-dim">{fmt.format(new Date(d.updatedAt))}</span>
                </Link>
              </li>
            ))}
          </Rows>
        )}
      </Section>
    </Page>
  )
}
