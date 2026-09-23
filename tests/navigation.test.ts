import { describe, expect, it } from 'vitest'
import { orderScore, sameLandmark } from '../src/modules/navigation/score'

describe('puntuación de rutas', () => {
  it('reconoce referencias escritas distinto', () => {
    expect(sameLandmark('Parque Central', 'el parque')).toBe(true)
    expect(sameLandmark('Gasolinera Shell', 'la gasolinera')).toBe(true)
    expect(sameLandmark('Farmacia', 'Panadería')).toBe(false)
  })

  it('premia el orden correcto', () => {
    const plan = ['parque', 'gasolinera', 'iglesia', 'mercado']
    expect(orderScore(plan, plan).score).toBe(1)
    expect(orderScore(plan, ['mercado', 'iglesia', 'gasolinera', 'parque']).score).toBe(0.25)
    const partial = orderScore(plan, ['parque', 'iglesia'])
    expect(partial.score).toBe(0.5)
    expect(partial.matched).toEqual([true, false, true, false])
  })
})
