# SKILLMAP-FRONTEND

Repositorio del frontend de **Cenit** (antes SkillMap), "Tu ruta hacia el cenit de tu carrera": un dashboard que muestra el nivel de preparación para un objetivo profesional y las brechas de habilidades prioritarias.

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

Cuando el backend exponga ese campo, basta con reemplazar esa función.

La **Tendencia de Preparación** ya es real: `GET /api/goals/{id}/readiness/history` (un punto por día con cambios), en SVG inline con tooltip por mouse o teclado y una tabla accesible; con menos de 2 puntos muestra un estado vacío.

### Otras vistas

- **Mapa Visual**: vista accesible desde la barra superior con **todas** las habilidades del sistema (`GET /api/skills`), dibujadas como un grafo de nodos circulares sobre fondo rosa pálido. Cada categoría es un cluster ubicado en círculo alrededor del centro y sus habilidades se reparten en círculo alrededor del cluster (layout automático, sin coordenadas fijas), unidas por líneas grises. Color por estado: menta = dominada, rosa = en desarrollo, blanco punteado = por aprender. Incluye zoom +/− (0.5x–2x), arrastre con el mouse para mover el mapa, botón para centrar, leyenda y tooltip con la demanda de cada habilidad. Se carga la primera vez que se abre y no depende del objetivo seleccionado en el GoalSelector.
  - **Vista 3D** (`js/mapa-3d.js`): el interruptor "2D / 3D" de la tarjeta muestra las mismas habilidades en 3D, con el layout 2D en el piso y la demanda como altura. Se gira arrastrando, se acerca con la rueda o pellizcando y se selecciona con clic o teclado (mismo panel y mismo selector de estado que en 2D). La 2D sigue siendo la vista por defecto; sin WebGL 2 se queda en 2D con un aviso. Detalle en DESIGN.md ("Vista 3D del Mapa").

### Navegación

Sin framework de routing: cada vista es una `<section id="view-*">` en `index.html` y la barra superior muestra/oculta la sección elegida (clase `hidden`) y desliza el indicador del nav hasta el ítem activo. Vistas actuales: `view-dashboard` (Mi Ruta) y `view-mapa` (Mapa Visual). Objetivo, Analizador y Perfil aparecen deshabilitados ("Próximamente").

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
    ├── skill-card.js   # Web Component <skill-card> (hoy sin uso en las vistas)
    ├── dashboard.js    # Vista Mi Ruta: fetch a la API, render y datos de ejemplo
    ├── mapa.js         # Vista Mapa Visual y navegación entre vistas
    └── mapa-3d.js      # Vista 3D del Mapa Visual (three.js)
vendor/
├── tailwind.js         # Tailwind Play CDN 3.4.17, copia local
└── three/              # three.js r170 para la vista 3D: three.module.min.js, LICENSE (MIT) y README con la versión
```

## Dependencias locales (`vendor/`)

Las librerías van copiadas en `vendor/` para que la app funcione sin internet y dentro del ejecutable (`scriptsuild-app.ps1` del backend copia `vendor` entero junto con `index.html`, `css`, `js` y `assets`). No se usa npm ni CDN en tiempo de ejecución.

- **three.js 0.170.0** (`vendor/three/three.module.min.js`, MIT): un solo archivo, módulo ES autónomo. Lo importa `js/mapa-3d.js` con `import()` solo cuando se elige la vista 3D, así la 2D no lo descarga.

Cómo actualizar three.js:

1. Elige una versión cuyo `build/three.module.min.js` no importe otros archivos (desde r171 el build se separa en `three.core.js` + `three.module.js` y harían falta los dos).
2. Descarga el paquete desde el registro de npm y comprueba su integridad (`dist.integrity` de `https://registry.npmjs.org/three`):

   ```bash
   curl -O https://registry.npmjs.org/three/-/three-0.170.0.tgz
   echo "sha512-$(openssl dgst -sha512 -binary three-0.170.0.tgz | base64 -w0)"   # debe coincidir con dist.integrity
   tar -xzf three-0.170.0.tgz package/build/three.module.min.js package/LICENSE
   ```

3. Reemplaza `vendor/three/three.module.min.js` y `vendor/three/LICENSE`, y anota versión, integridad y SHA-256 en `vendor/three/README.md`.
4. Prueba la vista 3D (alternar 2D/3D, girar, seleccionar, cambiar de tema) y revisa la consola: three.js cambia de API entre versiones.

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
