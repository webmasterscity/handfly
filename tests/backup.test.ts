import { beforeEach, describe, expect, it } from 'vitest'
import { BackupError, createBackup, parseBackup, restoreBackup, wipeAllData } from '../src/core/db/backup'
import { db } from '../src/core/db/schema'
import { addCard } from '../src/core/srs/scheduler'

describe('respaldo', () => {
  beforeEach(() => wipeAllData())

  it('exporta, borra y restaura sin perder datos', async () => {
    await addCard('fact', 'q', 'a')
    await db.people.add({
      id: 'p1', name: 'Rosa', whereMet: 'boda', trait: 'gafas', conversation: '', nameImage: 'rosa',
      featureChosen: 'gafas', linkImage: 'una rosa en sus gafas', metOn: '2026-09-23', createdAt: '',
    })
    const text = JSON.stringify(await createBackup({ theme: 'dark' }))
    await wipeAllData()
    expect(await db.cards.count()).toBe(0)
    await restoreBackup(parseBackup(text), 'replace')
    expect(await db.cards.count()).toBe(1)
    expect((await db.people.get('p1'))?.name).toBe('Rosa')
  })

  it('combinar conserva lo existente', async () => {
    await addCard('fact', 'uno', 'a')
    const backup = await createBackup({})
    await wipeAllData()
    await addCard('fact', 'dos', 'b')
    await restoreBackup(backup, 'merge')
    expect(await db.cards.count()).toBe(2)
  })

  it('rechaza archivos que no son respaldos', () => {
    expect(() => parseBackup('no json')).toThrow(BackupError)
    expect(() => parseBackup('{"format":"otra"}')).toThrow(BackupError)
    expect(() => parseBackup(JSON.stringify({ format: 'handfly-backup', schemaVersion: 99, tables: {} }))).toThrow(BackupError)
    expect(() => parseBackup(JSON.stringify({ format: 'handfly-backup', schemaVersion: 1, tables: { secreto: [] } }))).toThrow(BackupError)
  })
})
