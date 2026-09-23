import type { Localized, Reference } from '../modules/types'

/** Fundamentos generales de Handfly (no pertenecen a un módulo concreto). */
export interface Foundation {
  id: string
  title: Localized
  body: Localized
  references: Reference[]
}

export const FOUNDATIONS: Foundation[] = [
  {
    id: 'transfer',
    title: {
      es: 'Por qué no hay "juegos para el cerebro"',
      en: 'Why there are no "brain games"',
    },
    body: {
      es: 'Los análisis que reúnen cientos de estudios muestran que entrenar con juegos genéricos (memoria de trabajo, n-back, rompecabezas) mejora el juego entrenado, pero casi no mejora otras tareas ni la vida diaria. La mejora se transfiere cuando la práctica comparte elementos con la tarea real, una idea que se conoce desde hace más de un siglo. Por eso cada ejercicio de Handfly es la tarea real o usa contenido de tu propia vida.',
      en: 'Analyses pooling hundreds of studies show that training with generic games (working memory, n-back, puzzles) improves the trained game but barely improves other tasks or daily life. Gains transfer when practice shares elements with the real task, an idea known for over a century. That is why every Handfly exercise is the real task, or uses content from your own life.',
    },
    references: [
      {
        authors: 'Sala, G., & Gobet, F.',
        year: 2019,
        title: 'Cognitive training does not enhance general cognition',
        source: 'Trends in Cognitive Sciences, 23(1), 9–20',
        doi: '10.1016/j.tics.2018.10.004',
        peerReviewed: true,
        note: {
          es: 'Metaanálisis: el entrenamiento cognitivo no mejora la cognición general una vez controlados los sesgos.',
          en: 'Meta-analysis: cognitive training does not improve general cognition once biases are controlled.',
        },
      },
      {
        authors: 'Sala, G., Aksayli, N. D., Tatlidil, K. S., Tatsumi, T., Gondo, Y., & Gobet, F.',
        year: 2019,
        title: 'Near and far transfer in cognitive training: A second-order meta-analysis',
        source: 'Collabra: Psychology, 5(1), 18',
        doi: '10.1525/collabra.203',
        peerReviewed: true,
        note: {
          es: 'Transferencia cercana pequeña; transferencia lejana prácticamente nula.',
          en: 'Small near transfer; practically no far transfer.',
        },
      },
      {
        authors: 'Gobet, F., & Sala, G.',
        year: 2023,
        title: 'Cognitive training: A field in search of a phenomenon',
        source: 'Perspectives on Psychological Science, 18(1), 125–141',
        doi: '10.1177/17456916221091830',
        peerReviewed: true,
        note: {
          es: 'Revisión: tras décadas de estudios, el efecto de transferencia lejana no aparece.',
          en: 'Review: after decades of studies, far-transfer effects fail to appear.',
        },
      },
      {
        authors: 'Thorndike, E. L., & Woodworth, R. S.',
        year: 1901,
        title: 'The influence of improvement in one mental function upon the efficiency of other functions',
        source: 'Psychological Review, 8(3), 247–261',
        doi: '10.1037/h0074898',
        peerReviewed: true,
        note: {
          es: 'Origen de la idea de "elementos idénticos": se transfiere lo que comparte elementos con lo practicado.',
          en: 'Origin of the "identical elements" idea: what transfers is what shares elements with the practice.',
        },
      },
    ],
  },
  {
    id: 'handflying',
    title: {
      es: 'De dónde viene la idea de "volar a mano"',
      en: 'Where "hand-flying" comes from',
    },
    body: {
      es: 'En aviación se comprobó que los pilotos que vuelan casi siempre con piloto automático conservan los movimientos básicos, pero pierden sobre todo las habilidades mentales: saber dónde están y qué hacer sin la ayuda. Por eso las autoridades recomiendan practicar vuelo manual. Delegar tareas en herramientas —lo que los investigadores llaman «descarga cognitiva»— libera la mente, pero si nunca se practica sin ellas, la habilidad se debilita.',
      en: 'Aviation found that pilots who fly almost always on autopilot keep basic stick-and-rudder skills but lose mostly the cognitive ones: knowing where they are and what to do without help. That is why regulators recommend manual flying practice. Offloading tasks onto tools frees the mind, but if we never practice without them, the skill weakens.',
    },
    references: [
      {
        authors: 'Casner, S. M., Geven, R. W., Recker, M. P., & Schooler, J. W.',
        year: 2014,
        title: 'The retention of manual flying skills in the automated cockpit',
        source: 'Human Factors, 56(8), 1506–1516',
        doi: '10.1177/0018720814535628',
        peerReviewed: true,
        note: {
          es: 'Con automatización, las habilidades cognitivas de vuelo manual se deterioraron más que las motoras.',
          en: 'With automation, cognitive manual-flying skills declined more than motor ones.',
        },
      },
      {
        authors: 'Risko, E. F., & Gilbert, S. J.',
        year: 2016,
        title: 'Cognitive offloading',
        source: 'Trends in Cognitive Sciences, 20(9), 676–688',
        doi: '10.1016/j.tics.2016.07.002',
        peerReviewed: true,
        note: {
          es: 'Marco teórico de por qué delegamos en herramientas y qué costos tiene.',
          en: 'Theoretical framework for why we offload onto tools and what it costs.',
        },
      },
      {
        authors: 'Arthur, W., Jr., Bennett, W., Jr., Stanush, P. L., & McNelly, T. L.',
        year: 1998,
        title: 'Factors that influence skill decay and retention: A quantitative review and analysis',
        source: 'Human Performance, 11(1), 57–101',
        doi: '10.1207/s15327043hup1101_3',
        peerReviewed: true,
        note: {
          es: 'Las habilidades se pierden con el desuso, más rápido las cognitivas.',
          en: 'Skills decay with disuse, cognitive ones faster.',
        },
      },
    ],
  },
]
