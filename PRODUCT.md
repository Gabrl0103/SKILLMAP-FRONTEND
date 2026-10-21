# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas en tech con un rol profesional objetivo, en dos grupos con el mismo peso:

- Estudiantes y juniors que buscan su primer empleo o prácticas.
- Devs en activo que quieren subir de nivel o cambiar de rol (ej. a Senior Frontend Engineer).

Trabajo que hacen en Cenit: elegir un rol objetivo, ver qué habilidades les faltan para él y decidir cuál aprender primero. Ninguna vista debe asumir un nivel de experiencia concreto.

## Product Purpose

Cenit muestra qué tan preparada está una persona para un objetivo profesional, qué habilidades le faltan (brechas), ordenadas por demanda en vacantes, y cuál es su siguiente acción.

El éxito tiene dos etapas:

1. **Ahora:** proyecto académico. Éxito = demo funcional que cumple la rúbrica del curso. *(Rúbrica no documentada en el repo: pendiente.)*
2. **Después:** producto real. Éxito = usuarios reales vuelven y avanzan en su ruta.

## Positioning

Un "GPS de carrera" (confirmado): en vez de un catálogo de cursos, Cenit traza una ruta hacia un rol concreto ordenando las brechas por demanda del mercado. El Analizador contrasta una vacante real pegada por el usuario con sus habilidades.

## Operating Context

- Vistas actuales: **Objetivo** (elegir rol), **Mi Ruta** (preparación, brechas, siguiente acción, tendencia), **Mapa Visual** (todas las habilidades como grafo 2D por categoría), **Analizador** (pegar el texto de una oferta y ver la compatibilidad) y **Perfil** (con "Mis Habilidades": el catálogo completo como lista filtrable donde se cambia el estado de cada habilidad). La Introducción, que se ve sin cuenta, muestra un mapa de habilidades decorativo hecho de glifos (canvas 2D, datos de ejemplo) que responde al cursor y acompaña cada slide: el mapa, la demanda de cada habilidad y un análisis de una oferta.
- Backend: SKILLMAP-API (Spring Boot) en `http://localhost:8080`. Endpoints en uso: `GET /api/goals`, `GET /api/goals/{id}/readiness`, `GET /api/skills`. Previsto: `POST /api/analyzer/analyze`.
- En desarrollo se sirve con un servidor estático local (Live Server de VS Code) junto al backend.
- Uso en escritorio: Cenit es una aplicación solo de escritorio (`dist\Cenit\Cenit.exe`).
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

- Nombre: Cenit (antes SkillMap). Se escribe "Cenit", nunca en mayúsculas completas. Los identificadores internos (claves de `localStorage`, eventos `skillmap:*`, repositorios) conservan el nombre anterior.
- Slogan: "Tu ruta hacia el cenit de tu carrera" / "Your route to the zenith of your career" (clave i18n `brand.slogan`).
- Logo: estrella de brújula de 4 puntas con la punta superior más larga (el norte, el cenit), con el degradado de acción del tema (`js/brand.js`, favicon en `assets/cenit-star.svg`). Ver DESIGN.md.
- Los mockups de `docs/mockups/` y la paleta que fijan (rosa principal, menta para "dominado") son vinculantes.
- Voz de la UI: español, tuteo, metáfora de ruta/GPS ("¿Cuál es tu próximo gran salto?"). Reglas en "Voz de GPS".

## Voz de GPS

Los textos hablan como un navegador GPS amable y breve: orientan, indican el siguiente paso y celebran la llegada. Es solo texto en pantalla, no hay voz ni audio.

- **Vocabulario:** ruta, rumbo, destino (el objetivo), siguiente giro (la siguiente habilidad), tramo, punto de control (una habilidad dominada), recalculando (cuando cambia el objetivo o llegan ofertas nuevas), llegaste (100 % de preparación). "Llegada estimada" solo si hay un dato real que la respalde; hoy no lo hay.
- **Claridad primero:** primero va el dato y después la metáfora ("Llegaste a tu destino: dominas todas las habilidades clave de…"). Ninguna metáfora va sola si oculta qué pasó.
- **Una sola expresión GPS por bloque o pantalla.** No se repite en cada botón: botones, formularios, etiquetas de campo y títulos de tarjeta quedan neutros.
- **Sin juegos de palabras en errores ni en seguridad:** contraseña, eliminar cuenta, borrar historial y mensajes de error dicen lo que pasa, en literal.
- **Accesibilidad:** los textos `aria-live` y `aria-label` describen la acción real ("Objetivo cambiado a… Recalculando tu ruta").
- **Idioma:** español natural de Colombia, sin regionalismos fuertes; el inglés es idiomático, no traducción literal ("You've arrived", "Next turn"). Sin emojis ni signos de exclamación.
- **No cambiar** las claves i18n ni los mensajes del backend que se traducen comparando el texto (`BACKEND_ERRORS_EN` en `js/i18n.js`).
- **Títulos con degradado** (`intro.title`, `objetivo.title`, título del objetivo): no se reescriben, porque el degradado recorta las letras con cola.

| Dónde | Antes | Después |
|---|---|---|
| Mi Ruta · tarjeta de acción | Siguiente acción | Siguiente giro |
| Mi Ruta · preparación | Estás a solo 3 habilidades clave de alcanzar el perfil ideal para Frontend Senior. | Te faltan 3 habilidades clave para llegar a Frontend Senior. |
| Mi Ruta · objetivo alcanzado | Dominas todas las habilidades clave de Frontend Senior. | Llegaste a tu destino: dominas todas las habilidades clave de Frontend Senior. |
| Mi Ruta · cargando (lector de pantalla) | Cargando tu ruta… | Calculando tu ruta… |
| Mi Ruta · aviso al cambiar objetivo | Objetivo cambiado a Backend Java. Tu progreso se conserva. | Objetivo cambiado a Backend Java. Recalculando tu ruta; tu progreso se conserva. |
| Mi Ruta · tendencia vacía | Aún no hay suficiente historial: marca tu avance y aquí verás tu tendencia. | Aún no hay recorrido que mostrar: marca tu avance y aquí verás tu tendencia. |
| Objetivo · subtítulo | Define tu objetivo profesional para que el GPS pueda trazar la ruta más eficiente hacia tu meta. | Elige tu destino y Cenit traza la ruta: qué habilidades te faltan y en qué orden aprenderlas. |
| Acceso · crear cuenta | Tu progreso se guarda en este equipo, separado del de otras cuentas. | Marca tu punto de partida. Tu progreso se guarda en este equipo, separado del de otras cuentas. |
| Analizador · sin análisis | …para ver tu porcentaje de match y las habilidades que te faltan. | …: verás tu porcentaje de match y qué habilidades te faltan para llegar a ese puesto. |
| Perfil · filtro Aprendiendo vacío | No estás aprendiendo ninguna habilidad ahora mismo. | No estás aprendiendo ninguna ahora mismo. Mi Ruta te indica el siguiente giro. |
| Perfil · filtro Dominadas vacío | Aún no tienes habilidades dominadas. | Aún no dominas ninguna. Tu primera parada está en Mi Ruta. |
| Perfil · filtro Pendientes vacío | — | No te queda ninguna pendiente: llegaste a destino. |

Ya seguían esta voz y no cambian: el subtítulo de la Introducción ("traza la ruta hacia tu próximo rol"), Acceso al entrar ("seguir tu ruta donde la dejaste"), el detalle del Mapa ("Es tu siguiente giro hacia…"), Ajustes ("Recalculando…", "Tu ruta se recalculó con las ofertas nuevas") y los logros "Medio camino" y "Recta final".

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
