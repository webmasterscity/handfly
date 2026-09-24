import { describe, expect, it } from 'vitest'
import {
  angleDiff,
  bearingTo,
  clockDiff,
  distanceKm,
  minutesUntil,
  needsBet,
  scoreBearing,
  scoreCloseness,
  scoreCount,
  scoreList,
  scoreMinutesUntil,
  scoreNumber,
  scorePeeks,
  scoreTier,
  scoreTime,
} from '../src/core/missions/scoring'
import { parseNumber } from '../src/core/numbers'

describe('apuesta y comprueba', () => {
  it('número: exacto da 100 y el margen máximo da 0', () => {
    expect(scoreNumber(37200, 37200, 0.25)).toBe(100)
    expect(scoreNumber(37500, 37200, 0.25)).toBe(97)
    expect(scoreNumber(125, 100, 0.25)).toBe(0)
    expect(scoreNumber(1500, 1800, 1)).toBe(83)
    expect(scoreNumber(0, 0)).toBe(100)
  })

  it('hora: cada minuto resta 5, incluso pasando la medianoche', () => {
    expect(scoreTime('16:25', '16:28')).toBe(85)
    expect(clockDiff('23:55', '00:05')).toBe(10)
    expect(scoreTime('10:00', '11:00')).toBe(0)
  })

  it('lista, conteo, cercanía y vistazos', () => {
    expect(scoreList(3, 3, 1)).toBe(75)
    expect(scoreList(4, 2, 0)).toBe(50)
    expect(scoreCount(2, 3)).toBe(67)
    expect(scoreCount(5, 3)).toBe(100)
    expect(scoreCloseness(5)).toBe(100)
    expect(scoreCloseness(1)).toBe(0)
    expect(scorePeeks(0)).toBe(100)
    expect(scorePeeks(2)).toBe(50)
  })

  it('minutos hasta una hora: se cuenta hasta mañana si ya pasó', () => {
    const now = new Date(2026, 8, 23, 10, 35)
    expect(minutesUntil('13:00', now)).toBe(145)
    expect(minutesUntil('10:00', now)).toBe(1405)
    expect(scoreMinutesUntil(145, 145)).toBe(100)
    expect(scoreMinutesUntil(140, 145)).toBe(50)
    // Hizo la cuenta a las 10:35 (145) y la anotó a las 10:37 (143): sigue siendo exacta.
    expect(scoreMinutesUntil(145, 143)).toBe(100)
    expect(scoreMinutesUntil(150, 145)).toBe(80)
  })

  it('rumbo y distancia a casa', () => {
    const home = { lat: 4.711, lng: -74.0721 }
    const north = { lat: 4.611, lng: -74.0721 }
    expect(Math.round(bearingTo(north, home))).toBe(0)
    expect(Math.round(distanceKm(north, home))).toBe(11)
    expect(angleDiff(350, 10)).toBe(20)
    expect(scoreBearing(350, 10)).toBe(78)
    expect(scoreBearing(0, 180)).toBe(0)
  })

  it('frases sin castigo y qué misiones piden apuesta', () => {
    expect(scoreTier(100)).toBe('bullseye')
    expect(scoreTier(10)).toBe('learning')
    expect(needsBet({ kind: 'number' })).toBe(true)
    expect(needsBet({ kind: 'closeness' })).toBe(false)
    expect(needsBet({ kind: 'closeness', bet: true })).toBe(true)
    expect(needsBet({ kind: 'minutesUntil' })).toBe(false)
  })

  it('los precios en pesos con punto de miles se leen bien', () => {
    expect(parseNumber('37.500')).toBe(37500)
    expect(parseNumber('1.800.000')).toBe(1800000)
    expect(parseNumber('37,500')).toBe(37500)
    expect(parseNumber('21,50')).toBe(21.5)
    expect(parseNumber('1.234,50')).toBe(1234.5)
  })
})
