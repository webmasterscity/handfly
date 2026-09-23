import { describe, expect, it } from 'vitest'
import { computeStreak } from '../src/core/streak/streak'

// 2026-09-23 es miércoles (semana ISO 39: lunes 21 a domingo 27).
const today = new Date(2026, 8, 23, 12)

describe('computeStreak', () => {
  it('cuenta días seguidos y no rompe si hoy aún no hay actividad', () => {
    const s = computeStreak(['2026-09-21', '2026-09-22'], today)
    expect(s.current).toBe(2)
    expect(s.activeToday).toBe(false)
    expect(s.restUsedThisWeek).toBe(false)
  })

  it('un día perdido por semana queda protegido', () => {
    // Lunes 21 perdido; domingo 20 y sábado 19 (semana 38) activos.
    const s = computeStreak(['2026-09-19', '2026-09-20', '2026-09-22', '2026-09-23'], today)
    expect(s.current).toBe(4)
    expect(s.restUsedThisWeek).toBe(true)
  })

  it('el segundo día perdido en la misma semana corta la racha', () => {
    // Semana 39: faltan lunes 21 y martes 22.
    const s = computeStreak(['2026-09-20', '2026-09-23'], today)
    expect(s.current).toBe(1)
  })

  it('sin actividad, racha cero y descanso intacto', () => {
    const s = computeStreak([], today)
    expect(s.current).toBe(0)
    expect(s.restUsedThisWeek).toBe(false)
  })

  it('recuerda la mejor racha histórica', () => {
    const s = computeStreak(['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-09-23'], today)
    expect(s.best).toBe(4)
    expect(s.current).toBe(1)
  })
})
