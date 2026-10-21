// Ilustración de la Introducción: un mapa de habilidades en canvas 2D hecho de glifos diminutos (puntos, asteriscos,
// triangulitos y pequeñas "Y"). Datos de ejemplo decorativos (la Introducción se ve sin cuenta: no se llama a la API),
// dispuestos como el Mapa de la app: discos agrupados por categoría y unidos por conexiones punteadas muy tenues (Motivo
// de Ruta). Cada disco es una retícula hexagonal apretada recortada en círculo, con un núcleo luminoso desplazado hacia
// la luz (arriba a la izquierda), borde definido y halo; los discos lejanos son más pequeños y tenues. El color dice el
// estado: menta = dominada, rosa→violeta = aprendiendo, gris con glifos huecos = por aprender (la leyenda).
// Vida: glifos sueltos que destellan despacio (~30 fps) y discos que respiran. Mouse: parallax por capas, glifos que se
// encienden cerca del cursor, el disco bajo el cursor se resalta con sus conexiones (los demás bajan) y muestra el nombre
// de su categoría. Slides (750ms, curva --ease-out): 1 el mapa entero; 2 "Demanda real": cada disco crece y brilla según
// su demanda y muestra su habilidad con el % contando desde 0; 3 "Análisis con IA": una oferta aparece a un lado, un haz
// la escanea, líneas punteadas fluyen hacia los discos que coinciden (que pulsan en onda) y la compatibilidad cuenta
// hasta 72%, en bucle de 6 s. Espacio pausa todo el movimiento (el reloj de la escena se detiene).
// Animaciones reducidas: dibujo estático (en la slide 2 los % finales; en la 3 el estado final del análisis) y el
// resalte por hover es un cambio instantáneo.
// Rendimiento: cada glifo × tono se dibuja una vez en un canvas fuera de pantalla (sprite) y cada disco en reposo en su
// propio bitmap; por cuadro se copian los 10 bitmaps con drawImage y solo se redibujan sueltos los glifos que destellan
// o están cerca del cursor. DPR ≤ 2; ~3700 glifos; solo se piden cuadros si algo se mueve, ninguno con la pestaña oculta. stopIntroMap quita
// listeners, el ResizeObserver y el bucle. Decorativo: el canvas es aria-hidden y el significado está en las slides.
// Usa prefersReducedMotion (theme.js) y t, tSkill y tCategory (i18n.js). Lo llama intro.js: startIntroMap,
// stopIntroMap, setIntroMapSlide y setIntroMapPaused.

const MAP_W = 520, MAP_H = 400;       // espacio de la escena (se escala al tamaño del canvas)
const MAP_PAD = 24;                   // margen interno: halos y zoom de las slides no tocan el borde
const MAP_R = 1.2;                    // escala de los radios de MAP_DISCS
const MAP_FRAME = 33;                 // ~30 fps mientras solo hay titileo
const MAP_PARALLAX = 10;              // px máximos que se desplaza la capa más cercana con el cursor
const MAP_GLOW_R = 56;                // radio (px de escena) en el que el cursor enciende glifos
const MAP_TURN_MS = 750;              // transición entre slides
const MAP_SPRITE = 24;                // tamaño (px CSS) al que se dibuja cada glifo en su sprite
const MAP_BUCKETS = 10;               // tonos del degradado interno de cada disco (0 = núcleo luminoso)
const MAP_LIGHT = { x: -0.6, y: -0.8 }; // de dónde viene la luz
const MAP_COUNT_MS = 0.7, MAP_COUNT_STAGGER = 0.07; // slide 2: el % cuenta de 0 al valor (s), escalonado por disco
const MAP_LOOP = 6;                   // slide 3: duración del bucle del análisis (s)
const MAP_FINAL = 4.6;                // slide 3: momento del bucle que se muestra quieto (todo visible)
const MAP_MATCH = 72;                 // slide 3: compatibilidad de ejemplo

