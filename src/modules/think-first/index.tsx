import { Lightbulb } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'

export const thinkFirst: ModuleDefinition = {
  meta,
  icon: Lightbulb,
  // Las pantallas se cargan al abrir el módulo: la primera carga de la app no las descarga.
  routes: [
    { index: true, lazy: () => import('./screens/ThinkHome').then((m) => ({ Component: m.ThinkHome })) },
    { path: 'new', lazy: () => import('./screens/ThinkNew').then((m) => ({ Component: m.ThinkNew })) },
    { path: 'close/:id', lazy: () => import('./screens/ThinkClose').then((m) => ({ Component: m.ThinkClose })) },
  ],
  missions: [
    { id: 'tf-before-chat', moduleId: 'think-first', textKey: 'thinkFirst.beforeChat', minutes: 5, to: '/m/think-first/new', completesOn: 'think.saved', starter: true },
    { id: 'tf-say-it', moduleId: 'think-first', textKey: 'thinkFirst.sayIt', minutes: 3, check: { kind: 'closeness' } },
    { id: 'tf-solve-alone', moduleId: 'think-first', textKey: 'thinkFirst.solveAlone', minutes: 20, to: '/m/think-first/new', completesOn: 'think.saved' },
  ],
}
