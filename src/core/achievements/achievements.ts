import { db } from '../db/schema'
import type { Snapshot } from '../stats/stats'

export interface AchievementDef {
  id: string
  /** Oculto: no se muestra hasta desbloquearse (recompensa variable). */
  hidden: boolean
  check: (s: Snapshot) => boolean
}

const isNight = (iso: string) => {
  const h = new Date(iso).getHours()
  return h >= 21 || h < 5
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstFlight', hidden: false, check: (s) => s.realFlights >= 1 },
  { id: 'firstThink', hidden: false, check: (s) => s.think.closed >= 1 },
  { id: 'streak7', hidden: false, check: (s) => s.streak.best >= 7 },
  { id: 'streak30', hidden: false, check: (s) => s.streak.best >= 30 },
  { id: 'rankPrivate', hidden: false, check: (s) => s.rank.rank.id !== 'student' },
  { id: 'names10', hidden: false, check: (s) => s.people.namesRecalled >= 10 },
  { id: 'firstRoute', hidden: false, check: (s) => s.navigation.flownNoGps >= 1 },
  { id: 'firstDraft', hidden: false, check: (s) => s.writing.longDrafts >= 1 },
  { id: 'calc10', hidden: false, check: (s) => s.calculation.correct >= 10 },
  { id: 'firstCheck', hidden: false, check: (s) => s.weeklyChecks.length >= 1 },
  // Ocultos
  {
    id: 'calibrated',
    hidden: true,
    check: (s) => s.think.series.filter((p) => Math.abs(p.confidence - p.closeness) <= 1).length >= 5,
  },
  {
    id: 'humble',
    hidden: true,
    check: (s) => s.think.series.some((p) => p.confidence <= 2 && p.closeness >= 4),
  },
  { id: 'allRunways', hidden: true, check: (s) => s.practicedThisWeek.size >= 6 },
  { id: 'nightFlight', hidden: true, check: (s) => s.flights.some((f) => f.kind === 'real' && isNight(f.createdAt)) },
  { id: 'cartographer', hidden: true, check: (s) => s.navigation.goodRecalls >= 3 },
  // Volver después de una pausa se celebra; nunca se castiga.
  { id: 'welcomeBack', hidden: true, check: (s) => (s.daysSincePreviousActivity ?? 0) >= 7 && s.streak.activeToday },
]

/** Desbloquea los logros nuevos y los devuelve para anunciarlos. */
export async function checkAchievements(snapshot: Snapshot): Promise<AchievementDef[]> {
  const unlocked = new Set((await db.achievements.toArray()).map((a) => a.id))
  const fresh = ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.check(snapshot))
  if (fresh.length) {
    const now = new Date().toISOString()
    await db.achievements.bulkPut(fresh.map((a) => ({ id: a.id, unlockedAt: now })))
  }
  return fresh
}
