import { CircleCheckBig, Flame } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MemoryCard } from '../../core/db/types'
import { feedback } from '../../core/feedback/feedback'
import { checkableAnswer, matchesAnswer } from '../../core/srs/match'
import { isRecalled, previewIntervals, reviewCard, type Rating } from '../../core/srs/scheduler'
import { cardRenderers } from '../../modules/cardRenderers'
import { DefaultCard } from '../../modules/DefaultCard'
import { Button } from '../primitives/Button'

/** Tiempo mínimo de intento antes de poder destapar: siempre se recuerda antes de mirar. */
const THINK_MS = 3000

export interface RunnerResult {
  reviewed: number
  recalled: number
}

export function ReviewRunner({
  cards,
  onReviewed,
  onDone,
}: {
  cards: MemoryCard[]
  onReviewed?: (recalled: boolean) => void | Promise<void>
  onDone: (result: RunnerResult) => void
}) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [attempt, setAttempt] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [combo, setCombo] = useState(0)
  const stats = useRef<RunnerResult>({ reviewed: 0, recalled: 0 })
  const headingRef = useRef<HTMLHeadingElement>(null)
  const card = cards[index]

  useEffect(() => {
    const id = setTimeout(() => setReady(true), THINK_MS)
    headingRef.current?.focus()
    return () => clearTimeout(id)
  }, [index])

  const intervals = useMemo(() => (card ? previewIntervals(card) : undefined), [card])

  if (!card) return null
  const Renderer = cardRenderers[card.kind] ?? DefaultCard
  // Si la respuesta es corta (un nombre, un dato breve), la app te dice si la tenías.
  const answer = checkableAnswer(card.back, card.kind)
  const verdict = revealed && answer && attempt.trim() ? matchesAnswer(attempt, answer, card.kind) : undefined

  async function grade(rating: Rating) {
    if (busy) return
    setBusy(true)
    const recalled = isRecalled(rating)
    await reviewCard(card, rating, attempt.trim().length > 0)
    stats.current.reviewed++
    if (recalled) {
      stats.current.recalled++
      setCombo((c) => c + 1)
      feedback.good()
    } else {
      setCombo(0)
      feedback.tick()
    }
    await onReviewed?.(recalled)
    setBusy(false)
    if (index + 1 >= cards.length) {
      onDone(stats.current)
    } else {
      setIndex(index + 1)
      setRevealed(false)
      setAttempt('')
      setReady(false)
    }
  }

  const ratings: { r: Rating; key: string; cls: string }[] = [
    { r: 1, key: 'again', cls: 'border-red text-red' },
    { r: 2, key: 'hard', cls: 'border-amber text-amber' },
    { r: 3, key: 'good', cls: 'border-green text-green' },
    { r: 4, key: 'easy', cls: 'border-accent text-accent' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-ink-dim">
        <span>{t(`review.kinds.${card.kind}`)}</span>
        <span className="flex items-center gap-3">
          {combo >= 2 && (
            <span className="flex items-center gap-1 font-display font-bold text-amber">
              <Flame className="h-4 w-4" aria-hidden />
              <span key={combo} className="hf-bump">
                ×{combo}
              </span>
              <span className="sr-only">{t('review.combo', { count: combo })}</span>
            </span>
          )}
          <span className="readout" aria-label={t('review.progressAria', { current: index + 1, total: cards.length })}>
            {index + 1}/{cards.length}
          </span>
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full bg-accent transition-[width]" style={{ width: `${(index / cards.length) * 100}%` }} />
      </div>

      {/* La región que se anuncia es siempre la misma (así el lector de pantalla lee la respuesta);
          lo que se da la vuelta al destaparla es su contenido. */}
      <section className="rounded-2xl border border-line bg-panel p-5" aria-live="polite">
        <h2 ref={headingRef} tabIndex={-1} className="sr-only">
          {t('review.cardHeading', { n: index + 1 })}
        </h2>
        <div key={`${card.id}-${revealed}`} className={revealed ? 'hf-flip' : ''}>
          <Renderer card={card} revealed={revealed} />
        </div>
      </section>

      {!revealed ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[0.95rem] font-bold">{t('review.attemptLabel')}</span>
            <span className="text-sm text-ink-dim">{t('review.attemptHint')}</span>
            <textarea
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-line bg-panel px-4 py-3 focus:border-accent focus:outline-none"
            />
          </label>
          <Button
            block
            disabled={!ready && !attempt.trim()}
            onClick={() => {
              setRevealed(true)
              feedback.tick()
            }}
          >
            {ready || attempt.trim() ? t('review.reveal') : t('review.thinking')}
          </Button>
          {!ready && !attempt.trim() && (
            <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
              <div className="hf-think-bar h-full bg-amber" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {verdict === true ? (
            <p className="animate-pop flex items-center gap-2 rounded-xl border-2 border-green bg-panel px-4 py-3 font-bold text-green">
              <CircleCheckBig className="h-5 w-5 shrink-0" aria-hidden />
              {t('review.matched', { attempt })}
            </p>
          ) : (
            attempt.trim() && (
              <p className="rounded-xl bg-panel-2 px-4 py-3 text-sm">
                <span className="text-ink-dim">{verdict === false ? t('review.notMatched') : t('review.yourAttempt')} </span>
                {attempt}
              </p>
            )
          )}
          <p className="font-display font-bold">{t('review.howWasIt')}</p>
          <div className="grid grid-cols-2 gap-2">
            {ratings.map(({ r, key, cls }) => (
              <button
                key={r}
                type="button"
                disabled={busy}
                onClick={() => grade(r)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-2 px-2 font-display font-bold ${cls} ${
                  verdict === undefined || (verdict ? r >= 3 : r <= 2) ? 'bg-panel' : 'bg-panel opacity-50'
                }`}
              >
                {t(`review.ratings.${key}`)}
                {intervals && <span className="readout text-xs font-normal text-ink-dim">{formatInterval(intervals[r], t)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatInterval(days: number, t: (k: string, o?: Record<string, unknown>) => string) {
  if (days < 1 / 24) return t('review.interval.minutes', { count: Math.max(1, Math.round(days * 1440)) })
  if (days < 1) return t('review.interval.hours', { count: Math.round(days * 24) })
  if (days < 45) return t('review.interval.days', { count: Math.round(days) })
  return t('review.interval.months', { count: Math.round(days / 30) })
}
