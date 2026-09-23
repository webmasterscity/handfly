import { db, TABLE_NAMES, type TableName } from './schema'

export const BACKUP_FORMAT = 'handfly-backup'
export const BACKUP_SCHEMA_VERSION = 1

export interface Backup {
  format: typeof BACKUP_FORMAT
  schemaVersion: number
  exportedAt: string
  settings: unknown
  tables: Partial<Record<TableName, unknown[]>>
}

export async function createBackup(settings: unknown): Promise<Backup> {
  const tables: Backup['tables'] = {}
  for (const name of TABLE_NAMES) {
    tables[name] = await db.table(name).toArray()
  }
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    tables,
  }
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export class BackupError extends Error {}

/** Valida la forma del archivo antes de tocar la base de datos. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('notJson')
  }
  if (!data || typeof data !== 'object') throw new BackupError('notBackup')
  const b = data as Partial<Backup>
  if (b.format !== BACKUP_FORMAT || typeof b.tables !== 'object' || b.tables === null) {
    throw new BackupError('notBackup')
  }
  if (typeof b.schemaVersion !== 'number' || b.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new BackupError('newerVersion')
  }
  for (const [name, rows] of Object.entries(b.tables)) {
    if (!(TABLE_NAMES as readonly string[]).includes(name) || !Array.isArray(rows)) {
      throw new BackupError('notBackup')
    }
  }
  return b as Backup
}

/**
 * 'replace' borra todo y carga el respaldo. 'merge' conserva lo existente y agrega o
 * sobrescribe por clave primaria. Todo ocurre en una transacción: o entra completo o nada.
 */
export async function restoreBackup(backup: Backup, mode: 'replace' | 'merge') {
  const tables = TABLE_NAMES.map((n) => db.table(n))
  await db.transaction('rw', tables, async () => {
    for (const name of TABLE_NAMES) {
      const table = db.table(name)
      if (mode === 'replace') await table.clear()
      const rows = backup.tables[name]
      if (rows?.length) await table.bulkPut(rows)
    }
  })
}

export async function wipeAllData() {
  const tables = TABLE_NAMES.map((n) => db.table(n))
  await db.transaction('rw', tables, async () => {
    for (const t of tables) await t.clear()
  })
}
