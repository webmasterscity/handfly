import { describe, expect, it } from 'vitest'
import { CATEGORIES, isCorrect, makeProblem, makeSet, parseAnswer, seeded } from '../src/modules/calculation/generators'

describe('generadores de cálculo', () => {
  it('cada categoría produce una respuesta finita y aceptada por sí misma', () => {
    const rng = seeded(42)
    for (const c of CATEGORIES) {
      for (let i = 0; i < 50; i++) {
        const p = makeProblem(c, rng)
        expect(Number.isFinite(p.answer)).toBe(true)
        expect(isCorrect(p, p.answer)).toBe(true)
        expect(p.answer).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('una tanda mezcla categorías', () => {
    const set = makeSet(5, seeded(7))
    expect(new Set(set.map((p) => p.category)).size).toBe(5)
  })

  it('entiende comas, puntos y símbolos', () => {
    expect(parseAnswer('12,5')).toBe(12.5)
    expect(parseAnswer('12.5')).toBe(12.5)
    expect(parseAnswer('1.234,50')).toBe(1234.5)
    expect(parseAnswer('1,234.50')).toBe(1234.5)
    expect(parseAnswer('$ 7')).toBe(7)
    expect(parseAnswer('abc')).toBeUndefined()
  })
})
