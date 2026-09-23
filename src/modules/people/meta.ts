import type { ModuleMeta } from '../../core/modules/types'

export const meta: ModuleMeta = {
  id: 'people',
  ns: 'people',
  replaces: 'memoria',
  accent: 'var(--magenta)',
  transfer: {
    es: 'Las personas son reales: gente que conociste esta semana. Lo que se practica (recordar el nombre a partir de dónde la viste y qué la distingue) es lo mismo que necesitas la próxima vez que te la encuentres.',
    en: 'The people are real: people you met this week. What you practice (recalling the name from where you met and what stands out) is what you need the next time you run into them.',
  },
  evidence: {
    level: 'moderada',
    summary: {
      es: 'La técnica de convertir el nombre en una imagen y unirla a un rasgo mejora el recuerdo de nombres en laboratorio desde hace décadas. En la vida real se ha probado menos, y hay estudios donde repasar el nombre con intervalos crecientes ayudó tanto o más que la imagen; por eso Handfly combina las dos cosas. Adaptación honesta: los estudios usaban la cara; aquí no se guardan fotos, así que el rasgo lo eliges tú al conocer a la persona.',
      en: 'Turning the name into an image and linking it to a feature has improved name recall in the lab for decades. It has been tested less in real life, and some studies found that recalling the name at growing intervals helped as much or more than the image, so Handfly combines both. An honest adaptation: studies used faces; Handfly stores no photos, so you pick the feature when you meet the person.',
    },
    references: [
      {
        authors: 'McCarty, D. L.',
        year: 1980,
        title: 'Investigation of a visual imagery mnemonic device for acquiring face–name associations',
        source: 'Journal of Experimental Psychology: Human Learning and Memory, 6(2), 145–155',
        doi: '10.1037/0278-7393.6.2.145',
        peerReviewed: true,
        note: {
          es: 'Los tres pasos (imagen del nombre, rasgo destacado, escena que los une) mejoran el recuerdo frente a no usar técnica.',
          en: 'The three steps (name image, prominent feature, linking scene) improve recall compared with no technique.',
        },
      },
      {
        authors: 'Morris, P. E., Jones, S., & Hampson, P.',
        year: 1978,
        title: "An imagery mnemonic for the learning of people's names",
        source: 'British Journal of Psychology, 69(3), 335–336',
        doi: '10.1111/j.2044-8295.1978.tb01663.x',
        peerReviewed: true,
        note: {
          es: 'Primera demostración de la técnica con nombres de personas.',
          en: 'First demonstration of the technique with people’s names.',
        },
      },
      {
        authors: 'Morris, P. E., Fritz, C. O., Jackson, L., Nichol, E., & Roberts, E.',
        year: 2005,
        title: 'Strategies for learning proper names: Expanding retrieval practice, meaning and imagery',
        source: 'Applied Cognitive Psychology, 19(6), 779–798',
        doi: '10.1002/acp.1115',
        peerReviewed: true,
        note: {
          es: 'Recordar el nombre a intervalos crecientes fue muy eficaz; por eso los nombres entran en la repetición espaciada.',
          en: 'Recalling the name at expanding intervals was very effective, which is why names enter spaced repetition.',
        },
      },
    ],
  },
}
