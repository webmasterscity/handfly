import { Flame, Star, Timer, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { db } from '../../../core/db/schema'
import { celebrate } from '../../../core/feedback/celebrate'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity } from '../../../core/session/session'
import { getSettings, updateSettings } from '../../../core/settings/settings'
import { dayKey, minutesBetween, newId } from '../../../core/time'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { Keypad } from '../../../ui/primitives/Keypad'
import { isCorrect, makeSet, money, nextLevel, parseAnswer, setCalcLocale, starsFor, type Level, type Problem, type Words } from '../generators'
import { ProblemView } from './ProblemView'

const SET_SIZE = 5
/** Rondas por día: el simulador es un calentamiento, la práctica que cuenta es la de afuera. */
export const MAX_ROUNDS_PER_DAY = 3

function formatAnswer(p: Problem, t: (k: string, o?: Record<string, unknown>) => string) {
  if (p.unit === 'money') return money(p.answer)
  if (p.unit === 'minutes') return t('units.minutes', { count: p.answer })
  return t('units.grams', { count: p.answer })
}

function roundsToday() {
  const r = getSettings().calcRounds
  return r?.date === dayKey() ? r.count : 0
}

/**
 * Caja rápida: una ronda de 5 cuentas de la vida real, dibujadas como el objeto real
 * (tique, cuenta, etiqueta). Racha de aciertos, estrellas, récord y nivel que sube o baja
 * según cómo te va. Termina siempre: no hay ronda infinita.
 */
export function CalcPractice() {
  // «Otra ronda» monta una ronda nueva desde cero (problemas, reloj y racha).
  const [round, setRound] = useState(0)
  return <Round key={round} onAgain={() => setRound((r) => r + 1)} />
}