// Escena de ejemplo: habilidad y % de demanda (los seis primeros, del grafo anterior de la Introducción), categoría (como
// en la API: se traduce con tCategory), centro y radio en la escena, estado y capa (0 cerca, 1 media, 2 lejos).
// match: coincide con la oferta de la slide 3.
const MAP_DISCS = [
  { skill: "React", pct: 78, cat: "Frontend", x: 150, y: 112, r: 48, state: "MASTERED", depth: 0, match: true },
  { skill: "TypeScript", pct: 88, cat: "Frontend", x: 240, y: 56, r: 30, state: "IN_PROGRESS", depth: 1, match: true },
  { skill: "Next.js", pct: 71, cat: "Frontend", x: 62, y: 176, r: 26, state: "PENDING", depth: 1 },
  { skill: "SQL", pct: 41, cat: "Datos", x: 290, y: 214, r: 50, state: "MASTERED", depth: 0, match: true },
  { skill: "Testing", pct: 69, cat: "Calidad", x: 330, y: 346, r: 28, state: "PENDING", depth: 0 },
  { skill: "Docker", pct: 54, cat: "DevOps", x: 132, y: 284, r: 34, state: "MASTERED", depth: 0, match: true },
  { skill: "Java", pct: 64, cat: "Backend", x: 392, y: 98, r: 40, state: "IN_PROGRESS", depth: 0 },
  { skill: "Spring Boot", pct: 38, cat: "Backend", x: 466, y: 172, r: 24, state: "PENDING", depth: 1 },
  { skill: "Kubernetes", pct: 33, cat: "DevOps", x: 206, y: 356, r: 22, state: "IN_PROGRESS", depth: 2 },
  { skill: "Kotlin", pct: 22, cat: "Móvil", x: 444, y: 300, r: 30, state: "PENDING", depth: 1 },
];
const MAP_LINKS = [[0, 1], [0, 2], [1, 6], [6, 7], [0, 3], [3, 6], [2, 5], [5, 8], [3, 4], [7, 9], [9, 4], [8, 4], [5, 3]];
const MAP_DEPTH = [{ alpha: 1, scale: 1, parallax: 1 }, { alpha: 0.8, scale: 0.92, parallax: 0.6 }, { alpha: 0.55, scale: 0.84, parallax: 0.3 }];
const MAP_PCT_MAX = Math.max(...MAP_DISCS.map(d => d.pct));
const demandOf = d => d.pct / MAP_PCT_MAX; // 0..1

// Cada slide: qué discos se enfatizan, cuánto crecen y hacia dónde (centro de la escena) y cuánto se acerca la vista
const MAP_SLIDES = {
  1: { focus: () => 1, grow: () => 1, cx: MAP_W / 2, cy: MAP_H / 2, zoom: 1 },
  2: { focus: d => 0.3 + 0.7 * demandOf(d), grow: d => 0.78 + 0.36 * demandOf(d), cx: MAP_W / 2, cy: MAP_H / 2 + 8, zoom: 0.96 },
  3: { focus: d => (d.match ? 1 : 0.3), grow: () => 1, cx: MAP_W / 2 - 6, cy: MAP_H / 2, zoom: 0.98 },
};
// Slide 3: la oferta, una tarjetita abajo a la izquierda de la escena
const MAP_OFFER = { x: 6, y: 330, w: 104, h: 62 };

const SHAPES = { MASTERED: ["dot", "asterisk", "tri", "y"], IN_PROGRESS: ["dot", "asterisk", "tri", "y"], PENDING: ["ring", "hollowTri", "ring", "dot"] };

let introMap = null;

// cubic-bezier(.16,1,.3,1): la --ease-out de styles.css (se busca el parámetro de la curva por bisección)
function mapEase(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const bez = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  let lo = 0, hi = 1, s = t;
  for (let i = 0; i < 20; i++) {
    s = (lo + hi) / 2;
    if (bez(0.16, 0.3, s) < t) lo = s;
    else hi = s;
  }
  return bez(1, 1, s);
}

const clamp01 = v => Math.max(0, Math.min(1, v));

