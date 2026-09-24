# Handfly

**Apaga el piloto automático.** · [English](README.en.md)

Handfly es una aplicación web gratuita y de código abierto para recuperar las habilidades que se debilitan cuando se lo dejamos todo a la IA, al GPS y a la calculadora. El nombre viene de la aviación: los pilotos practican el *hand-flying* —volar a mano, sin piloto automático— para no perder la habilidad.

- **App:** https://handfly.yapirides.com (también en https://webmasterscity.github.io/handfly/)
- **Evidencia científica:** [EVIDENCIA.md](EVIDENCIA.md) · [EVIDENCE.md](EVIDENCE.md)
- **En una hoja, para compartir:** [¿Qué es Handfly?](docs/handfly-en-una-hoja.pdf) · [La ciencia detrás](docs/evidencia-en-una-hoja.pdf)
- **Licencia:** [MIT](LICENSE)

## En palabras fáciles de entender

Cuando una máquina hace algo por nosotros todo el tiempo, poco a poco dejamos de saber hacerlo. Handfly te ayuda a practicar esas cosas a propósito, unos minutos al día y con situaciones de tu propia vida: intentar responder tú antes de preguntarle a la IA, repasar lo que aprendiste, recordar el nombre de la gente que conoces, llegar a un sitio sin GPS, escribir tus propios mensajes y hacer las cuentas del día.

No tiene juegos para «entrenar el cerebro», porque los estudios más grandes muestran que esos juegos solo te hacen mejor en el juego. Cada ejercicio dice qué tan probado está. No promete hacerte más inteligente.

Todo lo que escribes se queda en tu teléfono: no hay cuentas, ni anuncios, ni rastreo. Se instala como una app y funciona sin internet. Está en español y en inglés.

## El principio que guía todo

Los metaanálisis sobre entrenamiento cognitivo (Sala y Gobet, 2019–2023) muestran que practicar con juegos genéricos mejora el juego, pero casi no se transfiere a la vida real. La mejora se transfiere cuando la práctica **comparte elementos con la tarea real**. Por eso:

- No hay minijuegos genéricos (n-back, rompecabezas, «brain games»).
- Cada ejercicio **es** la tarea real o usa contenido real de tu vida.
- Cada módulo declara su nivel de evidencia (alta / moderada / preliminar) con referencias verificadas.

## Módulos

| Módulo | Qué practicas | Evidencia |
|---|---|---|
| **Pensar primero** | Escribir tu respuesta y tu confianza antes de preguntarle a una IA; después comparar | moderada |
| **Recuerdo activo** | Repasar lo aprendido recordando antes de mirar, con repetición espaciada (FSRS) | alta |
| **Nombres de personas** | Técnica de imagen + rasgo + escena, y repaso espaciado del nombre. Sin fotos | moderada |
| **Navegación sin GPS** | Planear con el mapa, recorrer sin GPS y reconstruir la ruta (lista o croquis) | moderada |
| **Escritura propia** | Borradores reales sin pegar texto, con temporizador opcional y comparación con IA | preliminar |
| **Cálculo cotidiano** | Súper, propinas, cuentas, descuentos, trayectos, recetas y estimaciones reales | preliminar |

## Motivación sana

- **Una misión al día, como un pase de abordar:** algo concreto de tu vida, con pasos, un ejemplo y cuándo está cumplida. Casi siempre sale de las habilidades que elegiste recuperar en la bienvenida.
- **Apuesta y comprueba:** en muchas misiones anotas primero tu predicción (el total de la compra, tu hora de llegada, hacia dónde queda tu casa) y después el dato real. Recibes una precisión de 0 a 100 y compites contra tu propio récord. Predecir y corregir enseguida es lo que afina la estimación.
- **Retos cortos con final:** «Caja rápida» (5 cuentas de la vida real dibujadas como el tique, la cuenta o la etiqueta; con estrellas, niveles que se ajustan solos y un máximo de 3 rondas al día) y «¿Dónde está casa?» (apuntas el teléfono hacia tu casa y la brújula mide cuántos grados te desviaste; sin brújula, se juega con los puntos cardinales).
- **Horas de vuelo real y rango de piloto:** solo suben con lo que resuelves fuera de la app. El primer ascenso llega con la primera misión; cada rango tiene sus alas. La práctica dentro de la app cuenta aparte, como «horas de simulador».
- **Celebraciones** al ascender, al desbloquear un logro o al batir un récord. **Racha** con un día de descanso protegido por semana, misiones sorpresa y logros ocultos.
- **Límites éticos:** sin contenido infinito; al terminar, la app se despide. Un solo recordatorio diario opcional, en tu calendario (`.ics`), sin mensajes que te hagan sentir culpable. Sin anuncios ni recogida de datos: tu ubicación, si juegas con la brújula, tampoco sale del teléfono.

## Tecnología

React 19 · Vite · TypeScript · Tailwind CSS 4 · Dexie (IndexedDB) · ts-fsrs · i18next · vite-plugin-pwa.

- Sin servidor de datos: todo vive en IndexedDB del navegador, con exportación e importación de respaldo en JSON.
- PWA instalable y funcional sin conexión, pensada primero para el móvil.
- Accesible (objetivo WCAG AA; pruebas automáticas con axe), modo claro y oscuro.
- Español e inglés; cada idioma tiene exactamente las mismas claves (lo verifica una prueba).

## Probar en local

Requisitos: Node.js 20 o superior.

```bash
git clone https://github.com/webmasterscity/handfly.git
cd handfly
npm install
BASE_PATH=/ npm run dev      # abre http://localhost:5173
```

Otros comandos:

```bash
npm test                 # pruebas (lógica, metadatos de evidencia, idiomas, accesibilidad)
npm run lint             # linter (oxlint)
npm run typecheck        # tipos
npm run build            # compilación para GitHub Pages (/handfly/)
BASE_PATH=/ npm run build && npm run preview   # compilación para la raíz de un dominio
npm run evidence         # regenera EVIDENCIA.md y EVIDENCE.md desde los metadatos
```

## Publicar

**Servidor propio (handfly.yapirides.com):**

```bash
./deploy.sh
```

El script prueba, compila, sube la versión y la activa con un cambio atómico, y guarda las últimas 5 versiones (`./deploy.sh --rollback` vuelve a la anterior). La primera vez crea el vhost de nginx y el certificado HTTPS; para eso pide la contraseña de `sudo`. No toca ningún otro sitio del servidor. Ver `./deploy.sh --help`.

**GitHub Pages:** cada push a `main` se publica solo con el workflow `.github/workflows/deploy.yml`. En *Settings → Pages*, la fuente debe ser «GitHub Actions».

## Estructura

```
src/
├── app/            # Shell (navegación), router
├── core/           # lógica independiente de módulos
│   ├── db/         # esquema Dexie, respaldo JSON
│   ├── srs/        # repetición espaciada (FSRS)
│   ├── streak/     # racha con descanso protegido
│   ├── flight-log/ # vuelos reales / simulador, rangos
│   ├── missions/   # planificador de misiones y sorpresas
│   ├── session/    # sesión diaria
│   ├── stats/      # métricas de progreso
│   ├── evidence/   # fundamentos generales con referencias
│   └── ...
├── modules/        # un directorio por módulo: meta.ts (evidencia), index.tsx, screens/
├── screens/        # Hoy, Sesión, Practicar, Progreso, Ajustes, Evidencia…
├── ui/             # instrumentos (horizonte, altímetro), gráficas, componentes
└── i18n/           # es/ y en/
```

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md). La regla principal: **todo módulo nuevo debe justificar su transferencia a la vida real y citar evidencia.**
