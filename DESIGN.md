---
name: Cenit
description: GPS de carrera que traza la ruta de habilidades hacia un rol objetivo.
colors:
  pink: "#D95F8E"
  pink-soft: "#FCE8EF"
  pink-tint: "#FDEEF4"
  pink-line: "#F8DAE6"
  pink-line-hover: "#F1C4D6"
  mint: "#5FD9AA"
  mint-ink: "#34B583"
  mint-soft: "#E9F9F2"
  mint-line: "#D2F2E4"
  mint-line-hover: "#A9E6CC"
  ink: "#1F1F24"
  ink-2: "#3F3F46"
  ink-3: "#6E6A74"
  muted: "#8A8792"
  muted-2: "#A19DA6"
  faint: "#F2EEF1"
  line: "#F7EBF0"
  field: "#F7F6F8"
  page: "#FCF5F7"
  map-canvas: "#FBEFF3"
  white: "#FFFFFF"
  carbon: "#1F1D23"
  text-2: "#625E6D"
  text-mid: "#555162"
  text-2-page: "#524E5B"
  text-2-dark: "#B7BCD2"
  text-mid-dark: "#C6CBDE"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  numeral:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 300
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.66rem"
    fontWeight: 600
    letterSpacing: "0.1em"
rounded:
  badge: "5px"
  chip-sm: "0.55rem"
  button-soft: "0.7rem"
  chip: "0.9rem"
  field: "1rem"
  control: "1.1rem"
  tile: "1.25rem"
  card: "24px"
  pill: "9999px"
spacing:
  chip-gap: "0.7rem"
  grid-gap: "1.5rem"
  card-padding: "1.75rem"
  section-gap: "1.75rem"
  page-gutter: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0.9rem 1.6rem"
  button-light:
    backgroundColor: "{colors.white}"
    textColor: "{colors.pink}"
    rounded: "{rounded.button-soft}"
    padding: "0.7rem 1.25rem"
  button-outline:
    backgroundColor: "{colors.white}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.4rem"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  card-action:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  card-dark:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "1.6rem 1.5rem"
  goal-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "1.5rem 1.4rem 1.4rem"
  chip-mastered:
    backgroundColor: "{colors.mint-soft}"
    textColor: "{colors.mint-ink}"
    rounded: "{rounded.chip-sm}"
    padding: "0.5rem 0.8rem"
  chip-progress:
    backgroundColor: "{colors.pink-tint}"
    textColor: "{colors.pink}"
    rounded: "{rounded.chip-sm}"
    padding: "0.5rem 0.8rem"
  chip-missing:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.chip-sm}"
    padding: "0.5rem 0.8rem"
  input-search:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "3.4rem"
    padding: "0 1.4rem"
  textarea:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "1.1rem 1.25rem"
  nav-item:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "0.85rem 1.1rem"
  nav-item-hover:
    backgroundColor: "{colors.pink-soft}"
    textColor: "{colors.pink}"
  nav-item-active:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.white}"
  sample-tag:
    backgroundColor: "#FAF7F8"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  switch-on:
    backgroundColor: "{colors.mint}"
    rounded: "{rounded.pill}"
    width: "2.5rem"
    height: "1.4rem"
---

# Design System: Cenit

## Overview

**Creative North Star: "El GPS de Carrera"**

Cenit se lee como un GPS: siempre dice dónde estás, cuánto falta y cuál es el siguiente giro. El rosa marca el camino por recorrer y la acción siguiente; el menta marca el tramo ya recorrido. Todo lo demás es papel rosado muy claro y tarjetas blancas, para que esos dos colores hablen solos. Ninguna pantalla termina sin una acción clara en rosa.

El ánimo es **cálido, claro y alentador**. Nada intimida a quien busca su primer empleo ni le habla con condescendencia a un senior: los números son grandes y livianos (peso 300), los textos de apoyo son cortos y grises, y el progreso se celebra con menta, no con fanfarria. La densidad es aireada: tarjetas con 28px de padding, grillas con 24–28px de separación y un contenedor máximo de 1200px.

**Marca:** Cenit (antes SkillMap), con el slogan "Tu ruta hacia el cenit de tu carrera" (en: "Your route to the zenith of your career"). El logo es una estrella de brújula de 4 puntas cuya punta superior, más larga, marca el norte: el cenit al que lleva la ruta.

Los datos simulados se muestran siempre con la etiqueta "Datos de ejemplo" (borde punteado gris, punto gris). Esa etiqueta es parte del sistema visual: la honestidad de los datos se ve, no se esconde.

**Key Characteristics:**
- Dos voces de color con significado fijo: rosa = ruta y acción, menta = logro.
- Tarjetas blancas que levitan con una sombra rosada ambiental.
- Radios generosos: 28px en tarjetas, pastilla completa en botones.
- Números grandes y livianos con cifras tabulares, que cuentan desde 0 al aparecer.
- Movimiento corto con salida suave; todo respeta `prefers-reduced-motion`.

## Colors

Paleta de dos acentos con significado (rosa y menta) sobre neutrales tibios con un leve tinte rosado.

### Primary
- **Rosa Ruta** (pink): el camino y la acción. Botón principal, ítem activo del sidebar, gauge de preparación y match, barras de brechas, contorno de foco y la tarjeta "Siguiente giro". Es el único color que pide un clic.
- **Bruma Rosa** (pink-soft): fondos de hover (sidebar, controles del mapa, leyenda), la etiqueta "Objetivo actual" de las tarjetas de Objetivo y el fondo del ícono en tarjetas.
- **Tinte Rosa** (pink-tint), **Línea Rosa** (pink-line) y **Línea Rosa Viva** (pink-line-hover): fondo y borde de los chips "en desarrollo"; la línea viva es el borde de hover de chips y tarjetas de objetivo.

### Secondary
- **Menta Logro** (mint): lo dominado. Nodos dominados del mapa, barra "Habilidades dominadas", toggles encendidos, punto de la leyenda y demanda alta.
- **Tinta Menta** (mint-ink): texto menta legible sobre fondos claros (chips dominados, métricas de grupo).
- **Bruma Menta** (mint-soft), **Línea Menta** (mint-line) y **Línea Menta Viva** (mint-line-hover): fondo, borde y borde de hover de los chips dominados.