// Números pseudoaleatorios con semilla: el mapa sale igual cada vez
function mapRandom(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Colores y sprites ----------

const rgb = ([r, g, b], a = 1) => `rgba(${r},${g},${b},${a})`;
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// Colores de los tokens del tema vigente, como [r, g, b] para el canvas
function readMapTheme(canvas) {
  const css = getComputedStyle(document.documentElement);
  const probe = document.createElement("span");
  probe.hidden = true;
  canvas.parentElement.append(probe);
  const color = value => {
    probe.style.color = value;
    return (getComputedStyle(probe).color.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  };
  const stops = token => (css.getPropertyValue(token).match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) || []).map(color);
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const mastered = stops("--mastered-bg"), progress = stops("--progress-bg");
  const white = [255, 255, 255];
  const theme = {
    dark,
    // Del núcleo luminoso al borde. En claro, colores saturados y oscuros (la menta pálida se lavaría sobre el fondo);
    // en oscuro el núcleo se aclara hacia el blanco
    MASTERED: dark ? [mix(mastered[0], white, 0.35), mastered[1]] : [mastered[1], color("var(--mint-ink)")],
    IN_PROGRESS: dark ? [mix(progress[0], white, 0.3), progress[1]] : progress,
    PENDING: dark ? [color("var(--text-2)"), color("var(--line-dashed)")] : [color("var(--text-2)"), color("var(--line-dashed)")],
    line: color("var(--line-dashed)"),
    route: color("var(--map-route)"),
    surface: color("var(--surface-solid)"),
    text: color("var(--text)"),
    pct: color("var(--chip-azul-fg)"),
    border: css.getPropertyValue("--card-border").trim(),
    font: getComputedStyle(document.body).fontFamily,
    // Claro: sin brillo que sume, glifos más grandes y opacos y borde más definido. Oscuro: halo y algo más de brillo
    glyphAlpha: dark ? 1.25 : 1.7, glyphSize: dark ? 1.1 : 1.2, halo: dark ? 0.62 : 0.12,
  };
  probe.remove();
  return theme;
}

function drawShape(ctx, shape, s) {
  const c = s / 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (shape === "dot") {
    ctx.arc(c, c, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === "ring") {
    ctx.lineWidth = s * 0.1;
    ctx.arc(c, c, s * 0.24, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape === "tri" || shape === "hollowTri") {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      ctx.lineTo(c + Math.cos(a) * s * 0.32, c + Math.sin(a) * s * 0.32);
    }
    ctx.closePath();
    if (shape === "tri") ctx.fill();
    else { ctx.lineWidth = s * 0.09; ctx.stroke(); }
  } else {
    // asterisco: tres trazos por el centro; "Y": tres brazos desde el centro
    ctx.lineWidth = s * 0.11;
    const arms = shape === "asterisk" ? [0, 60, 120, 180, 240, 300] : [-90, 30, 150];
    for (const deg of arms) {
      const a = (deg * Math.PI) / 180;
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(a) * s * 0.34, c + Math.sin(a) * s * 0.34);
    }
    ctx.stroke();
  }
}

// Un sprite por glifo × estado × tono, y un halo por estado
function buildMapSprites(theme, dpr) {
  const size = Math.round(MAP_SPRITE * dpr);
  const sprites = {}, halos = {};
  for (const state of Object.keys(SHAPES)) {
    const [from, to = from] = theme[state];
    sprites[state] = {};
    for (const shape of new Set(SHAPES[state])) {
      sprites[state][shape] = Array.from({ length: MAP_BUCKETS }, (_, b) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = ctx.strokeStyle = rgb(mix(from, to, b / (MAP_BUCKETS - 1)));
        drawShape(ctx, shape, size);
        return canvas;
      });
    }
    const halo = document.createElement("canvas");
    halo.width = halo.height = Math.round(128 * dpr);
    const ctx = halo.getContext("2d");
    const g = ctx.createRadialGradient(halo.width / 2, halo.height / 2, 0, halo.width / 2, halo.height / 2, halo.width / 2);
    g.addColorStop(0, rgb(from, 0.6));
    g.addColorStop(0.45, rgb(mix(from, to, 0.5), 0.24));
    g.addColorStop(1, rgb(to, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, halo.width, halo.height);
    halos[state] = halo;
  }
  return { sprites, halos };
}

// Bitmap de cada disco con sus glifos en reposo, a la resolución con que se ve más grande (crecer en la slide 2 y latir
// en la 3) para que no se vea borroso. Se rehace al cambiar el tema o el tamaño.
const MAP_CACHE_ZOOM = 1.3;

function buildDiscCaches(m) {
  const { theme } = m;
  const res = m.scale * m.dpr * MAP_CACHE_ZOOM; // px del bitmap por unidad de escena
  return m.discs.map(d => {
    const extent = 2 * (d.r + MAP_SPRITE); // diámetro + margen para los glifos del borde
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.ceil(extent * res);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(res, 0, 0, res, (extent / 2) * res, (extent / 2) * res);
    const sprites = m.sprites[d.state];
    for (const glyph of d.glyphs) {
      const size = glyph.size * theme.glyphSize;
      ctx.globalAlpha = Math.min(1, (theme.dark ? glyph.alphaDark : glyph.alphaLight) * theme.glyphAlpha);
      ctx.drawImage(sprites[glyph.shape][glyph.bucket], glyph.dx - size / 2, glyph.dy - size / 2, size, size);
    }
    return { canvas, extent };
  });
}

// ---------- Escena ----------

// Retícula hexagonal apretada recortada en círculo: ~300–450 glifos por disco grande. El brillo sale de un núcleo
// desplazado hacia la luz; el borde se apaga (más nítido en claro, más suave en oscuro)
function buildMapDiscs() {
  const random = mapRandom(2024);
  return MAP_DISCS.map((source, i) => {
    const d = { ...source, r: source.r * MAP_R };
    const target = 200 + d.r * 4.4;
    const step = d.r * Math.sqrt(Math.PI / (target * 0.866));
    const core = { x: MAP_LIGHT.x * d.r * 0.36, y: MAP_LIGHT.y * d.r * 0.36 };
    const glyphs = [];
    for (let row = -Math.ceil(d.r / (step * 0.866)); row * step * 0.866 <= d.r; row++) {
      const y = row * step * 0.866;
      const shift = row % 2 ? step / 2 : 0;
      for (let x = -d.r - shift; x <= d.r; x += step) {
        const gx = x + shift, dist = Math.hypot(gx, y);
        if (dist > d.r) continue;
        const u = dist / d.r;
        const glow = clamp01(1 - Math.hypot(gx - core.x, y - core.y) / (1.35 * d.r)); // 1 en el núcleo
        const shapes = SHAPES[d.state];
        // Los "por aprender" son huecos y grises: tenues pero legibles (en claro más suaves que los de color, en oscuro
        // algo más opacos para que no se pierdan)
        const base = 0.35 + 0.65 * glow, pending = d.state === "PENDING";
        glyphs.push({
          dx: gx, dy: y, shape: shapes[Math.floor(random() * shapes.length)],
          bucket: Math.min(MAP_BUCKETS - 1, Math.round((1 - glow) * (MAP_BUCKETS - 1))),
          alphaLight: base * (pending ? 0.6 : 1) * (1 - u ** 10), alphaDark: base * (pending ? 1.25 : 1) * (1 - u ** 4),
          size: step * (1.05 + random() * 0.35),
        });
      }
    }
    return { ...d, index: i, glyphs, phase: random() * Math.PI * 2, breathes: random() < 0.5, emphasis: 1, grow: 1, label: 0 };
  });
}

// slide: la slide que se ve al abrir (la vista empieza ya en ella, sin transición)
function startIntroMap(canvas, slide = 1) {
  if (introMap) return;
  let ctx = null;
  try { ctx = canvas.getContext("2d"); } catch { ctx = null; }
  // Sin canvas queda el fondo estático (el resplandor sobre la rejilla de puntos)
  canvas.closest(".intro-map")?.classList.toggle("is-static", !ctx);
  if (!ctx) return;
  const discs = buildMapDiscs();
  const first = MAP_SLIDES[slide] ? slide : 1;
  const m = {
    canvas, ctx, discs, dpr: 1, scale: 1, w: 1, h: 1, theme: null, sprites: null, halos: null, caches: null,
    sparks: discs.map(d => new Float32Array(d.glyphs.length)),
    slide: first, slideStart: -100, view: { ...MAP_SLIDES[first] }, tween: null, paused: false, reduced: prefersReducedMotion(),
    pointer: null, parallax: { x: 0, y: 0 }, parallaxTarget: { x: 0, y: 0 }, hover: -1,
    time: 0, last: 0, lastDraw: 0, raf: 0, controller: new AbortController(), observer: null,
  };
  introMap = m;
  discs.forEach(d => {
    d.emphasis = MAP_SLIDES[first].focus(d);
    d.grow = MAP_SLIDES[first].grow(d);
    d.label = first === 2 ? 1 : 0;
  });
  resumeSlideClock(m);
  applyMapTheme(m);
  resizeIntroMap(m);
  bindIntroMap(m);
  invalidateIntroMap(m);
}

function stopIntroMap() {
  const m = introMap;
  introMap = null;
  if (!m) return;
  cancelAnimationFrame(m.raf);
  m.controller.abort();
  m.observer?.disconnect();
  m.ctx.setTransform(1, 0, 0, 1, 0, 0);
  m.ctx.clearRect(0, 0, m.canvas.width, m.canvas.height);
  m.sprites = m.halos = m.caches = null;
}

// Una slide a la que se llegó en pausa o quieta se muestra terminada (slideStart < 0); al volver el movimiento, su
// animación sigue desde ese estado final
function resumeSlideClock(m) {
  if (m.slideStart < -50 && !m.paused && !m.reduced) m.slideStart = m.time - (m.slide === 3 ? MAP_FINAL : 10);
}

function setIntroMapSlide(n) {
  const m = introMap;
  const slide = MAP_SLIDES[n];
  if (!m || !slide || m.slide === Number(n)) return;
  m.slide = Number(n);
  m.slideStart = m.paused || m.reduced ? -100 : m.time;
  if (m.reduced) Object.assign(m.view, slide);
  else m.tween = { from: { ...m.view }, to: slide, start: performance.now() };
  invalidateIntroMap(m);
}

function setIntroMapPaused(paused) {
  if (!introMap) return;
  introMap.paused = paused;
  resumeSlideClock(introMap);
  invalidateIntroMap(introMap);
}

function applyMapTheme(m) {
  m.theme = readMapTheme(m.canvas);
  m.reduced = prefersReducedMotion();
  if (m.reduced) {
    m.tween = null;
    m.slideStart = -100;
    Object.assign(m.view, MAP_SLIDES[m.slide]);
    m.parallax = { x: 0, y: 0 };
  }
  resumeSlideClock(m);
  ({ sprites: m.sprites, halos: m.halos } = buildMapSprites(m.theme, m.dpr));
  m.caches = null;
  invalidateIntroMap(m);
}

// El canvas toma el tamaño de su caja (CSS); la escena se escala para caber entera
function resizeIntroMap(m) {
  const { width, height } = m.canvas.getBoundingClientRect();
  if (!width || !height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  m.w = width;
  m.h = height;
  m.scale = Math.min((width - 2 * MAP_PAD) / MAP_W, (height - 2 * MAP_PAD) / MAP_H);
  m.canvas.width = Math.round(width * dpr);
  m.canvas.height = Math.round(height * dpr);
  m.caches = null;
  if (dpr !== m.dpr) {
    m.dpr = dpr;
    ({ sprites: m.sprites, halos: m.halos } = buildMapSprites(m.theme, dpr));
  }
  invalidateIntroMap(m);
}

// ---------- Interacción ----------

// Escena → px del canvas (CSS) con la vista actual, y al revés
function mapToScreen(m, x, y) {
  const s = m.scale * m.view.zoom;
  return { x: (x - m.view.cx) * s + m.w / 2, y: (y - m.view.cy) * s + m.h / 2 };
}

function mapPointerToScene(m, clientX, clientY) {
  const rect = m.canvas.getBoundingClientRect();
  const s = m.scale * m.view.zoom;
  return { x: (clientX - rect.left - m.w / 2) / s + m.view.cx, y: (clientY - rect.top - m.h / 2) / s + m.view.cy, rect };
}

function bindIntroMap(m) {
  const signal = m.controller.signal;
  const intro = m.canvas.closest(".intro") || document;
  // Parallax con el cursor en toda la Introducción; glifos y disco resaltado solo cerca del mapa
  intro.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    const p = mapPointerToScene(m, e.clientX, e.clientY);
    const nx = ((e.clientX - p.rect.left) / p.rect.width) * 2 - 1, ny = ((e.clientY - p.rect.top) / p.rect.height) * 2 - 1;
    m.parallaxTarget = m.reduced ? { x: 0, y: 0 } : { x: -Math.max(-1, Math.min(1, nx)) * MAP_PARALLAX, y: -Math.max(-1, Math.min(1, ny)) * MAP_PARALLAX };
    const inside = e.clientX >= p.rect.left && e.clientX <= p.rect.right && e.clientY >= p.rect.top && e.clientY <= p.rect.bottom;
    m.pointer = inside ? { x: p.x, y: p.y } : null;
    const hit = inside ? m.discs.filter(d => Math.hypot(p.x - d.x, p.y - d.y) <= d.r * d.grow + 6).sort((a, b) => a.depth - b.depth)[0] : null;
    m.hover = hit ? hit.index : -1;
    invalidateIntroMap(m);
  }, { signal });
  document.documentElement.addEventListener("pointerleave", () => {
    m.pointer = null;
    m.hover = -1;
    m.parallaxTarget = { x: 0, y: 0 };
    invalidateIntroMap(m);
  }, { signal });
  document.addEventListener("visibilitychange", () => { m.last = 0; invalidateIntroMap(m); }, { signal });
  // Tema o "Reducir animaciones" cambiaron (theme.js); el idioma cambia las etiquetas
  document.addEventListener("skillmap:settings", () => applyMapTheme(m), { signal });
  document.addEventListener("skillmap:language", () => invalidateIntroMap(m), { signal });
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => applyMapTheme(m), { signal });
  m.observer = new ResizeObserver(() => resizeIntroMap(m));
  m.observer.observe(m.canvas);
}

