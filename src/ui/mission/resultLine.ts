import type { Mission } from '../../core/db/types'
import type { MissionCheck } from '../../core/missions/scoring'
import { formatAmount } from '../../core/numbers'

/** Explicación corta de una puntuación («Apostaste 37.500 · Real 37.200»). */
export function resultLine(check: MissionCheck | undefined, mission: Mission, t: (k: string, o?: Record<string, unknown>) => string, lang: string) {
  const r = mission.result
  if (!r || !check) return undefined
  const amount = (n: number) => (check.unit === 'minutes' ? t('missions.play.minutes', { count: n }) : formatAmount(n, lang))
  switch (check.kind) {
    case 'number':
      return mission.bet?.value !== undefined && r.actual !== undefined ? t('missions.play.lineNumber', { bet: amount(mission.bet.value), actual: amount(r.actual) }) : undefined
    case 'time':
      return t('missions.play.lineTime', { bet: mission.bet?.time, actual: r.time })
    case 'count':
      return t('missions.play.lineCount', { got: r.got, total: r.total })
    case 'closeness':
      return t('missions.play.lineCloseness', { closeness: r.closeness })
    case 'peeks':
      return r.peeks ? t('missions.play.linePeeks', { count: r.peeks }) : t('missions.play.lineNoPeeks')
    case 'minutesUntil':
      return t('missions.play.lineUntil', { mine: r.got, actual: r.actual })
    case 'bearing':
      return t('missions.play.lineBearing', { degrees: r.degrees, km: formatAmount(r.km ?? 0, lang) })
  }
}
