import type { ModuleMeta } from '../../core/modules/types'

export const meta: ModuleMeta = {
  id: 'think-first',
  ns: 'think-first',
  replaces: 'ia',
  accent: 'var(--accent)',
  transfer: {
    es: 'La práctica es la tarea real: una pregunta que de verdad ibas a buscar en una IA, en un buscador o preguntándole a alguien. Intentar responderla primero es exactamente el hábito que se quiere conservar fuera de la app.',
    en: 'The practice is the real task: a question you were actually going to look up with an AI, a search engine or by asking someone. Trying to answer it first is exactly the habit you want to keep outside the app.',
  },
  evidence: {
    level: 'moderada',
    summary: {
      es: 'Intentar responder antes de ver la respuesta mejora el aprendizaje posterior, incluso cuando el intento falla (efecto del pre-examen, sólido en laboratorio). Que la IA usada como muleta reduce el aprendizaje lo muestra un ensayo grande en matemáticas escolares. Lo específico de "pensar antes de la IA" sobre la memoria viene de un estudio pequeño aún sin revisión por pares: por eso el conjunto es moderado, no alto.',
      en: 'Trying to answer before seeing the answer improves later learning, even when the attempt fails (the pretesting effect, robust in the lab). That AI used as a crutch reduces learning is shown by a large trial in high-school math. The specific claim that "thinking before AI" protects memory comes from a small study not yet peer reviewed, so overall the evidence is moderate, not high.',
    },
    references: [
      {
        authors: 'Kornell, N., Hays, M. J., & Bjork, R. A.',
        year: 2009,
        title: 'Unsuccessful retrieval attempts enhance subsequent learning',
        source: 'Journal of Experimental Psychology: Learning, Memory, and Cognition, 35(4), 989–998',
        doi: '10.1037/a0015729',
        peerReviewed: true,
        note: {
          es: 'Equivocarse al intentar responder antes de estudiar mejora el recuerdo posterior.',
          en: 'Getting it wrong when trying to answer before studying improves later recall.',
        },
      },
      {
        authors: 'Richland, L. E., Kornell, N., & Kao, L. S.',
        year: 2009,
        title: 'The pretesting effect: Do unsuccessful retrieval attempts enhance learning?',
        source: 'Journal of Experimental Psychology: Applied, 15(3), 243–257',
        doi: '10.1037/a0016496',
        peerReviewed: true,
        note: {
          es: 'El pre-examen ayuda aunque el intento sea incorrecto, con textos reales.',
          en: 'Pretesting helps even when the attempt is wrong, using real texts.',
        },
      },
      {
        authors: 'Pan, S. C., & Carpenter, S. K.',
        year: 2023,
        title: 'Prequestioning and pretesting effects: A review of empirical research, theoretical perspectives, and implications for educational practice',
        source: 'Educational Psychology Review, 35(4), 97',
        doi: '10.1007/s10648-023-09814-5',
        peerReviewed: true,
        note: {
          es: 'Revisión reciente: el beneficio de preguntarse antes es consistente, sobre todo para lo que se preguntó.',
          en: 'Recent review: the benefit of asking yourself first is consistent, especially for what was asked.',
        },
      },
      {
        authors: 'Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R.',
        year: 2025,
        title: 'Generative AI without guardrails can harm learning: Evidence from high school mathematics',
        source: 'Proceedings of the National Academy of Sciences, 122(26), e2422633122',
        doi: '10.1073/pnas.2422633122',
        peerReviewed: true,
        note: {
          es: 'Con GPT sin límites el rendimiento en práctica subió, pero en el examen sin IA bajó; una versión que obligaba a pensar evitó buena parte del daño.',
          en: 'Unrestricted GPT raised practice scores but lowered exam scores without AI; a version that made students think avoided most of the harm.',
        },
      },
      {
        authors: 'Kosmyna, N., Hauptmann, E., Yuan, Y. T., et al.',
        year: 2025,
        title: 'Your Brain on ChatGPT: Accumulation of cognitive debt when using an AI assistant for essay writing task',
        source: 'arXiv:2506.08872 (MIT Media Lab)',
        url: 'https://arxiv.org/abs/2506.08872',
        peerReviewed: false,
        note: {
          es: 'Preliminar (54 participantes): quienes escribieron primero sin IA recordaban mejor su propio texto.',
          en: 'Preliminary (54 participants): those who wrote without AI first remembered their own text better.',
        },
      },
    ],
  },
}
