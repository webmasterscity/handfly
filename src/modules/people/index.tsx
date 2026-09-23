import { Users } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'

export const people: ModuleDefinition = {
  meta,
  icon: Users,
  // Las pantallas se cargan al abrir el módulo: la primera carga de la app no las descarga.
  routes: [
    { index: true, lazy: () => import('./screens/PeopleHome').then((m) => ({ Component: m.PeopleHome })) },
    { path: 'new', lazy: () => import('./screens/PersonNew').then((m) => ({ Component: m.PersonNew })) },
    { path: 'p/:id', lazy: () => import('./screens/PersonEdit').then((m) => ({ Component: m.PersonEdit })) },
  ],
  missions: [
    { id: 'pp-greet', moduleId: 'people', textKey: 'people.greet', minutes: 5 },
    { id: 'pp-register', moduleId: 'people', textKey: 'people.register', minutes: 10 },
    { id: 'pp-meeting', moduleId: 'people', textKey: 'people.meeting', minutes: 5 },
  ],
}
