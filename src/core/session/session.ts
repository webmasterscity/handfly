import { checkAchievements } from '../achievements/achievements'
import { db } from '../db/schema'
import type { Mission, ModuleId } from '../db/types'
import type { MissionBet, MissionResult } from '../missions/scoring'
import { celebrate } from '../feedback/celebrate'
import { feedback, toast } from '../feedback/feedback'
import { logFlight, RANKS, rankIndex } from '../flight-log/flights'
import { SURPRISE_MISSIONS } from '../missions/templates'
import { pickMission } from '../missions/planner'
import type { MissionEvent, MissionTemplate } from '../modules/types'
import { loadSnapshot, type Snapshot } from '../stats/stats'
import { addDays, dayKey, minutesBetween, newId } from '../time'
import { getSettings, updateSettings } from '../settings/settings'
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

/**
 * Anuncia ascensos y logros nuevos con una celebración. Llamar después de cualquier
 * registro relevante. Las llamadas van en fila: si dos se solapan (p. ej. «¡La cumplí!» y
 * «Terminar la sesión» seguidos), la segunda ve lo que ya anotó la primera y no se
 * celebra dos veces lo mismo.
 */
let announcing: Promise<void> = Promise.resolve()

export function afterActivity(): Promise<void> {
  announcing = announcing.then(announce, announce)
  return announcing
}

async function announce() {
  const snapshot = await loadSnapshot()
  const promoted = await announceRank(snapshot)
  // «Licencia privada» ya se celebra como ascenso: se desbloquea sin otra pantalla.
  const fresh = (await checkAchievements(snapshot)).filter((a) => !(a.id === 'rankPrivate' && promoted))
  if (!fresh.length) return
  // Varios logros a la vez van en una sola pantalla: una celebración, no una fila de ellas.
  const names = fresh.map((a) => i18n.t(`achievements.items.${a.id}.name`))
  celebrate({
    kind: 'achievement',
    title: i18n.t('celebrate.achievement', { count: fresh.length }),
    subtitle: names.join(' · '),
    detail: fresh.length === 1 ? i18n.t(`achievements.items.${fresh[0].id}.desc`) : undefined,
  })
}

/** Filas «rank:<id>» de los rangos ya alcanzados que aún no están anotadas. */
async function unrecordedRanks(snapshot: Snapshot) {
  const current = rankIndex(snapshot.rank.rank.id)
  const seen = new Set((await db.achievements.toArray()).map((a) => a.id))
  return RANKS.slice(1, current + 1).filter((r) => !seen.has(`rank:${r.id}`))
}

/**
 * Cada rango alcanzado queda anotado (fila «rank:<id>» en logros) para celebrarlo una
 * sola vez, aunque se llegue a él por un vuelo registrado a mano o una restauración.
 * Devuelve si hubo ascenso.
 */
async function announceRank(snapshot: Snapshot): Promise<boolean> {
  const fresh = await unrecordedRanks(snapshot)
  if (!fresh.length) return false
  const now = new Date().toISOString()
  await db.achievements.bulkPut(fresh.map((r) => ({ id: `rank:${r.id}`, unlockedAt: now })))
  const next = snapshot.rank.next
  celebrate({
    kind: 'rank',
    rankIndex: rankIndex(snapshot.rank.rank.id),
    title: i18n.t('celebrate.promoted'),
    subtitle: i18n.t('celebrate.nowYouAre', { rank: i18n.t(`ranks.${snapshot.rank.rank.id}`) }),
    detail: next ? i18n.t('celebrate.nextRank', { rank: i18n.t(`ranks.${next.id}`) }) : i18n.t('celebrate.topRank'),
  })
  return true
}

/**
 * Al abrir la app: anota sin celebrar los rangos que ya se tenían antes de existir esta
 * anotación (quien ya era Piloto comercial no debe ver un «¡Ascenso!» falso), y los logros
 * que ya se cumplían. Se hace una sola vez por dispositivo.
 */
export async function recordExistingProgress() {
  if (getSettings().progressRecorded) return
  const snapshot = await loadSnapshot()
  const fresh = await unrecordedRanks(snapshot)
  if (fresh.length) {
    const now = new Date().toISOString()
    await db.achievements.bulkPut(fresh.map((r) => ({ id: `rank:${r.id}`, unlockedAt: now })))
  }
  updateSettings({ progressRecorded: true })
}

let ensuring: Promise<Mission | undefined> | undefined

