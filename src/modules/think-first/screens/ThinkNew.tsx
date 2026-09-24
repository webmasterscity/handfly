import { MessageCircle } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '../../../core/db/schema'
import type { ThinkEntry } from '../../../core/db/types'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity, reportActivity } from '../../../core/session/session'
import { minutesBetween, newId } from '../../../core/time'
import { ALL_MISSIONS } from '../../registry'
import { Button } from '../../../ui/primitives/Button'
import { TextArea, TextField } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { CONFIDENCE } from '../think'
import { CheckStep, ThinkResult } from './ThinkCheck'

/**
 * Pensar primero sin escribir: piensas (o dices en voz alta) tu respuesta y tocas qué tan
 * seguro estás. Después lo compruebas donde quieras —la IA, un buscador, un libro o
 * preguntándole a alguien— y dices si acertaste. Lo que entrena es intentarlo antes;
 * anotar la duda o la respuesta es opcional.
 */
export function ThinkNew() {
  const { t } = useTranslation('think-first')
  const openedAt = useRef(new Date())
  const [question, setQuestion] = useState('')
  const [attempt, setAttempt] = useState('')
  const [notes, setNotes] = useState(false)
  const [confidence, setConfidence] = useState<number>()
  const [entry, setEntry] = useState<ThinkEntry>()
  const [closeness, setCloseness] = useState<number>()

  // Nada que escribir: basta con pensar (o decir en voz alta) la respuesta y tocar qué tan
  // seguro estás. Escribir la duda o la respuesta es opcional.
  const canSave = Boolean(confidence)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!canSave || entry) return
    const saved: ThinkEntry = {
      id: newId(),
      question: question.trim(),
      attempt: attempt.trim(),
      confidence: confidence!,
      createdAt: new Date().toISOString(),
      status: 'open',
    }
    await db.thinkEntries.add(saved)
    setEntry(saved)
    // Intentarlo ante una pregunta real ya es un vuelo manual (y cumple la misión).
    await logFlight({
      kind: 'real',
      moduleId: 'think-first',
      title: saved.question || t('flightTitle'),
      minutes: Math.max(1, Math.min(30, minutesBetween(openedAt.current, new Date()))),
      source: 'measured',
      refId: saved.id,
    })
    feedback.good()
    await reportActivity('think.saved', ALL_MISSIONS)
    await afterActivity()
  }

  if (entry && closeness !== undefined) {
    return (
      <Page title={t('result.title')}>
        <ThinkResult entry={entry} closeness={closeness} />
      </Page>
    )
  }

  if (entry) {
    return (
      <Page title={t('savedTitle')}>
        <CheckStep entry={entry} onClosed={setCloseness} />
      </Page>
    )
  }

  return (
    <Page title={t('newTitle')} lead={t('newLead')} back="/m/think-first">
      <form onSubmit={save} className="flex flex-col gap-6">
        {/* El paso que importa: pensar la respuesta antes de buscarla. */}
        <div className="flex items-start gap-4 rounded-2xl border-2 border-accent bg-panel p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
            <MessageCircle className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg font-bold">{t('thinkTitle')}</p>
            <p className="prose-text text-ink-dim">{t('thinkLead')}</p>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 font-display text-[0.95rem] font-bold">{t('confidenceLabel')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {CONFIDENCE.map((c) => (
              <label key={c.value} className="relative">
                <input
                  type="radio"
                  name="confidence"
                  value={c.value}
                  checked={confidence === c.value}
                  onChange={() => setConfidence(c.value)}
                  className="peer absolute inset-0 opacity-0"
                />
                <span className="flex min-h-12 items-center justify-center rounded-xl border-2 border-line bg-panel px-2 text-center text-sm font-bold transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
                  {t(`confidence.${c.key}`)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Button type="submit" block disabled={!canSave}>
            {t('saveAttempt')}
          </Button>
          {!canSave && <p className="text-center text-sm text-ink-dim">{t('saveNeeds')}</p>}
        </div>

        {/* Notas opcionales, para quien quiera acordarse después de qué era. */}
        {notes ? (
          <div className="flex flex-col gap-4">
            <TextField label={t('questionLabel')} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('questionPlaceholder')} autoComplete="off" autoFocus />
            <TextArea label={t('attemptLabel')} value={attempt} onChange={(e) => setAttempt(e.target.value)} placeholder={t('attemptPlaceholder')} rows={2} />
          </div>
        ) : (
          <button type="button" onClick={() => setNotes(true)} className="self-center py-2 text-sm text-accent underline underline-offset-4">
            {t('addNotes')}
          </button>
        )}
      </form>
    </Page>
  )
}
