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
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
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
    fontSize: "1.05rem"
    fontWeight: 600
    letterSpacing: "-0.01em"
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
  card: "1.75rem"
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
- **Rosa Ruta** (pink): el camino y la acción. Botón principal, ítem activo del sidebar, gauge de preparación y match, barras de brechas, contorno de foco y la tarjeta "Siguiente acción". Es el único color que pide un clic.
- **Bruma Rosa** (pink-soft): fondos de hover (sidebar, controles del mapa, leyenda), la etiqueta "Objetivo actual" y el fondo del ícono en tarjetas.
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

**The One Pink Action Rule.** Cada pantalla tiene una sola acción principal en rosa sólido (Trazar mi ruta, Ver detalle de brechas, Analizar Compatibilidad). Las acciones secundarias van en blanco con contorno o en rosa sobre blanco.

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
- **Label** (600–700, 0.6–0.66rem o 10px, 0.06–0.12em, MAYÚSCULAS): rótulos de grupo, badges de urgencia, tags de proyecto y la etiqueta "Datos de ejemplo".

### Named Rules
**The Light Numbers Rule.** Los porcentajes y métricas grandes van en peso 300 con cifras tabulares; nunca en negrita. Lo que pesa es el color del anillo, no el número.

## Layout

La aplicación es solo de escritorio. Un sidebar blanco fijo de 14rem a la izquierda (4.5rem, solo íconos, por debajo de 640px) y un área de contenido con 2rem de margen lateral y un máximo de 1200px, centrada. El Mapa Visual es la excepción: ocupa de borde a borde y a alto completo.

Las grillas pasan a dos columnas desde 1024px. Mi Ruta y Analizador usan una columna angosta (gauge) y una ancha (1fr / 2.1fr); Perfil usa 1.7fr / 1fr. Objetivo usa una grilla de 1, 2 o 3 columnas de tarjetas iguales (640px y 1024px). La separación entre tarjetas es de 1.5rem (Perfil, Analizador) a 1.75rem (Mi Ruta), y cada tarjeta tiene 1.75rem de padding.

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
- **En desarrollo:** Tinte Rosa, borde Línea Rosa y texto rosa.
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
- **Sidebar:** blanco y fijo. Ítems de 0.9rem en 600 y gris, con radio de 1.1rem. En hover, Bruma Rosa con texto rosa; el activo va en Rosa Ruta con texto blanco y halo de acción. Por debajo de 640px quedan solo los íconos.

### Gauge
Anillo de 160px con trazo de 18 sobre pista Niebla, en Rosa Ruta. Al aparecer, el anillo se llena y el número cuenta desde 0 a la par (800ms). Es el mismo componente en Mi Ruta y en el Analizador.

### Historial del Analizador
Tarjeta blanca bajo el resultado, con medidas en múltiplos de 8px. Cada análisis es una fila (borde Línea de Tarjeta, radio 16px) con el % de entonces en una pastilla rosa, el título, la fecha y quién lo analizó (Gemini, IA en la nube o Caché), y una papelera a la derecha. Al abrir uno, el resultado se recalcula con el progreso actual y lo encabeza un aviso azul informativo ("Resultado recalculado con tu progreso actual"); la fila abierta queda en Tinte Rosa con borde rosa. Borrar uno o "Borrar historial" se confirma en el lugar (fondo rosa claro, "Sí, borrar" con contorno y "Cancelar"), porque no se puede deshacer. Vacío con el Motivo de Ruta; carga con la línea en bucle; error con borde rosa punteado y "Reintentar".

### Ofertas para ti (Mi Ruta)
Tarjeta blanca en la columna ancha de Mi Ruta, entre Brechas Prioritarias y Tendencia, con medidas en múltiplos de 8px. Título neutro ("Ofertas para ti") y pista "Ordenadas por encaje"; la única expresión GPS está en el estado vacío ("…encajen con tu destino"). Muestra 5 ofertas y "Ver más (n)" (botón con contorno) despliega hasta 10; el foco pasa a la primera nueva. Cada oferta es una fila (borde Línea de Tarjeta, radio 16px) como las del historial del Analizador:
- **% de encaje** en pastilla rosa de 64×40 a la izquierda (cifras tabulares). La pastilla es `aria-hidden`; el lector oye "Encaje: n%".
- **Título** (700, .9rem) que enlaza a la oferta original en una pestaña nueva (`target="_blank" rel="noopener noreferrer"`), con ícono de enlace externo y el aviso "(se abre en otra pestaña)" solo para lectores. Hover en azul de enlace subrayado.
- **Meta**: empresa · "Fuente: Remotive/Arbeitnow" (en 600, siempre visible: Remotive exige citar la fuente y enlazar la original) · fecha de publicación.
- **Chips** de 24px y radio 8px: menta (la tienes), rosa→violeta sólido `--progress-bg` con texto blanco (aprendiendo) y punteado gris (pendiente). Dos listas con nombre accesible ("Habilidades que ya tienes" / "…que te faltan"); el estado de cada faltante se lee entre paréntesis.
- **"Analizar con IA"**: botón secundario con contorno, a la derecha. Lleva el texto al Analizador ya pegado, con un aviso azul ("Oferta pegada: …"), pero no analiza: el usuario decide cuándo gastar cuota. Mientras pide el texto dice "Abriendo…"; si falla, el error sale en rosa bajo los chips.

