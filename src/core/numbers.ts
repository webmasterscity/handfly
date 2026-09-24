/**
 * Acepta "12,5", "12.5", "1.234,50", "$ 12" y miles sin decimales como "37.500" o
 * "37,500": un separador seguido de grupos de exactamente tres cifras son miles
 * (así se escriben los precios en pesos), no decimales.
 */
export function parseNumber(input: string): number | undefined {
  let s = input.replace(/[^\d.,-]/g, '')
  if (!s) return undefined
  if (/^-?\d{1,3}([.,]\d{3})+$/.test(s) && !(s.includes(',') && s.includes('.'))) {
    s = s.replace(/[.,]/g, '')
  } else if (s.includes(',') && s.includes('.')) {
    // El último separador es el decimal.
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

/** Cantidad con separadores del idioma y hasta dos decimales (dinero o número suelto). */
export function formatAmount(n: number, lang: string) {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(n)
}