function Round({ onAgain }: { onAgain: () => void }) {
  const { t, i18n } = useTranslation('calculation')
  const [level] = useState<Level>(() => getSettings().calcLevel ?? 1)
  const [problems] = useState(() => {
    setCalcLocale(i18n.language)
    return makeSet(SET_SIZE, Math.random, t('words', { returnObjects: true }) as Words, level)
  })
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState<{ ok: boolean; seconds: number }>()
  const [correct, setCorrect] = useState(0)
  const [combo, setCombo] = useState(0)
  const [done, setDone] = useState<{ stars: number; seconds: number; record: boolean; newLevel: Level }>()
  const [blocked] = useState(() => roundsToday() >= MAX_ROUNDS_PER_DAY)
  const startedAt = useRef(new Date())
  const [problemStart, setProblemStart] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const p = problems[index]

  // Reloj visible del problema: un poco de ritmo, sin cuenta atrás que agobie.
  useEffect(() => {
    if (checked || done) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [checked, done])

  async function check() {
    const value = parseAnswer(input)
    if (value === undefined || checked) return
    const ok = isCorrect(p, value)
    const seconds = Math.max(1, Math.round((Date.now() - problemStart) / 1000))
    setChecked({ ok, seconds })
    if (ok) {
      setCorrect((c) => c + 1)
      setCombo((c) => c + 1)
      feedback.good()
    } else {
      setCombo(0)
      feedback.tick()
    }
    await db.calcAttempts.add({
      id: newId(),
      mode: 'problem',
      category: p.category,
      prompt: t(`problems.${p.category}`, p.params),
      userAnswer: value,
      correctAnswer: p.answer,
      error: p.answer ? Math.abs(value - p.answer) / Math.abs(p.answer) : Math.abs(value),
      correct: ok,
      seconds,
      createdAt: new Date().toISOString(),
    })
    // Acierto: pasa solo al siguiente. Fallo: se queda para leer la respuesta y el truco.
    if (ok) setTimeout(() => void next(correct + 1), 900)
  }

  async function next(correctSoFar = correct) {
    if (index + 1 < problems.length) {
      setIndex((i) => i + 1)
      setInput('')
      setChecked(undefined)
      setProblemStart(Date.now())
      return
    }
    const seconds = Math.round((Date.now() - startedAt.current.getTime()) / 1000)
    const stars = starsFor(correctSoFar, problems.length)
    const best = getSettings().calcBest
    const record = correctSoFar > 0 && (!best || correctSoFar > best.correct || (correctSoFar === best.correct && seconds < best.seconds))
    const newLevel = nextLevel(level, correctSoFar, problems.length)
    updateSettings({
      calcLevel: newLevel,
      calcRounds: { date: dayKey(), count: roundsToday() + 1 },
      ...(record ? { calcBest: { correct: correctSoFar, seconds } } : {}),
    })
    setDone({ stars, seconds, record: record && Boolean(best), newLevel })
    await logFlight({
      kind: 'sim',
      moduleId: 'calculation',
      title: t('simTitle', { count: problems.length }),
      minutes: Math.min(30, minutesBetween(startedAt.current, new Date())),
      source: 'measured',
    })
    feedback.land()
    if (record && best) {
      celebrate({ kind: 'record', title: t('game.recordTitle'), subtitle: t('game.recordSubtitle', { correct: correctSoFar, seconds }), detail: t('game.recordDetail', { correct: best.correct, seconds: best.seconds }) })
    }
    await afterActivity()
  }

  const exit = (
    <Link to="/m/calculation" aria-label={t('game.exit')} className="grid h-11 w-11 place-items-center rounded-full text-ink-dim hover:text-ink">
      <X className="h-6 w-6" aria-hidden />
    </Link>
  )

  if (blocked && !done) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-4 pb-8">
        <header className="mb-6 flex justify-end">{exit}</header>
        <h1 className="text-[1.75rem]">{t('game.enoughTitle')}</h1>
        <p className="prose-text mt-3 text-lg">{t('game.enoughLead')}</p>
        <ButtonLink to="/" block className="mt-auto">
          {t('game.toToday')}
        </ButtonLink>
      </div>
    )
  }

  if (done) {
    const left = MAX_ROUNDS_PER_DAY - roundsToday()
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-4 pb-8">
        <header className="mb-2 flex justify-end">{exit}</header>
        <div className="flex flex-1 flex-col items-center text-center">
          <p className="font-display text-sm font-bold text-ink-dim">{t('game.roundOver')}</p>
          <div className="my-5 flex gap-2" role="img" aria-label={t('game.starsAria', { count: done.stars })}>
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                aria-hidden
                className={`hf-badge h-16 w-16 ${i < done.stars ? 'fill-amber text-amber' : 'text-line'}`}
                style={{ animationDelay: `${200 + i * 220}ms` }}
              />
            ))}
          </div>
          <h1 className="text-[2rem]">{t('game.score', { correct, total: problems.length })}</h1>
          <p className="mt-1 font-display text-lg font-bold">{t(`game.tier.${done.stars}`)}</p>
          <p className="mt-1 text-ink-dim">{t('game.time', { seconds: done.seconds })}</p>
          {done.newLevel !== level && (
            <p className={`animate-pop mt-4 rounded-full px-4 py-1.5 font-bold ${done.newLevel > level ? 'bg-green text-on-accent' : 'bg-panel-2'}`}>
              {done.newLevel > level ? t('game.levelUp', { level: done.newLevel }) : t('game.levelDown', { level: done.newLevel })}
            </p>
          )}
          <p className="prose-text mt-6 rounded-2xl bg-panel-2 p-4 text-left">{t('doneInvite')}</p>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          {left > 0 && (
            <Button block onClick={onAgain}>
              {t('game.again', { count: left })}
            </Button>
          )}
          <ButtonLink to="/" variant={left > 0 ? 'secondary' : 'primary'} block>
            {t('game.toToday')}
          </ButtonLink>
        </div>
      </div>
    )
  }

  const elapsed = checked ? checked.seconds : Math.max(0, Math.round((now - problemStart) / 1000))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-3 pb-6">
      <h1 className="sr-only">{t('game.title')}</h1>
      <header className="mb-3 flex items-center justify-between gap-3">
        {exit}
        <ol className="flex gap-1.5" aria-label={t('progressAria', { n: index + 1, total: problems.length })}>
          {problems.map((_, i) => (
            <li
              key={i}
              className={`h-2.5 w-7 rounded-full ${i < index || (i === index && checked) ? 'bg-green' : i === index ? 'bg-accent' : 'bg-line'}`}
            />
          ))}
        </ol>
        <span className="flex min-w-16 items-center justify-end gap-1 font-display font-bold text-amber" aria-live="polite">
          {combo >= 2 && (
            <>
              <Flame className="h-5 w-5" aria-hidden />
              <span key={combo} className="hf-bump">
                ×{combo}
              </span>
              <span className="sr-only">{t('game.combo', { count: combo })}</span>
            </>
          )}
        </span>
      </header>

      <p className="mb-3 flex items-center justify-between text-sm text-ink-dim">
        <span>
          {t(`categories.${p.category}`)} · {t('game.level', { level })}
        </span>
        <span className="readout flex items-center gap-1" aria-hidden>
          <Timer className="h-4 w-4" />
          {elapsed} s
        </span>
      </p>

      <div key={index} className="animate-pop">
        <ProblemView p={p} />
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <div
          key={checked ? `c${index}` : `i${index}`}
          aria-live="polite"
          className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2 ${
            !checked ? 'border-accent bg-panel' : checked.ok ? 'animate-pop border-green bg-panel' : 'hf-shake border-amber bg-panel'
          }`}
        >
          <span className="text-sm text-ink-dim">{!checked ? t('yourAnswer') : checked.ok ? t('right') : t('notQuite')}</span>
          <span className="readout text-3xl">
            {input || <span className="text-ink-dim/50">0</span>}
            {p.unit !== 'money' && <span className="ml-1 text-lg text-ink-dim">{p.unit === 'minutes' ? 'min' : 'g'}</span>}
          </span>
        </div>

        {checked && !checked.ok ? (
          <div className="animate-pop flex flex-col gap-3">
            <div className="rounded-2xl bg-panel-2 p-4">
              <p className="font-bold">{t('answerWas', { answer: formatAnswer(p, t) })}</p>
              <p className="mt-1 text-sm text-ink-dim">{t(`tips.${p.category}`)}</p>
            </div>
            <Button block onClick={() => void next()}>
              {index + 1 < problems.length ? t('next') : t('finish')}
            </Button>
          </div>
        ) : (
          <>
            <Keypad value={input} onChange={setInput} onEnter={() => void check()} decimal={p.unit === 'money'} disabled={Boolean(checked)} />
            <Button block disabled={parseAnswer(input) === undefined || Boolean(checked)} onClick={() => void check()}>
              {t('check')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
