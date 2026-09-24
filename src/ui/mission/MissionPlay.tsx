import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Mission } from '../../core/db/types'
import {
  minutesUntil,
  scoreCloseness,
  scoreCount,
  scoreMinutesUntil,
  scoreNumber,
  scorePeeks,
  scoreTime,
  type MissionBet,
  type MissionCheck,
  type MissionResult,
} from '../../core/missions/scoring'
import { formatAmount, parseNumber } from '../../core/numbers'
import { Button } from '../primitives/Button'
import { Stepper } from '../primitives/Stepper'

export interface PlayLabels {
  /** Qué se apuesta (p. ej. «Tu total, hecho de cabeza»). */
  bet?: string
  /** Qué se comprueba (p. ej. «El total real de la caja»). */
  check?: string
}

const CLOSENESS = [
  [5, 'yes'],
  [3, 'partly'],
  [1, 'no'],
] as const

const bigInput =
  'readout w-full rounded-xl border-2 border-line bg-panel px-4 py-3 text-center text-3xl focus:border-accent focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--focus)]'

const nowClock = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Anotar la predicción antes de salir. */
export function BetForm({
  check,
  labels,
  onSave,
  onCancel,
}: {
  check: MissionCheck
  labels: PlayLabels
  onSave: (bet: Omit<MissionBet, 'at'>) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [time, setTime] = useState(nowClock)

  let ready = false
  let bet: Omit<MissionBet, 'at'> = {}
  if (check.kind === 'number') {
    const n = parseNumber(value)
    ready = n !== undefined
    bet = { value: n }
  } else if (check.kind === 'time') {
    ready = /^\d{2}:\d{2}$/.test(time)
    bet = { time }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (ready) onSave(bet)
  }

  return (
    <form onSubmit={submit} className="animate-pop flex flex-col gap-4">
      {check.kind === 'number' && (
        <label className="flex flex-col gap-2">
          <span className="font-display font-bold">{labels.bet ?? t('missions.play.betNumber')}</span>
          <input autoFocus inputMode="decimal" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} className={bigInput} />
        </label>
      )}
      {check.kind === 'time' && (
        <label className="flex flex-col gap-2">
          <span className="font-display font-bold">{labels.bet ?? t('missions.play.betTime')}</span>
          <input type="time" autoFocus value={time} onChange={(e) => setTime(e.target.value)} className={bigInput} />
        </label>
      )}
      <p className="text-sm text-ink-dim">{t('missions.play.betNote')}</p>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={!ready}>
          {t('missions.play.saveBet')}
        </Button>
      </div>
    </form>
  )
}

/** Comprobar al volver: calcula la puntuación a partir de lo anotado. */
export function ResultForm({
  check,
  mission,
  labels,
  onSubmit,
  onCancel,
}: {
  check: MissionCheck
  mission: Mission
  labels: PlayLabels
  onSubmit: (result: Omit<MissionResult, 'at'>) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const bet = mission.bet
  const [value, setValue] = useState('')
  const [time, setTime] = useState(nowClock)
  const [total, setTotal] = useState(check.total ?? 5)
  const [got, setGot] = useState(0)
  const [peeks, setPeeks] = useState(0)
  const [target, setTarget] = useState('')

  let result: Omit<MissionResult, 'at'> | undefined
  if (check.kind === 'number' && bet?.value !== undefined) {
    const actual = parseNumber(value)
    if (actual !== undefined) result = { actual, score: scoreNumber(bet.value, actual, check.maxError) }
  } else if (check.kind === 'time' && bet?.time) {
    if (/^\d{2}:\d{2}$/.test(time)) result = { time, score: scoreTime(bet.time, time) }
  } else if (check.kind === 'count') {
    result = { got: Math.min(got, total), total, score: scoreCount(got, total) }
  } else if (check.kind === 'peeks') {
    result = { peeks, score: scorePeeks(peeks) }
  } else if (check.kind === 'minutesUntil') {
    const mine = parseNumber(value)
    const truth = minutesUntil(target, new Date())
    if (mine !== undefined && truth !== undefined) result = { actual: truth, got: mine, score: scoreMinutesUntil(mine, truth) }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (result) onSubmit(result)
  }

  return (
    <form onSubmit={submit} className="animate-pop flex flex-col gap-4">
      {bet && <BetTicket bet={bet} check={check} />}

      {check.kind === 'number' && (
        <label className="flex flex-col gap-2">
          <span className="font-display font-bold">{labels.check ?? t('missions.play.checkNumber')}</span>
          <input autoFocus inputMode="decimal" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} className={bigInput} />
        </label>
      )}

      {check.kind === 'time' && (
        <label className="flex flex-col gap-2">
          <span className="font-display font-bold">{labels.check ?? t('missions.play.checkTime')}</span>
          <input type="time" autoFocus value={time} onChange={(e) => setTime(e.target.value)} className={bigInput} />
        </label>
      )}

      {check.kind === 'count' && (
        <div className="flex flex-col gap-4">
          {check.total === undefined && <Stepper label={labels.bet ?? t('missions.play.countTotal')} value={total} onChange={setTotal} min={1} />}
          <Stepper label={labels.check ?? t('missions.play.countGot')} value={Math.min(got, total)} onChange={setGot} max={total} />
        </div>
      )}

      {/* Cercanía: un toque y listo, sin escala ni botón extra. */}
      {check.kind === 'closeness' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display font-bold">{labels.check ?? t('missions.play.checkCloseness')}</legend>
          {CLOSENESS.map(([value, key]) => (
            <Button key={value} variant={value === 5 ? 'primary' : 'secondary'} block onClick={() => onSubmit({ closeness: value, score: scoreCloseness(value) })}>
              {t(`missions.play.closeness.${key}`)}
            </Button>
          ))}
        </fieldset>
      )}

      {check.kind === 'peeks' && <Stepper label={labels.check ?? t('missions.play.checkPeeks')} value={peeks} onChange={setPeeks} max={20} />}

      {check.kind === 'minutesUntil' && (
        <>
          <label className="flex flex-col gap-2">
            <span className="font-display font-bold">{labels.bet ?? t('missions.play.untilTarget')}</span>
            <input type="time" value={target} onChange={(e) => setTarget(e.target.value)} className={bigInput} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-display font-bold">{labels.check ?? t('missions.play.untilMine')}</span>
            <input inputMode="numeric" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} className={bigInput} />
          </label>
        </>
      )}

      {check.kind === 'closeness' ? (
        <Button variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      ) : (
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!result}>
            {t('missions.play.seeScore')}
          </Button>
        </div>
      )}
    </form>
  )
}

/** La apuesta anotada, con aspecto de talón de billete. */
export function BetTicket({ bet, check }: { bet: MissionBet; check: MissionCheck }) {
  const { t, i18n } = useTranslation()
  let shown = ''
  if (bet.value !== undefined) shown = check.unit === 'minutes' ? t('missions.play.minutes', { count: bet.value }) : formatAmount(bet.value, i18n.language)
  else if (bet.time) shown = bet.time
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl border-2 border-dashed border-accent bg-panel-2 px-4 py-3">
      <span className="text-sm font-bold text-ink-dim">{t('missions.play.yourBet')}</span>
      <span className="readout text-2xl">{shown}</span>
    </div>
  )
}
