import type { ModuleMeta } from '../../core/modules/types'

export const meta: ModuleMeta = {
  id: 'calculation',
  ns: 'calculation',
  replaces: 'calculadora',
  accent: 'var(--green)',
  transfer: {
    es: 'Los problemas son situaciones de todos los días (súper, propina, dividir la cuenta, descuentos, trayectos, recetas) y las misiones se hacen en la caja o en la mesa, no en la app. Las estimaciones usan precios y datos de tu propia vida.',
    en: 'Problems are everyday situations (groceries, tips, splitting the bill, discounts, trips, recipes) and missions happen at the checkout or the table, not in the app. Estimates use prices and facts from your own life.',
  },
  evidence: {
    level: 'preliminar',
    summary: {
      es: 'Las habilidades que no se practican se deterioran, y más las que son cognitivas que las físicas (revisión cuantitativa amplia). Que practicar cuentas y estimaciones cotidianas mantenga el cálculo mental en adultos es razonable pero está poco estudiado fuera de la escuela. Los "juegos de cálculo" genéricos no se incluyen: no se transfieren.',
      en: 'Skills that are not practiced decay, cognitive ones more than physical ones (broad quantitative review). That practicing everyday sums and estimates keeps adults’ mental arithmetic sharp is reasonable but little studied outside school. Generic "math games" are not included: they do not transfer.',
    },
    references: [
      {
        authors: 'Arthur, W., Jr., Bennett, W., Jr., Stanush, P. L., & McNelly, T. L.',
        year: 1998,
        title: 'Factors that influence skill decay and retention: A quantitative review and analysis',
        source: 'Human Performance, 11(1), 57–101',
        doi: '10.1207/s15327043hup1101_3',
        peerReviewed: true,
        note: {
          es: 'Las habilidades se pierden con el desuso; las cognitivas, más rápido.',
          en: 'Skills are lost with disuse; cognitive ones faster.',
        },
      },
      {
        authors: 'Sala, G., & Gobet, F.',
        year: 2019,
        title: 'Cognitive training does not enhance general cognition',
        source: 'Trends in Cognitive Sciences, 23(1), 9–20',
        doi: '10.1016/j.tics.2018.10.004',
        peerReviewed: true,
        note: {
          es: 'Por qué no hay juegos de números genéricos: lo entrenado casi no se transfiere a otras tareas.',
          en: 'Why there are no generic number games: what is trained barely transfers to other tasks.',
        },
      },
    ],
  },
}