// ---------- Bucle ----------

function invalidateIntroMap(m) {
  if (!m.raf && introMap === m && !document.hidden) m.raf = requestAnimationFrame(now => frameIntroMap(m, now));
}

// Hay animación de slide en curso: el conteo de la 2 mientras dura y el bucle de la 3 siempre
function slideAnimating(m) {
  if (m.paused || m.reduced) return false;
  if (m.slide === 3) return true;
  return m.slide === 2 && m.time - m.slideStart < MAP_COUNT_MS + MAP_COUNT_STAGGER * MAP_DISCS.length + 0.1;
}

function frameIntroMap(m, now) {
  m.raf = 0;
  if (introMap !== m || document.hidden) { m.last = 0; return; }
  const running = !m.paused && !m.reduced; // el reloj de la escena avanza (titileo y animaciones de slide)
  const dt = m.last ? Math.min(0.1, (now - m.last) / 1000) : 0;
  m.last = now;
  const easing = stepIntroMap(m, dt, now);
  if (running) {
    m.time += dt;
    stepSparks(m, dt);
  }
  // Solo titileo: ~30 fps; transiciones, hover y animaciones de slide, a la frecuencia de la pantalla
  if (easing || slideAnimating(m) || !running || now - m.lastDraw >= MAP_FRAME) {
    drawIntroMap(m);
    m.lastDraw = now;
  }
  if (running || easing) invalidateIntroMap(m);
  else m.last = 0;
}

