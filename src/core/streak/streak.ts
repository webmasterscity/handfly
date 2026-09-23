import { addDays, dayKey, fromDayKey, weekKey } from '../time'

export interface StreakInfo {
  current: number
  best: number
  /** Si el descanso protegido de esta semana ya se usó para sostener la racha actual. */
  restUsedThisWeek: boolean
  activeToday: boolean
}

/**
 * Racha con un día de descanso protegido por semana ISO.
 * - Un día cuenta si hubo sesión completada o un vuelo real.
 * - Hoy sin actividad no rompe la racha (el día aún no termina).
 * - El primer día perdido de cada semana se cubre solo; el segundo la corta.
 * - Los días de descanso no suman, solo sostienen.
 */
export function computeStreak(activeDays: Iterable<string>, today = new Date()): StreakInfo {
  const active = new Set(activeDays)
  const activeToday = active.has(dayKey(today))
  const { count, restWeeks } = walkBack(active, activeToday ? today : addDays(today, -1))

  let best = count
  for (const key of active) {
    // Solo se mide desde el último día de cada tramo activo.
    if (active.has(dayKey(addDays(fromDayKey(key), 1)))) continue
    best = Math.max(best, walkBack(active, fromDayKey(key)).count)
  }

  return {
    current: count,
    best,
    restUsedThisWeek: restWeeks.has(weekKey(today)),
    activeToday,
  }
}

function walkBack(active: Set<string>, from: Date) {
  const usedWeeks = new Set<string>() // semanas cuyo descanso ya se gastó al recorrer
  const sustaining = new Set<string>() // descansos que de verdad unen dos días activos
  let pending: string[] = []
  let count = 0
  let cursor = from
  // Cada semana cubre como mucho un día, así que el bucle siempre termina.
  for (;;) {
    if (active.has(dayKey(cursor))) {
      count++
      pending.forEach((w) => sustaining.add(w))
      pending = []
    } else {
      const wk = weekKey(cursor)
      if (usedWeeks.has(wk)) break
      usedWeeks.add(wk)
      pending.push(wk)
    }
    cursor = addDays(cursor, -1)
  }
  return { count, restWeeks: sustaining }
}
