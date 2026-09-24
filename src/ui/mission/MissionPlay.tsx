import { Check, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Mission } from '../../core/db/types'
import {
  minutesUntil,
  scoreCloseness,
  scoreCount,
  scoreList,
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
import { TextArea } from '../primitives/Field'
import { Scale } from '../primitives/Scale'
import { Stepper } from '../primitives/Stepper'

export interface PlayLabels {
  /** Qué se apuesta (p. ej. «Tu total, hecho de cabeza»). */
  bet?: string
  /** Qué se comprueba (p. ej. «El total real de la caja»). */
  check?: string
}

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
  const [items, setItems] = useState<string[]>([])
  const [text, setText] = useState('')

  let ready = false
  let bet: Omit<MissionBet, 'at'> = {}
  if (check.kind === 'number') {
    const n = parseNumber(value)
    ready = n !== undefined
    bet = { value: n }
  } else if (check.kind === 'time') {
    ready = /^\d{2}:\d{2}$/.test(time)
    bet = { time }
  } else if (check.kind === 'list') {
    ready = items.length > 0
    bet = { items }
  } else if (check.kind === 'closeness') {
    ready = text.trim().length > 0
    bet = { text: text.trim() }
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
      {check.kind === 'list' && <ListInput label={labels.bet ?? t('missions.play.betList')} items={items} onChange={setItems} />}
      {check.kind === 'closeness' && (
        <TextArea label={labels.bet ?? t('missions.play.betText')} value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus />
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
  const [wrong, setWrong] = useState<Set<number>>(new Set())
  const [missed, setMissed] = useState(0)
  const [total, setTotal] = useState(check.total ?? 5)
  const [got, setGot] = useState(0)
  const [closeness, setCloseness] = useState<number>()
  const [peeks, setPeeks] = useState(0)
  const [target, setTarget] = useState('')

  let result: Omit<MissionResult, 'at'> | undefined
  if (check.kind === 'number' && bet?.value !== undefined) {
    const actual = parseNumber(value)
    if (actual !== undefined) result = { actual, score: scoreNumber(bet.value, actual, check.maxError) }
  } else if (check.kind === 'time' && bet?.time) {
    if (/^\d{2}:\d{2}$/.test(time)) result = { time, score: scoreTime(bet.time, time) }
  } else if (check.kind === 'list' && bet?.items) {
    const right = bet.items.length - wrong.size
    result = { got: right, total: bet.items.length + missed, score: scoreList(bet.items.length, right, missed) }
  } else if (check.kind === 'count') {
    result = { got: Math.min(got, total), total, score: scoreCount(got, total) }
  } else if (check.kind === 'closeness') {
    if (closeness) result = { closeness, score: scoreCloseness(closeness) }
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

      {check.kind === 'list' && bet?.items && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display font-bold">{labels.check ?? t('missions.play.checkList')}</legend>
          {bet.items.map((item, i) => {
            const isWrong = wrong.has(i)
            return (
              <label
                key={i}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 has-focus-visible:outline-3 has-focus-visible:outline-[var(--focus)] ${
                  isWrong ? 'border-line bg-panel-2 text-ink-dim line-through' : 'border-green bg-panel'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={!isWrong}
                  onChange={() => {
                    const next = new Set(wrong)
                    if (isWrong) next.delete(i)
                    else next.add(i)
                    setWrong(next)
                  }}
                />
                <span aria-hidden className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${isWrong ? 'bg-line text-ink-dim' : 'bg-green text-on-accent'}`}>
                  {isWrong ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                <span className="flex-1">{item}</span>
              </label>
            )
          })}
          <p className="text-sm text-ink-dim">{t('missions.play.listHint')}</p>
          <Stepper label={t('missions.play.missed')} value={missed} onChange={setMissed} />
        </fieldset>
      )}

      {check.kind === 'count' && (
        <div className="flex flex-col gap-4">
          {check.total === undefined && <Stepper label={labels.bet ?? t('missions.play.countTotal')} value={total} onChange={setTotal} min={1} />}
          <Stepper label={labels.check ?? t('missions.play.countGot')} value={Math.min(got, total)} onChange={setGot} max={total} />
        </div>
      )}

      {check.kind === 'closeness' && (
        <Scale
          label={labels.check ?? t('missions.play.checkCloseness')}
          value={closeness}
          onChange={setCloseness}
          lowLabel={t('missions.play.closenessLow')}
          highLabel={t('missions.play.closenessHigh')}
        />
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

      <div className="grid grid-cols-[auto_1fr] gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={!result}>
          {t('missions.play.seeScore')}
        </Button>
      </div>
    </form>
  )
}

/** La apuesta anotada, con aspecto de talón de billete. */
export function BetTicket({ bet, check }: { bet: MissionBet; check: MissionCheck }) {
  const { t, i18n } = useTranslation()
  let shown = ''
  if (bet.value !== undefined) shown = check.unit === 'minutes' ? t('missions.play.minutes', { count: bet.value }) : formatAmount(bet.value, i18n.language)
  else if (bet.time) shown = bet.time
  else if (bet.items) shown = t('missions.play.items', { count: bet.items.length })
  else if (bet.text) shown = bet.text
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl border-2 border-dashed border-accent bg-panel-2 px-4 py-3">
      <span className="text-sm font-bold text-ink-dim">{t('missions.play.yourBet')}</span>
      <span className={bet.text ? 'text-right' : 'readout text-2xl'}>{shown}</span>
    </div>
  )
}

function ListInput({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...items, v])
    setDraft('')
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="mission-list-input" className="font-display font-bold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id="mission-list-input"
          autoFocus
          value={draft}
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-4 py-3 focus:border-accent focus:outline-none"
        />
        <button type="button" onClick={add} aria-label={t('missions.play.addItem')} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-on-accent">
          <Plus className="h-5 w-5" aria-hidden />
        </button>
      </div>
      {items.length > 0 && (
        <ol className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <li key={i} className="animate-pop flex items-center gap-1 rounded-full border border-line bg-panel-2 py-1 pr-1 pl-3">
              <span className="readout text-xs text-ink-dim">{i + 1}</span>
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={t('missions.play.removeItem', { item })}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-dim"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
