import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { ThinkEntry } from '../../../core/db/types'
import { scoreCloseness, scoreTier } from '../../../core/missions/scoring'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { useCountUp } from '../../../ui/useCountUp'
import { CLOSENESS, closeThink, saveThinkCard } from '../think'

/**
 * Paso 2: comprobarlo donde se quiera (la IA, un buscador, un libro, otra persona) y
 * decir con un toque si se acertó. Se puede dejar para después.
 */
export function CheckStep({ entry, onClosed }: { entry: ThinkEntry; onClosed: (closeness: number) => void }) {
  const { t } = useTranslation('think-first')
  const [busy, setBusy] = useState(false)

  async function pick(closeness: number) {
    if (busy) return
    setBusy(true)
    onClosed(closeness)
    await closeThink(entry, closeness)
  }

  return (
    <div className="animate-pop flex flex-col gap-5">
      {(entry.question || entry.attempt) && (
        <div className="rounded-2xl border border-line bg-panel p-4">
          {entry.question && (
            <>
              <p className="text-sm text-ink-dim">{t('yourQuestion')}</p>
              <p className="font-bold">{entry.question}</p>
            </>
          )}
          {entry.attempt && (
            <>
              <p className="mt-3 text-sm text-ink-dim">{t('yourGuess')}</p>
              <p className="whitespace-pre-wrap">{entry.attempt}</p>
            </>
          )}
        </div>
      )}
      <div>
        <h2 className="text-xl">{t('checkTitle')}</h2>
        <p className="prose-text mt-1 text-ink-dim">{t('checkLead')}</p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-display font-bold">{t('gotIt')}</legend>
        {CLOSENESS.map((c) => (
          <Button key={c.value} variant={c.value === 5 ? 'primary' : 'secondary'} block disabled={busy} onClick={() => void pick(c.value)}>
            {t(`closeness.${c.key}`)}
          </Button>
        ))}
      </fieldset>
      <ButtonLink to="/" variant="ghost">
        {t('checkLater')}
      </ButtonLink>
    </div>
  )
}

/** Paso 3: el resultado, con la tarjeta de repaso como algo opcional. */
export function ThinkResult({ entry, closeness }: { entry: ThinkEntry; closeness: number }) {
  const { t } = useTranslation('think-first')
  const score = scoreCloseness(closeness)
  const shown = useCountUp(score)
  const [answer, setAnswer] = useState('')
  const [saved, setSaved] = useState(false)
  const gap = closeness - entry.confidence
  const calibration = Math.abs(gap) <= 1 ? 'good' : gap > 0 ? 'under' : 'over'

  async function saveCard(e: FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    await saveThinkCard(entry, answer.trim())
    setSaved(true)
  }

  return (
    <div className="animate-pop flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4 rounded-2xl border border-line bg-panel p-5">
        <p className="font-display text-2xl leading-tight font-bold">{t(`result.tier.${scoreTier(score)}`)}</p>
        <p className="text-right">
          <span className="block text-sm text-ink-dim">{t('result.precision')}</span>
          <span className="readout block text-5xl leading-none">{shown}</span>
        </p>
      </div>
      <p className="prose-text rounded-2xl bg-panel-2 p-4">{t(`calibration.${calibration}`)}</p>

      {!entry.question ? null : saved ? (
        <p className="rounded-2xl border-2 border-green p-4 font-bold">{t('result.cardMade')}</p>
      ) : (
        <form onSubmit={saveCard} className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-4">
          <label htmlFor="think-answer" className="font-display font-bold">
            {t('result.cardLabel')}
          </label>
          <p className="text-sm text-ink-dim">{t('result.cardHint')}</p>
          <input
            id="think-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoComplete="off"
            className="rounded-xl border border-line bg-panel px-4 py-3 focus:border-accent focus:outline-none"
          />
          <Button type="submit" variant="secondary" disabled={!answer.trim()}>
            {t('result.cardSave')}
          </Button>
        </form>
      )}

      <ButtonLink to="/" block>
        {t('result.done')}
      </ButtonLink>
    </div>
  )
}
