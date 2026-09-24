import { describe, expect, it } from 'vitest'
import { checkableAnswer, matchesAnswer } from '../src/core/srs/match'

describe('comprobación automática de intentos', () => {
  it('ignora tildes, mayúsculas y signos', () => {
    expect(matchesAnswer('jose', 'José')).toBe(true)
    expect(matchesAnswer('  LAURA! ', 'Laura')).toBe(true)
    expect(matchesAnswer('Laura', 'Laura Gómez', 'person')).toBe(true)
    expect(matchesAnswer('es Paris', 'París')).toBe(true)
  })

  it('no da por buena una respuesta distinta', () => {
    expect(matchesAnswer('Lucía', 'Laura')).toBe(false)
    expect(matchesAnswer('', 'Laura')).toBe(false)
    expect(matchesAnswer('La', 'Laura')).toBe(false)
    expect(matchesAnswer('buenos', 'Buenos Aires')).toBe(false)
    expect(matchesAnswer('carbon', 'Carbon dioxide')).toBe(false)
    expect(matchesAnswer('París o Londres', 'Londres')).toBe(false)
    expect(matchesAnswer('Laura', 'Laura Gómez')).toBe(false)
  })

  it('solo comprueba respuestas cortas; en personas, el nombre', () => {
    expect(checkableAnswer('Rosa — una rosa en sus gafas', 'person')).toBe('Rosa')
    expect(checkableAnswer('x'.repeat(80), 'fact')).toBeUndefined()
  })
})
