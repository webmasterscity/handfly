import { Calculator } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'
import { CalcHome } from './screens/CalcHome'
import { CalcPractice } from './screens/CalcPractice'
import { CalcEstimate } from './screens/CalcEstimate'

export const calculation: ModuleDefinition = {
  meta,
  icon: Calculator,
  routes: [
    { index: true, element: <CalcHome /> },
    { path: 'practice', element: <CalcPractice /> },
    { path: 'estimate', element: <CalcEstimate /> },
  ],
  missions: [
    { id: 'cc-groceries', moduleId: 'calculation', textKey: 'calculation.groceries', minutes: 10 },
    { id: 'cc-tip', moduleId: 'calculation', textKey: 'calculation.tip', minutes: 3 },
    { id: 'cc-budget', moduleId: 'calculation', textKey: 'calculation.budget', minutes: 10 },
    { id: 'cc-arrival', moduleId: 'calculation', textKey: 'calculation.arrival', minutes: 3 },
    { id: 'cc-estimate', moduleId: 'calculation', textKey: 'calculation.estimate', minutes: 5 },
  ],
}
