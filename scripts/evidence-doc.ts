// Genera EVIDENCIA.md (es) y EVIDENCE.md (en) desde los metadatos de los módulos:
// una sola fuente de verdad para la app y para la documentación.
//   node scripts/evidence-doc.ts          → escribe los archivos
//   node scripts/evidence-doc.ts --check  → falla si están desactualizados (lo usa CI)
import { readFileSync, writeFileSync } from 'node:fs'
import { FOUNDATIONS } from '../src/core/evidence/foundations.ts'
import type { Lang, ModuleMeta, Reference } from '../src/core/modules/types.ts'
import { meta as thinkFirst } from '../src/modules/think-first/meta.ts'
import { meta as recall } from '../src/modules/recall/meta.ts'
import { meta as people } from '../src/modules/people/meta.ts'
import { meta as navigation } from '../src/modules/navigation/meta.ts'
import { meta as writing } from '../src/modules/writing/meta.ts'
import { meta as calculation } from '../src/modules/calculation/meta.ts'

const METAS: ModuleMeta[] = [thinkFirst, recall, people, navigation, writing, calculation]

const T = {
  es: {
    file: 'EVIDENCIA.md',
    other: '[English version](EVIDENCE.md)',
    title: 'Evidencia científica de Handfly',
    intro:
      'Este documento se genera automáticamente desde los metadatos de cada módulo (`src/modules/*/meta.ts` y `src/core/evidence/foundations.ts`), los mismos que muestra la app en la pantalla Evidencia. Para cambiarlo, edita esos archivos y ejecuta `npm run evidence`. Todos los DOI se verificaron contra Crossref.',
    plainTitle: 'En palabras fáciles de entender',
    plain: [
      'Handfly existe porque cuando una máquina hace algo por nosotros todo el tiempo, poco a poco dejamos de saber hacerlo. Les pasa a los pilotos con el piloto automático, y nos pasa a todos con la inteligencia artificial, el GPS y la calculadora.',
      'Muchas aplicaciones prometen «entrenar el cerebro» con juegos. Los estudios más grandes dicen que eso no funciona: te vuelves bueno en el juego, pero no en tu vida. Lo que sí funciona es practicar la tarea de verdad. Por eso Handfly no tiene juegos: te pide intentar tú primero antes de preguntarle a la IA, recordar lo que aprendiste, aprenderte el nombre de la gente que conoces, llegar a un sitio sin GPS, escribir tus propios mensajes y hacer las cuentas del día.',
      'No todos los ejercicios están igual de probados, y la app lo dice claramente. Cada uno lleva una etiqueta: «alta» significa que muchísimos estudios coinciden; «moderada», que hay buenos estudios pero no tantos en la vida real; «preliminar», que la idea es sensata pero todavía falta confirmarla.',
      'Lo más probado es repasar lo aprendido intentando recordarlo antes de mirar, y hacerlo cada vez más espaciado. Lo menos probado es que escribir sin IA o hacer cuentas a mano mantenga esas habilidades, aunque tiene sentido.',
      'Handfly no te hace más inteligente y no lo promete. Te ayuda a no perder habilidades que usas a diario, y te muestra con honestidad cuánto resuelves por tu cuenta.',
    ],
    levels: 'Niveles de evidencia',
    levelRows: [
      ['alta', 'Muchos estudios y varias revisiones que los reúnen coinciden, también fuera del laboratorio.'],
      ['moderada', 'Hay estudios sólidos, pero pocos en la vida real o con resultados que no siempre coinciden.'],
      ['preliminar', 'La idea es razonable y hay indicios, pero todavía faltan estudios buenos que la confirmen.'],
    ],
    foundations: 'Fundamentos',
    modules: 'Módulos',
    level: 'Nivel de evidencia',
    why: 'Por qué ese nivel',
    transfer: 'Por qué sirve fuera de la app',
    refs: 'Referencias',
    notPeer: 'sin revisión por pares',
    names: {
      'think-first': 'Pensar primero',
      recall: 'Recuerdo activo',
      people: 'Nombres de personas',
      navigation: 'Navegación sin GPS',
      writing: 'Escritura propia',
      calculation: 'Cálculo cotidiano',
    },
    lvl: { alta: 'alta', moderada: 'moderada', preliminar: 'preliminar' },
  },
  en: {
    file: 'EVIDENCE.md',
    other: '[Versión en español](EVIDENCIA.md)',
    title: 'Handfly scientific evidence',
    intro:
      'This document is generated automatically from each module’s metadata (`src/modules/*/meta.ts` and `src/core/evidence/foundations.ts`), the same data the app shows on its Evidence screen. To change it, edit those files and run `npm run evidence`. Every DOI was checked against Crossref.',
    plainTitle: 'In plain words',
    plain: [
      'Handfly exists because when a machine does something for us all the time, we slowly stop knowing how to do it. It happens to pilots with autopilot, and to all of us with AI, GPS and calculators.',
      'Many apps promise to "train your brain" with games. The largest studies say that doesn’t work: you get good at the game, not at your life. What does work is practicing the real task. That’s why Handfly has no games: it asks you to try first before asking an AI, to recall what you learned, to learn the names of people you meet, to get somewhere without GPS, to write your own messages and to do everyday math.',
      'Not every exercise is equally well tested, and the app says so plainly. Each one has a label: "high" means a great many studies agree; "moderate" means there are good studies but fewer in real life; "preliminary" means the idea is sensible but still needs confirming.',
      'The best tested is reviewing what you learned by trying to recall it before looking, at growing intervals. The least tested is that writing without AI or doing math by hand keeps those skills sharp, although it makes sense.',
      'Handfly won’t make you smarter and doesn’t promise to. It helps you keep skills you use every day, and shows you honestly how much you handle on your own.',
    ],
    levels: 'Evidence levels',
    levelRows: [
      ['high', 'Many studies and several reviews pooling them agree, including outside the lab.'],
      ['moderate', 'There are solid studies, but few in real life, or results that do not always agree.'],
      ['preliminary', 'The idea is reasonable and there are signs, but good studies confirming it are still missing.'],
    ],
    foundations: 'Foundations',
    modules: 'Modules',
    level: 'Evidence level',
    why: 'Why this level',
    transfer: 'Why it helps outside the app',
    refs: 'References',
    notPeer: 'not peer reviewed',
    names: {
      'think-first': 'Think first',
      recall: 'Active recall',
      people: "People's names",
      navigation: 'No-GPS navigation',
      writing: 'Your own writing',
      calculation: 'Everyday math',
    },
    lvl: { alta: 'high', moderada: 'moderate', preliminar: 'preliminary' },
  },
} as const

