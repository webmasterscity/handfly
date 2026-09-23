import type { RouteObject } from 'react-router'
import { MODULES } from '../modules/registry'
import { NotFound } from '../screens/NotFound'
import { Today } from '../screens/Today'
import { Shell } from './Shell'

// Hoy se carga con la app; el resto de pantallas, al visitarlas.
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Today /> },
      { path: 'session', lazy: () => import('../screens/Session').then((m) => ({ Component: m.Session })) },
      { path: 'practice', lazy: () => import('../screens/Practice').then((m) => ({ Component: m.Practice })) },
      { path: 'log', lazy: () => import('../screens/LogFlight').then((m) => ({ Component: m.LogFlight })) },
      { path: 'progress', lazy: () => import('../screens/Progress').then((m) => ({ Component: m.Progress })) },
      { path: 'weekly', lazy: () => import('../screens/WeeklyCheck').then((m) => ({ Component: m.WeeklyCheck })) },
      { path: 'settings', lazy: () => import('../screens/Settings').then((m) => ({ Component: m.Settings })) },
      { path: 'about', lazy: () => import('../screens/About').then((m) => ({ Component: m.About })) },
      { path: 'evidence', lazy: () => import('../screens/Evidence').then((m) => ({ Component: m.Evidence })) },
      ...MODULES.map((m) => ({ path: `m/${m.meta.id}`, children: m.routes })),
      { path: '*', element: <NotFound /> },
    ],
  },
]
