import type { ModuleMeta } from '../../core/modules/types'

export const meta: ModuleMeta = {
  id: 'navigation',
  ns: 'navigation',
  replaces: 'gps',
  accent: 'var(--magenta)',
  transfer: {
    es: 'La misión es un trayecto real de tu día. Estudiar el mapa antes, orientarte por referencias y reconstruir la ruta después es precisamente lo que hace quien se orienta bien sin GPS.',
    en: 'The mission is a real trip from your day. Studying the map beforehand, navigating by landmarks and reconstructing the route afterwards is exactly what good navigators do without GPS.',
  },
  evidence: {
    level: 'moderada',
    summary: {
      es: 'Experimentos de campo muestran que quien sigue instrucciones del GPS aprende peor el recorrido y la forma del lugar que quien usa un mapa o lo recorre por su cuenta. Que el uso habitual del GPS se asocie con peor memoria espacial viene sobre todo de estudios correlacionales y de un seguimiento pequeño. Que practicar sin GPS recupere esa habilidad es plausible pero todavía poco probado.',
      en: 'Field experiments show that people following GPS directions learn the route and the layout of a place worse than people using a map or finding their own way. The link between habitual GPS use and poorer spatial memory comes mostly from correlational studies and one small follow-up. That practicing without GPS restores the skill is plausible but still little tested.',
    },
    references: [
      {
        authors: 'Dahmani, L., & Bohbot, V. D.',
        year: 2020,
        title: 'Habitual use of GPS negatively impacts spatial memory during self-guided navigation',
        source: 'Scientific Reports, 10, 6310',
        doi: '10.1038/s41598-020-62877-0',
        peerReviewed: true,
        note: {
          es: 'Más uso de GPS se asoció con peor memoria espacial; en un seguimiento de 3 años, con un declive mayor (muestra pequeña).',
          en: 'More GPS use was associated with poorer spatial memory and, in a 3-year follow-up, with steeper decline (small sample).',
        },
      },
      {
        authors: 'Ishikawa, T., Fujiwara, H., Imai, O., & Okabe, A.',
        year: 2008,
        title: 'Wayfinding with a GPS-based mobile navigation system: A comparison with maps and direct experience',
        source: 'Journal of Environmental Psychology, 28(1), 74–82',
        doi: '10.1016/j.jenvp.2007.09.002',
        peerReviewed: true,
        note: {
          es: 'Quienes usaron GPS caminaron más lento, se detuvieron más y dibujaron peores croquis que quienes usaron mapa.',
          en: 'GPS users walked slower, stopped more and drew worse sketch maps than map users.',
        },
      },
      {
        authors: 'Münzer, S., Zimmer, H. D., Schwalm, M., Baus, J., & Aslan, I.',
        year: 2006,
        title: 'Computer-assisted navigation and the acquisition of route and survey knowledge',
        source: 'Journal of Environmental Psychology, 26(4), 300–308',
        doi: '10.1016/j.jenvp.2006.08.001',
        peerReviewed: true,
        note: {
          es: 'La navegación asistida redujo lo aprendido sobre la ruta frente a usar un mapa.',
          en: 'Assisted navigation reduced what was learned about the route compared with using a map.',
        },
      },
    ],
  },
}
