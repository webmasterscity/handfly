import { describe, expect, it } from 'vitest'
import { FOUNDATIONS } from '../src/core/evidence/foundations'
import { LANGUAGES, type Localized } from '../src/core/modules/types'
import { SURPRISE_MISSIONS } from '../src/core/missions/templates'
import { resources } from '../src/i18n'
import { ALL_MISSIONS, MODULES } from '../src/modules/registry'

// La regla del CONTRIBUTING, hecha prueba: ningún módulo entra sin justificar su
// transferencia a la vida real ni sin citar evidencia, en todos los idiomas.

const complete = (l: Localized) => LANGUAGES.every((lang) => typeof l[lang] === 'string' && l[lang].trim().length > 20)

describe('metadatos de módulos', () => {
  for (const { meta } of MODULES) {
    describe(meta.id, () => {
      it('declara nivel de evidencia válido', () => {
        expect(['alta', 'moderada', 'preliminar']).toContain(meta.evidence.level)
      })
      it('explica el nivel y la transferencia en todos los idiomas', () => {
        expect(complete(meta.evidence.summary)).toBe(true)
        expect(complete(meta.transfer)).toBe(true)
      })
      it('cita al menos dos referencias localizables', () => {
        expect(meta.evidence.references.length).toBeGreaterThanOrEqual(2)
        for (const r of meta.evidence.references) {
          expect(r.doi || r.url, r.title).toBeTruthy()
          expect(complete(r.note), r.title).toBe(true)
          if (r.doi) expect(r.doi).toMatch(/^10\.\d{4,}\//)
        }
      })
      it('tiene al menos una misión del mundo real', () => {
        expect(ALL_MISSIONS.some((m) => m.moduleId === meta.id)).toBe(true)
      })
      it('tiene textos en todos los idiomas', () => {
        for (const lang of LANGUAGES) expect(resources[lang][meta.ns as keyof (typeof resources)['es']]).toBeTruthy()
      })
    })
  }

  it('los fundamentos están completos', () => {
    for (const f of FOUNDATIONS) {
      expect(complete(f.title) && complete(f.body)).toBe(true)
      for (const r of f.references) expect(complete(r.note)).toBe(true)
    }
  })
})

function keys(obj: unknown, prefix = ''): string[] {
  if (Array.isArray(obj)) return [prefix]
  if (obj && typeof obj === 'object') return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
  return [prefix]
}

describe('i18n', () => {
  it('español e inglés tienen exactamente las mismas claves', () => {
    for (const ns of Object.keys(resources.es) as (keyof typeof resources.es)[]) {
      const es = keys(resources.es[ns]).sort()
      const en = keys(resources.en[ns]).sort()
      expect(en, ns).toEqual(es)
    }
  })

  it('cada misión tiene su texto', () => {
    for (const m of [...ALL_MISSIONS, ...SURPRISE_MISSIONS]) {
      for (const lang of LANGUAGES) {
        const text = m.textKey.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], resources[lang].core.missions)
        expect(typeof text, `${lang}:${m.textKey}`).toBe('string')
      }
    }
  })
})
