// Sin servidor, una PWA no puede programar notificaciones fiables. En su lugar se genera
// un evento de calendario diario (.ics) que el propio teléfono se encarga de recordar.

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function escapeText(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildReminderIcs(opts: {
  time: string // 'HH:MM'
  title: string
  description: string
  url: string
  now?: Date
}): string {
  const now = opts.now ?? new Date()
  const [hh, mm] = opts.time.split(':').map(Number)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm)
  if (start <= now) start.setDate(start.getDate() + 1)
  // Hora "flotante" (sin zona): el calendario la interpreta en la hora local del teléfono.
  const local = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  const end = new Date(start.getTime() + 10 * 60_000)
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Handfly//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:handfly-daily-${stamp}@handfly`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${escapeText(opts.title)}`,
    `DESCRIPTION:${escapeText(opts.description)}`,
    `URL:${opts.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(opts.title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function downloadIcs(content: string, filename = 'handfly-recordatorio.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