### Neutral
- **Tinta** (ink): títulos y texto principal; también el fondo de tooltips.
- **Tinta Media** (ink-2) y **Pizarra** (ink-3): texto secundario fuerte, etiquetas de leyenda y texto de chips "faltantes".
- **Gris Niebla** (muted) y **Gris Suave** (muted-2): textos de apoyo, subtítulos, placeholders y rótulos en mayúsculas.
- **Niebla** (faint): pistas de gauge y barras, divisores y el skeleton.
- **Línea de Tarjeta** (line): el borde casi invisible de toda tarjeta blanca.
- **Campo** (field): fondo del textarea del Analizador.
- **Papel Rosado** (page): fondo de la aplicación. **Lienzo de Mapa** (map-canvas): fondo del grafo, un tono más rosado.
- **Carbón** (carbon): la única superficie oscura, la tarjeta "Estadísticas de Carrera".

### Named Rules
**The Two Voices Rule.** El rosa significa "por hacer / siguiente paso" y el menta significa "logrado". No se intercambian ni se usan como decoración: un chip rosa nunca representa algo dominado.

**The One Pink Action Rule.** Cada pantalla tiene una sola acción principal en rosa sólido (Trazar mi ruta, Analizar compatibilidad); en Mi Ruta es "Ver cómo empezar" de la tarjeta Siguiente giro. Las acciones secundarias ("Ver más", "Reintentar", "Añadir clave") van en blanco con contorno o en rosa sobre blanco.

## Typography

**Display Font:** Plus Jakarta Sans (con ui-sans-serif, system-ui)
**Body Font:** Plus Jakarta Sans

**Character:** Una sola familia geométrica y amable que cubre todo, desde el número de 300 hasta el rótulo en mayúsculas de 700. La jerarquía sale del tamaño y del peso, nunca de una segunda fuente.

### Hierarchy
- **Display** (500, 1.9rem, 1.2): título de cada vista ("¿Cuál es tu próximo gran salto?", "Analizador de Vacantes", el objetivo actual en Mi Ruta).
- **Headline** (400, 1.75rem, 1.2): el nombre de la persona en Perfil.
- **Numeral** (300, 2.6rem, cifras tabulares): el valor dentro del gauge, con "%" en 1.2rem. Liviano a propósito: el número es grande, no pesado.
- **Title** (600, 1.05rem): títulos de tarjeta. El peso varía según el mockup de cada vista (500 en Perfil, 700 en Analizador y en las tarjetas de objetivo); se respeta el mockup.
- **Body** (400, 0.78–0.9rem, 1.55–1.6): subtítulos, descripciones y mensajes del gauge, con ancho máximo de unos 15–16rem en textos centrados.
- **Label** (600–700, 11px como mínimo, 0.06–0.12em, MAYÚSCULAS): rótulos de grupo, badges de urgencia, tags de proyecto y la etiqueta "Datos de ejemplo".

### Named Rules
**The Light Numbers Rule.** Los porcentajes y métricas grandes van en peso 300 con cifras tabulares; nunca en negrita. Lo que pesa es el color del anillo, no el número.

## Layout

La aplicación es solo de escritorio (ancho de diseño 1440px). Barra superior pegada arriba y un área de contenido de 1200px útiles, centrada, con 32px de margen lateral; la barra alinea marca, nav y acciones con ese mismo ancho.

