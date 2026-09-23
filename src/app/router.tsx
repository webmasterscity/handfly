import type { RouteObject } from 'react-router'
import { MODULES } from '../modules/registry'
import { About } from '../screens/About'
import { Evidence } from '../screens/Evidence'
import { LogFlight } from '../screens/LogFlight'
import { NotFound } from '../screens/NotFound'
import { Practice } from '../screens/Practice'
import { Progress } from '../screens/Progress'
import { Session } from '../screens/Session'
import { Settings } from '../screens/Settings'
import { Today } from '../screens/Today'
import { WeeklyCheck } from '../screens/WeeklyCheck'
import { Shell } from './Shell'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Today /> },
      { path: 'session', element: <Session /> },
      { path: 'practice', element: <Practice /> },
      { path: 'log', element: <LogFlight /> },
      { path: 'progress', element: <Progress /> },
      { path: 'weekly', element: <WeeklyCheck /> },
      { path: 'settings', element: <Settings /> },
      { path: 'about', element: <About /> },
      { path: 'evidence', element: <Evidence /> },
      ...MODULES.map((m) => ({ path: `m/${m.meta.id}`, children: m.routes })),
      { path: '*', element: <NotFound /> },
    ],
  },
]
