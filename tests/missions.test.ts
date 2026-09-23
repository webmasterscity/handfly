import { beforeEach, describe, expect, it } from 'vitest'
import { wipeAllData } from '../src/core/db/backup'
import { db } from '../src/core/db/schema'
import { ensureTodayMission, reportActivity, swapTodayMission } from '../src/core/session/session'
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
