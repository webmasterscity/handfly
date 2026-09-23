import { describe, expect, it } from 'vitest'
import { buildReminderIcs } from '../src/core/reminders/ics'

describe('recordatorio .ics', () => {
  it('crea un evento diario a la hora elegida', () => {
    const ics = buildReminderIcs({
      time: '08:30',
      title: 'Handfly, 5 minutos',
      description: 'Repasos; y misión',
      url: 'https://handfly.example/',
      now: new Date(2026, 8, 23, 7, 0),
    })
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('DTSTART:20260923T083000')
    expect(ics).toContain('SUMMARY:Handfly\\, 5 minutos')
    expect(ics).toContain('DESCRIPTION:Repasos\\; y misión')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })

  it('si la hora ya pasó hoy, empieza mañana', () => {
    const ics = buildReminderIcs({ time: '06:00', title: 't', description: 'd', url: 'u', now: new Date(2026, 8, 23, 7, 0) })
    expect(ics).toContain('DTSTART:20260924T060000')
  })
})
