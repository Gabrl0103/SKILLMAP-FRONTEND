# SKILLMAP-FRONTEND

Repositorio del frontend de SKILLMAP: un dashboard que muestra el nivel de preparación para un objetivo profesional y las brechas de habilidades prioritarias.

Hecho con HTML, [Tailwind CSS (CDN)](https://tailwindcss.com/docs/installation/play-cdn), JavaScript vanilla y un Web Component (`<skill-card>`). No requiere build ni `npm install`.

Diseño basado en los mockups de `docs/mockups/`. Paleta: rosa `#D95F8E` (principal) y menta `#5FD9AA` (dominado / alta demanda), fondo rosa pálido y fuente [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Google Fonts) en todas las vistas.

## Features

### Mi Ruta (`docs/mockups/Dashboard.jpeg`)

Datos de `GET /api/goals/{id}/readiness`:

- **GoalSelector**: selector en el encabezado para cambiar de objetivo; carga la lista desde `GET /api/goals` y recarga la vista con el readiness del objetivo elegido.
- **Mercado Laboral**: Alta / Media / Baja demanda según el promedio de `demandPercentage` de las brechas del objetivo.
- **Nivel de preparación**: gauge con el % de preparación y cuántas habilidades clave faltan. El botón "Ver detalle de brechas" despliega todas las brechas y lleva a la tarjeta.
- **Brechas prioritarias**: las 3 habilidades pendientes con más demanda (el resto se ve con "Ver detalle"), cada una con barra de demanda y estado (En desarrollo / Por aprender).
- **Siguiente acción**: la brecha con mayor demanda; "Empezar ahora" abre el Mapa Visual.

**Datos de ejemplo** — la API aún no provee estos datos, así que se simulan en funciones aparte de `js/dashboard.js` y se muestran con la etiqueta "Datos de ejemplo":

- `sampleUrgencyBadge()`: badges de urgencia de cada brecha (Alta demanda / Crítica / Media), asignados según la posición en el ranking.
- `sampleTrendData()`: gráfico "Tendencia de Habilidades" (tu nivel vs. demanda del mercado, Ene–Jun). SVG inline, con tooltip al pasar el mouse o con teclado y una tabla accesible para lectores de pantalla.

Cuando el backend exponga estos campos, basta con reemplazar esas dos funciones.

### Otras vistas

- **Mapa Visual**: vista accesible desde el sidebar con **todas** las habilidades del sistema (`GET /api/skills`), dibujadas como un grafo de nodos circulares sobre fondo rosa pálido. Cada categoría es un cluster ubicado en círculo alrededor del centro y sus habilidades se reparten en círculo alrededor del cluster (layout automático, sin coordenadas fijas), unidas por líneas grises. Color por estado: menta = dominada, rosa = en desarrollo, blanco punteado = por aprender. Incluye zoom +/− (0.5x–2x), arrastre con el mouse para mover el mapa, botón para centrar, leyenda y tooltip con la demanda de cada habilidad. Se carga la primera vez que se abre y no depende del objetivo seleccionado en el GoalSelector.

### Navegación

Sin framework de routing: cada vista es una `<section id="view-*">` en `index.html` y el sidebar muestra/oculta la sección elegida (clase `hidden`) y mueve el estado activo del item (píldora rosa sólida). Vistas actuales: `view-dashboard` (Mi Ruta) y `view-mapa` (Mapa Visual). Objetivo, Analizador y Perfil aparecen deshabilitados ("Próximamente").

## Estructura

```
SKILLMAP-FRONTEND/
├── index.html          # Estructura HTML (sidebar + una <section> por vista)
├── css/
│   └── styles.css      # Paleta, sidebar, tarjetas de Mi Ruta, gráfico y Mapa Visual
├── docs/mockups/       # Mockups de referencia de cada vista
└── js/
    ├── skill-card.js   # Web Component <skill-card> (hoy sin uso en las vistas)
    ├── dashboard.js    # Vista Mi Ruta: fetch a la API, render y datos de ejemplo
    └── mapa.js         # Vista Mapa Visual y navegación entre vistas
```

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