// Transición de slide, parallax, resaltado, crecimiento por demanda y etiquetas. Devuelve si algo sigue moviéndose.
function stepIntroMap(m, dt, now) {
  let moving = false;
  if (m.tween) {
    const k = Math.min(1, (now - m.tween.start) / MAP_TURN_MS);
    const e = mapEase(k);
    for (const key of ["cx", "cy", "zoom"]) m.view[key] = m.tween.from[key] + (m.tween.to[key] - m.tween.from[key]) * e;
    if (k >= 1) m.tween = null;
    else moving = true;
  }
  const approach = (obj, key, target, rate, epsilon) => {
    const diff = target - obj[key];
    obj[key] = Math.abs(diff) < epsilon ? target : obj[key] + diff * (m.reduced ? 1 : 1 - Math.exp(-dt * rate));
    if (obj[key] !== target) moving = true;
  };
  approach(m.parallax, "x", m.parallaxTarget.x, 8, 0.05);
  approach(m.parallax, "y", m.parallaxTarget.y, 8, 0.05);
  const slide = MAP_SLIDES[m.slide];
  for (const d of m.discs) {
    const focus = slide.focus(d);
    approach(d, "emphasis", m.hover < 0 ? focus : m.hover === d.index ? 1.25 : 0.4 * focus + 0.1, 6, 0.005);
    approach(d, "grow", slide.grow(d), 5, 0.002);
    approach(d, "label", m.slide === 2 ? 1 : 0, 7, 0.01);
  }
  return moving;
}

