/**
 * Comprobación automática de un intento escrito, solo cuando la respuesta es corta y
 * clara (un nombre, un dato breve). Sin tildes, mayúsculas ni signos: «Jose» vale
 * por «José». Si no coincide, decide la persona: puede haberlo dicho con otras palabras.
 */
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Respuesta corta que se puede comprobar sola, o undefined si es texto largo. */
export function checkableAnswer(back: string, kind: string): string | undefined {
  // Las tarjetas de personas guardan «Nombre — imagen»: se compara solo el nombre.
  const answer = kind === 'person' ? back.split(' — ')[0] : back
  return answer.trim().length > 0 && answer.length <= 40 ? answer : undefined
}

/**
 * Solo en personas vale el primer nombre («Laura» por «Laura Gómez»). En el resto, la
 * respuesta tiene que estar completa y el intento no puede añadir mucho más: «buenos» no
 * vale por «Buenos Aires», ni «París o Londres» por «Londres».
 */
export function matchesAnswer(attempt: string, answer: string, kind = 'fact'): boolean {
  const a = normalize(attempt)
  const b = normalize(answer)
  if (!a || !b) return false
  if (a === b) return true
  const first = b.split(' ')[0]
  if (kind === 'person' && first.length >= 3 && a === first) return true
  const extraWords = a.split(' ').length - b.split(' ').length
  return b.length >= 3 && extraWords <= 1 && ` ${a} `.includes(` ${b} `) && !/\b(o|or|y|and|ni)\b/.test(a)
}
