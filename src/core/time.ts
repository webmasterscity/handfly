// Utilidades de fecha en hora LOCAL. Las rachas y las sesiones se cuentan por día local
// del usuario, no por UTC: un repaso a las 23:30 cuenta para "hoy".

/** 'YYYY-MM-DD' en hora local. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Convierte 'YYYY-MM-DD' a una fecha local a mediodía (evita saltos por horario de verano). */
export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Semana ISO 8601 como 'YYYY-Www' (las semanas empiezan en lunes). */
export function weekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Lunes (hora local, mediodía) de la semana de la fecha dada. */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const offset = (d.getDay() + 6) % 7
  return addDays(d, -offset)
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60_000))
}

export function newId(): string {
  return crypto.randomUUID()
}
