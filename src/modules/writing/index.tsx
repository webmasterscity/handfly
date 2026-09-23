import { PenLine } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'
import { DraftCompare } from './screens/DraftCompare'
import { DraftEditor } from './screens/DraftEditor'
import { WritingHome } from './screens/WritingHome'

export const writing: ModuleDefinition = {
  meta,
  icon: PenLine,
  routes: [
    { index: true, element: <WritingHome /> },
    { path: 'd/:id', element: <DraftEditor /> },
    { path: 'd/:id/compare', element: <DraftCompare /> },
  ],
  missions: [
    { id: 'wr-message', moduleId: 'writing', textKey: 'writing.message', minutes: 10 },
    { id: 'wr-email', moduleId: 'writing', textKey: 'writing.email', minutes: 15 },
    { id: 'wr-summary', moduleId: 'writing', textKey: 'writing.summary', minutes: 10 },
  ],
}
