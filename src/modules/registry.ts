import type { ModuleId } from '../core/db/types'
import type { MissionTemplate, ModuleDefinition } from '../core/modules/types'
import { calculation } from './calculation'
import { navigation } from './navigation'
import { people } from './people'
import { recall } from './recall'
import { thinkFirst } from './think-first'
import { writing } from './writing'

/**
 * Registro de módulos. Para añadir uno: crear su carpeta con meta.ts e index.tsx,
 * importarlo aquí y añadir sus textos en src/i18n/<lang>/<id>.json.
 * El orden es el que se muestra en Practicar.
 */
export const MODULES: ModuleDefinition[] = [thinkFirst, recall, people, navigation, writing, calculation]

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.meta.id, m])) as Record<ModuleId, ModuleDefinition>

export const ALL_MISSIONS: MissionTemplate[] = MODULES.flatMap((m) => m.missions)

export const ENABLED_MODULE_IDS: ModuleId[] = MODULES.map((m) => m.meta.id)
