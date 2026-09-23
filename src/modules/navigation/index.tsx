import { Compass } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'

export const navigation: ModuleDefinition = {
  meta,
  icon: Compass,
  // Las pantallas se cargan al abrir el módulo: la primera carga de la app no las descarga.
  routes: [
    { index: true, lazy: () => import('./screens/NavHome').then((m) => ({ Component: m.NavHome })) },
    { path: 'new', lazy: () => import('./screens/RoutePlan').then((m) => ({ Component: m.RoutePlan })) },
    { path: 'r/:id/fly', lazy: () => import('./screens/RouteFly').then((m) => ({ Component: m.RouteFly })) },
    { path: 'r/:id/recall', lazy: () => import('./screens/RouteRecall').then((m) => ({ Component: m.RouteRecall })) },
  ],
  missions: [
    { id: 'nv-plan', moduleId: 'navigation', textKey: 'navigation.plan', minutes: 30 },
    { id: 'nv-return', moduleId: 'navigation', textKey: 'navigation.return', minutes: 20 },
    { id: 'nv-landmarks', moduleId: 'navigation', textKey: 'navigation.landmarks', minutes: 15 },
    { id: 'nv-home', moduleId: 'navigation', textKey: 'navigation.pointHome', minutes: 3 },
  ],
}
