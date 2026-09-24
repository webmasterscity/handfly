import { Layers } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'

export const recall: ModuleDefinition = {
  meta,
  icon: Layers,
  // Las pantallas se cargan al abrir el módulo: la primera carga de la app no las descarga.
  routes: [
    { index: true, lazy: () => import('./screens/RecallHome').then((m) => ({ Component: m.RecallHome })) },
    { path: 'new', lazy: () => import('./screens/CardEdit').then((m) => ({ Component: m.CardEdit })) },
    { path: 'card/:id', lazy: () => import('./screens/CardEdit').then((m) => ({ Component: m.CardEdit })) },
    { path: 'review', lazy: () => import('./screens/ReviewNow').then((m) => ({ Component: m.ReviewNow })) },
  ],
  missions: [
    { id: 'rc-explain', moduleId: 'recall', textKey: 'recall.explain', minutes: 10, check: { kind: 'closeness' } },
    { id: 'rc-agenda', moduleId: 'recall', textKey: 'recall.agenda', minutes: 3, check: { kind: 'count' } },
    { id: 'rc-shopping', moduleId: 'recall', textKey: 'recall.shopping', minutes: 15, check: { kind: 'count' } },
  ],
}
