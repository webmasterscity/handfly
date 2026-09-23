// Puntuación del recuerdo de una ruta: qué parte de las referencias planeadas se
// recordaron EN EL ORDEN correcto (subsecuencia común más larga / total planeado).

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOP = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'y', 'en', 'al', 'a', 'por', 'con'])

/** Dos referencias coinciden si una contiene a la otra o comparten una palabra significativa. */
export function sameLandmark(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return false
  if (na.includes(nb) || nb.includes(na)) return true
  const wa = na.split(' ').filter((w) => w.length > 2 && !STOP.has(w))
  const wb = new Set(nb.split(' ').filter((w) => w.length > 2 && !STOP.has(w)))
  return wa.some((w) => wb.has(w))
}

export function orderScore(planned: string[], recalled: string[]): { score: number; matched: boolean[] } {
  const p = planned.filter((x) => x.trim())
  const r = recalled.filter((x) => x.trim())
  if (!p.length) return { score: 0, matched: [] }
  const dp = Array.from({ length: p.length + 1 }, () => new Array<number>(r.length + 1).fill(0))
  for (let i = 1; i <= p.length; i++) {
    for (let j = 1; j <= r.length; j++) {
      dp[i][j] = sameLandmark(p[i - 1], r[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  // Reconstruye qué referencias planeadas entraron en la secuencia.
  const matched = new Array<boolean>(p.length).fill(false)
  let i = p.length
  let j = r.length
  while (i > 0 && j > 0) {
    if (sameLandmark(p[i - 1], r[j - 1]) && dp[i][j] === dp[i - 1][j - 1] + 1) {
      matched[i - 1] = true
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--
    else j--
  }
  return { score: dp[p.length][r.length] / p.length, matched }
}
