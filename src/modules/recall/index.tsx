import { Layers } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'
import { CardEdit } from './screens/CardEdit'
import { RecallHome } from './screens/RecallHome'
import { ReviewNow } from './screens/ReviewNow'

export const recall: ModuleDefinition = {
  meta,
  icon: Layers,
  routes: [
    { index: true, element: <RecallHome /> },
    { path: 'new', element: <CardEdit /> },
    { path: 'card/:id', element: <CardEdit /> },
    { path: 'review', element: <ReviewNow /> },
  ],
  missions: [
    { id: 'rc-explain', moduleId: 'recall', textKey: 'recall.explain', minutes: 10 },
    { id: 'rc-agenda', moduleId: 'recall', textKey: 'recall.agenda', minutes: 3 },
    { id: 'rc-shopping', moduleId: 'recall', textKey: 'recall.shopping', minutes: 15 },
  ],
}
