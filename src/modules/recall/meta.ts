import type { ModuleMeta } from '../../core/modules/types'

export const meta: ModuleMeta = {
  id: 'recall',
  ns: 'recall',
  replaces: 'memoria',
  accent: 'var(--green)',
  transfer: {
    es: 'Las tarjetas son cosas que aprendiste en tu vida (respuestas de Pensar primero, datos que quieres retener), no listas genéricas. Recordarlas de memoria es la misma operación que necesitas cuando las usas en una conversación o en el trabajo.',
    en: 'Cards are things you learned in your own life (Think First answers, facts you want to keep), not generic lists. Recalling them from memory is the same operation you need when you use them in a conversation or at work.',
  },
  evidence: {
    level: 'alta',
    summary: {
      es: 'Practicar el recuerdo (preguntarse antes de mirar) y espaciar los repasos son de los hallazgos más replicados de la psicología del aprendizaje, en laboratorio y en clase. El beneficio se transfiere a preguntas nuevas sobre el mismo contenido de forma moderada; no mejora la memoria "en general".',
      en: 'Retrieval practice (asking yourself before looking) and spacing reviews are among the most replicated findings in the psychology of learning, both in the lab and in classrooms. The benefit transfers moderately to new questions about the same content; it does not improve memory "in general".',
    },
    references: [
      {
        authors: 'Pan, S. C., & Rickard, T. C.',
        year: 2018,
        title: 'Transfer of test-enhanced learning: Meta-analytic review and synthesis',
        source: 'Psychological Bulletin, 144(7), 710–756',
        doi: '10.1037/bul0000151',
        peerReviewed: true,
        note: {
          es: 'El recuerdo practicado se transfiere a otras preguntas y formatos sobre el mismo contenido, con efecto moderado.',
          en: 'Practiced retrieval transfers to other questions and formats about the same content, with a moderate effect.',
        },
      },
      {
        authors: 'Yang, C., Luo, L., Vadillo, M. A., Yu, R., & Shanks, D. R.',
        year: 2021,
        title: 'Testing (quizzing) boosts classroom learning: A systematic and meta-analytic review',
        source: 'Psychological Bulletin, 147(4), 399–435',
        doi: '10.1037/bul0000309',
        peerReviewed: true,
        note: {
          es: 'El efecto se mantiene en aulas reales, no solo en laboratorio.',
          en: 'The effect holds in real classrooms, not only in the lab.',
        },
      },
      {
        authors: 'Rowland, C. A.',
        year: 2014,
        title: 'The effect of testing versus restudy on retention: A meta-analytic review of the testing effect',
        source: 'Psychological Bulletin, 140(6), 1432–1463',
        doi: '10.1037/a0037559',
        peerReviewed: true,
        note: {
          es: 'Recordar supera a releer, sobre todo cuando después se ve la respuesta correcta.',
          en: 'Recalling beats rereading, especially when the correct answer is shown afterwards.',
        },
      },
      {
        authors: 'Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D.',
        year: 2006,
        title: 'Distributed practice in verbal recall tasks: A review and quantitative synthesis',
        source: 'Psychological Bulletin, 132(3), 354–380',
        doi: '10.1037/0033-2909.132.3.354',
        peerReviewed: true,
        note: {
          es: 'Espaciar los repasos en el tiempo mejora la retención a largo plazo.',
          en: 'Spacing reviews over time improves long-term retention.',
        },
      },
      {
        authors: 'Ye, J., Su, J., & Cao, Y.',
        year: 2022,
        title: 'A stochastic shortest path algorithm for optimizing spaced repetition scheduling',
        source: 'Proceedings of the 28th ACM SIGKDD Conference, 4381–4390',
        doi: '10.1145/3534678.3539081',
        peerReviewed: true,
        note: {
          es: 'Base del algoritmo FSRS que usa Handfly para decidir cuándo repasar.',
          en: 'Basis of the FSRS algorithm Handfly uses to decide when to review.',
        },
      },
    ],
  },
}
