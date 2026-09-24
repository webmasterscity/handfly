import { createHashRouter, RouterProvider } from 'react-router'
import { recordExistingProgress } from '../core/session/session'
import { routes } from './router'

// HashRouter: GitHub Pages y el servidor estático no saben reescribir rutas; con /#/ruta
// cualquier enlace funciona, también sin conexión.
const router = createHashRouter(routes)

// Una vez por dispositivo, antes de cualquier actividad: los rangos que ya se tenían no
// se celebran como ascensos nuevos.
void recordExistingProgress()

export function App() {
  return <RouterProvider router={router} />
}
