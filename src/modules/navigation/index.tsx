import { Compass } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'
import { NavHome } from './screens/NavHome'
import { RouteFly } from './screens/RouteFly'
import { RoutePlan } from './screens/RoutePlan'
import { RouteRecall } from './screens/RouteRecall'

export const navigation: ModuleDefinition = {
  meta,
  icon: Compass,
  routes: [
    { index: true, element: <NavHome /> },
    { path: 'new', element: <RoutePlan /> },
    { path: 'r/:id/fly', element: <RouteFly /> },
    { path: 'r/:id/recall', element: <RouteRecall /> },
  ],
  missions: [
    { id: 'nv-plan', moduleId: 'navigation', textKey: 'navigation.plan', minutes: 30 },
    { id: 'nv-return', moduleId: 'navigation', textKey: 'navigation.return', minutes: 20 },
    { id: 'nv-landmarks', moduleId: 'navigation', textKey: 'navigation.landmarks', minutes: 15 },
    { id: 'nv-home', moduleId: 'navigation', textKey: 'navigation.pointHome', minutes: 3 },
  ],
}
