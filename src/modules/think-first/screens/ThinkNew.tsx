import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../../../core/db/schema'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity, reportActivity } from '../../../core/session/session'
import { ALL_MISSIONS } from '../../../modules/registry'
import { minutesBetween, newId } from '../../../core/time'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { TextArea } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { Scale } from '../../../ui/primitives/Scale'

export function ThinkNew() {
  const { t } = useTranslation('think-first')
  const navigate = useNavigate()
  const openedAt = useRef(new Date())
  const [question, setQuestion] = useState('')
  const [attempt, setAttempt] = useState('')
  const [confidence, setConfidence] = useState<number>()
  const [savedId, setSavedId] = useState<string>()

  const canSave = question.trim() && attempt.trim() && confidence

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    const id = newId()
    await db.thinkEntries.add({
      id,
      question: question.trim(),
      attempt: attempt.trim(),
      confidence: confidence!,
      createdAt: new Date().toISOString(),
      status: 'open',
    })
    // Pensar primero ante una pregunta real ya es un vuelo manual.
    await logFlight({
      kind: 'real',
      moduleId: 'think-first',
      title: question.trim(),
      minutes: Math.min(30, minutesBetween(openedAt.current, new Date())),
      source: 'measured',
      refId: id,
    })
    feedback.good()
    await reportActivity('think.saved', ALL_MISSIONS)
    await afterActivity()
    setSavedId(id)
  }

  if (savedId) {
    return (
      <Page title={t('savedTitle')} lead={t('savedLead')}>
        <div className="animate-pop flex flex-col gap-3">
          <ButtonLink to="/" block>
            {t('savedLater')}
          </ButtonLink>
          <Button variant="secondary" block onClick={() => navigate(`/m/think-first/close/${savedId}`)}>
            {t('savedCloseNow')}
          </Button>
        </div>
      </Page>
    )
  }

  return (
    <Page title={t('newTitle')} lead={t('newLead')} back="/m/think-first">
      <form onSubmit={save} className="flex flex-col gap-6">
        <TextArea
          label={t('questionLabel')}
          hint={t('questionHint')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('questionPlaceholder')}
          rows={3}
          required
        />
        <TextArea
          label={t('attemptLabel')}
          hint={t('attemptHint')}
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          placeholder={t('attemptPlaceholder')}
          rows={6}
          required
        />
        <Scale
          label={t('confidenceLabel')}
          value={confidence}
          onChange={setConfidence}
          lowLabel={t('confidenceLow')}
          highLabel={t('confidenceHigh')}
        />
        <div className="flex flex-col gap-2">
          <Button type="submit" block disabled={!canSave}>
            {t('saveAttempt')}
          </Button>
          {!canSave && <p className="text-center text-sm text-ink-dim">{t('saveNeeds')}</p>}
        </div>
      </form>
    </Page>
  )
}
