import { checkAchievements } from '../achievements/achievements'
import { db } from '../db/schema'
import type { Mission, ModuleId } from '../db/types'
import { feedback, toast } from '../feedback/feedback'
import { logFlight } from '../flight-log/flights'
import { SURPRISE_MISSIONS } from '../missions/templates'
import { pickMission } from '../missions/planner'
import type { MissionTemplate } from '../modules/types'
import { loadSnapshot } from '../stats/stats'
import { addDays, dayKey, minutesBetween, newId } from '../time'
import i18n from '../../i18n'

export async function startSession() {
  const date = dayKey()
  const existing = await db.sessions.get(date)
  if (!existing) {
    await db.sessions.put({ date, startedAt: new Date().toISOString(), reviews: 0, correct: 0 })
  }
}

export async function recordSessionReview(correct: boolean) {
  const date = dayKey()
  await db.sessions.where('date').equals(date).modify((s) => {
    s.reviews++
    if (correct) s.correct++
  })
}

export async function completeSession() {
  const date = dayKey()
  const s = await db.sessions.get(date)
  if (!s || s.completedAt) return
  const completedAt = new Date()
  await db.sessions.update(date, { completedAt: completedAt.toISOString() })
  // La sesión es práctica dentro de la app: horas de simulador, no vuelo real.
  if (s.reviews > 0) {
    await logFlight({
      kind: 'sim',
      moduleId: 'recall',
      title: i18n.t('session.simFlightTitle', { count: s.reviews }),
      minutes: Math.min(30, minutesBetween(new Date(s.startedAt), completedAt)),
      source: 'measured',
    })
  }
  await afterActivity()
}

/** Anuncia logros nuevos. Llamar después de cualquier registro relevante. */
export async function afterActivity() {
  const fresh = await checkAchievements(await loadSnapshot())
  for (const a of fresh) {
    feedback.land()
    toast(i18n.t('achievements.unlocked', { name: i18n.t(`achievements.items.${a.id}.name`) }), 'success')
  }
}

/** Devuelve la misión de hoy, creándola si no existe. */
export async function ensureTodayMission(
  templates: MissionTemplate[],
  enabledModules: ModuleId[],
): Promise<Mission | undefined> {
  const today = dayKey()
  const existing = await db.missions.where('assignedOn').equals(today).toArray()
  const active = existing.find((m) => m.status !== 'skipped')
  if (active) return active
  return createMission(templates, enabledModules, existing.map((m) => m.templateId))
}

export async function swapTodayMission(
  current: Mission,
  templates: MissionTemplate[],
  enabledModules: ModuleId[],
) {
  await db.missions.update(current.id, { status: 'skipped' })
  const today = await db.missions.where('assignedOn').equals(dayKey()).toArray()
  return createMission(templates, enabledModules, today.map((m) => m.templateId), false)
}

async function createMission(
  templates: MissionTemplate[],
  enabledModules: ModuleId[],
  exclude: string[],
  allowSurprise = true,
) {
  const since = dayKey(addDays(new Date(), -14))
  const recentFlights = await db.flights.where('date').aboveOrEqual(since).toArray()
  const recentMissions = await db.missions.where('assignedOn').aboveOrEqual(since).sortBy('assignedOn')
  const template = pickMission({
    templates,
    surprises: allowSurprise ? SURPRISE_MISSIONS : [],
    recentFlights,
    recentMissions,
    enabledModules,
    exclude,
  })
  if (!template) return undefined
  const mission: Mission = {
    id: newId(),
    templateId: template.id,
    moduleId: template.moduleId,
    assignedOn: dayKey(),
    surprise: Boolean(template.surprise),
    status: 'offered',
  }
  await db.missions.add(mission)
  return mission
}

export function findTemplate(templates: MissionTemplate[], id: string) {
  return [...templates, ...SURPRISE_MISSIONS].find((t) => t.id === id)
}

export async function completeMission(mission: Mission, template: MissionTemplate | undefined, minutes: number, note: string) {
  await db.missions.update(mission.id, { status: 'done', doneAt: new Date().toISOString(), note })
  await logFlight({
    kind: 'real',
    moduleId: mission.moduleId,
    title: template ? i18n.t(`missions.${template.textKey}`) : i18n.t('missions.fallbackTitle'),
    minutes,
    source: 'declared',
    refId: mission.id,
  })
  feedback.land()
  await afterActivity()
}
