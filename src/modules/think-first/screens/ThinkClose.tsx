import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { db } from '../../../core/db/schema'
import { feedback, toast } from '../../../core/feedback/feedback'
import { afterActivity } from '../../../core/session/session'
import { addCard } from '../../../core/srs/scheduler'
import { Button } from '../../../ui/primitives/Button'
import { TextArea, Toggle } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { Scale } from '../../../ui/primitives/Scale'

export function ThinkClose() {
  const { t } = useTranslation('think-first')
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const entry = useLiveQuery(() => db.thinkEntries.get(id), [id])
  const [aiAnswer, setAiAnswer] = useState('')
  const [closeness, setCloseness] = useState<number>()
  const [learned, setLearned] = useState('')
  const [makeCard, setMakeCard] = useState(true)

  if (entry === undefined) return null
  if (!entry || entry.status === 'closed') {
    return <Page title={t('notFound')} back="/m/think-first" />
  }

  const canSave = closeness && learned.trim()

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!entry || !canSave) return
    let cardId: string | undefined
    if (makeCard) {
      const card = await addCard('think', entry.question, learned.trim(), entry.id)
      cardId = card.id
    }
    await db.thinkEntries.update(entry.id, {
      status: 'closed',
      closedAt: new Date().toISOString(),
      aiAnswer: aiAnswer.trim() || undefined,
      closeness,
      learned: learned.trim(),
      cardId,
    })
    feedback.good()
    toast(calibrationMessage(entry.confidence, closeness!), 'success')
    await afterActivity()
    navigate('/m/think-first')
  }

  function calibrationMessage(confidence: number, close: number) {
    const gap = close - confidence
    if (Math.abs(gap) <= 1) return t('calibration.good')
    return gap > 0 ? t('calibration.under') : t('calibration.over')
  }

  return (
    <Page title={t('closeTitle')} lead={t('closeLead')} back="/m/think-first">
      <div className="mb-6 rounded-2xl border border-line bg-panel p-4">
        <p className="text-sm text-ink-dim">{t('yourQuestion')}</p>
        <p className="mb-3 font-bold">{entry.question}</p>
        <p className="text-sm text-ink-dim">{t('yourAttempt', { confidence: entry.confidence })}</p>
        <p className="whitespace-pre-wrap">{entry.attempt}</p>
      </div>
      <form onSubmit={save} className="flex flex-col gap-6">
        <TextArea
          label={t('aiAnswerLabel')}
          hint={t('aiAnswerHint')}
          value={aiAnswer}
          onChange={(e) => setAiAnswer(e.target.value)}
          rows={4}
        />
        <Scale
          label={t('closenessLabel')}
          value={closeness}
          onChange={setCloseness}
          lowLabel={t('closenessLow')}
          highLabel={t('closenessHigh')}
        />
        <TextArea
          label={t('learnedLabel')}
          hint={t('learnedHint')}
          value={learned}
          onChange={(e) => setLearned(e.target.value)}
          rows={4}
          required
        />
        <Toggle label={t('makeCard')} hint={t('makeCardHint')} checked={makeCard} onChange={setMakeCard} />
        <Button type="submit" block disabled={!canSave}>
          {t('closeSave')}
        </Button>
      </form>
    </Page>
  )
}
