import type { MissionCheck } from '../missions/scoring'
import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'
import type { MemoryCard, ModuleId } from '../db/types'

export type EvidenceLevel = 'alta' | 'moderada' | 'preliminar'

export const LANGUAGES = ['es', 'en'] as const
export type Lang = (typeof LANGUAGES)[number]

/** Texto en todos los idiomas soportados. Obligatorio en los metadatos de evidencia. */
export type Localized = Record<Lang, string>

export interface Reference {
  authors: string
  year: number
  /** Título original de la publicación (no se traduce). */
  title: string
  source: string
  doi?: string
  url?: string
  /** false para preprints u otros textos sin revisión por pares. */
  peerReviewed: boolean
  /** Qué aporta esta referencia al módulo, en una frase. */
  note: Localized
}

/** Metadatos obligatorios de todo módulo. Una prueba automática verifica que estén completos. */
export interface ModuleMeta {
  id: ModuleId
  /** Clave del espacio de nombres i18n del módulo. */
  ns: string
  /** Qué se delega normalmente y este módulo recupera. */
  replaces: 'ia' | 'memoria' | 'gps' | 'calculadora'
  evidence: {
    level: EvidenceLevel
    /** Explicación honesta de por qué ese nivel. */
    summary: Localized
    references: Reference[]
  }
  /** Por qué la práctica se transfiere a la vida real: qué elementos comparte con la tarea real. */
  transfer: Localized
  /** Color de acento del módulo (variable CSS). */
  accent: string
}

/**
 * Acciones dentro de la app que cumplen una misión por sí solas: el módulo las anuncia
 * con reportActivity() al guardar y la misión del día se marca cumplida sin que la
 * persona tenga que volver a confirmarla.
 */
export type MissionEvent = 'think.saved' | 'person.saved' | 'draft.finished' | 'route.flown' | 'compass.pointed'

export interface MissionTemplate {
  id: string
  moduleId: ModuleId
  /**
   * Clave i18n (dentro de 'missions') de la instrucción de la misión, un objeto con
   * title, goal, steps[], example, done y why. Todas las misiones siguen el mismo molde
   * para que siempre quede claro qué hacer, cómo y cuándo está cumplida.
   */
  textKey: string
  /** Minutos que se registran como vuelo real al completarla, si el usuario no indica otros. */
  minutes: number
  surprise?: boolean
  /** Pantalla de la app donde se hace la misión (botón «Empezar»). Sin ella, se hace fuera. */
  to?: string
  /** Se hace en la calle aunque la app ayude (abre una pantalla, pero no es «aquí en la app»). */
  outside?: boolean
  /** Acción de la app que la da por cumplida automáticamente. */
  completesOn?: MissionEvent
  /** La primera misión de alguien nuevo: corta, dentro de la app y sin salir de casa. */
  starter?: boolean
  /** Cómo se juega al volver: apuesta previa y comprobación con puntuación. */
  check?: MissionCheck
}

/** Cómo se pregunta un tipo de tarjeta propio (registrado en src/modules/cardRenderers.tsx). */
export interface CardRendererProps {
  card: MemoryCard
  revealed: boolean
}

export interface ModuleDefinition {
  meta: ModuleMeta
  /** Rutas bajo /m/<id>. */
  routes: RouteObject[]
  icon: ComponentType<{ className?: string }>
  missions: MissionTemplate[]
}
