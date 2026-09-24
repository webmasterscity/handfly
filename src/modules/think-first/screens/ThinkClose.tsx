import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { db } from '../../../core/db/schema'
import { feedback } from '../../../core/feedback/feedback'
import { scoreCloseness, scoreTier } from '../../../core/missions/scoring'
import { afterActivity } from '../../../core/session/session'
import { addCard } from '../../../core/srs/scheduler'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { useCountUp } from '../../../ui/useCountUp'
import { TextArea, Toggle } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { Scale } from '../../../ui/primitives/Scale'

export function ThinkClose() {
  const { t } = useTranslation('think-first')
  const { id = '' } = useParams()
  const entry = useLiveQuery(() => db.thinkEntries.get(id), [id])
  const [aiAnswer, setAiAnswer] = useState('')
  const [closeness, setCloseness] = useState<number>()
  const [learned, setLearned] = useState('')
  const [makeCard, setMakeCard] = useState(true)
  const [closed, setClosed] = useState<{ confidence: number; closeness: number; card: boolean }>()

  if (closed) return <CloseResult {...closed} message={calibrationMessage(closed.confidence, closed.closeness)} />
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
    feedback.land()
    setClosed({ confidence: entry.confidence, closeness: closeness!, card: makeCard })
    await afterActivity()
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

/**
 * El momento de la verdad: qué tan cerca estuviste y si tu confianza coincidió con lo
 * que sabías (calibración). Las dos barras muestran «lo seguro que estabas» frente a
 * «lo cerca que estuviste».
 */
function CloseResult({ confidence, closeness, card, message }: { confidence: number; closeness: number; card: boolean; message: string }) {
  const { t } = useTranslation('think-first')
  const score = scoreCloseness(closeness)
  const shown = useCountUp(score)
  return (
    <Page title={t('result.title')}>
      <div className="animate-pop flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4 rounded-2xl border border-line bg-panel p-5">
          <p className="font-display text-2xl leading-tight font-bold">{t(`result.tier.${scoreTier(score)}`)}</p>
          <p className="text-right">
            <span className="block text-sm text-ink-dim">{t('result.precision')}</span>
            <span className="readout block text-5xl leading-none">{shown}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5">
          <p className="mb-3 font-display font-bold">{t('result.calibrationTitle')}</p>
          <Bar label={t('result.sure')} value={confidence} color="var(--amber)" />
          <Bar label={t('result.close')} value={closeness} color="var(--green)" />
          <p className="prose-text mt-3">{message}</p>
        </div>
        {card && <p className="rounded-2xl bg-panel-2 p-4">{t('result.cardMade')}</p>}
        <ButtonLink to="/m/think-first" block>
          {t('result.done')}
        </ButtonLink>
      </div>
    </Page>
  )
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-ink-dim">{label}</span>
      <span className="flex h-3 flex-1 overflow-hidden rounded-full bg-panel-2" aria-hidden>
        <span className="h-full rounded-full transition-[width] duration-700" style={{ width: `${value * 20}%`, background: color }} />
      </span>
      <span className="readout w-10 text-right">{value}/5</span>
    </div>
  )
}
