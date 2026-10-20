// Motivo de Ruta: el sello visual de Cenit, una línea punteada con puntos de control como la ruta de un GPS. Estilos
// en la sección "Motivo de Ruta" de styles.css. Todo es decorativo (aria-hidden): no entra en el orden de lectura ni en
// el de foco. Usa SKILL_STATE_CLASS (skill-status.js).
//   .route-rail + .route-stop  brechas de Mi Ruta unidas en vertical, un punto de control por brecha
//   .route-dest                destino al final del riel (el objetivo)
//   .route-divider             divisor corto con un punto en el extremo (Perfil, Ajustes, Analizador, Objetivo)
//   .route-glyph               tramo mínimo con su punto, dentro de los botones "Cambiar objetivo"
//   .route-draw                línea que se dibuja sola en estados vacíos y de carga (loop: se repite mientras carga)
//   .topnav-trail              estela del indicador del nav (positionNavIndicator en mapa.js)

// Clases del punto de control según el estado de la habilidad: punteado = pendiente, rosa→violeta = aprendiendo
function routeStopClass(status) {
  return `route-stop route-stop--${SKILL_STATE_CLASS[status] || "pending"}`;
}

// Destino del riel: marcador de diana y el nombre del objetivo (ya está en el h1, por eso va oculto a lectores).
// label va escapado; order es su turno en la entrada del riel (--i), justo después de la última parada visible.
function routeDestination(label, order = 0) {
  return `<div class="route-dest" style="--i:${order};" aria-hidden="true"><span class="route-dest-marker"></span><span class="route-dest-label">${label}</span></div>`;
}

function routeDivider() {
  return `<span class="route-divider" aria-hidden="true"></span>`;
}

// Mismo SVG que el botón "Cambiar objetivo" de Mi Ruta (index.html)
function routeGlyph() {
  return `<svg class="route-glyph" width="24" height="8" viewBox="0 0 24 8" aria-hidden="true" focusable="false"><path d="M0 4H14"/><circle cx="20" cy="4" r="4"/></svg>`;
}

// La línea punteada se revela con stroke-dashoffset sobre una máscara (el punteado no puede usar su propio dasharray
// para dibujarse). Cada SVG necesita su id de máscara.
let routeDrawCount = 0;

function routeDraw({ loop = false } = {}) {
  const id = `route-draw-mask-${++routeDrawCount}`;
  return `<svg class="route-draw${loop ? " route-draw--loop" : ""}" width="120" height="16" viewBox="0 0 120 16" aria-hidden="true" focusable="false">
    <mask id="${id}" maskUnits="userSpaceOnUse"><path class="route-draw-reveal" d="M4 8H100" pathLength="1"/></mask>
    <path class="route-draw-line" d="M4 8H100" mask="url(#${id})"/>
    <circle class="route-draw-dot" cx="108" cy="8" r="4"/>
  </svg>`;
}
