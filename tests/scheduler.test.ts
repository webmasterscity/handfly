import { describe, expect, it } from 'vitest'
import { buildCard, previewIntervals, schedule } from '../src/core/srs/scheduler'

describe('FSRS scheduler', () => {
  const now = new Date('2026-09-23T10:00:00Z')

  it('una tarjeta nueva vence de inmediato', () => {
    const card = buildCard('fact', '¿Capital de Perú?', 'Lima', undefined, now)
    expect(new Date(card.due).getTime()).toBeLessThanOrEqual(now.getTime())
  })

  it('recordar mejor espacia más el siguiente repaso', () => {
    const card = buildCard('fact', 'q', 'a', undefined, now)
    const iv = previewIntervals(card, now)
    expect(iv[1]).toBeLessThanOrEqual(iv[2])
    expect(iv[2]).toBeLessThanOrEqual(iv[3])
    expect(iv[3]).toBeLessThan(iv[4])
  })

  it('los intervalos crecen con repasos exitosos', () => {
    let card = buildCard('fact', 'q', 'a', undefined, now)
    let t = now
    const gaps: number[] = []
    for (let i = 0; i < 4; i++) {
      card = schedule(card, 3, t)
      const due = new Date(card.due)
      gaps.push(due.getTime() - t.getTime())
      t = due
    }
    expect(gaps[3]).toBeGreaterThan(gaps[1])
  })
})
