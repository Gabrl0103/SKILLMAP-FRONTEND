# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas en tech con un rol profesional objetivo, en dos grupos con el mismo peso:

- Estudiantes y juniors que buscan su primer empleo o prácticas.
- Devs en activo que quieren subir de nivel o cambiar de rol (ej. a Senior Frontend Engineer).

Trabajo que hacen en SkillMap: elegir un rol objetivo, ver qué habilidades les faltan para él y decidir cuál aprender primero. Ninguna vista debe asumir un nivel de experiencia concreto.

## Product Purpose

SkillMap muestra qué tan preparada está una persona para un objetivo profesional, qué habilidades le faltan (brechas), ordenadas por demanda en vacantes, y cuál es su siguiente acción.

El éxito tiene dos etapas:

1. **Ahora:** proyecto académico. Éxito = demo funcional que cumple la rúbrica del curso. *(Rúbrica no documentada en el repo: pendiente.)*
2. **Después:** producto real. Éxito = usuarios reales vuelven y avanzan en su ruta.

## Positioning

Un "GPS de carrera" (confirmado): en vez de un catálogo de cursos, SkillMap traza una ruta hacia un rol concreto ordenando las brechas por demanda del mercado. El Analizador contrasta una vacante real pegada por el usuario con sus habilidades.

## Operating Context

- Vistas actuales: **Objetivo** (elegir rol), **Mi Ruta** (preparación, brechas, siguiente acción, tendencia), **Mapa Visual** (todas las habilidades como grafo por categoría), **Analizador** (pegar el texto de una oferta y ver la compatibilidad) y **Perfil**.
- Backend: SKILLMAP-API (Spring Boot) en `http://localhost:8080`. Endpoints en uso: `GET /api/goals`, `GET /api/goals/{id}/readiness`, `GET /api/skills`. Previsto: `POST /api/analyzer/analyze`.
- En desarrollo se sirve con un servidor estático local (Live Server de VS Code) junto al backend.
- Uso en escritorio: SkillMap es una aplicación solo de escritorio.
- Un solo usuario implícito, sin autenticación. El objetivo activo vive en `localStorage` porque la API no lo guarda.

## Capabilities and Constraints

- **Stack vinculante:** HTML + CSS + JavaScript vanilla, sin framework, sin build y sin `npm install`. Hoy Tailwind se carga por CDN.
- **Mockups vinculantes:** `docs/mockups/*.jpeg` definen las vistas; el trabajo futuro los sigue, no los rediseña.
- **Datos que la API aún no provee** (urgencia de brechas, histórico de tendencia, analizador, usuario, proyectos, cursos, logros, preferencias): se simulan en funciones `sample*()` separadas y se muestran siempre con la etiqueta visible "Datos de ejemplo". Al llegar el endpoint real, se reemplaza solo esa función.
- **Demanda desde vacantes reales (requisito de la entrega final):** el `demandPercentage` debe calcularse a partir de ofertas de empleo reales. Hoy el backend usa datos sembrados; es temporal y no debe presentarse como dato de mercado real.
- **Solo escritorio:** el soporte móvil no es requisito.
- **Accesibilidad:** WCAG AA no es obligatorio; es una mejora opcional.
- Idioma de la interfaz: español.
- **Decisiones abiertas:**
  - Contenido de la rúbrica académica: pendiente, no inventarlo.

## Brand Commitments

- Nombre: SkillMap.
- Los mockups de `docs/mockups/` y la paleta que fijan (rosa principal, menta para "dominado") son vinculantes.
- Voz observada en la UI: español, tuteo, metáfora de ruta/GPS ("¿Cuál es tu próximo gran salto?").

## Evidence on Hand

- Mockups: `docs/mockups/Dashboard.jpeg`, `GoalSelector.jpeg`, `OfferAnalyzer.jpeg`, `Profile.jpeg`, `Skillmap.jpeg`.
- Datos reales: solo lo que devuelve SKILLMAP-API (objetivos, habilidades, readiness). Los porcentajes de demanda que devuelve hoy son sembrados, todavía no vienen de vacantes reales.
- No existen usuarios reales, testimonios, métricas de uso ni casos de éxito. El perfil "Alex Rivera" es de ejemplo. No inventar ninguno de estos.

## Product Principles

1. **Siempre un siguiente paso.** Cada vista responde "¿qué aprendo ahora?".
2. **Datos honestos.** Lo simulado se etiqueta; nunca se presenta como real.
3. **La demanda ordena la ruta.** La prioridad de las brechas viene del mercado, no de preferencias arbitrarias.
4. **Sirve a junior y a senior.** Nada asume experiencia previa ni la subestima.
5. **Demo hoy, producto mañana.** Las decisiones de la demo no deben bloquear el paso a usuarios reales (ej. conexión a la API aislada en un solo punto).
