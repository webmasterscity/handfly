# Contribuir a Handfly · Contributing

[Español](#español) · [English](#english)

## Español

¡Gracias por querer ayudar! Handfly tiene una regla que está por encima de todas las demás.

### La regla de oro

**Todo módulo nuevo debe justificar su transferencia a la vida real y citar evidencia.**

La investigación en entrenamiento cognitivo muestra que la práctica genérica (juegos de memoria, n-back, acertijos) mejora el juego pero casi no se transfiere a otras tareas (Sala y Gobet, 2019; Gobet y Sala, 2023). Por eso:

1. **El ejercicio es la tarea real o usa contenido real de la vida del usuario.** Si se puede practicar sin que el usuario aporte algo de su vida, probablemente no encaja.
2. **Se declara un nivel de evidencia honesto**: `alta`, `moderada` o `preliminar`. Ante la duda, el nivel más bajo.
3. **Se citan referencias verificables**, con DOI siempre que exista, y se marcan los preprints (`peerReviewed: false`).
4. **Nada de promesas de «más inteligencia»**, ni de mejorar la memoria o la atención «en general».

Estas condiciones no son solo texto: `tests/metadata.test.ts` falla si un módulo no las cumple.

### Cómo añadir un módulo

1. Crea `src/modules/<id>/` con:
   - `meta.ts`: el `ModuleMeta` con `transfer` y `evidence` (resumen y notas de cada referencia) **en todos los idiomas**.
   - `index.tsx`: el `ModuleDefinition` (rutas, icono y al menos una misión del mundo real).
   - `screens/`: las pantallas.
2. Añade el `id` a `ModuleId` y `MODULE_IDS` en `src/core/db/types.ts`, y regístralo en `src/modules/registry.ts`.
3. Crea `src/i18n/es/<id>.json` y `src/i18n/en/<id>.json` con **las mismas claves**, y regístralos en `src/i18n/index.ts`. Añade los textos de sus misiones en `core.json` (`missions.*`), su nombre en `modules.*` y su descripción en `moduleBlurbs.*`.
4. Si guarda datos nuevos, añade una **versión nueva** del esquema en `src/core/db/schema.ts` (nunca edites una versión anterior) y la tabla en `TABLE_NAMES` para que entre en los respaldos.
5. Ejecuta `npm run evidence` para regenerar `EVIDENCIA.md` y `EVIDENCE.md`.
6. Comprueba que todo pasa: `npm run lint && npm run typecheck && npm test && npm run evidence:check`.

### Principios de diseño

- **Pensado primero para el móvil**: zonas táctiles de al menos 44 px y la acción principal al alcance del pulgar.
- **Accesible**: etiquetas en todos los campos, foco visible, contraste AA y respeto a «reducir movimiento». Añade la pantalla nueva a `tests/a11y.test.tsx`.
- **Privacidad**: los datos personales nunca salen del dispositivo. Nada de peticiones de red con datos del usuario, analítica ni fotos de terceros.
- **Enganche sano**: nada de contenido infinito ni mensajes que culpen. Una sesión termina y se despide.
- **Texto claro**: frases cortas, sin jerga. Si una palabra hay que explicarla, se cambia por una común.

### Idiomas

Para añadir un idioma: crea `src/i18n/<lang>/` con los mismos archivos, añádelo a `LANGUAGES` en `src/core/modules/types.ts` (eso obliga a traducir también los metadatos de evidencia) y regístralo en `src/i18n/index.ts`.

---

## English

Thanks for wanting to help! Handfly has one rule above all others.

### The golden rule

**Every new module must justify its transfer to real life and cite evidence.**

Cognitive-training research shows that generic practice (memory games, n-back, puzzles) improves the game but barely transfers to other tasks (Sala & Gobet, 2019; Gobet & Sala, 2023). So:

1. **The exercise is the real task or uses real content from the user's life.**
2. **Declare an honest evidence level**: `alta` (high), `moderada` (moderate) or `preliminar` (preliminary). When in doubt, pick the lower one.
3. **Cite verifiable references**, with a DOI whenever one exists, and flag preprints (`peerReviewed: false`).
4. **No promises of "more intelligence"** or of improving memory or attention "in general".

`tests/metadata.test.ts` fails if a module breaks these rules.

### Adding a module

1. Create `src/modules/<id>/` with `meta.ts` (transfer and evidence **in every language**), `index.tsx` (routes, icon, at least one real-world mission) and `screens/`.
2. Add the id to `ModuleId`/`MODULE_IDS` in `src/core/db/types.ts` and register it in `src/modules/registry.ts`.
3. Add `src/i18n/es/<id>.json` and `src/i18n/en/<id>.json` with **identical keys**, register them in `src/i18n/index.ts`, and add mission texts, name and blurb to `core.json`.
4. New data? Add a **new** schema version in `src/core/db/schema.ts` and the table to `TABLE_NAMES`.
5. Run `npm run evidence`, then `npm run lint && npm run typecheck && npm test && npm run evidence:check`.

Design principles: mobile first, accessible (add new screens to `tests/a11y.test.tsx`), personal data never leaves the device, no endless content or guilt, plain language.
