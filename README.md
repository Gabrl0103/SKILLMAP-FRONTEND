# SKILLMAP-FRONTEND

Repositorio del frontend de **Cenit** (antes SkillMap), "Tu ruta hacia el cenit de tu carrera": un dashboard que muestra el nivel de preparación para un objetivo profesional y las brechas de habilidades prioritarias.

Hecho con HTML, [Tailwind CSS (CDN)](https://tailwindcss.com/docs/installation/play-cdn), y JavaScript vanilla. No requiere build ni `npm install`.

Diseño basado en los mockups de `docs/mockups/`. Paleta: rosa `#D95F8E` (principal) y menta `#5FD9AA` (dominado / alta demanda), fondo rosa pálido y fuente [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Google Fonts) en todas las vistas.

## Features

### Mi Ruta (`docs/mockups/Dashboard.jpeg`)

Datos de `GET /api/goals/{id}/readiness`:

- **GoalSelector**: el título del objetivo es un desplegable para cambiarlo (el único control para eso en el encabezado; la selección completa está en Objetivo); carga la lista desde `GET /api/goals` y recarga la vista con el readiness del objetivo elegido.
- **Demanda de este rol**: Alta / Media / Baja según el promedio de `demandPercentage` de las habilidades del objetivo frente al catálogo, con la comparación a la vista ("Sus habilidades salen en el 7% de las ofertas; el promedio es 12%").
- **Nivel de preparación**: gauge con el % de preparación y cuántas habilidades clave faltan.
- **Brechas prioritarias**: las 3 habilidades pendientes con más demanda y "Ver más (n)" para el resto. Cada una con su nombre como enlace al detalle, una barra con el % real de ofertas ("En el 15% de las ofertas") y su estado (Aprendiendo / Pendiente).
- **Siguiente giro**: la brecha con mayor demanda; "Ver cómo empezar" (o "Ver los siguientes pasos" si ya la estás aprendiendo) abre su detalle. Es la única acción principal de la vista.
- **Tu semana** (`js/plan-semanal.js`): plan de estudio de 3 habilidades para la semana (lunes a domingo, hora local), sacado de las brechas: primero las que ya están en Aprendiendo y, dentro, por demanda. Cada una con horas sugeridas (`planHours`: 2 h + 1 h por cada 25 % de demanda, 1 h menos si ya la estás aprendiendo; entre 2 y 6 h), una casilla para marcar el avance de la semana y el selector Pendiente / Aprendiendo / Dominada (`PUT /api/skills/{id}/status`). El backend no guarda planes: vive en `localStorage` por usuario y objetivo (`skillmap.plan.{userId}.{goalId}`) y se rehace el primer día que se abre Mi Ruta en una semana nueva. Cambiar un estado desde aquí recarga Mi Ruta sin skeleton y deja el foco donde estaba.
- **Tu ritmo** (`js/rachas.js`): meta semanal editable (1–10, por defecto 2: habilidades que pasan a Aprendiendo o Dominada), "Esta semana: n de meta", racha actual y mejor racha (semanas seguidas cumpliendo la meta) y "Este mes": las habilidades del objetivo dominadas desde el día 1, sobre una barra del objetivo. La fecha de cada avance es `statusUpdatedAt` de `/api/skills` (cuándo pasó la habilidad a su estado actual). Como el backend solo guarda el último cambio, cada semana cerrada se queda con lo máximo que se vio de ella y con su meta de entonces (`localStorage`: `skillmap.ritmo.{userId}`), para que un avance nuevo no rompa una racha ya ganada.

**Datos de ejemplo** — la API aún no provee estos datos, así que se simulan en funciones aparte de `js/dashboard.js` y se muestran con la etiqueta "Datos de ejemplo":

- `urgencyBadge()`: badges de cada brecha (Más pedida / Alta demanda / Media), asignados por tercios de demanda entre las habilidades del objetivo.

Cuando el backend exponga ese campo, basta con reemplazar esa función.

La **Tendencia de Preparación** ya es real: `GET /api/goals/{id}/readiness/history` (un punto por día con cambios), en SVG inline con tooltip por mouse o teclado y una tabla accesible; con menos de 2 puntos muestra un estado vacío.

### Otras vistas

- **Mapa Visual**: vista accesible desde la barra superior con **todas** las habilidades del sistema (`GET /api/skills`), dibujadas como un grafo de nodos circulares sobre fondo rosa pálido. Cada categoría es un cluster ubicado en círculo alrededor del centro y sus habilidades se reparten en círculo alrededor del cluster (layout automático, sin coordenadas fijas), unidas por líneas grises. Color por estado: menta = dominada, rosa = en desarrollo, blanco punteado = por aprender. Incluye zoom +/− (0.5x–2x), arrastre con el mouse para mover el mapa, botón para centrar, leyenda y tooltip con la demanda de cada habilidad. Se carga la primera vez que se abre y no depende del objetivo seleccionado en el GoalSelector.
  - Solo 2D. Un consejo de primera vez explica cómo usar el mapa y se cierra para siempre. El enlace "Ver mis habilidades como lista" lleva a la vista **Habilidades**.
- **Habilidades** (`js/habilidades.js`): sección propia del nav, junto al Mapa. Encabezado con el resumen (X dominadas · Y aprendiendo · Z pendientes y una barra de proporciones), filtros Todas · Dominadas · Aprendiendo · Pendientes en una fila (el filtro dura la sesión) y una tarjeta por categoría con filas tipo tabla: el nombre abre el contexto y preguntas frecuentes, la demanda en barra y %, y un indicador de estado que abre un popover Pendiente / Aprendiendo / Dominada. Se sincroniza al instante con Mapa, Mi Ruta y Perfil; al volver del detalle de una habilidad el foco regresa a su fila. Detalle en DESIGN.md ("Habilidades").
- **Perfil · Mis Habilidades**: un resumen corto bajo la cabecera (el mismo de Habilidades) con el botón "Ver todas mis habilidades", que abre la vista Habilidades.
- **Introducción · mapa de glifos** (`js/intro-glifos.js`): ilustración decorativa en canvas 2D (datos de ejemplo, sin API): discos de habilidades hechos de glifos diminutos, agrupados por categoría como el Mapa, con titileo, parallax y resalte del disco bajo el cursor. Slide 2: cada habilidad con su % de demanda; slide 3: una oferta escaneada y su compatibilidad. ← → cambian de slide; Espacio pausa las animaciones, salvo con el foco en un control, donde lo activa. Detalle en DESIGN.md ("Mapa de glifos de la Introducción").

### Navegación

Sin framework de routing: cada vista es una `<section id="view-*">` en `index.html` y la barra superior muestra/oculta la sección elegida (clase `hidden`) y desliza el indicador del nav hasta el ítem activo. Secciones del nav: `view-objetivo` (Objetivo), `view-dashboard` (Mi Ruta), `view-mapa` (Mapa Visual), `view-habilidades` (Habilidades), `view-analizador` (Analizador) y `view-perfil` (Perfil); Ajustes (`view-ajustes`) se abre desde su botón y el detalle de habilidad (`view-skill`) desde Mapa, Mi Ruta o Habilidades. Por debajo de 1280px el nav muestra solo íconos.

## Estructura

```
SKILLMAP-FRONTEND/
├── index.html          # Estructura HTML (barra superior + una <section> por vista)
├── assets/cenit-star.svg  # Favicon: la estrella de Cenit
├── css/
│   └── styles.css      # Tokens, barra superior, tarjetas de Mi Ruta, gráfico y Mapa Visual
├── docs/mockups/       # Mockups de referencia de cada vista
└── js/
    ├── brand.js        # Logo de Cenit (estrella de brújula): brandMark() y las marcas de index.html
    ├── dashboard.js    # Vista Mi Ruta: fetch a la API, render y datos de ejemplo
    ├── plan-semanal.js # "Tu semana" de Mi Ruta: plan de 3 habilidades, horas sugeridas y avance (localStorage)
    ├── rachas.js       # "Tu ritmo" de Mi Ruta: meta semanal, rachas y lo dominado este mes
    ├── mapa.js         # Vista Mapa Visual (2D, consejo de primera vez) y navegación entre vistas
    ├── habilidades.js  # Vista Habilidades: resumen, filtros, demanda y estado de cada habilidad
    ├── intro.js        # Introducción: slides, teclado, pausa y arranque del mapa de glifos
    └── intro-glifos.js # Mapa de glifos de la Introducción (canvas 2D)
vendor/
└── tailwind.js         # Tailwind Play CDN 3.4.17, copia local
```

## Dependencias locales (`vendor/`)

Las librerías van copiadas en `vendor/` para que la app funcione sin internet y dentro del ejecutable (`scripts\build-app.ps1` del backend copia `vendor` entero junto con `index.html`, `css`, `js` y `assets`). No se usa npm ni CDN en tiempo de ejecución. Hoy solo hay una: `vendor/tailwind.js` (Tailwind Play CDN 3.4.17).

## Requisitos

- El backend **SKILLMAP-API** corriendo en paralelo en `http://localhost:8080`.
  Desde la carpeta `skillmap-api`:

  ```bash
  ./mvnw spring-boot:run
  ```

- Un servidor estático local, por ejemplo la extensión **Live Server** de VS Code.

## Cómo abrir el proyecto

1. Levanta el backend (ver arriba) y verifica que responda en `http://localhost:8080`.
2. Abre esta carpeta en VS Code.
3. Clic derecho sobre `index.html` → **Open with Live Server**
   (o el botón **Go Live** en la barra inferior).
4. Se abrirá el navegador en algo como `http://127.0.0.1:5500/index.html`.

Si el backend no está corriendo, el dashboard muestra un mensaje de error indicando que no se pudo conectar con la API.

> La URL de la API está definida en `js/dashboard.js` (`API_BASE_URL`).
