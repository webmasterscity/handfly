import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { db } from '../../../core/db/schema'
import type { ThinkEntry } from '../../../core/db/types'
import { Page } from '../../../ui/primitives/Page'
import { CheckStep, ThinkResult } from './ThinkCheck'

/** Cerrar después una pregunta que quedó abierta: un toque para decir si acertaste. */
export function ThinkClose() {
  const { t } = useTranslation('think-first')
  const { id = '' } = useParams()
  const entry = useLiveQuery(() => db.thinkEntries.get(id), [id])
  // La entrada tal como estaba al abrir: al cerrarla, la consulta en vivo ya la vería cerrada.
  const [closed, setClosed] = useState<{ entry: ThinkEntry; closeness: number }>()

  if (closed) {
    return (
      <Page title={t('result.title')}>
        <ThinkResult entry={closed.entry} closeness={closed.closeness} />
      </Page>
    )
  }
  if (entry === undefined) return null
  if (!entry || entry.status === 'closed') return <Page title={t('notFound')} back="/m/think-first" />

  return (
    <Page title={t('closeTitle')} back="/m/think-first">
      <CheckStep entry={entry} onClosed={(closeness) => setClosed({ entry, closeness })} />
    </Page>
  )
}