function refLine(r: Reference, lang: Lang) {
  const link = r.doi ? `[doi:${r.doi}](https://doi.org/${r.doi})` : r.url ? `[${r.url}](${r.url})` : ''
  const peer = r.peerReviewed ? '' : ` _(${T[lang].notPeer})_`
  return `- ${r.authors} (${r.year}). *${r.title}*. ${r.source}. ${link}${peer}\n  ${r.note[lang]}`
}

export function render(lang: Lang): string {
  const t = T[lang]
  const out: string[] = []
  out.push(`# ${t.title}`, '', t.other, '', t.intro, '')
  out.push(`## ${t.plainTitle}`, '', ...t.plain.flatMap((p) => [p, '']))
  out.push(`## ${t.levels}`, '', '| | |', '|---|---|', ...t.levelRows.map(([a, b]) => `| **${a}** | ${b} |`), '')
  out.push(`## ${t.foundations}`, '')
  for (const f of FOUNDATIONS) {
    out.push(`### ${f.title[lang]}`, '', f.body[lang], '', `**${t.refs}**`, '', ...f.references.map((r) => refLine(r, lang)), '')
  }
  out.push(`## ${t.modules}`, '')
  for (const m of METAS) {
    out.push(
      `### ${t.names[m.id]}`,
      '',
      `**${t.level}:** ${t.lvl[m.evidence.level]}`,
      '',
      `**${t.why}.** ${m.evidence.summary[lang]}`,
      '',
      `**${t.transfer}.** ${m.transfer[lang]}`,
      '',
      `**${t.refs}**`,
      '',
      ...m.evidence.references.map((r) => refLine(r, lang)),
      '',
    )
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

const check = process.argv.includes('--check')
let stale = false
for (const lang of ['es', 'en'] as const) {
  const file = T[lang].file
  const next = render(lang)
  if (check) {
    let current = ''
    try {
      current = readFileSync(file, 'utf8')
    } catch {
      /* no existe */
    }
    if (current !== next) {
      console.error(`${file} está desactualizado. Ejecuta: npm run evidence`)
      stale = true
    }
  } else {
    writeFileSync(file, next)
    console.log(`Escrito ${file}`)
  }
}
if (stale) process.exit(1)
