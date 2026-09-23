import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '../../../core/db/schema'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity } from '../../../core/session/session'
import { newId } from '../../../core/time'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { TextField } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { parseAnswer } from '../generators'

const IDEAS = ['idea1', 'idea2', 'idea3', 'idea4', 'idea5']

/** Estimar primero, comprobar después: el dato real lo busca el usuario fuera de la app. */
export function CalcEstimate() {
  const { t } = useTranslation('calculation')
  const [question, setQuestion] = useState('')
  const [estimate, setEstimate] = useState('')
  const [locked, setLocked] = useState(false)
  const [actual, setActual] = useState('')
  const [error, setError] = useState<number>()

  function lock(e: FormEvent) {
    e.preventDefault()
    if (question.trim() && parseAnswer(estimate) !== undefined) {
      setLocked(true)
      feedback.tick()
    }
  }

  async function compare(e: FormEvent) {
    e.preventDefault()
    const est = parseAnswer(estimate)
    const real = parseAnswer(actual)
    if (est === undefined || real === undefined || real === 0) return
    const err = Math.abs(est - real) / Math.abs(real)
    setError(err)
    await db.calcAttempts.add({
      id: newId(),
      mode: 'estimate',
      category: 'estimate',
      prompt: question.trim(),
      userAnswer: est,
      correctAnswer: real,
      error: err,
      correct: err <= 0.1,
      createdAt: new Date().toISOString(),
    })
    await logFlight({ kind: 'sim', moduleId: 'calculation', title: question.trim(), minutes: 3, source: 'declared' })
    if (err <= 0.1) feedback.land()
    else feedback.good()
    await afterActivity()
  }

  function reset() {
    setQuestion('')
    setEstimate('')
    setActual('')
    setLocked(false)
    setError(undefined)
  }

  if (error !== undefined) {
    const pct = Math.round(error * 100)
    return (
      <Page title={t('estimateResultTitle')} lead={t('estimateResultLead', { pct })} back="/m/calculation">
        <p className="mb-6 rounded-xl bg-panel-2 p-4">
          {pct <= 10 ? t('estimateGreat') : pct <= 30 ? t('estimateOk') : t('estimateFar')}
        </p>
        <div className="flex flex-col gap-3">
          <Button block onClick={reset}>
            {t('estimateAnother')}
          </Button>
          <ButtonLink to="/m/calculation" variant="secondary" block>
            {t('back')}
          </ButtonLink>
        </div>
      </Page>
    )
  }

  return (
    <Page title={t('estimateTitle')} lead={t('estimateLead')} back="/m/calculation">
      {!locked ? (
        <form onSubmit={lock} className="flex flex-col gap-6">
          <TextField label={t('estimateQuestion')} hint={t('estimateQuestionHint')} value={question} onChange={(e) => setQuestion(e.target.value)} required />
          <div className="flex flex-wrap gap-2" aria-label={t('ideasLabel')}>
            {IDEAS.map((k) => (
              <button key={k} type="button" onClick={() => setQuestion(t(`ideas.${k}`))} className="min-h-10 rounded-full border border-line px-3 text-sm hover:border-accent">
                {t(`ideas.${k}`)}
              </button>
            ))}
          </div>
          <TextField label={t('yourEstimate')} inputMode="decimal" value={estimate} onChange={(e) => setEstimate(e.target.value)} className="readout" required />
          <Button type="submit" block disabled={!question.trim() || parseAnswer(estimate) === undefined}>
            {t('lockEstimate')}
          </Button>
        </form>
      ) : (
        <form onSubmit={compare} className="flex flex-col gap-6">
          <div className="rounded-2xl border border-line bg-panel p-4">
            <p className="font-bold">{question}</p>
            <p className="readout mt-1 text-ink-dim">{t('lockedAt', { value: estimate })}</p>
          </div>
          <p>{t('nowCheck')}</p>
          <TextField label={t('actualValue')} inputMode="decimal" value={actual} onChange={(e) => setActual(e.target.value)} required />
          <Button type="submit" block disabled={!parseAnswer(actual)}>
            {t('compareEstimate')}
          </Button>
        </form>
      )}
    </Page>
  )
}