// Destellos: unos pocos glifos al azar se encienden y se apagan despacio
function stepSparks(m, dt) {
  const decay = Math.exp(-dt * 1.4);
  m.sparks.forEach(sparks => { for (let i = 0; i < sparks.length; i++) sparks[i] *= decay; });
  const count = Math.random() < dt * 30 ? 3 : 0;
  for (let i = 0; i < count; i++) {
    const d = Math.floor(Math.random() * m.discs.length);
    m.sparks[d][Math.floor(Math.random() * m.sparks[d].length)] = 1;
  }
}

// Slide 3: momento del bucle del análisis (0..MAP_LOOP s); quieta o a la que se llegó en pausa, el estado final
function analysisPhase(m) {
  if (m.reduced || m.slideStart < -50) return MAP_FINAL;
  return (m.time - m.slideStart) % MAP_LOOP;
}

// Discos que coinciden con la oferta, en el orden en que les llega la línea
const MAP_MATCHES = MAP_DISCS.map((d, i) => (d.match ? i : -1)).filter(i => i >= 0);
const matchAt = i => 1.6 + MAP_MATCHES.indexOf(i) * 0.38; // s del bucle en que la línea sale hacia el disco i

function drawIntroMap(m) {
  const { ctx, theme, discs, view } = m;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, m.canvas.width, m.canvas.height);
  const s = m.scale * view.zoom * m.dpr;
  const sceneTransform = () => ctx.setTransform(s, 0, 0, s, (m.w / 2) * m.dpr - view.cx * s, (m.h / 2) * m.dpr - view.cy * s);
  sceneTransform();
  ctx.globalCompositeOperation = theme.dark ? "lighter" : "source-over";
  const phase = m.slide === 3 ? analysisPhase(m) : 0;
  const placed = discs.map(d => {
    const depth = MAP_DEPTH[d.depth];
    const breath = d.breathes && !m.reduced ? 1 + 0.025 * Math.sin(m.time * 0.9 + d.phase) : 1;
    // Slide 3: cada disco que coincide late una vez cuando le llega la línea de la oferta (quieta: resaltado fijo)
    const hit = m.slide === 3 && d.match ? phase - matchAt(d.index) - 0.35 : -1;
    const pulse = m.reduced ? 0 : hit > 0 && hit < 0.7 ? Math.sin((hit / 0.7) * Math.PI) : 0;
    return { x: d.x + (m.parallax.x * depth.parallax) / m.scale, y: d.y + (m.parallax.y * depth.parallax) / m.scale, depth,
      k: breath * depth.scale * d.grow * (1 + 0.12 * pulse), pulse };
  });

  // Conexiones punteadas: las del disco bajo el cursor se iluminan con el color de la ruta
  ctx.setLineDash([1.5, 6]);
  ctx.lineCap = "round";
  for (const [a, b] of MAP_LINKS) {
    const lit = m.hover === a || m.hover === b;
    const e = Math.min(discs[a].emphasis, discs[b].emphasis);
    ctx.lineWidth = lit ? 1.6 : 1;
    ctx.strokeStyle = lit ? rgb(theme.route, 0.85) : rgb(theme.line, (theme.dark ? 0.32 : 0.45) * Math.min(1, e));
    ctx.beginPath();
    ctx.moveTo(placed[a].x, placed[a].y);
    ctx.lineTo(placed[b].x, placed[b].y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Cada disco es un bitmap ya dibujado (sus glifos en reposo); encima, solo los glifos que destellan o están cerca
  // del cursor, más grandes y brillantes
  if (!m.caches) m.caches = buildDiscCaches(m);
  const pointer = m.reduced ? null : m.pointer;
  discs.forEach((d, i) => {
    const { x, y, depth, k, pulse } = placed[i];
    const e = d.emphasis + 0.6 * pulse;
    const dim = (0.25 + 0.75 * e) * depth.alpha;
    const halo = d.r * 2.6 * k;
    ctx.globalAlpha = Math.min(1, theme.halo * e * depth.alpha);
    ctx.drawImage(m.halos[d.state], x - halo / 2, y - halo / 2, halo, halo);
    const cache = m.caches[i];
    const extent = cache.extent * k;
    // Resaltado por encima de 1 (hover, pulso): una segunda pasada del mismo bitmap
    for (let pass = dim; pass > 0.01; pass -= 1) {
      ctx.globalAlpha = Math.min(1, pass);
      ctx.drawImage(cache.canvas, x - extent / 2, y - extent / 2, extent, extent);
    }
    const sparks = m.sparks[i];
    const sprites = m.sprites[d.state];
    const close = pointer && Math.hypot(pointer.x - x, pointer.y - y) < d.r * k + MAP_GLOW_R;
    for (let g = 0; g < d.glyphs.length; g++) {
      const spark = sparks[g];
      if (spark < 0.03 && !close) continue;
      const glyph = d.glyphs[g];
      const gx = x + glyph.dx * k, gy = y + glyph.dy * k;
      let near = 0;
      if (close) {
        const dist = Math.hypot(gx - pointer.x, gy - pointer.y);
        if (dist < MAP_GLOW_R) near = (1 - dist / MAP_GLOW_R) ** 2;
      }
      if (spark < 0.03 && near <= 0) continue;
      const size = glyph.size * k * theme.glyphSize * (1 + 0.6 * spark + 0.9 * near);
      const base = theme.dark ? glyph.alphaDark : glyph.alphaLight;
      ctx.globalAlpha = Math.min(1, base * dim * theme.glyphAlpha * (0.8 * spark + 1.2 * near) + 0.25 * near);
      ctx.drawImage(sprites[glyph.shape][glyph.bucket], gx - size / 2, gy - size / 2, size, size);
    }
  });
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  if (m.slide === 3) drawAnalysis(m, placed, phase, sceneTransform);
  // Etiquetas en px de pantalla (texto nítido con cualquier zoom)
  ctx.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);
  const demand = discs.some(d => d.label > 0.01);
  if (demand) drawDemandLabels(m, placed);
  if (m.hover >= 0 && !(demand && discs[m.hover].label > 0.5)) drawCategoryLabel(m, discs[m.hover], placed[m.hover]);
  if (m.slide === 3) drawMatchBadge(m, phase);
}

