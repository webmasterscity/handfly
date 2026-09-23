import { PenLine } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'

export const writing: ModuleDefinition = {
  meta,
  icon: PenLine,
  // Las pantallas se cargan al abrir el módulo: la primera carga de la app no las descarga.
  routes: [
    { index: true, lazy: () => import('./screens/WritingHome').then((m) => ({ Component: m.WritingHome })) },
    { path: 'd/:id', lazy: () => import('./screens/DraftEditor').then((m) => ({ Component: m.DraftEditor })) },
    { path: 'd/:id/compare', lazy: () => import('./screens/DraftCompare').then((m) => ({ Component: m.DraftCompare })) },
  ],
  missions: [
    { id: 'wr-message', moduleId: 'writing', textKey: 'writing.message', minutes: 10 },
    { id: 'wr-email', moduleId: 'writing', textKey: 'writing.email', minutes: 15, to: '/m/writing', completesOn: 'draft.finished' },
    { id: 'wr-summary', moduleId: 'writing', textKey: 'writing.summary', minutes: 10, to: '/m/writing', completesOn: 'draft.finished' },
  ],
}
