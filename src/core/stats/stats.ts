import { db } from '../db/schema'
import {
  MODULE_IDS,
  type CalcAttempt,
  type Draft,
  type Flight,
  type ModuleId,
  type ReviewEntry,
  type RouteMission,
  type ThinkEntry,
  type WeeklyCheck,
} from '../db/types'
import { rankFor, type RankProgress } from '../flight-log/flights'
import { computeStreak, type StreakInfo } from '../streak/streak'
import { addDays, dayKey, startOfWeek, weekKey } from '../time'

export interface WeekBucket {
  week: string
  start: Date
  real: number
  sim: number
  realMinutes: number
}

export interface Snapshot {
  streak: StreakInfo
  /** Lunes a domingo de esta semana: qué días hubo práctica (para la tira de la semana). */
  weekDays: { date: string; active: boolean; today: boolean; future: boolean }[]
  realMinutes: number
  simMinutes: number
  realFlights: number
  rank: RankProgress
  weeks: WeekBucket[]
  realByModuleThisWeek: Record<ModuleId, number>
  practicedThisWeek: Set<ModuleId>
  horizon: { pitch: number; bank: number; hasData: boolean }
  think: {
    closed: number
    open: number
    avgCloseness?: number
    /** Distancia media entre confianza previa y cercanía real (0 = perfectamente calibrado). */
    calibrationGap?: number
    series: { date: string; confidence: number; closeness: number }[]
  }
  recall: { cards: number; reviews30: number; accuracy30?: number; byKind: Record<string, number | undefined> }
  people: { count: number; namesRecalled: number }
  navigation: { flownNoGps: number; flown: number; avgRecall?: number; goodRecalls: number }
  writing: { drafts: number; minutes: number; longDrafts: number }
  calculation: { problems: number; correct: number; accuracy?: number; estimates: number; medianEstimateError?: number }
  weeklyChecks: WeeklyCheck[]
  lastWeeklyCheck?: WeeklyCheck
  flights: Flight[]
  /** Días entre el último día activo anterior a hoy y hoy (para "bienvenida de vuelta"). */
  daysSincePreviousActivity?: number
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined)

