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

export interface MissionTemplate {
  id: string
  moduleId: ModuleId
  /** Clave i18n (dentro de 'missions') del texto de la misión. */
  textKey: string
  /** Minutos que se registran como vuelo real al completarla, si el usuario no indica otros. */
  minutes: number
  surprise?: boolean
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
