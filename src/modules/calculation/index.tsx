import { Calculator } from 'lucide-react'
import type { ModuleDefinition } from '../../core/modules/types'
import { meta } from './meta'

export const calculation: ModuleDefinition = {
  meta,
  icon: Calculator,
  // Las pantallas se cargan al abrir el módulo: la primera carga de la app no las descarga.
  routes: [
    { index: true, lazy: () => import('./screens/CalcHome').then((m) => ({ Component: m.CalcHome })) },
    { path: 'practice', lazy: () => import('./screens/CalcPractice').then((m) => ({ Component: m.CalcPractice })) },
    { path: 'estimate', lazy: () => import('./screens/CalcEstimate').then((m) => ({ Component: m.CalcEstimate })) },
  ],
  missions: [
    { id: 'cc-groceries', moduleId: 'calculation', textKey: 'calculation.groceries', minutes: 10, check: { kind: 'number', unit: 'money', maxError: 0.25 } },
    { id: 'cc-tip', moduleId: 'calculation', textKey: 'calculation.tip', minutes: 3, check: { kind: 'number', unit: 'money', maxError: 0.25 } },
    { id: 'cc-budget', moduleId: 'calculation', textKey: 'calculation.budget', minutes: 10, check: { kind: 'number', unit: 'money', maxError: 0.5 } },
    { id: 'cc-arrival', moduleId: 'calculation', textKey: 'calculation.arrival', minutes: 3, check: { kind: 'time' } },
    { id: 'cc-estimate', moduleId: 'calculation', textKey: 'calculation.estimate', minutes: 5, check: { kind: 'number', unit: 'plain', maxError: 1 } },
  ],
}
