import { Users } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'
import { PeopleHome } from './screens/PeopleHome'
import { PersonEdit } from './screens/PersonEdit'
import { PersonNew } from './screens/PersonNew'

export const people: ModuleDefinition = {
  meta,
  icon: Users,
  routes: [
    { index: true, element: <PeopleHome /> },
    { path: 'new', element: <PersonNew /> },
    { path: 'p/:id', element: <PersonEdit /> },
  ],
  missions: [
    { id: 'pp-greet', moduleId: 'people', textKey: 'people.greet', minutes: 5 },
    { id: 'pp-register', moduleId: 'people', textKey: 'people.register', minutes: 10 },
    { id: 'pp-meeting', moduleId: 'people', textKey: 'people.meeting', minutes: 5 },
  ],
}
