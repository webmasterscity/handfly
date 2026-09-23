import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '../../../core/db/schema'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity } from '../../../core/session/session'
import { minutesBetween, newId } from '../../../core/time'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { Page } from '../../../ui/primitives/Page'
import { isCorrect, makeSet, money, parseAnswer, setCalcLocale, type Problem, type Words } from '../generators'

const SET_SIZE = 5

function formatAnswer(p: Problem, t: (k: string, o?: Record<string, unknown>) => string) {
  if (p.unit === 'money') return money(p.answer)
  if (p.unit === 'minutes') return t('units.minutes', { count: p.answer })
  return t('units.grams', { count: p.answer })
}

/** Una tanda corta de problemas cotidianos, sin calculadora. Termina: no hay tanda infinita. */
export function CalcPractice() {
  const { t, i18n } = useTranslation('calculation')
  const [problems] = useState(() => {
    setCalcLocale(i18n.language)
    return makeSet(SET_SIZE, Math.random, t('words', { returnObjects: true }) as Words)
  })
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState<{ ok: boolean; value: number }>()
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)
  const startedAt = useRef(new Date())
  const problemStart = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)
  const p = problems[index]

  useEffect(() => {
    problemStart.current = Date.now()
    inputRef.current?.focus()
  }, [index])

  async function check(e: FormEvent) {
    e.preventDefault()
    const value = parseAnswer(input)
    if (value === undefined || checked) return
    const ok = isCorrect(p, value)
    setChecked({ ok, value })
    if (ok) {
      setCorrect((c) => c + 1)
      feedback.good()
    } else feedback.tick()
    await db.calcAttempts.add({
      id: newId(),
      mode: 'problem',
      category: p.category,
      prompt: t(`problems.${p.category}`, p.params),
      userAnswer: value,
      correctAnswer: p.answer,
      error: p.answer ? Math.abs(value - p.answer) / Math.abs(p.answer) : Math.abs(value),
      correct: ok,
      seconds: Math.round((Date.now() - problemStart.current) / 1000),
      createdAt: new Date().toISOString(),
    })
  }

  async function next() {
    if (index + 1 < problems.length) {
      setIndex(index + 1)
      setInput('')
      setChecked(undefined)
      return
    }
    setDone(true)
    await logFlight({
      kind: 'sim',
      moduleId: 'calculation',
      title: t('simTitle', { count: problems.length }),
      minutes: Math.min(30, minutesBetween(startedAt.current, new Date())),
      source: 'measured',
    })
    feedback.land()
    await afterActivity()
  }

  if (done) {
    return (
      <Page title={t('doneTitle')} lead={t('doneLead', { correct, total: problems.length })}>
        <p className="mb-6 rounded-xl bg-panel-2 p-4">{t('doneInvite')}</p>
        <ButtonLink to="/m/calculation" block>
          {t('back')}
        </ButtonLink>
      </Page>
    )
  }

  return (
    <Page title={t(`categories.${p.category}`)} back="/m/calculation">
      <p className="readout mb-4 text-sm text-ink-dim" aria-label={t('progressAria', { n: index + 1, total: problems.length })}>
        {index + 1}/{problems.length}
      </p>
      <form onSubmit={check} className="flex flex-col gap-5">
        <p className="text-xl leading-snug">{t(`problems.${p.category}`, p.params)}</p>
        <label className="flex flex-col gap-1.5">
          <span className="font-display text-[0.95rem] font-bold">{t('yourAnswer')}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            readOnly={Boolean(checked)}
            className="readout w-full rounded-xl border border-line bg-panel px-4 py-3 text-2xl focus:border-accent focus:outline-none"
          />
        </label>
        {!checked ? (
          <Button type="submit" block disabled={parseAnswer(input) === undefined}>
            {t('check')}
          </Button>
        ) : (
          <div className="animate-pop flex flex-col gap-4" aria-live="polite">
            <div className={`rounded-xl border-2 p-4 ${checked.ok ? 'border-green' : 'border-amber'}`}>
              <p className="font-display text-lg font-bold">{checked.ok ? t('right') : t('notQuite')}</p>
              <p>{t('answerWas', { answer: formatAnswer(p, t) })}</p>
              <p className="mt-2 text-sm text-ink-dim">{t(`tips.${p.category}`)}</p>
            </div>
            <Button block onClick={next}>
              {index + 1 < problems.length ? t('next') : t('finish')}
            </Button>
          </div>
        )}
      </form>
    </Page>
  )
}
