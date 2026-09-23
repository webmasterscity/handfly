import { createHashRouter, RouterProvider } from 'react-router'
import { routes } from './router'

// HashRouter: GitHub Pages y el servidor estático no saben reescribir rutas; con /#/ruta
// cualquier enlace funciona, también sin conexión.
const router = createHashRouter(routes)

export function App() {
  return <RouterProvider router={router} />
}
