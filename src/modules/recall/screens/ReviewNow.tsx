import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MemoryCard } from '../../../core/db/types'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity } from '../../../core/session/session'
import { dueCards } from '../../../core/srs/scheduler'
import { minutesBetween } from '../../../core/time'
import { useSettings } from '../../../core/settings/settings'
import { ReviewRunner, type RunnerResult } from '../../../ui/review/ReviewRunner'
import { ButtonLink } from '../../../ui/primitives/Button'
import { Empty, Page } from '../../../ui/primitives/Page'

/** Repaso fuera de la sesión diaria. Igual de limitado: no hay repaso infinito. */
export function ReviewNow() {
  const { t } = useTranslation('recall')
  const { sessionSize } = useSettings()
  const [cards, setCards] = useState<MemoryCard[]>()
  const [result, setResult] = useState<RunnerResult>()
  const startedAt = useRef(new Date())

  useEffect(() => {
    void dueCards(sessionSize).then(setCards)
  }, [sessionSize])

  async function done(r: RunnerResult) {
    setResult(r)
    await logFlight({
      kind: 'sim',
      moduleId: 'recall',
      title: t('simTitle', { count: r.reviewed }),
      minutes: Math.min(30, minutesBetween(startedAt.current, new Date())),
      source: 'measured',
    })
    await afterActivity()
  }

  if (!cards) return null
  if (result) {
    return (
      <Page title={t('doneTitle')} lead={t('doneLead', { recalled: result.recalled, total: result.reviewed })}>
        <ButtonLink to="/m/recall" block>
          {t('backToCards')}
        </ButtonLink>
      </Page>
    )
  }
  return (
    <Page title={t('reviewTitle')} back="/m/recall">
      {cards.length ? <ReviewRunner cards={cards} onDone={done} /> : <Empty>{t('nothingDue')}</Empty>}
    </Page>
  )
}
