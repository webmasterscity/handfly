import { Lightbulb } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'
import { ThinkClose } from './screens/ThinkClose'
import { ThinkHome } from './screens/ThinkHome'
import { ThinkNew } from './screens/ThinkNew'

export const thinkFirst: ModuleDefinition = {
  meta,
  icon: Lightbulb,
  routes: [
    { index: true, element: <ThinkHome /> },
    { path: 'new', element: <ThinkNew /> },
    { path: 'close/:id', element: <ThinkClose /> },
  ],
  missions: [
    { id: 'tf-before-chat', moduleId: 'think-first', textKey: 'thinkFirst.beforeChat', minutes: 5 },
    { id: 'tf-say-it', moduleId: 'think-first', textKey: 'thinkFirst.sayIt', minutes: 3 },
    { id: 'tf-solve-alone', moduleId: 'think-first', textKey: 'thinkFirst.solveAlone', minutes: 20 },
  ],
}
