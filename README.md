# SKILLMAP-FRONTEND

Repositorio del frontend de SKILLMAP: un dashboard que muestra el nivel de preparación para un objetivo profesional y las brechas de habilidades prioritarias.

Hecho con HTML, [Tailwind CSS (CDN)](https://tailwindcss.com/docs/installation/play-cdn), JavaScript vanilla y un Web Component (`<skill-card>`). No requiere build ni `npm install`.

## Estructura

```
SKILLMAP-FRONTEND/
├── index.html          # Estructura HTML del dashboard
├── css/
│   └── styles.css      # Estilos personalizados (cards, sidebar, gauge)
└── js/
    ├── skill-card.js   # Web Component <skill-card>
    └── dashboard.js    # Fetch a la API y renderizado del dashboard
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
