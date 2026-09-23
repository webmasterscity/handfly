import { describe, expect, it } from 'vitest'
import type { Flight } from '../src/core/db/types'
import { rankFor } from '../src/core/flight-log/flights'
import { pickMission } from '../src/core/missions/planner'
import { ALL_MISSIONS, ENABLED_MODULE_IDS } from '../src/modules/registry'

const flight = (moduleId: Flight['moduleId']): Flight => ({
  id: crypto.randomUUID(),
  kind: 'real',
  moduleId,
  title: 'x',
  minutes: 5,
  source: 'declared',
  date: '2026-09-20',
  createdAt: '',
})

describe('planificador de misiones', () => {
  it('elige el módulo menos practicado', () => {
    const practiced = ENABLED_MODULE_IDS.filter((m) => m !== 'navigation').flatMap((m) => [flight(m), flight(m)])
    const m = pickMission({
      templates: ALL_MISSIONS,
      surprises: [],
      recentFlights: practiced,
      recentMissions: [],
      enabledModules: ENABLED_MODULE_IDS,
      random: () => 0.5,
    })
    expect(m?.moduleId).toBe('navigation')
  })
})

describe('rangos', () => {
  it('sube solo con horas Y vuelos reales', () => {
    expect(rankFor(0, 0).rank.id).toBe('student')
    expect(rankFor(120, 3).rank.id).toBe('student')
    expect(rankFor(120, 5).rank.id).toBe('private')
    expect(rankFor(6000, 365).rank.id).toBe('instructor')
    expect(rankFor(6000, 365).progress).toBe(1)
  })
})