Entrada: las filas suben 8px con fundido (320ms, escalonadas 40ms) solo al cargar o al mostrar las de "Ver más"; sin animación con movimiento reducido. Carga con la línea del Motivo de Ruta en bucle; vacío con el Motivo de Ruta; error con borde rosa punteado, `role="alert"` y "Reintentar". Se vuelve a pedir al cambiar el estado de una habilidad, el objetivo o el idioma, y nunca muestra datos simulados.

### Nodo del Mapa
Círculos de 112px: menta sólido (dominado), rosa sólido (en desarrollo) o blanco con borde punteado (por aprender), cada uno con sombra de su color. En hover o foco suben 3px y crecen un 4%. Al pasar por la leyenda, los nodos de los otros estados bajan a .22 de opacidad.

### Mapa Visual: solo 2D
El Mapa es solo el grafo 2D (nodos, ruta sugerida, panel de detalle con el selector de estado, zoom y arrastre). Arriba a la derecha de la tarjeta, un enlace pequeño "Ver mis habilidades como lista" (píldora de 40px con el fondo del nav, ícono de lista y texto `--text-mid` de 13px, rosa en hover) lleva a "Mis Habilidades" de Perfil con el foco en su título.

**Consejo de primera vez:** una línea sobre el mapa y el panel ("Cada punto es una habilidad. Toca uno para cambiar su estado."), con un punto de `--map-route` y un botón cerrar (`aria-label`). Al cerrarlo no vuelve (`localStorage`) y el foco pasa al nodo activo del mapa.

### Mis Habilidades (Perfil)
El catálogo completo, ligero, para quien prefiere leer en vez de recorrer el mapa (`js/perfil-habilidades.js`). La tarjeta va a todo el ancho bajo la cabecera de Perfil para que las filas quepan en tres columnas.

- **Filtros:** segmentados compactos (32px, 13px, `--toggle-on-*` en el elegido): Todas · Dominadas · Aprendiendo · Pendientes, cada uno con su contador en texto tenue. `aria-pressed`; el filtro dura la sesión del navegador (`sessionStorage`).
- **Pista única:** debajo de los filtros, una sola vez: "Toca un nombre para ver su contexto y preguntas frecuentes; el estado se cambia desde su indicador." (también es la descripción accesible de cada nombre).
- **Grupos:** por categoría en el orden de los clusters del Mapa, con un título discreto (11px, 700, mayúsculas, `--text-2`) y el contador; dentro, por demanda. Filas en tres columnas (`auto-fill`, mínimo 264px: dos o una si el ancho no alcanza), separadas solo por espacio, sin líneas divisorias.
- **Fila (40px):** nombre (botón con aspecto de enlace, 14px/600, rosa subrayado en hover) que abre el contexto; demanda en texto tenue (12px, `--text-2`, "15%"); indicador de estado: círculo de 10px (punteado = pendiente, `--progress-bg` = aprendiendo, `--mastered-bg` = dominada) con etiqueta de 12px, sin píldora ni borde (fondo `--surface-2` solo en hover o abierto). El `aria-label` dice habilidad y estado.
- **Selector:** popover pequeño (168px, radio 16px, superficie sólida y sombra de tarjeta) anclado al indicador, con las tres opciones en columna (círculo + texto corto; la elegida en negrita con fondo `--surface-2`). Flota sin desplazar nada; si abajo no cabe en la ventana se abre hacia arriba, y si se saldría por la derecha se alinea con el final del indicador. Enter, Espacio o ↓ lo abren con el foco en la opción actual; las flechas mueven el foco; Enter, Espacio o clic eligen; elegir o Esc lo cierran y devuelven el foco al indicador; Tab o un clic fuera lo cierran.
- **Cambio de estado:** la fila cambia al instante (si el filtro ya no la incluye, sigue a la vista hasta cambiar de filtro), `#perfil-status` lo anuncia ("Testing: Aprendiendo.") y Mapa, Mi Ruta, estadísticas y logros se actualizan. Si el backend falla, vuelve al estado anterior con el error en la fila (`role="alert"`).
- **Vacío por filtro:** el Motivo de Ruta con un texto en voz de GPS (p. ej. "No te queda ninguna pendiente: llegaste a destino.").

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
- **Con el nombre:** siempre junto a "Cenit" (700, 18px, sin mayúsculas completas), así que el logo es decorativo (`aria-hidden`). En Introducción y Acceso lleva el slogan debajo (12px, 500, texto secundario).
- **Aguja (barra superior):** la punta de arriba apunta al ítem activo del nav (o a Ajustes) y gira al cambiar de sección (400ms, `--ease-out`, rebote corto de aguja). El ángulo sale de las posiciones del logo y del ítem, medido contra un horizonte virtual a la distancia del centro del nav (el centro queda a 45°). Con hover o foco en otro ítem se inclina un tercio del camino hacia él, 10° como mucho (180ms). Sin ítem activo (detalle de habilidad) apunta al norte. `pointBrandNeedle()` en `js/brand.js`, llamada desde `positionNavIndicator` (mapa.js).
- **Búsqueda (Introducción y Acceso):** oscila unos grados (barridos de 400ms con pausas, ciclo de 4s, `brand-search`). Al enviar el formulario de Acceso se detiene y vuelve al norte con el rebote; si el envío falla, sigue buscando (`setBrandSearchFound`).
- **Animaciones reducidas:** quieta, sin giro ni oscilación. Solo se anima `transform`.
- **Favicon:** `assets/cenit-star.svg`, la misma estrella con colores fijos (los del tema oscuro si el navegador está en oscuro).

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
