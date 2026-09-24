import { render } from '@testing-library/react'
import axe from 'axe-core'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from '../src/app/router'

async function audit(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const { container, findByRole } = render(<RouterProvider router={router} />)
  await findByRole('heading', { level: 1 })
  // El contraste depende de CSS real, que jsdom no calcula: se revisa aparte.
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

describe('accesibilidad (axe)', () => {
  for (const path of ['/practice', '/evidence', '/about', '/log', '/settings', '/m/think-first/new', '/m/people/new', '/m/navigation/new', '/m/calculation', '/welcome', '/m/calculation/practice', '/m/navigation/compass', '/progress', '/m/people/quiz']) {
    it(`sin violaciones en ${path}`, async () => {
      expect(await audit(path)).toEqual([])
    })
  }
})