// Píldora de etiqueta (px de pantalla)
function mapPill(ctx, theme, x, y, w, h) {
  ctx.fillStyle = rgb(theme.surface, 0.95);
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
}

// Etiqueta pequeña con la categoría del disco bajo el cursor, encima del disco
function drawCategoryLabel(m, d, p) {
  const { ctx, theme } = m;
  const text = tCategory(d.cat).toUpperCase();
  ctx.font = `700 11px ${theme.font}`;
  const w = ctx.measureText(text).width + 16, h = 24;
  const c = mapToScreen(m, p.x, p.y), r = d.r * p.k * m.scale * m.view.zoom;
  mapPill(ctx, theme, c.x - w / 2, c.y - r - h - 8, w, h);
  ctx.fillStyle = rgb(theme.text);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, c.x, c.y - r - h / 2 - 7.5);
}

// Slide 2: habilidad y % de demanda bajo cada disco. El % cuenta de 0 al valor (escalonado) y una etiqueta que pisaría
// a otra se desplaza (debajo un paso más, luego encima del disco)
function drawDemandLabels(m, placed) {
  const { ctx, theme, discs } = m;
  const boxes = [];
  const order = discs.map((d, i) => i).sort((a, b) => placed[a].y - placed[b].y);
  const done = m.reduced || m.slideStart < -50;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (const i of order) {
    const d = discs[i];
    const alpha = d.label * Math.sqrt(MAP_DEPTH[d.depth].alpha);
    if (alpha < 0.01) continue;
    const progress = done ? 1 : mapEase(clamp01((m.time - m.slideStart - i * MAP_COUNT_STAGGER) / MAP_COUNT_MS));
    const name = tSkill(d.skill);
    ctx.font = `600 11px ${theme.font}`;
    const nameW = ctx.measureText(name).width;
    ctx.font = `700 11px ${theme.font}`;
    const w = nameW + ctx.measureText(`${d.pct}%`).width + 24, h = 22;
    const c = mapToScreen(m, placed[i].x, placed[i].y), r = d.r * placed[i].k * m.scale * m.view.zoom;
    const x = Math.max(4, Math.min(m.w - w - 4, c.x - w / 2));
    const free = ty => ty >= 4 && ty + h <= m.h - 4
      && !boxes.some(b => x < b.x + b.w + 4 && x + w + 4 > b.x && ty < b.y + b.h + 2 && ty + h + 2 > b.y);
    const y = [c.y + r + 4, c.y + r + h + 8, c.y - r - h - 4, c.y - r - 2 * h - 8].find(free)
      ?? Math.max(4, Math.min(m.h - h - 4, c.y + r + 4));
    boxes.push({ x, y, w, h });
    ctx.globalAlpha = alpha;
    mapPill(ctx, theme, x, y, w, h);
    ctx.font = `600 11px ${theme.font}`;
    ctx.fillStyle = rgb(theme.text);
    ctx.fillText(name, x + 10, y + h / 2 + 0.5);
    ctx.font = `700 11px ${theme.font}`;
    ctx.fillStyle = rgb(theme.pct);
    ctx.fillText(`${Math.round(d.pct * progress)}%`, x + 14 + nameW, y + h / 2 + 0.5);
  }
  ctx.globalAlpha = 1;
}

