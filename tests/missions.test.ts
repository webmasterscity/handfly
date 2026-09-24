import { beforeEach, describe, expect, it } from 'vitest'
import { wipeAllData } from '../src/core/db/backup'
import { db } from '../src/core/db/schema'
import { clearCelebrations, pendingCelebrations } from '../src/core/feedback/celebrate'
import { logFlight } from '../src/core/flight-log/flights'
import { afterActivity, bestScore, completeMission, ensureTodayMission, placeBet, recordExistingProgress, reportActivity, swapTodayMission } from '../src/core/session/session'
import { updateSettings } from '../src/core/settings/settings'
import { ALL_MISSIONS, ENABLED_MODULE_IDS } from '../src/modules/registry'

describe('misión del día', () => {
  beforeEach(() => wipeAllData())

  it('la primera misión es la de arranque, dentro de la app', async () => {
    const mission = await ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS)
    expect(mission?.templateId).toBe('tf-before-chat')
  })

  it('llamadas simultáneas no crean dos misiones el mismo día', async () => {
    await Promise.all([ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS), ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS)])
    expect(await db.missions.count()).toBe(1)
  })

  it('se cumple sola con la acción que le corresponde, sin registrar otro vuelo', async () => {
    const mission = await ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS)
    await reportActivity('draft.finished', ALL_MISSIONS)
    expect((await db.missions.get(mission!.id))?.status).toBe('offered')

    await reportActivity('think.saved', ALL_MISSIONS)
    const done = await db.missions.get(mission!.id)
    expect(done?.status).toBe('done')
    expect(done?.auto).toBe(true)
    expect(await db.flights.count()).toBe(0)
  })

  it('al cambiarla ya no ofrece la de arranque', async () => {
    const first = await ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS)
    const next = await swapTodayMission(first!, ALL_MISSIONS, ENABLED_MODULE_IDS)
    expect(next?.templateId).not.toBe('tf-before-chat')
  })
})

describe('apuesta y comprueba en la misión', () => {
  beforeEach(() => wipeAllData())

  it('dos toques en «¡La cumplí!» registran un solo vuelo y guardan la puntuación', async () => {
    const mission = (await ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS))!
    const template = ALL_MISSIONS.find((m) => m.id === mission.templateId)
    await Promise.all([completeMission(mission, template, { score: 80 }), completeMission(mission, template, { score: 80 })])
    expect(await db.flights.filter((f) => f.refId === mission.id).count()).toBe(1)
    expect((await db.missions.get(mission.id))?.result?.score).toBe(80)
  })

  it('la apuesta queda guardada y la mejor marca se calcula sin contar la misión actual', async () => {
    const mission = (await ensureTodayMission(ALL_MISSIONS, ENABLED_MODULE_IDS))!
    await placeBet(mission, { value: 37500 })
    expect((await db.missions.get(mission.id))?.bet?.value).toBe(37500)
    expect(await bestScore(mission.templateId, mission.id)).toBeUndefined()
  })
})

describe('celebraciones', () => {
  beforeEach(async () => {
    await wipeAllData()
    clearCelebrations()
    updateSettings({ progressRecorded: false })
  })

  const realFlight = (i: number) => logFlight({ kind: 'real', moduleId: 'recall', title: `v${i}`, minutes: 20, source: 'declared' })

  it('quien ya tenía un rango no ve un ascenso falso al actualizar la app', async () => {
    for (let i = 0; i < 20; i++) await realFlight(i) // 20 vuelos, 400 min: Piloto comercial
    await recordExistingProgress()
    await afterActivity()
    expect(pendingCelebrations().filter((c) => c.kind === 'rank')).toHaveLength(0)
  })

  it('dos actividades seguidas no celebran dos veces lo mismo', async () => {
    await recordExistingProgress()
    await realFlight(1)
    await Promise.all([afterActivity(), afterActivity()])
    const shown = pendingCelebrations()
    expect(shown.filter((c) => c.kind === 'rank')).toHaveLength(1)
    // Todos los logros nuevos van en una sola pantalla (p. ej. «vuelo nocturno» si la prueba corre de noche).
    expect(shown.filter((c) => c.kind === 'achievement')).toHaveLength(1)
  })
})
