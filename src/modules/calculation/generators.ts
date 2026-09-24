// Generadores de problemas cotidianos. Cada uno produce un enunciado (clave i18n y
// parámetros), la respuesta exacta y la tolerancia aceptada para cálculo mental.

export type CalcCategory = 'groceries' | 'tip' | 'split' | 'discount' | 'budget' | 'travel' | 'recipe'

export const CATEGORIES: CalcCategory[] = ['groceries', 'tip', 'split', 'discount', 'budget', 'travel', 'recipe']

export interface Problem {
  category: CalcCategory
  params: Record<string, string | number>
  /** Renglones de un recibo, para dibujar la compra como un tique real. */
  receipt?: { name: string; price: string }[]
  answer: number
  /** Diferencia absoluta aceptada. */
  tolerance: number
  unit: 'money' | 'minutes' | 'grams'
}

type Rng = () => number

/** Dificultad: 1 = números redondos, 2 = como en la vida diaria, 3 = más renglones y porcentajes raros. */
export type Level = 1 | 2 | 3

const pick = <T,>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)]
const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1))
const round2 = (n: number) => Math.round(n * 100) / 100

let locale = 'es'
/** Idioma para formatear importes (lo fija la pantalla según el idioma activo). */
export function setCalcLocale(lang: string) {
  locale = lang
}

export const money = (n: number) =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

/** Palabras del idioma activo para los enunciados (productos e ingredientes). */
export interface Words {
  items: string[]
  ingredients: string[]
}

const DEFAULT_WORDS: Words = {
  items: ['pan', 'leche', 'huevos', 'café', 'arroz', 'manzanas', 'queso', 'tomates', 'jabón', 'pasta'],
  ingredients: ['harina', 'azúcar', 'arroz', 'queso', 'mantequilla'],
}

const generators: Record<CalcCategory, (rng: Rng, w: Words, level: Level) => Problem> = {
  groceries: (rng, w, level) => {
    const n = level === 1 ? 3 : level === 2 ? int(rng, 3, 4) : int(rng, 4, 5)
    const names = [...w.items].sort(() => rng() - 0.5).slice(0, n)
    // Precios en múltiplos de 0,05 como en una caja real; en el nivel 1, de 0,50.
    const prices = names.map(() => (level === 1 ? int(rng, 2, 20) * 0.5 : int(rng, 10, 200) * 0.05))
    const list = names.map((name, i) => `${name} ${money(prices[i])}`).join(', ')
    return {
      category: 'groceries',
      params: { list },
      receipt: names.map((name, i) => ({ name, price: money(prices[i]) })),
      answer: round2(prices.reduce((a, b) => a + b, 0)),
      tolerance: 0.001,
      unit: 'money',
    }
  },
  tip: (rng, _w, level) => {
    const bill = level === 1 ? int(rng, 2, 18) * 10 : int(rng, 16, 180) + pick(rng, [0, 0.5])
    const pct = pick(rng, level === 1 ? [10, 20] : level === 2 ? [10, 15, 20] : [12, 15, 18])
    return { category: 'tip', params: { bill: money(bill), pct }, answer: round2((bill * pct) / 100), tolerance: 0.051, unit: 'money' }
  },
  split: (rng, _w, level) => {
    const people = level === 1 ? int(rng, 2, 4) : level === 2 ? int(rng, 2, 6) : int(rng, 3, 8)
    const each = int(rng, 8, 45) + (level === 1 ? 0 : pick(rng, [0, 0.5, 0.25]))
    const total = round2(each * people)
    return { category: 'split', params: { total: money(total), people }, answer: each, tolerance: 0.011, unit: 'money' }
  },
  discount: (rng, _w, level) => {
    const price = level === 1 ? int(rng, 2, 16) * 10 : int(rng, 8, 160)
    const pct = pick(rng, level === 1 ? [10, 20, 50] : level === 2 ? [10, 15, 20, 25, 30, 40, 50] : [15, 25, 35, 45])
    return { category: 'discount', params: { price: money(price), pct }, answer: round2(price * (1 - pct / 100)), tolerance: 0.011, unit: 'money' }
  },
  budget: (rng, _w, level) => {
    const budget = int(rng, 70, 150) * 10
    const step = level === 1 ? 10 : 1
    const a = int(rng, 4, 30) * (level === 1 ? step : 10) + (level === 3 ? int(rng, 1, 9) : 0)
    const b = int(rng, 2, 20) * (level === 1 ? step : 10) + (level === 1 ? 0 : int(rng, 0, 9))
    const c = int(rng, 1, 15) * (level === 1 ? step : 10) + (level === 3 ? int(rng, 1, 9) : 0)
    return { category: 'budget', params: { budget: money(budget), a: money(a), b: money(b), c: money(c) }, answer: budget - a - b - c, tolerance: 0.001, unit: 'money' }
  },
  travel: (rng, _w, level) => {
    const speed = pick(rng, level === 1 ? [30, 60, 90] : [30, 40, 45, 60, 80, 90, 100])
    // Distancias que dan minutos enteros a esa velocidad.
    const minutes = pick(rng, level === 1 ? [20, 30, 60, 90, 120] : [15, 20, 30, 40, 45, 60, 75, 90, 120])
    const km = round2((speed * minutes) / 60)
    return { category: 'travel', params: { km, speed }, answer: minutes, tolerance: 1, unit: 'minutes' }
  },
  recipe: (rng, w, level) => {
    const base = pick(rng, level === 1 ? [2, 4] : [2, 4, 6])
    const target = pick(rng, (level === 1 ? [2, 4, 8] : [2, 3, 4, 6, 8]).filter((x) => x !== base))
    const grams = pick(rng, level === 1 ? [100, 200, 300, 400] : [120, 150, 180, 200, 240, 300, 360, 400, 450, 600])
    const ingredient = pick(rng, w.ingredients)
    const answer = Math.round((grams * target) / base)
    return { category: 'recipe', params: { base, target, grams, ingredient }, answer, tolerance: Math.max(1, answer * 0.01), unit: 'grams' }
  },
}

export function makeProblem(category: CalcCategory, rng: Rng = Math.random, words: Words = DEFAULT_WORDS, level: Level = 2): Problem {
  return generators[category](rng, words, level)
}

export function makeSet(size: number, rng: Rng = Math.random, words: Words = DEFAULT_WORDS, level: Level = 2): Problem[] {
  const cats = [...CATEGORIES].sort(() => rng() - 0.5)
  return Array.from({ length: size }, (_, i) => makeProblem(cats[i % cats.length], rng, words, level))
}

/** Estrellas de una ronda: 5/5 = tres, 4 = dos, 3 = una. */
export function starsFor(correct: number, total: number): 0 | 1 | 2 | 3 {
  const missed = total - correct
  return missed <= 0 ? 3 : missed === 1 ? 2 : missed === 2 ? 1 : 0
}

/** Ronda perfecta: sube de nivel; dos o menos aciertos: baja. Así el reto sigue a la persona. */
export function nextLevel(level: Level, correct: number, total: number): Level {
  if (correct === total) return Math.min(3, level + 1) as Level
  if (correct <= 2) return Math.max(1, level - 1) as Level
  return level
}

/** Acepta "12,5", "12.5", "1.234,50" y "$ 12" (vive en core: también lo usan las misiones). */
export { parseNumber as parseAnswer } from '../../core/numbers'

export function isCorrect(p: Problem, value: number) {
  return Math.abs(value - p.answer) <= p.tolerance
}

/** Generador pseudoaleatorio con semilla, para pruebas reproducibles. */
export function seeded(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
