import { CircleCheckBig, Flame, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { db } from '../../../core/db/schema'
import type { Person } from '../../../core/db/types'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity } from '../../../core/session/session'
import { matchesAnswer } from '../../../core/srs/match'
import { minutesBetween } from '../../../core/time'
import { Button, ButtonLink } from '../../../ui/primitives/Button'

const ROUND = 5

/**
 * ¿Cómo se llama?: una ronda corta con la gente que registraste. Ves dónde la conociste
 * y qué la distingue, escribes el nombre y la app te dice si acertaste. Es un recuerdo
 * extra, fuera del calendario de repasos (no lo altera). Nunca con fotos.
 */
export function PeopleQuiz() {
  const { t } = useTranslation('people')
  const [people, setPeople] = useState<Person[]>()
  const [index, setIndex] = useState(0)
  const [attempt, setAttempt] = useState('')
  const [writing, setWriting] = useState(false)
  // Destapado sin escribir: la persona dice si lo sabía (checked queda pendiente hasta entonces).
  const [revealed, setRevealed] = useState(false)
  const [checked, setChecked] = useState<boolean>()
  const [right, setRight] = useState(0)
  const [combo, setCombo] = useState(0)
  const [done, setDone] = useState(false)
  const startedAt = useRef(new Date())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void db.people.toArray().then((all) => setPeople([...all].sort(() => Math.random() - 0.5).slice(0, ROUND)))
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [index, writing])

  if (!people) return null
  const person = people[index]

  function grade(ok: boolean) {
    setChecked(ok)
    setRevealed(true)
    if (ok) {
      setRight((r) => r + 1)
      setCombo((c) => c + 1)
      feedback.good()
    } else {
      setCombo(0)
      feedback.tick()
    }
  }

  /** Con el nombre escrito, la app comprueba sola. */
  function check(e: FormEvent) {
    e.preventDefault()
    if (!attempt.trim() || checked !== undefined) return
    grade(matchesAnswer(attempt, person.name, 'person'))
  }

  async function next() {
    if (index + 1 < people!.length) {
      setIndex(index + 1)
      setAttempt('')
      setChecked(undefined)
      setRevealed(false)
      return
    }
    setDone(true)
    feedback.land()
    await logFlight({
      kind: 'sim',
      moduleId: 'people',
      title: t('quiz.simTitle', { count: people!.length }),
      minutes: Math.max(1, Math.min(15, minutesBetween(startedAt.current, new Date()))),
      source: 'measured',
    })
    await afterActivity()
  }

  const exit = (
    <Link to="/m/people" aria-label={t('quiz.exit')} className="grid h-11 w-11 place-items-center rounded-full text-ink-dim hover:text-ink">
      <X className="h-6 w-6" aria-hidden />
    </Link>
  )

  if (!people.length) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-3 pb-8">
        <header className="mb-4 flex justify-end">{exit}</header>
        <h1 className="text-[1.75rem]">{t('quiz.emptyTitle')}</h1>
        <p className="prose-text mt-3 text-lg">{t('empty')}</p>
        <ButtonLink to="/m/people/new" block className="mt-auto">
          {t('add')}
        </ButtonLink>
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-3 pb-8 text-center">
        <header className="mb-4 flex justify-end">{exit}</header>
        <p className="font-display text-sm font-bold text-ink-dim">{t('quiz.over')}</p>
        <h1 className="readout mt-4 text-6xl">
          {right}/{people.length}
        </h1>
        <p className="mt-2 font-display text-xl font-bold">{right === people.length ? t('quiz.perfect') : right >= people.length / 2 ? t('quiz.good') : t('quiz.keepGoing')}</p>
        <p className="prose-text mt-6 rounded-2xl bg-panel-2 p-4 text-left">{t('quiz.realWorld')}</p>
        <ButtonLink to="/m/people" block className="mt-auto">
          {t('quiz.back')}
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-3 pb-8">
      <h1 className="sr-only">{t('quiz.title')}</h1>
      <header className="mb-4 flex items-center justify-between gap-3">
        {exit}
        <ol className="flex gap-1.5" aria-label={t('quiz.progress', { n: index + 1, total: people.length })}>
          {people.map((_, i) => (
            <li key={i} className={`h-2.5 w-7 rounded-full ${i < index || (i === index && checked !== undefined) ? 'bg-magenta' : i === index ? 'bg-accent' : 'bg-line'}`} />
          ))}
        </ol>
        <span className="flex min-w-16 items-center justify-end gap-1 font-display font-bold text-amber">
          {combo >= 2 && (
            <>
              <Flame className="h-5 w-5" aria-hidden />
              <span key={combo} className="hf-bump">
                ×{combo}
              </span>
            </>
          )}
        </span>
      </header>

      {/* Tarjeta de contacto sin foto: solo contexto, como en la vida real. */}
      <section key={person.id} className="animate-pop rounded-3xl border border-line bg-panel p-5" aria-live="polite">
        <span aria-hidden className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-magenta font-display text-4xl font-bold text-on-accent">
          {revealed ? person.name.charAt(0).toUpperCase() : '?'}
        </span>
        <dl className="grid gap-3">
          <div>
            <dt className="text-sm text-ink-dim">{t('card.where')}</dt>
            <dd className="text-lg">{person.whereMet}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-dim">{t('card.trait')}</dt>
            <dd className="text-lg">{person.trait}</dd>
          </div>
          {person.conversation && (
            <div>
              <dt className="text-sm text-ink-dim">{t('card.talked')}</dt>
              <dd className="text-lg">{person.conversation}</dd>
            </div>
          )}
        </dl>
        {revealed && (
          <div className="hf-flip mt-4 border-t border-line pt-4">
            <p className="font-display text-3xl font-bold">{person.name}</p>
            {person.linkImage && (
              <p className="mt-1 text-ink-dim">
                {t('card.yourImage')} {person.linkImage}
              </p>
            )}
          </div>
        )}
      </section>

      <form onSubmit={check} className="mt-auto flex flex-col gap-3 pt-6">
        {checked !== undefined ? (
          <>
            <p className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 font-bold ${checked ? 'border-green text-green' : 'hf-shake border-amber'}`}>
              {checked && <CircleCheckBig className="h-5 w-5 shrink-0" aria-hidden />}
              {checked ? t('quiz.right') : attempt.trim() ? t('quiz.wrong', { attempt }) : t('quiz.wrongSaid')}
            </p>
            <Button block onClick={() => void next()}>
              {index + 1 < people.length ? t('quiz.next') : t('quiz.finish')}
            </Button>
          </>
        ) : revealed ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-center font-display text-lg font-bold">{t('quiz.didYouKnow')}</legend>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => grade(false)}>
                {t('quiz.no')}
              </Button>
              <Button onClick={() => grade(true)}>{t('quiz.yes')}</Button>
            </div>
          </fieldset>
        ) : writing ? (
          <>
            <label htmlFor="quiz-name" className="font-display font-bold">
              {t('card.question')}
            </label>
            <input
              id="quiz-name"
              ref={inputRef}
              value={attempt}
              autoComplete="off"
              autoCapitalize="words"
              onChange={(e) => setAttempt(e.target.value)}
              className="rounded-xl border-2 border-accent bg-panel px-4 py-3 text-center text-2xl focus:outline-none"
            />
            <Button type="submit" block disabled={!attempt.trim()}>
              {t('quiz.check')}
            </Button>
          </>
        ) : (
          <>
            <p className="text-center font-display text-lg font-bold">{t('quiz.sayIt')}</p>
            <Button block onClick={() => setRevealed(true)}>
              {t('quiz.show')}
            </Button>
            <button type="button" onClick={() => setWriting(true)} className="self-center py-1 text-sm text-accent underline underline-offset-4">
              {t('quiz.preferWriting')}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
