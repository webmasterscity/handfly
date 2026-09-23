import type { ModuleMeta } from '../../core/modules/types'

export const meta: ModuleMeta = {
  id: 'writing',
  ns: 'writing',
  replaces: 'ia',
  accent: 'var(--amber)',
  transfer: {
    es: 'Se escriben textos reales que vas a enviar: un mensaje, un correo, una nota. No hay ejercicios de redacción inventados; el borrador propio es la tarea misma.',
    en: 'You write real texts you are going to send: a message, an email, a note. There are no made-up writing drills; your own draft is the task itself.',
  },
  evidence: {
    level: 'preliminar',
    summary: {
      es: 'Producir algo con tus propias palabras se recuerda mejor que leerlo ya hecho (efecto de generación, bien establecido para la memoria). Que delegar la escritura a la IA reduzca la capacidad de escribir o el sentido de autoría viene de estudios recientes, pequeños o de encuestas. Por eso el nivel es preliminar: es razonable, pero aún no está demostrado.',
      en: 'Producing something in your own words is remembered better than reading it ready-made (the generation effect, well established for memory). That delegating writing to AI reduces writing ability or the sense of authorship comes from recent small studies or surveys. That is why the level is preliminary: it is reasonable, but not yet proven.',
    },
    references: [
      {
        authors: 'Slamecka, N. J., & Graf, P.',
        year: 1978,
        title: 'The generation effect: Delineation of a phenomenon',
        source: 'Journal of Experimental Psychology: Human Learning and Memory, 4(6), 592–604',
        doi: '10.1037/0278-7393.4.6.592',
        peerReviewed: true,
        note: {
          es: 'Lo que generas tú se recuerda mejor que lo que solo lees.',
          en: 'What you generate yourself is remembered better than what you only read.',
        },
      },
      {
        authors: 'Bertsch, S., Pesta, B. J., Wiscott, R., & McDaniel, M. A.',
        year: 2007,
        title: 'The generation effect: A meta-analytic review',
        source: 'Memory & Cognition, 35(2), 201–210',
        doi: '10.3758/BF03193441',
        peerReviewed: true,
        note: {
          es: 'El efecto de generación se confirma en decenas de estudios.',
          en: 'The generation effect holds across dozens of studies.',
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
          es: 'Preliminar: quienes escribieron con IA citaban peor su propio texto y lo sentían menos suyo.',
          en: 'Preliminary: those who wrote with AI quoted their own text worse and felt less ownership of it.',
        },
      },
      {
        authors: 'Lee, H.-P., Sarkar, A., Tankelevitch, L., et al.',
        year: 2025,
        title: 'The impact of generative AI on critical thinking: Self-reported reductions in cognitive effort and confidence effects from a survey of knowledge workers',
        source: 'Proceedings of the 2025 CHI Conference on Human Factors in Computing Systems',
        doi: '10.1145/3706598.3713778',
        peerReviewed: true,
        note: {
          es: 'Encuesta: más confianza en la IA se asoció con menos pensamiento crítico declarado.',
          en: 'Survey: more trust in AI was associated with less self-reported critical thinking.',
        },
      },
    ],
  },
}