### Rediseño visual (escala común)
Fuente única de tokens en `:root` de `css/styles.css` (iguales en los dos temas):
- **Espacios:** `--space-1…10` (4, 8, 12, 16, 20, 24, 32, 40px), `--card-pad` 32px, `--grid-gap` 24px, `--content-max` 1200px, `--page-gutter` 32px.
- **Radios:** `--radius-card` 24px (tarjetas), `--radius-tile` 20px (fichas internas, menús), `--radius-control` 14px (opciones de menú), `--radius-pill` (botones, chips).
- **Tipografía (ajustes R3):** la de la Introducción en toda la app, con la escala del rediseño. Plus Jakarta Sans local (`assets/fonts`, `@font-face` al inicio de styles.css, sin internet), en `--font-sans`. Pesos por papel: `--fw-display` 500 con `--ls-display` -.035em (título de vista 48px, nombre de Perfil 40px; con el degradado `--title-grad` del título de la Intro), `--ls-heading` -.025em para títulos grandes de tarjeta (36 y 28px, en 500); `--fw-title` 600 con `--ls-title` -.015em (título de tarjeta 22, de ruta 20, nombre de parada); `--fw-num` 300 con `--ls-num` -.03em para números grandes (Light Numbers Rule: anillo, %, totales, rachas); `--fw-strong` 700 para énfasis chico, botones y CTA; `--fw-nav` 600 en el nav. Tamaños sin cambio: `--fs-display` 48, `--fs-h2` 22, `--fs-row` 17, `--fs-body` 15, `--fs-sm` 14, `--fs-xs` 13, `--fs-label` 12.
- **Acabados (ajustes R3, del diseño anterior):** vidrio (`--glass-bg`, `--glass-bg-strong`, `--glass-border`, `--glass-blur`, `--glass-shadow(-sm)`) en el nav, los botones redondos de la barra, menús, filtros de Habilidades, búsqueda de Objetivo, chips y avisos; sin `backdrop-filter` o con transparencia reducida pasan a sólidos (`--glass-solid`). Tarjetas con velo claro arriba (`--card-sheen`) y filo de luz (`--card-edge`); botones de acción, opción de estado elegida, avatar y Siguiente giro con reflejo (`--btn-sheen`, `--btn-edge`) y halo (`--action-glow`, `--action-glow-hover`); tarjetas de Objetivo con `--card-glow-hover`; Ajustes activo en la barra con el gradiente de acción; badges de demanda en mayúsculas espaciadas (11px, .06em) con borde fino de su color (`--chip-line*`); parada dominada con halo menta (`--mint-glow`); trazo del anillo con brillo suave.
- **Controles:** `--hit` 44px de alto mínimo. Un solo botón con el gradiente de acción por vista (`.btn-pill`); el resto es `.btn-ghost` (contorno fino, 14/700) o `.btn-ghost--strong` para la acción de una tarjeta o de un aviso (Deshacer, Editar perfil).
- **Texto secundario:** `--text-2` (#625E6D claro, #B7BCD2 oscuro) para descripciones, porcentajes y apoyo; `--text-mid` un paso más fuerte (#555162 / #C6CBDE); `--text-2-page` (#524E5B) directo sobre el fondo de página. Mínimos medidos: 5.7:1 en claro sobre `--surface-2` y 7.9:1 en oscuro sobre la superficie más clara.
- **Grillas:** filas de una columna ancha y una de 360px (Mi Ruta, Perfil, Analizador); Objetivo y Ofertas para ti en rejillas de 3; Ajustes en dos columnas iguales del mismo alto (Apariencia | Idioma, con las dos opciones de idioma apiladas repartiendo el alto) y Seguridad a todo el ancho. Ajustes ya no muestra las ofertas de empleo ni las recalcula: el backend actualiza Arbeitnow y Remotive solo al abrir la app, y la atribución a las fuentes queda en Mi Ruta ("Basado en N ofertas reales · Remotive, Arbeitnow" y "Fuente:" en cada oferta) y en el panel de habilidad del Mapa.
- **Mi Ruta:** la preparación va sola en la primera fila, a todo el ancho y sin otra tarjeta al lado: el anillo grande (200px) a la izquierda ocupa dos filas; a su derecha, el título, el mensaje GPS y "X de N paradas dominadas" y, debajo, tras un divisor, la ruta del objetivo como el antiguo riel de Brechas (una parada por habilidad del objetivo en el orden de demanda, también las dominadas, que se quedan en su lugar en menta con ✓; punto de estado, nombre que abre el detalle de la habilidad y el destino con la diana al final; los puntos entran en orden, cada tramo punteado se traza hacia la siguiente parada y entre dos dominadas el tramo es menta continuo). Con más de 7 paradas se ve una ventana de 5 (las 2 dominadas más recientes y las siguientes pendientes, en su orden) y cada tramo oculto queda como un "+N" punteado en su lugar, que despliega la ruta entera. Siguiente giro cierra la vista, a todo el ancho, con el texto a la izquierda y "Ver cómo empezar" a la derecha.
- **Objetivo:** toda la tarjeta de una ruta es el botón para elegirla ("Elegir esta ruta →" siempre a la vista al pie; en hover y foco sube y el borde toma el rosa). Un toque elige la ruta al instante (la tarjeta dice "Guardando…" mientras tanto) y sale el aviso "Nuevo destino: X" con Deshacer. La página no se mueve: solo cambian la tarjeta del objetivo actual, la tarjeta tocada (en su hueco entra la ruta anterior, con un fundido) y el "en común" de las demás; la rejilla se mantiene en el mismo punto de la pantalla. "Otro objetivo" usa la misma tarjeta con borde punteado y "Próximamente" donde va el %, y ocupa las columnas que sobran en su fila para que la rejilla no deje huecos. La búsqueda usa la superficie, el borde y la tipografía de las tarjetas.
- **Encabezado de vista** (`.view-header`): título y bajada de 18px; sin rótulo encima salvo "Objetivo actual" en Mi Ruta.
- **Avisos con Deshacer** (`js/toast.js`, uno para toda la app): píldora chica de vidrio de 44px, ajustada al texto, en la esquina inferior derecha, con marca menta (el cambio quedó hecho), texto corto ("Nuevo destino: X", "React: Dominada") y "Deshacer" en texto rosa (32px a la vista, 44px de área). Sale tras cambiar de objetivo (Objetivo) y tras cambiar un estado (Habilidades y Tu semana en Mi Ruta). `role="status"`, primer hijo de `<main>` (Mayús+Tab desde la vista llega a Deshacer); se va sola a los 3 s, espera mientras el puntero o el foco están encima y Esc la cierra. Entra subiendo con un fundido y sale bajando (transform y opacity).
- **Tu semana · Brechas prioritarias:** la lista sigue el orden de las paradas de la ruta; una habilidad que pasa a Dominada conserva su lugar (en menta, con "Esta semana") y la siguiente brecha entra al plan en el lugar que le toca. Filas con 24px arriba y abajo; 12px entre el nombre con su etiqueta y la barra, y 20px entre columnas (habilidad, horas y selector).
- **Analizador sin análisis:** tarjeta con un dibujo SVG de tokens (la oferta con renglones y habilidades punteadas, un tramo con su punto de control y el anillo vacío con chips punteados) que entra por partes, y la invitación "Pega una oferta para empezar".
- **Movimiento:** solo transform y opacity con `--ease-out` y `--dur-fast` / `--dur` / `--dur-slow`: cada vista entra con un fundido corto, las tarjetas suben escalonadas, las barras crecen desde la izquierda (`scale`), el indicador del nav se desliza y se estira con transform, los menús bajan desde su esquina, la opción de estado elegida late una vez, botones y círculos de la barra suben 1px en hover y se encogen al pulsar, y las filas de Habilidades y Tu semana toman un velo suave en hover. El anillo y la tendencia se trazan con `stroke-dashoffset`. Cuando un dato cambia y la vista se repinta (estado de una habilidad, objetivo, meta semanal), el anillo, los números y las barras de Mi Ruta, Tu ritmo, Objetivo, Habilidades y Perfil van del valor anterior al nuevo en 800ms con `--ease-out` en vez de saltar o volver a empezar desde 0 (`js/motion.js`, atributo `data-motion`); al cambiar de objetivo, Mi Ruta no muestra skeleton: lo anterior se atenúa y lo nuevo entra con un fundido de 300ms escalonado 40ms. Las marcas de estado (punto de la ruta, marca de Tu semana, nodo del Mapa) laten una vez (420ms, escala y opacidad) al cambiar, y el proyecto o enlace recién guardado en Perfil entra con un fundido de 320ms. Hover de controles sin borde propio: el mismo velo (`--hover-bg`), radio (`--hover-radius`) y margen (`--hover-pad`). Tras iniciar sesión, Acceso se funde en 450ms sobre la app, que ya se pinta debajo: la barra superior baja 10px con fundido, las tarjetas suben escalonadas y el anillo cuenta desde 0; al terminar sale el aviso "Hola de nuevo, {nombre}" (solo en un inicio de sesión explícito; no al crear la cuenta ni al reabrir). Con la sesión guardada solo hay un fundido de 250ms. La app de escritorio abre con su propia pantalla (`cenit-desktop/loading.html`): "Cenit" se revela de izquierda a derecha con `clip-path` (900ms), la estrella entra a su lado con giro corto y escala 0.6 → 1 y un brillo suave, luego "Preparando tu ruta…" con una barra fina; si el backend tarda, la estrella late suave; al estar lista, fundido de 300ms hacia la app (1,45 s como mucho si el backend ya respondió). Con `prefers-reduced-motion` o "Reducir animaciones" no queda ninguna animación ni transición (salvo el fundido de 120ms del cambio de vista).
- **Fondo con patrón (R4):** una capa fija detrás de todas las vistas (`.bg-pattern`, primer hijo de `<body>`; la Introducción y Acceso la tapan con su propio fondo), sobre el degradado y los halos de esquina. En oscuro es la rejilla de puntos de la Introducción (`--dot-grid` de 36px con `--map-dot`, el mismo token que usa `.intro::before`); en claro, estrellas de Cenit (la del logo, con el norte arriba) de 9 y 6px en un paso de 64px, en rosa→violeta muy suave. Cerca del cursor (radio `--pattern-radius`, 160px, con caída ease-out) los puntos y las estrellas crecen y toman el rosa→violeta; el halo llega rápido, frena al final y se funde al salir el puntero de la ventana. `js/fondo.js`: un solo `pointermove` pasivo con `requestAnimationFrame` y solo `transform` (sin repintado ni layout). Se apaga sobre el lienzo del Mapa (tiene su propia rejilla), con un botón apretado (arrastre), con la pestaña oculta y con la Introducción o Acceso abiertos. Con movimiento reducido queda solo el patrón quieto; en alto contraste e impresión no hay capa. Alfas tope: con un punto o estrella iluminado bajo una letra, el texto secundario sigue ≥4.4:1.

## Elevation & Depth

Levitación suave. Las superficies blancas flotan sobre el papel rosado con una sombra rosada muy difusa y ambiental, que no marca estructura. Un borde casi invisible (line) define el borde. En hover, lo que se puede tocar sube 1–3px y su sombra se alarga en su propio color. Las superficies de color (siguiente acción, estadísticas, nodos del mapa, botón principal) llevan una sombra más profunda de su mismo tono.

### Shadow Vocabulary
- **Levitación** (`0 1px 2px rgba(217,95,142,.04), 0 14px 34px rgba(217,95,142,.05)`): toda tarjeta blanca y las tarjetas de objetivo en reposo.
- **Levitación alta** (`0 1px 2px rgba(217,95,142,.04), 0 18px 38px rgba(217,95,142,.1)`): tarjeta de objetivo en hover o foco.
- **Halo de acción** (`0 10px 22px rgba(217,95,142,.3)`): botón principal y el ítem activo del sidebar; en hover `0 14px 26px rgba(217,95,142,.36)`.
- **Superficie de color** (`0 18px 36px rgba(217,95,142,.28)` en rosa, `0 18px 36px rgba(31,29,35,.25)` en carbón): la siguiente acción y las estadísticas.
- **Flotante neutra** (`0 4px 14px rgba(16,16,20,.06)`): controles y leyenda del mapa sobre su lienzo.

### Named Rules
**The Tinted Shadow Rule.** Las sombras se tiñen del color de la superficie que las proyecta (rosa bajo rosa, menta bajo menta, carbón bajo carbón). El gris neutro queda para piezas chicas que flotan (perilla del toggle, tooltips, el "+" de Otro objetivo) y para los controles sobre el lienzo del mapa.

## Shapes

Formas redondeadas y generosas, sin esquinas vivas. Las tarjetas grandes usan 28px (1.75rem); las tarjetas clicables en grilla (objetivos) usan 20px; los controles (sidebar, buscador) 1.1rem; los campos 1rem; los chips entre .55rem y .9rem según su tamaño. Botones, etiquetas, toggles, nodos del mapa y la leyenda son pastillas o círculos completos. Los bordes son de 1px y casi invisibles; el punteado se reserva para lo que aún no existe o no se tiene (chips "faltantes", nodos "por aprender", "Otro objetivo", "Datos de ejemplo").

**The Dashed Means Not-Yet Rule.** El borde punteado significa "todavía no": habilidad faltante, opción próximamente o dato simulado. No se usa como decoración.

## Components

Suaves y táctiles: todo lo que se toca responde al hover y al clic sin brusquedad.

### Buttons
- **Shape:** pastilla completa (9999px).
- **Primary:** Rosa Ruta con texto blanco en 700, 0.9rem 1.6rem, con el halo de acción.
- **Hover / Active / Focus:** sube 1px y el halo crece; al presionar baja y escala a .98 en 60ms; foco con contorno Tinta de 2px, porque el rosa no se ve sobre rosa.
- **Light:** blanco con texto rosa y radio de 0.7rem, sobre la tarjeta rosa, con sombra oscura. **Outline:** blanco, texto gris y borde de 1.5px.
- **Deshabilitado / Próximamente:** no sube. El hover solo aclara el tono y el clic hace un "no" lateral corto (±3px).

### Chips
- **Dominado:** Bruma Menta, borde Línea Menta y texto Tinta Menta.
- **Aprendiendo:** Tinte Rosa, borde Línea Rosa y texto rosa.
- **Faltante:** blanco con borde punteado gris y texto Pizarra.
- **Hover:** sube 1px y el borde pasa a su línea viva. No son clicables: el cursor no cambia.

### Cards / Containers
- **Corner Style:** 28px (1.75rem).
- **Background:** blanco; variantes de color en Rosa Ruta (siguiente acción) y Carbón (estadísticas).
- **Shadow Strategy:** Levitación (ver Elevation & Depth).
- **Border:** 1px Línea de Tarjeta.
- **Internal Padding:** 1.75rem.
- **Entrada:** suben 12px con fundido en 420ms, escalonadas en orden de lectura.

### Inputs / Fields
- **Buscador:** blanco, radio 1.1rem y 3.4rem de alto, con lupa gris. Con foco toma un anillo rosa de 2px y la lupa pasa a rosa.
- **Textarea:** fondo Campo, sin borde y radio 1rem. En hover el fondo baja un tono; con foco pasa a blanco con anillo rosa de 2px.
- **Toggle:** pastilla de 2.5rem; encendido en Menta Logro. La perilla se desliza con salida suave y se estira al presionar.

### Navigation
- **Barra superior:** estrella + "Cenit", seis secciones de solo texto en la píldora del nav (Objetivo · Mi Ruta · Mapa · Habilidades · Analizador · Perfil; Habilidades junto al Mapa: son el mismo catálogo como grafo y como lista), y a la derecha el botón de Ajustes y el menú de la cuenta: un círculo de 44px con la inicial (`aria-haspopup="menu"`) que abre nombre, correo, "Ver mi perfil" y "Cerrar sesión"; flechas, Inicio y Fin recorren las opciones y Esc lo cierra devolviendo el foco. Entre Ajustes y el avatar, el botón de tema (44px, el mismo círculo que Ajustes): "Modo oscuro" con `aria-pressed`, luna en claro y sol en oscuro; cambia el tema al instante con la misma preferencia que Ajustes > Apariencia. Ajustes activo se marca con contorno rosa, no con el gradiente, para no competir con el botón principal de la vista.
- **Sidebar:** blanco y fijo. Ítems de 0.9rem en 600 y gris, con radio de 1.1rem. En hover, Bruma Rosa con texto rosa; el activo va en Rosa Ruta con texto blanco y halo de acción. Por debajo de 640px quedan solo los íconos.

### Gauge
Anillo de 160px con trazo de 18 sobre pista Niebla, en Rosa Ruta. Al aparecer, el anillo se llena desde vacío y el número cuenta desde 0 a la par (3 × `--dur-slow`, 750ms). Es el mismo componente en Mi Ruta (200px) y en el Analizador (160px).

### Historial del Analizador
Tarjeta blanca bajo el resultado, con medidas en múltiplos de 8px. Cada análisis es una fila (borde Línea de Tarjeta, radio 16px) con el % de entonces en una pastilla rosa, el título y la fecha con la hora (sin el motor que lo analizó), y una papelera a la derecha. Al abrir uno, el resultado se recalcula con el progreso actual y lo encabeza un aviso azul informativo ("Resultado recalculado con tu progreso actual" + "Analizado el 7 nov 2026 · 15:54. En ese momento: 57%."); la fila abierta queda en Tinte Rosa con borde rosa. Borrar uno o "Borrar historial" se confirma en el lugar (fondo rosa claro, "Sí, borrar" con contorno y "Cancelar"), porque no se puede deshacer. Vacío con el Motivo de Ruta; carga con la línea en bucle; error con borde rosa punteado y "Reintentar".

### Ofertas para ti (Mi Ruta)
Tarjeta blanca en la columna ancha de Mi Ruta, entre Brechas Prioritarias y Tendencia, con medidas en múltiplos de 8px. Título neutro ("Ofertas para ti") y pista "Ordenadas por encaje"; la única expresión GPS está en el estado vacío ("…encajen con tu destino"). Muestra 5 ofertas y "Ver más (n)" (botón con contorno) despliega hasta 10; el foco pasa a la primera nueva. Cada oferta es una fila (borde Línea de Tarjeta, radio 16px) como las del historial del Analizador:
- **% de encaje** en pastilla rosa de 64×40 a la izquierda (cifras tabulares). La pastilla es `aria-hidden`; el lector oye "Encaje: n%".
- **Título** (700, .9rem) que enlaza a la oferta original en una pestaña nueva (`target="_blank" rel="noopener noreferrer"`), con ícono de enlace externo y el aviso "(se abre en otra pestaña)" solo para lectores. Hover en azul de enlace subrayado.
- **Meta**: empresa · "Fuente: Remotive/Arbeitnow" (en 600, siempre visible: Remotive exige citar la fuente y enlazar la original) · fecha de publicación.
- **Chips** de 24px y radio 8px: menta (la tienes), rosa→violeta sólido `--progress-bg` con texto blanco (aprendiendo) y punteado gris (pendiente). Dos listas con nombre accesible ("Habilidades que ya tienes" / "…que te faltan"); el estado de cada faltante se lee entre paréntesis.
- **"Analizar con IA"**: botón secundario con contorno, a la derecha. Lleva el texto al Analizador ya pegado, con un aviso azul ("Oferta pegada: …"), pero no analiza: el usuario decide cuándo gastar cuota. Mientras pide el texto dice "Abriendo…"; si falla, el error sale en rosa bajo los chips.

Entrada: las filas suben 8px con fundido (320ms, escalonadas 40ms) solo al cargar o al mostrar las de "Ver más"; sin animación con movimiento reducido. Carga con la línea del Motivo de Ruta en bucle; vacío con el Motivo de Ruta; error con borde rosa punteado, `role="alert"` y "Reintentar". Se vuelve a pedir al cambiar el estado de una habilidad, el objetivo o el idioma, y nunca muestra datos simulados.

### Tu semana (Mi Ruta)
Primera parte de la tarjeta "Tu semana · brechas prioritarias", en la columna ancha (`js/plan-semanal.js`, la pinta `renderBrechas`). Como pista, las fechas de la semana (lunes a domingo). Una sola expresión GPS, en la entrada: "Tus próximas paradas, por demanda del mercado: primero las que ya estás aprendiendo."
- **Plan:** 3 brechas del objetivo por hacer, primero las que están en Aprendiendo y dentro por demanda. Se arma el primer día que se abre Mi Ruta en una semana nueva. El avance sale solo del estado (no hay casilla): una habilidad que pasa a Dominada baja al final con su marca y "Esta semana" en lugar de las horas, y entra la siguiente brecha.
- **Fila (tabla, divisor de 1px entre filas):** marca de estado de 24px (punteada = pendiente, rosa→violeta = aprendiendo, menta con marca = dominada; decorativa), nombre (17/700, abre el detalle) con su nivel de demanda, barra de 6px con el % real y "% de las ofertas · categoría" en 13px, horas sugeridas ("≈ 3 h"; el lector oye "3 horas sugeridas esta semana") y el selector Pendiente / Aprendiendo / Dominada.
- **Pie:** "1 dominada esta semana · ≈ 7 h para lo que falta" y la regla de horas: más demanda, más horas; una menos si ya la estás aprendiendo.
- **Cambio de estado:** la fila cambia al instante y se guarda; `#ruta-live` lo anuncia y Mi Ruta se recarga sin skeleton ni entrada (`.ruta-grid.is-quiet`). El foco vuelve a la opción elegida. Si el backend falla, vuelve al estado anterior con el error en la fila.
- **Vacíos:** sin brechas, el Motivo de Ruta con "Llegaste a tu destino: no te quedan brechas en {objetivo}…"; con todo el plan dominado y sin brechas nuevas, "Dominaste todo lo que te faltaba para {objetivo}: llegaste a tu destino."

### Tu ritmo (Mi Ruta)
Tarjeta en la columna angosta, junto a Tu semana (`js/rachas.js`). Solo cuentan las habilidades del objetivo actual (tu ruta), como en "Este mes".
- **Esta semana:** el número grande (28/800) "1 de 2" sobre tramos de 8px, uno por avance de la meta: menta = dominada, rosa→violeta = aprendiendo, pista vacía = todavía no. Pasada la meta el número se queda en la meta ("2 de 2", nunca "5 de 2") y la nota dice "Meta cumplida, con N de más." Si la meta se cumplió solo empezando habilidades (ninguna dominada esta semana), la nota dice "Meta cumplida: empezaste N habilidades de tu ruta. Tu preparación sube cuando las domines.", para que un 0 % de preparación no la contradiga.
- **Meta semanal:** rótulo y "habilidades por semana" a la izquierda; a la derecha − / + (botones redondos de 44px; al llegar a 1 o a 10 quedan `aria-disabled` sin perder el foco) con el número. Cambiarla se anuncia en `#ruta-live` y solo afecta a la semana en curso.
- **Rachas:** racha actual y mejor racha en dos columnas (28/800). Sin racha: "Aún sin racha: cumple la meta esta semana para empezar una."; con racha y la semana sin cumplir: "Cumple la meta esta semana para llevarla a N semanas."
- **Este mes:** "N dominadas" en grande y la barra del objetivo entero: dominadas antes, dominadas este mes y lo que falta punteado, con su leyenda y "3 de 7 dominadas en {objetivo}". Sin dominadas este mes: "Aún no dominas ninguna este mes. Tu siguiente giro: {habilidad}."
- **Movimiento:** las barras se revelan de izquierda a derecha (`bar-fill`) con la entrada de la tarjeta; nada con movimiento reducido ni en la recarga silenciosa.

### Nodo del Mapa
Círculos de 112px: menta sólido (dominado), rosa sólido (en desarrollo) o blanco con borde punteado (por aprender), cada uno con sombra de su color. En hover o foco suben 3px y crecen un 4%. Al pasar por la leyenda, los nodos de los otros estados bajan a .22 de opacidad.

### Mapa Visual: solo 2D
El Mapa es solo el grafo 2D (nodos, ruta sugerida, panel de detalle con el selector de estado, zoom y arrastre). Arriba a la derecha de la tarjeta, un enlace pequeño "Ver mis habilidades como lista" (píldora de 40px con el fondo del nav, ícono de lista y texto `--text-mid` de 13px, rosa en hover) lleva a la vista Habilidades con el foco en su título.

**Consejo de primera vez:** una línea sobre el mapa y el panel ("Cada punto es una habilidad. Toca uno para cambiar su estado."), con un punto de `--map-route` y un botón cerrar (`aria-label`). Al cerrarlo no vuelve (`localStorage`) y el foco pasa al nodo activo del mapa.

### Habilidades
Vista propia del nav, junto al Mapa: el catálogo completo como lista, ordenada y ligera, para quien prefiere leer en vez de recorrer el mapa (`js/habilidades.js`). Medidas en múltiplos de 8px.

- **Encabezado:** título de página ("Tus habilidades", con el degradado de los títulos) y subtítulo. Debajo, el **resumen**: "4 dominadas · 3 aprendiendo · 13 pendientes", cada número grande y liviano (24px, 300, cifras tabulares) con el círculo de su estado y la palabra en 15px. Bajo el resumen, una barra de proporciones de 8px (máx. 480px): menta (`--mastered-bg`) y rosa→violeta (`--progress-bg`) sólidos y lo pendiente como línea punteada del Motivo de Ruta ("todavía no"). La barra es decorativa (`aria-hidden`); la lista del resumen dice los números.
- **Filtros:** una sola fila, en la píldora del nav (`--nav-bg`): Todas · Dominadas · Aprendiendo · Pendientes, botones de 40px y 14px/600, el elegido con `--toggle-on-*`. `aria-pressed`; el filtro dura la sesión del navegador (`sessionStorage`). Si no caben (pantallas angostas) se desplazan en horizontal, sin pasar a dos filas. Sin contadores: los números ya están en el resumen.
- **Pista única:** al lado de los filtros (debajo si no cabe), en `--text-2-page`: "Toca el nombre de una habilidad para saber de qué trata. Para cambiar tu estado, toca Pendiente, Aprendiendo o Dominada." (también es la descripción accesible de cada nombre).
- **Agrupación (feat/habilidades-agrupadas):** "Agrupar por: Categoría | Estado" a la derecha de los filtros, el mismo control segmentado, recordado por usuario (`localStorage`). Por categoría (por defecto): las categorías de la API en el orden de los clusters del Mapa; cada encabezado muestra el nombre (20px/600), "N de M dominadas" (14px/600, `--text-2`) y una mini barra de 104×8px con las Dos voces (menta, rosa→violeta y lo pendiente punteado `--route-dash-x`); el chip de categoría de la fila se oculta porque ya está en el encabezado. Por estado: Dominadas, Aprendiendo y Pendientes, en ese orden, con "N habilidades". Dentro de cada grupo, por demanda. Los grupos no son tarjetas: van dentro de la tarjeta de la lista, separados por 24px de espacio y una línea fina (`--card-border`). El encabezado es un botón de 44px (`aria-expanded`, `aria-controls`, chevron que gira) que pliega el grupo con `grid-template-rows` 0fr ↔ 1fr y opacidad (250ms); plegado queda `inert`. Todos abiertos salvo que haya más de 6 grupos o 30 habilidades: entonces solo los que tienen habilidades de tu ruta. Con un filtro, los grupos sin filas no se muestran. Agrupada por estado, la fila que cambia de estado pasa a su grupo nuevo (que se abre si estaba plegado), entra con un fundido de 320ms y queda a la vista con el foco en su selector.
- **Fila (64px, como una tabla):** nombre (botón con aspecto de enlace, 15px/600, rosa subrayado en hover) que abre el contexto; demanda como barra de 6px en `--chart-demand` (azul: neutral frente a las dos voces) con el % en 13px/600; indicador de estado: círculo de 10px (punteado = pendiente, `--progress-bg` = aprendiendo, `--mastered-bg` = dominada), etiqueta de 13px y flecha, con contorno suave (`--card-border`, 152px mínimo para que las flechas se alineen); en hover o abierto, fondo `--surface-2` y borde `--pink-line-hover`. Entre filas, un divisor de 1px. El `aria-label` dice habilidad y estado.
- **Selector:** popover pequeño (176px, radio 16px, superficie sólida y sombra de tarjeta) anclado al indicador, con las tres opciones en columna (círculo + texto; la elegida en negrita con fondo `--surface-2`). Flota sin desplazar nada (la tarjeta con el popover abierto sube de capa); si abajo no cabe en la ventana se abre hacia arriba, y si se saldría por la derecha se alinea con el final del indicador. Enter, Espacio o ↓ lo abren con el foco en la opción actual; las flechas mueven el foco; Enter, Espacio o clic eligen; elegir o Esc lo cierran y devuelven el foco al indicador; Tab o un clic fuera lo cierran sin repintar la lista, así el foco o el clic llegan a su destino.
- **Cambio de estado:** la fila y el resumen cambian al instante (si el filtro ya no incluye la fila, sigue a la vista hasta cambiar de filtro), `#habilidades-status` lo anuncia ("Testing: Aprendiendo.") y Mapa, Mi Ruta y Perfil se actualizan. Si el backend falla, vuelve al estado anterior con el error en la fila (`role="alert"`).
- **Detalle y vuelta:** el nombre abre el detalle de habilidad ("Volver a Habilidades"). Al volver, el foco regresa al nombre de esa fila, también si el estado cambió en el detalle (la fila sigue a la vista aunque el filtro ya no la incluya) y cuando llegan los datos nuevos.
- **Estados:** carga con la línea del Motivo de Ruta en bucle; vacío por filtro en una tarjeta con el Motivo de Ruta y voz de GPS ("No te queda ninguna pendiente: llegaste a destino."); error con el aviso de la API. La nota "Datos de ejemplo" va bajo las tarjetas mientras alguna demanda sea sembrada.
- **Movimiento:** las tarjetas entran escalonadas (`card-in`, 50ms entre ellas) y la barra del resumen se llena (`bar-fill`) solo al pintar con datos nuevos; cambiar de filtro o de estado no repite la entrada. Sin animaciones ni transiciones con movimiento reducido.
- **Angostas (<768px):** nombre y demanda en dos líneas, el indicador a la derecha y sin rótulos de columna.

### Mis Habilidades (Perfil)
Resumen corto a todo el ancho bajo la cabecera de Perfil, en una fila: título "Mis Habilidades" y el mismo resumen de la vista Habilidades (sin barra) a la izquierda, y a la derecha el botón con contorno "Ver todas mis habilidades →", que abre Habilidades con el foco en su título. La lista completa ya no vive en Perfil.

### Mapa de glifos de la Introducción
Ilustración decorativa en canvas 2D (`js/intro-glifos.js`) en la columna derecha de la Introducción (lienzo de 560×400, sobresale 20px a cada lado de la columna, sobre el resplandor `--intro-halo`). Datos de ejemplo decorativos, sin API; el canvas es `aria-hidden` y el significado está en los textos de las slides.

- **Disposición:** como el Mapa de la app: 10 discos en clusters por categoría (Frontend, Backend, Datos, DevOps, Móvil, Calidad) unidos por conexiones punteadas muy tenues (`--line-dashed`, Motivo de Ruta). Tres capas de profundidad: los discos lejanos son más pequeños y tenues. Cada disco es una habilidad de ejemplo con su % de demanda (React 78, TypeScript 88, Next.js 71, SQL 41, Testing 69 y Docker 54, del grafo anterior de la Introducción; Java 64, Spring Boot 38, Kubernetes 33 y Kotlin 22).
- **Disco:** retícula hexagonal apretada recortada en círculo (~230–460 glifos por disco, ~3700 en total): punto, asterisco, triangulito y "Y". Núcleo luminoso desplazado hacia la luz (arriba a la izquierda) con 10 tonos hacia el borde, borde definido y halo suave del color del estado.
- **Estado por color:** menta = dominada, rosa→violeta (`--progress-bg`) = aprendiendo, gris con glifos huecos (anillo y triángulo hueco) = por aprender, tenue pero legible. Coincide con la leyenda.
- **Tema:** colores de los tokens. Claro: colores saturados y oscuros (menta media a `--mint-ink`), glifos más grandes y opacos, borde nítido, mezcla normal y halo leve. Oscuro: núcleo aclarado hacia el blanco, mezcla aditiva (`lighter`) y halo más fuerte.
- **Vida:** destellos suaves de glifos sueltos (~30 fps) y discos que respiran un 2,5 %.
- **Cursor:** parallax por capas (hasta 10px la más cercana); los glifos a menos de 56px del cursor se encienden y crecen con caída suave; el disco bajo el cursor refuerza su halo y sus conexiones pasan a `--map-route`, los demás bajan de brillo, y aparece una etiqueta pequeña con su categoría (11px, mayúsculas, píldora con `--surface-solid`). Al salir, todo vuelve con easing.
- **Slides** (transición de 750ms con la curva `--ease-out`):
  - **1 · Mapa de habilidades:** el mapa entero.
  - **2 · Demanda real:** cada disco crece y brilla según su demanda (más demanda, más grande y brillante) y muestra una etiqueta con la habilidad y su % (11px, % en `--chip-azul-fg`). Los % cuentan de 0 al valor en 700ms, escalonados; las etiquetas entran con fundido y, si dos se pisarían, una se desplaza (más abajo o encima del disco). Al salir se desvanecen.
  - **3 · Análisis con IA** (bucle de 6 s): una oferta aparece abajo a la izquierda como una tarjetita con tres líneas simuladas; un haz de `--map-route` la escanea; líneas punteadas fluyen desde la oferta hacia los discos que coinciden (React, TypeScript, SQL y Docker), que laten uno tras otro; "Compatibilidad 72%" (`intro.match`) cuenta hacia arriba sobre la oferta; los demás discos bajan de brillo.
- **Teclado:** la cabecera de la Introducción solo muestra "Omitir (Esc)"; los demás atajos funcionan sin pista visible (`aria-keyshortcuts` en el grupo de slides). ← → cambian de slide (el avance automático sigue); Espacio detiene o reanuda el reloj de la escena (titileo, conteo y análisis) y el avance, y lo anuncia `#intro-live`, salvo con el foco en un botón, enlace o campo, donde Espacio activa el control; Esc, Empezar y Omitir cierran como siempre. Con movimiento reducido Espacio no hace nada (no hay animación que pausar).
- **Movimiento reducido:** dibujo estático (sin titileo, respiración, parallax ni transiciones). Slide 2 con los % finales; slide 3 en su estado final (líneas punteadas fijas, discos que coinciden resaltados y 72%). El resalte por hover es un cambio instantáneo.
- **Rendimiento:** cada glifo × tono se dibuja una vez en un sprite y cada disco en reposo en su propio bitmap (a 1,3× para que no se vea borroso al crecer). Por cuadro se copian 10 bitmaps y solo se redibujan sueltos los glifos que destellan o están cerca del cursor (~1 ms por cuadro). DPR ≤ 2; solo pide cuadros si algo se mueve y ninguno con la pestaña oculta; `ResizeObserver` para el tamaño. Al salir de la Introducción se quitan listeners, observer y bucle.
- **Respaldo:** si el canvas no puede dibujar (`.intro-map.is-static`), queda el resplandor estático sobre la rejilla de puntos.

### Logo (estrella de Cenit)
Estrella de brújula de 4 puntas con los flancos curvados hacia dentro; la punta de arriba es la más larga (el norte). Una sola definición en `js/brand.js` (`brandMark(size)`, `BRAND_NAME`); el path lleva la clase `.brand-star`, con el origen de transformación en su centro para girarlo.
- **Relleno:** degradado a 135° de `--brand-from` a `--brand-to`. En claro es el degradado de acción (`--action-from` #BE3A72 → `--action-to` #3F63D8); en oscuro, el rosa→violeta de los gráficos (#D95F8E → #A78BFA), porque el violeta→azul de acción no llega a 3:1 sobre el fondo oscuro.
- **Tamaños:** 32px en la barra superior, Introducción y Acceso (caja de 40px con sombra de acción); 24px y sin sombra en el CV imprimible.
- **Con el nombre:** siempre junto a "Cenit" (700, 18px, sin mayúsculas completas), así que el logo es decorativo (`aria-hidden`). En la Introducción lleva el slogan debajo (12px, 500, texto secundario); en Acceso va solo, porque el slogan es el título grande de la pantalla.
- **Aguja (barra superior):** la punta de arriba apunta al ítem activo del nav (o a Ajustes) y gira al cambiar de sección (400ms, `--ease-out`, rebote corto de aguja). El ángulo sale de las posiciones del logo y del ítem, medido contra un horizonte virtual a la distancia del centro del nav (el centro queda a 45°). Con hover o foco en otro ítem se inclina un tercio del camino hacia él, 10° como mucho (180ms). Sin ítem activo (detalle de habilidad) apunta al norte. `pointBrandNeedle()` en `js/brand.js`, llamada desde `positionNavIndicator` (mapa.js).
- **Búsqueda (Introducción y Acceso):** oscila unos grados (barridos de 400ms con pausas, ciclo de 4s, `brand-search`). Al enviar el formulario de Acceso se detiene y vuelve al norte con el rebote; si el envío falla, sigue buscando (`setBrandSearchFound`).
- **Animaciones reducidas:** quieta, sin giro ni oscilación. Solo se anima `transform`.
- **Favicon:** `assets/cenit-star.svg`, la misma estrella con colores fijos (los del tema oscuro si el navegador está en oscuro).

### Reglas de la guía de UX (heurísticas de Nielsen)
- **Un vocabulario de estado:** Dominada · Aprendiendo · Pendiente en todas las vistas (mapa, leyendas, chips, filtros, Analizador y estadísticas).
- **Mayúscula solo al inicio** en títulos y botones en español ("Brechas prioritarias", "Editar perfil"); los nombres de sección del nav (Mi Ruta, Mapa Visual) son nombres propios.
- **Títulos que dicen qué es la vista** ("Ajustes", no una metáfora) y sin rótulo encima del título.
- **Números con su significado:** una barra de demanda mide el % real de ofertas que dice su texto; un valor relativo ("Demanda baja") va con la comparación que lo explica.
- **Botones solo con ícono** (tema, Ajustes, zoom del mapa) llevan `title` además de `aria-label`.
- **Errores de carga:** qué pasó, "Reintentar" con contorno y el detalle técnico plegado en un `<details>`.
- **Seguridad en Ajustes:** cambiar contraseña y eliminar cuenta van en una tarjeta a todo el ancho al final de Ajustes, con las demás preferencias de la cuenta; Perfil queda para lo que se muestra de ti.
- **Contraseñas nuevas** (Acceso y Seguridad en Ajustes): requisitos visibles desde el inicio que se marcan en menta al cumplirse, incluida la coincidencia al repetirla.

### Acceso (iniciar sesión / crear cuenta)
Pantalla completa sin barra superior (`js/acceso.js`), en dos columnas centradas (máx. 1120px; una sola columna por debajo de 900px):
- **Izquierda:** el slogan como título grande (600, `clamp(3rem…4.6rem)`, tres líneas; solo la del medio, "hacia el cenit", en `--title-grad`), un párrafo de qué hace Cenit (18px, `--text-2-page`, máx. 30em) y el enlace "Ver cómo funciona", que vuelve a la Introducción (al cerrarla se regresa a Acceso). Sin rótulo encima del título.
- **Derecha:** tarjeta de 440px y 36px de padding: título sólido (26px, 700), subtítulo, alternancia Iniciar sesión / Crear cuenta, campos con rótulo en mayúsculas (12px, 700, .08em) y placeholder de ejemplo ("nombre@correo.com"), botón de acción a todo el ancho y una nota de 13px centrada debajo (qué se guarda y dónde).
- **Prevención y recuperación de errores:** cada error sale debajo de su campo (`aria-describedby`, `aria-live`) con el arreglo en el texto ("Falta el dominio. Ejemplo: nombre@correo.com"); el correo se revisa al salir del campo y el error se quita en cuanto queda bien. Al crear cuenta, el requisito "Al menos 8 caracteres" se ve desde el inicio y se marca en menta mientras se escribe. Aviso de Bloq Mayús en azul informativo. Los errores que no son de un campo (credenciales, conexión) van sobre el botón.
- **Pie:** línea divisoria y "© 2026 Cenit · Proyecto académico" (13px, centrado).

### Etiqueta "Datos de ejemplo"
Pastilla con borde punteado, fondo casi blanco, punto gris y texto Pizarra en 10px, mayúsculas y 700. Acompaña a todo dato que no viene de la API real; sobre superficies oscuras usa su variante carbón.

## Do's and Don'ts

### Do:
- **Do** reservar Rosa Ruta (#D95F8E) para la acción y el camino por recorrer, y Menta Logro (#5FD9AA) para lo dominado.
- **Do** usar el radio de 1.75rem, el borde Línea de Tarjeta y la sombra Levitación en toda tarjeta blanca nueva.
- **Do** marcar todo dato simulado con la etiqueta "Datos de ejemplo".
- **Do** mostrar el foco con un contorno rosa de 2px (3px de separación en tarjetas, 2px en controles chicos) y Tinta sobre botones rosa.
- **Do** animar con salida suave (`cubic-bezier(.16,1,.3,1)`), entradas de unos 420ms, y ofrecer siempre la versión sin movimiento para `prefers-reduced-motion`.
- **Do** seguir los mockups de `docs/mockups/` para layout y jerarquía de cada vista.

### Don't:
- **Don't** usar el rosa para algo dominado ni el menta para una acción.
- **Don't** agregar una segunda fuente; la jerarquía sale del tamaño y del peso de Plus Jakarta Sans.
- **Don't** usar sombras grises en tarjetas ni en superficies grandes; las sombras se tiñen de su superficie.
- **Don't** usar borde punteado como decoración: significa "todavía no".
- **Don't** hacer que un elemento no clicable (chip, logro, leyenda) cambie el cursor a mano.
- **Don't** presentar como dato real de mercado un porcentaje de demanda que venga de datos sembrados.
