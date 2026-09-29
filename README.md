# SKILLMAP-FRONTEND

Repositorio del frontend de SKILLMAP: un dashboard que muestra el nivel de preparación para un objetivo profesional y las brechas de habilidades prioritarias.

Hecho con HTML, [Tailwind CSS (CDN)](https://tailwindcss.com/docs/installation/play-cdn), JavaScript vanilla y un Web Component (`<skill-card>`). No requiere build ni `npm install`.

## Features

- **Nivel de preparación**: gauge con el % de habilidades dominadas para el objetivo.
- **Brechas prioritarias**: top 5 habilidades pendientes ordenadas por demanda (`<skill-card>`).
- **Próxima acción recomendada**: la brecha con mayor demanda en el mercado.
- **GoalSelector**: selector en el encabezado de "Mi Ruta" para cambiar de objetivo; carga la lista desde `GET /api/goals` y recarga el dashboard con el readiness del objetivo elegido.
- **Mapa Visual**: vista accesible desde el sidebar con **todas** las habilidades del sistema (`GET /api/skills`), dibujadas como un grafo de nodos circulares sobre fondo rosa pálido. Cada categoría es un cluster ubicado en círculo alrededor del centro y sus habilidades se reparten en círculo alrededor del cluster (layout automático, sin coordenadas fijas), unidas por líneas grises. Color por estado: menta = dominada, rosa = en desarrollo, blanco punteado = por aprender. Incluye zoom +/− (0.5x–2x), arrastre con el mouse para mover el mapa, botón para centrar, leyenda y tooltip con la demanda de cada habilidad. Se carga la primera vez que se abre y no depende del objetivo seleccionado en el GoalSelector.

### Navegación

Sin framework de routing: cada vista es una `<section id="view-*">` en `index.html` y el sidebar muestra/oculta la sección elegida (clase `hidden`) y mueve el estado activo del item. Vistas actuales: `view-dashboard` (Mi Ruta) y `view-mapa` (Mapa Visual).

## Estructura

```
SKILLMAP-FRONTEND/
├── index.html          # Estructura HTML (sidebar + una <section> por vista)
├── css/
│   └── styles.css      # Estilos personalizados (cards, sidebar, gauge)
└── js/
    ├── skill-card.js   # Web Component <skill-card>
    ├── dashboard.js    # Fetch a la API y renderizado del dashboard
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
