// Generadores de problemas cotidianos. Cada uno produce un enunciado (clave i18n y
// parámetros), la respuesta exacta y la tolerancia aceptada para cálculo mental.

export type CalcCategory = 'groceries' | 'tip' | 'split' | 'discount' | 'budget' | 'travel' | 'recipe'

export const CATEGORIES: CalcCategory[] = ['groceries', 'tip', 'split', 'discount', 'budget', 'travel', 'recipe']

export interface Problem {
  category: CalcCategory
  params: Record<string, string | number>
  answer: number
  /** Diferencia absoluta aceptada. */
  tolerance: number
  unit: 'money' | 'minutes' | 'grams'
}

type Rng = () => number

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

const generators: Record<CalcCategory, (rng: Rng, w: Words) => Problem> = {
  groceries: (rng, w) => {
    const n = int(rng, 3, 4)
    const names = [...w.items].sort(() => rng() - 0.5).slice(0, n)
    // Precios en múltiplos de 0,05, como en una caja real.
    const prices = names.map(() => int(rng, 10, 200) * 0.05)
    const list = names.map((name, i) => `${name} ${money(prices[i])}`).join(', ')
    return { category: 'groceries', params: { list }, answer: round2(prices.reduce((a, b) => a + b, 0)), tolerance: 0.001, unit: 'money' }
  },
  tip: (rng) => {
    const bill = int(rng, 16, 180) + pick(rng, [0, 0.5])
    const pct = pick(rng, [10, 15, 20])
    return { category: 'tip', params: { bill: money(bill), pct }, answer: round2((bill * pct) / 100), tolerance: 0.051, unit: 'money' }
  },
  split: (rng) => {
    const people = int(rng, 2, 6)
    const each = int(rng, 8, 45) + pick(rng, [0, 0.5, 0.25])
    const total = round2(each * people)
    return { category: 'split', params: { total: money(total), people }, answer: each, tolerance: 0.011, unit: 'money' }
  },
  discount: (rng) => {
    const price = int(rng, 8, 160)
    const pct = pick(rng, [10, 15, 20, 25, 30, 40, 50])
    return { category: 'discount', params: { price: money(price), pct }, answer: round2(price * (1 - pct / 100)), tolerance: 0.011, unit: 'money' }
  },
  budget: (rng) => {
    const budget = int(rng, 70, 150) * 10
    const a = int(rng, 40, 300)
    const b = int(rng, 20, 200)
    const c = int(rng, 10, 150)
    return { category: 'budget', params: { budget: money(budget), a: money(a), b: money(b), c: money(c) }, answer: budget - a - b - c, tolerance: 0.001, unit: 'money' }
  },
  travel: (rng) => {
    const speed = pick(rng, [30, 40, 45, 60, 80, 90, 100])
    // Distancias que dan minutos enteros a esa velocidad.
    const minutes = pick(rng, [15, 20, 30, 40, 45, 60, 75, 90, 120])
    const km = round2((speed * minutes) / 60)
    return { category: 'travel', params: { km, speed }, answer: minutes, tolerance: 1, unit: 'minutes' }
  },
  recipe: (rng, w) => {
    const base = pick(rng, [2, 4, 6])
    const target = pick(rng, [2, 3, 4, 6, 8].filter((x) => x !== base))
    const grams = pick(rng, [120, 150, 180, 200, 240, 300, 360, 400, 450, 600])
    const ingredient = pick(rng, w.ingredients)
    const answer = Math.round((grams * target) / base)
    return { category: 'recipe', params: { base, target, grams, ingredient }, answer, tolerance: Math.max(1, answer * 0.01), unit: 'grams' }
  },
}

export function makeProblem(category: CalcCategory, rng: Rng = Math.random, words: Words = DEFAULT_WORDS): Problem {
  return generators[category](rng, words)
}

export function makeSet(size: number, rng: Rng = Math.random, words: Words = DEFAULT_WORDS): Problem[] {
  const cats = [...CATEGORIES].sort(() => rng() - 0.5)
  return Array.from({ length: size }, (_, i) => makeProblem(cats[i % cats.length], rng, words))
}

/** Acepta "12,5", "12.5", "1.234,50" y "$ 12". */
export function parseAnswer(input: string): number | undefined {
  let s = input.replace(/[^\d.,-]/g, '')
  if (!s) return undefined
  if (s.includes(',') && s.includes('.')) {
    // El último separador es el decimal.
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

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