// Slide 3: la oferta (tarjetita con líneas simuladas), el haz que la escanea y las líneas punteadas que fluyen hacia los
// discos que coinciden. Fases del bucle (s): 0–0.4 aparece, 0.4–1.5 escaneo, 1.6–3 líneas y pulsos, 5.4–6 se apaga
function drawAnalysis(m, placed, phase, sceneTransform) {
  const { ctx, theme } = m;
  const fade = clamp01(phase / 0.4) * (1 - clamp01((phase - 5.4) / 0.6));
  if (fade <= 0) return;
  sceneTransform();
  const o = MAP_OFFER;
  const px = 1 / (m.scale * m.view.zoom); // 1 px de pantalla en la escena
  ctx.globalAlpha = fade;
  ctx.fillStyle = rgb(theme.surface, 0.97);
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = px;
  ctx.beginPath();
  ctx.roundRect(o.x, o.y, o.w, o.h, 10);
  ctx.fill();
  ctx.stroke();
  // Encabezado de color y tres líneas de texto simuladas
  ctx.fillStyle = rgb(theme.route, 0.9);
  ctx.beginPath();
  ctx.roundRect(o.x + 10, o.y + 10, 40, 6, 3);
  ctx.fill();
  ctx.fillStyle = rgb(theme.line, theme.dark ? 0.55 : 0.45);
  for (const [w, dy] of [[0.78, 24], [0.62, 34], [0.7, 44]]) {
    ctx.beginPath();
    ctx.roundRect(o.x + 10, o.y + dy, (o.w - 20) * w, 4, 2);
    ctx.fill();
  }
  // Haz de escaneo que recorre la tarjeta de izquierda a derecha
  const scan = (phase - 0.4) / 1.1;
  if (!m.reduced && scan > 0 && scan < 1) {
    const sx = o.x + scan * o.w;
    const g = ctx.createLinearGradient(sx - 14, 0, sx + 4, 0);
    g.addColorStop(0, rgb(theme.route, 0));
    g.addColorStop(1, rgb(theme.route, 0.45));
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(o.x, o.y, o.w, o.h, 10);
    ctx.clip();
    ctx.fillStyle = g;
    ctx.fillRect(sx - 14, o.y, 18, o.h);
    ctx.fillStyle = rgb(theme.route, 0.85);
    ctx.fillRect(sx + 3, o.y, 1.5 * px, o.h);
    ctx.restore();
  }
  // Líneas punteadas que fluyen desde la oferta hacia cada disco que coincide (en onda); quietas con animaciones reducidas
  const from = { x: o.x + o.w, y: o.y + o.h / 2 };
  ctx.setLineDash([3, 5]);
  ctx.lineDashOffset = m.reduced ? 0 : -m.time * 18;
  ctx.lineWidth = 1.4 * px;
  ctx.strokeStyle = rgb(theme.route, 0.8);
  for (const i of MAP_MATCHES) {
    const grow = clamp01((phase - matchAt(i)) / 0.35);
    if (grow <= 0) continue;
    const to = placed[i], r = m.discs[i].r * to.k;
    const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy);
    const end = Math.max(0, len - r - 4) * grow;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(from.x + (dx / len) * end, from.y + (dy / len) * end);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.globalAlpha = 1;
}

// Slide 3: "Compatibilidad 72%" sobre la oferta, contando hacia arriba mientras llegan las líneas
function drawMatchBadge(m, phase) {
  const { ctx, theme } = m;
  const fade = clamp01((phase - 1.5) / 0.3) * (1 - clamp01((phase - 5.4) / 0.6));
  if (fade <= 0) return;
  const value = Math.round(MAP_MATCH * mapEase(clamp01((phase - 1.6) / 1.4)));
  ctx.font = `700 12px ${theme.font}`;
  const w = ctx.measureText(t("intro.match", { n: MAP_MATCH })).width + 20, h = 26;
  const o = mapToScreen(m, MAP_OFFER.x, MAP_OFFER.y);
  const x = Math.max(4, o.x);
  ctx.globalAlpha = fade;
  mapPill(ctx, theme, x, o.y - h - 8, w, h);
  ctx.fillStyle = rgb(theme.pct);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(t("intro.match", { n: value }), x + 10, o.y - h / 2 - 7.5);
  ctx.globalAlpha = 1;
}