function median(xs: number[]) {
  if (!xs.length) return undefined
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export async function loadSnapshot(now = new Date()): Promise<Snapshot> {
  const [flights, sessions, thinks, cards, reviews, people, routes, drafts, calcs, checks] =
    await Promise.all([
      db.flights.toArray(),
      db.sessions.toArray(),
      db.thinkEntries.toArray(),
      db.cards.count(),
      db.reviews.toArray(),
      db.people.count(),
      db.routes.toArray(),
      db.drafts.toArray(),
      db.calcAttempts.toArray(),
      db.weeklyChecks.toArray(),
    ])
  return computeSnapshot({ flights, sessions, thinks, cards, reviews, people, routes, drafts, calcs, checks, now })
}

export function computeSnapshot(d: {
  flights: Flight[]
  sessions: { date: string; completedAt?: string }[]
  thinks: ThinkEntry[]
  cards: number
  reviews: ReviewEntry[]
  people: number
  routes: RouteMission[]
  drafts: Draft[]
  calcs: CalcAttempt[]
  checks: WeeklyCheck[]
  now: Date
}): Snapshot {
  const { flights, now } = d
  const real = flights.filter((f) => f.kind === 'real')
  const realMinutes = real.reduce((a, f) => a + f.minutes, 0)
  const simMinutes = flights.filter((f) => f.kind === 'sim').reduce((a, f) => a + f.minutes, 0)

  const activeDays = new Set<string>([
    ...d.sessions.filter((s) => s.completedAt).map((s) => s.date),
    ...real.map((f) => f.date),
  ])
  const streak = computeStreak(activeDays, now)
  const today = dayKey(now)
  const previous = [...activeDays].filter((k) => k < today).sort().at(-1)
  const daysSincePreviousActivity = previous
    ? Math.round((new Date(today).getTime() - new Date(previous).getTime()) / 86_400_000)
    : undefined

  // Últimas 8 semanas, de la más antigua a la actual.
  const thisMonday = startOfWeek(now)
  const weeks: WeekBucket[] = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(thisMonday, -7 * (7 - i))
    return { week: weekKey(start), start, real: 0, sim: 0, realMinutes: 0 }
  })
  const byWeek = new Map(weeks.map((w) => [w.week, w]))
  for (const f of flights) {
    const [y, m, dd] = f.date.split('-').map(Number)
    const b = byWeek.get(weekKey(new Date(y, m - 1, dd, 12)))
    if (!b) continue
    if (f.kind === 'real') {
      b.real++
      b.realMinutes += f.minutes
    } else b.sim++
  }

  const currentWeek = weekKey(now)
  const realByModuleThisWeek = Object.fromEntries(MODULE_IDS.map((id) => [id, 0])) as Record<ModuleId, number>
  const practicedThisWeek = new Set<ModuleId>()
  for (const f of flights) {
    const [y, m, dd] = f.date.split('-').map(Number)
    if (weekKey(new Date(y, m - 1, dd, 12)) !== currentWeek) continue
    practicedThisWeek.add(f.moduleId)
    if (f.kind === 'real') realByModuleThisWeek[f.moduleId]++
  }

  // Horizonte: cabeceo = autonomía reciente (vuelos reales frente a muletas declaradas);
  // alabeo = desequilibrio entre habilidades en los últimos 14 días.
  const sortedChecks = [...d.checks].sort((a, b) => a.week.localeCompare(b.week))
  const lastWeeklyCheck = sortedChecks.at(-1)
  const recentCheck = sortedChecks.filter((c) => c.week >= weeks[6].week).at(-1)
  const soloThisWeek = weeks[7].real + (recentCheck?.solo.length ?? 0)
  const crutches = recentCheck?.crutches.length ?? 0
  const autonomyTotal = soloThisWeek + crutches
  const fourteenAgo = dayKey(addDays(now, -14))
  const recentReal = real.filter((f) => f.date >= fourteenAgo)
  const counts = MODULE_IDS.map((id) => recentReal.filter((f) => f.moduleId === id).length)
  const maxShare = recentReal.length ? Math.max(...counts) / recentReal.length : 0
  const bank = recentReal.length >= 3 ? Math.max(0, (maxShare - 1 / 3) / (2 / 3)) : 0
  const horizon = {
    pitch: autonomyTotal ? (soloThisWeek / autonomyTotal - 0.5) * 2 : 0,
    bank,
    hasData: autonomyTotal > 0,
  }

  const closed = d.thinks.filter((t) => t.status === 'closed' && t.closeness)
  const thirty = new Date(now.getTime() - 30 * 86_400_000).toISOString()
  const recent = d.reviews.filter((r) => r.reviewedAt >= thirty)
  const accuracyOf = (rs: ReviewEntry[]) => (rs.length ? rs.filter((r) => r.rating >= 3).length / rs.length : undefined)

  const flown = d.routes.filter((r) => r.status !== 'planned')
  const recalls = d.routes.filter((r) => r.recallScore !== undefined).map((r) => r.recallScore as number)
  const problems = d.calcs.filter((c) => c.mode === 'problem')
  const estimates = d.calcs.filter((c) => c.mode === 'estimate')

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = dayKey(addDays(thisMonday, i))
    return { date, active: activeDays.has(date), today: date === today, future: date > today }
  })

  return {
    streak,
    weekDays,
    realMinutes,
    simMinutes,
    realFlights: real.length,
    rank: rankFor(realMinutes, real.length),
    weeks,
    realByModuleThisWeek,
    practicedThisWeek,
    horizon,
    think: {
      closed: closed.length,
      open: d.thinks.filter((t) => t.status === 'open').length,
      avgCloseness: avg(closed.map((t) => t.closeness as number)),
      calibrationGap: avg(closed.map((t) => Math.abs(t.confidence - (t.closeness as number)))),
      series: closed
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((t) => ({ date: t.createdAt, confidence: t.confidence, closeness: t.closeness as number })),
    },
    recall: {
      cards: d.cards,
      reviews30: recent.length,
      accuracy30: accuracyOf(recent),
      byKind: {
        think: accuracyOf(recent.filter((r) => r.kind === 'think')),
        fact: accuracyOf(recent.filter((r) => r.kind === 'fact')),
        person: accuracyOf(recent.filter((r) => r.kind === 'person')),
      },
    },
    people: {
      count: d.people,
      namesRecalled: d.reviews.filter((r) => r.kind === 'person' && r.rating >= 3).length,
    },
    navigation: {
      flown: flown.length,
      flownNoGps: flown.filter((r) => r.usedGps === 'no').length,
      avgRecall: avg(recalls),
      goodRecalls: recalls.filter((s) => s >= 0.8).length,
    },
    writing: {
      drafts: d.drafts.filter((x) => x.finishedAt).length,
      minutes: Math.round(d.drafts.reduce((a, x) => a + x.secondsWriting, 0) / 60),
      longDrafts: d.drafts.filter((x) => x.words >= 150).length,
    },
    calculation: {
      problems: problems.length,
      correct: problems.filter((c) => c.correct).length,
      accuracy: problems.length ? problems.filter((c) => c.correct).length / problems.length : undefined,
      estimates: estimates.length,
      medianEstimateError: median(estimates.map((c) => c.error)),
    },
    weeklyChecks: sortedChecks,
    lastWeeklyCheck,
    flights,
    daysSincePreviousActivity,
  }
}