/**
 * Devuelve la misión de hoy, creándola si no existe. Llamadas simultáneas (Hoy y la
 * sesión, o el doble efecto del modo estricto) comparten la misma promesa para no
 * crear dos misiones el mismo día.
 */
export function ensureTodayMission(templates: MissionTemplate[], enabledModules: ModuleId[]): Promise<Mission | undefined> {
  ensuring ??= loadOrCreateMission(templates, enabledModules).finally(() => {
    ensuring = undefined
  })
  return ensuring
}

async function loadOrCreateMission(templates: MissionTemplate[], enabledModules: ModuleId[]) {
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
  // La primera misión de alguien nuevo es siempre la de arranque: corta y dentro de la
  // app, para que la primera experiencia sea entender el ciclo, no salir a buscar algo.
  const first = (await db.missions.count()) === 0
  const starter = first ? templates.find((t) => t.starter && enabledModules.includes(t.moduleId)) : undefined
  const template = starter ?? pickMission({
    templates,
    surprises: allowSurprise ? SURPRISE_MISSIONS : [],
    recentFlights,
    recentMissions,
    enabledModules,
    exclude,
    focus: getSettings().focus,
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

export function missionTitle(template: MissionTemplate | undefined) {
  return template ? i18n.t(`missions.${template.textKey}.title`) : i18n.t('missions.fallbackTitle')
}

/** Anota la predicción antes de salir a hacer la misión. */
export async function placeBet(mission: Mission, bet: Omit<MissionBet, 'at'>) {
  await db.missions.update(mission.id, { status: 'accepted', bet: { ...bet, at: new Date().toISOString() } })
  feedback.good()
}

/** La mejor puntuación anterior en esta misión, para anunciar récords. */
export async function bestScore(templateId: string, exceptId?: string): Promise<number | undefined> {
  const done = await db.missions.filter((m) => m.templateId === templateId && m.id !== exceptId && m.result !== undefined).toArray()
  return done.length ? Math.max(...done.map((m) => m.result!.score)) : undefined
}

/**
 * Da la misión por cumplida y la registra como vuelo real con los minutos estimados de
 * la plantilla (se pueden corregir en el registro). Si trae resultado y supera la mejor
 * marca anterior, se celebra el récord.
 */
export async function completeMission(mission: Mission, template: MissionTemplate | undefined, result?: Omit<MissionResult, 'at'>) {
  const previousBest = result ? await bestScore(mission.templateId, mission.id) : undefined
  // En una transacción y comprobando el estado guardado: dos toques rápidos en «¡La cumplí!»
  // no registran dos vuelos.
  const completed = await db.transaction('rw', db.missions, db.flights, async () => {
    const current = await db.missions.get(mission.id)
    if (!current || current.status === 'done' || current.status === 'skipped') return false
    await db.missions.update(mission.id, {
      status: 'done',
      doneAt: new Date().toISOString(),
      ...(result ? { result: { ...result, at: new Date().toISOString() } } : {}),
    })
    await logFlight({
      kind: 'real',
      moduleId: mission.moduleId,
      title: missionTitle(template),
      minutes: template?.minutes ?? 10,
      source: 'declared',
      refId: mission.id,
    })
    return true
  })
  if (!completed) return
  feedback.land()
  if (result && previousBest !== undefined && result.score > previousBest) {
    celebrate({
      kind: 'record',
      title: i18n.t('celebrate.record'),
      subtitle: missionTitle(template),
      detail: i18n.t('celebrate.recordDetail', { score: result.score, previous: previousBest }),
    })
  }
  await afterActivity()
}

/**
 * Lo llaman los módulos al guardar una acción. Si la misión de hoy se cumple con esa
 * acción, queda cumplida sin pedir confirmación. No registra otro vuelo: la acción ya
 * registró el suyo y contarlo dos veces inflaría las horas.
 */
export async function reportActivity(event: MissionEvent, templates: MissionTemplate[], result?: Omit<MissionResult, 'at'>) {
  const today = await db.missions.where('assignedOn').equals(dayKey()).toArray()
  const mission = today.find((m) => m.status === 'offered' || m.status === 'accepted')
  const template = mission ? findTemplate(templates, mission.templateId) : undefined
  if (!mission || template?.completesOn !== event) return
  await db.missions.update(mission.id, {
    status: 'done',
    doneAt: new Date().toISOString(),
    auto: true,
    ...(result ? { result: { ...result, at: new Date().toISOString() } } : {}),
  })
  feedback.land()
  toast(i18n.t('missions.autoDone', { title: missionTitle(template) }), 'success')
}
