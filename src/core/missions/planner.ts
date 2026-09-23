import type { Flight, Mission, ModuleId } from '../db/types'
import type { MissionTemplate } from '../modules/types'

export const SURPRISE_CHANCE = 0.15

/**
 * Elige la misión del día: del módulo menos practicado en los últimos 14 días
 * (según vuelos registrados), evitando repetir la plantilla de las últimas misiones.
 * Con probabilidad SURPRISE_CHANCE ofrece una misión sorpresa.
 */
export function pickMission(opts: {
  templates: MissionTemplate[]
  surprises: MissionTemplate[]
  recentFlights: Flight[]
  recentMissions: Mission[]
  enabledModules: ModuleId[]
  random?: () => number
  exclude?: string[]
}): MissionTemplate | undefined {
  const random = opts.random ?? Math.random
  const recentTemplateIds = new Set([
    ...opts.recentMissions.slice(-5).map((m) => m.templateId),
    ...(opts.exclude ?? []),
  ])

  if (opts.surprises.length && random() < SURPRISE_CHANCE) {
    const pool = opts.surprises.filter((t) => !recentTemplateIds.has(t.id))
    if (pool.length) return pool[Math.floor(random() * pool.length)]
  }

  const usage = new Map<ModuleId, number>(opts.enabledModules.map((id) => [id, 0]))
  for (const f of opts.recentFlights) {
    if (usage.has(f.moduleId)) usage.set(f.moduleId, (usage.get(f.moduleId) ?? 0) + 1)
  }
  const ordered = [...usage.entries()].sort((a, b) => a[1] - b[1]).map(([id]) => id)

  for (const moduleId of ordered) {
    const pool = opts.templates.filter((t) => t.moduleId === moduleId && !recentTemplateIds.has(t.id))
    if (pool.length) return pool[Math.floor(random() * pool.length)]
  }
  const fallback = opts.templates.filter((t) => !(opts.exclude ?? []).includes(t.id))
  return fallback[Math.floor(random() * fallback.length)]
}
