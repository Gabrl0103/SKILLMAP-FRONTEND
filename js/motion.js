// Movimiento de valores: Mi Ruta, Objetivo, Habilidades y Perfil se vuelven a pintar con innerHTML cuando cambia un
// dato (estado de una habilidad, objetivo, meta semanal). Sin esto, el anillo, los números y las barras saltaban al
// valor nuevo o volvían a llenarse desde 0. settleMotion(root) se llama justo después de pintar: cada elemento con
// data-motion="tipo:clave" recuerda su último valor (por clave) y, si cambió, va del valor anterior al nuevo:
//   ring:clave   .gauge-ring con data-value (%): trazo (stroke-dashoffset) y número (--pct del contador) en el mismo
//                cuadro de animación, así nunca se desfasan. Con valor anterior no repite la entrada desde 0.
//   count:clave  número entero (data-value o su texto): cuenta del anterior al nuevo; si el elemento tiene más nodos
//                ("57<span>%</span>"), solo cambia el primer texto.
//   bar:clave    barra con data-value (ancho en %): se estira desde la proporción anterior (solo transform: scale).
//   fill:clave   tramo con data-value (su estado): si cambió, se llena desde la izquierda; los tramos que cambian a la
//                vez entran escalonados.
//   pop:clave    marca de estado con data-value (punto de la ruta, marca de Tu semana): si cambió, late una vez
//                (motionPop, también para los nodos del Mapa, que no se repintan).
// La primera vez que aparece una clave no hay animación de cambio (cada vista conserva su entrada). Duración 800ms con
// --ease-out. Con movimiento reducido (sistema o Ajustes) todo queda en su valor final. Usa prefersReducedMotion
// (theme.js).
// Además (al final): morphInto (repintar en su lugar, solo lo que cambia), motionFade, motionSkipEntry, motionFlip y
// keepScrollRoom (sin saltos de scroll), para que ningún cambio dentro de una vista parpadee, salte o repita entradas.

const MOTION_VALUE_MS = 800;
const MOTION_STAGGER_MS = 70;
// clave -> { value, from, start }: último valor pintado y, si está animándose, desde dónde y desde cuándo (from null:
// quieto). Así un repintado con el mismo valor a mitad de la animación (p. ej. el guardado optimista y luego la
// respuesta del backend) sigue desde donde iba en vez de saltar al final.
const motionValues = new Map();

// Curva cubic-bezier de --ease-out (styles.css) para las animaciones con requestAnimationFrame
function motionEasing() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "cubic-bezier(.16,1,.3,1)";
  const [x1, y1, x2, y2] = (raw.match(/-?[\d.]+/g) || [".16", "1", ".3", "1"]).map(Number);
  const bez = (a, b, t) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
  const fn = x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) { t = (lo + hi) / 2; if (bez(x1, x2, t) < x) lo = t; else hi = t; }
    return bez(y1, y2, t);
  };
  return { fn, css: raw };
}

// Llama a step(valor, terminó) en cada cuadro, de from a to en duration ms, con la curva de --ease-out. owner: el
// elemento que se anima; si ya tenía una cuenta en curso se corta (un elemento que se actualiza en su lugar, morphInto,
// nunca tiene dos cuentas escribiendo a la vez)
function motionTween(from, to, duration, step, owner = null) {
  const { fn } = motionEasing();
  owner?.__motionTween?.cancel();
  let start = null, alive = true;
  const handle = { to, cancel: () => { alive = false; } };
  if (owner) owner.__motionTween = handle;
  const frame = now => {
    if (!alive) return;
    if (start === null) start = now;
    const p = Math.min(1, Math.max(0, (now - start) / duration));
    step(from + (to - from) * fn(p), p === 1);
    if (p < 1) requestAnimationFrame(frame);
    else if (owner?.__motionTween === handle) owner.__motionTween = null;
  };
  requestAnimationFrame(frame);
}

// El elemento sigue en la página (morphInto) y ya va hacia ese valor: se deja seguir en vez de empezar otra cuenta
const motionRunning = (el, value) => el.__motionTween?.to === value;

function settleRing(el, from, value, duration) {
  el.classList.add("is-update"); // sin la entrada desde 0 (styles.css)
  if (from === null || motionRunning(el, value)) return;
  const circle = el.querySelector(".gauge-fill");
  const label = el.querySelector(".gauge-value");
  const circ = Number(circle?.getAttribute("stroke-dasharray")) || 0;
  const paint = pct => {
    circle?.setAttribute("stroke-dashoffset", String(circ - (pct / 100) * circ));
    label?.style.setProperty("--pct", String(Math.round(pct)));
  };
  paint(from);
  motionTween(from, value, duration, (v, done) => paint(done ? value : v), el);
}

function settleCount(el, from, value, duration) {
  const node = el.firstChild?.nodeType === Node.TEXT_NODE && el.childNodes.length > 1 ? el.firstChild : el;
  if (motionRunning(el, value)) return; // la cuenta en curso termina en el mismo texto
  const final = node.textContent;
  node.textContent = String(Math.round(from));
  motionTween(from, value, duration, (v, done) => { node.textContent = done ? final : String(Math.round(v)); }, el);
}

function settleBar(el, from, value, duration) {
  if (!(value > 0) || typeof el.animate !== "function") return;
  const running = el.getAnimations().filter(a => a.id === "motion-bar");
  if (running.length && el.__motionBar === value) return; // ya va hacia ese ancho
  running.forEach(a => a.cancel());
  el.__motionBar = value;
  const ratio = Math.max(0, Math.min(4, from / value));
  const anim = el.animate([{ scale: `${ratio} 1` }, { scale: "1 1" }], { duration, easing: motionEasing().css, fill: "backwards" });
  anim.id = "motion-bar";
}

const MOTION_POP_MS = 420;

// Un latido corto (escala y opacidad) al cambiar de estado
function motionPop(el) {
  if (!el || typeof el.animate !== "function" || prefersReducedMotion()) return;
  el.getAnimations().filter(a => a.id === "motion-pop").forEach(a => a.cancel()); // un latido a la vez
  const anim = el.animate([{ scale: "0.8", opacity: 0.55 }, { scale: "1", opacity: 1 }], { duration: MOTION_POP_MS, easing: motionEasing().css });
  anim.id = "motion-pop";
}

// fresh: la vista se pintó oculta (cambio de objetivo desde Objetivo): solo se registran los valores, sin cuentas; al
// mostrarse, el anillo y los nodos hacen su entrada de siempre (styles.css), una vez
function settleMotion(root, { fresh = false } = {}) {
  if (!root) return;
  if (fresh) {
    root.querySelectorAll("[data-motion]").forEach(el => {
      const [kind, key] = el.dataset.motion.split(":");
      if (!key) return;
      const raw = el.dataset.value ?? el.textContent;
      motionValues.set(key, { value: kind === "fill" || kind === "pop" ? raw : Number(raw), from: null, start: 0 });
    });
    return;
  }
  const reduced = prefersReducedMotion(); // theme.js
  const { fn, css } = motionEasing();
  const now = performance.now();
  let staggered = 0;
  root.querySelectorAll("[data-motion]").forEach(el => {
    const [kind, key] = el.dataset.motion.split(":");
    if (!key) return;
    const raw = el.dataset.value ?? el.textContent;
    // "fill" y "pop" guardan el estado (texto); "fill" anima su escala de 0 a 1 cuando cambia
    const value = kind === "fill" || kind === "pop" ? raw : Number(raw);
    if (kind !== "fill" && kind !== "pop" && !Number.isFinite(value)) return;
    const entry = motionValues.get(key);
    if (kind === "pop") {
      motionValues.set(key, { value, from: null, start: 0 });
      if (entry && entry.value !== value) motionPop(el);
      return;
    }
    const elapsed = entry && entry.from !== null ? now - entry.start : Infinity;
    const at = p => (kind === "fill" ? fn(p) : entry.from + (entry.value - entry.from) * fn(p)); // dónde iba
    let from = null, duration = MOTION_VALUE_MS, delay = 0;
    if (entry && entry.value !== value && !reduced) {
      if (kind === "fill") { from = 0; delay = staggered++ * MOTION_STAGGER_MS; }
      else from = elapsed < MOTION_VALUE_MS ? at(elapsed / MOTION_VALUE_MS) : entry.value;
      motionValues.set(key, { value, from, start: now + delay });
    } else if (entry && entry.value === value && elapsed < MOTION_VALUE_MS && !reduced) {
      from = at(Math.max(0, elapsed) / MOTION_VALUE_MS); // mismo valor a mitad de camino: sigue
      duration = MOTION_VALUE_MS - Math.max(0, elapsed);
      delay = Math.max(0, -elapsed);
    } else {
      motionValues.set(key, { value, from: null, start: 0 });
    }
    if (kind === "ring") { if (entry) settleRing(el, from, value, duration); return; }
    if (from === null) return;
    if (kind === "count") settleCount(el, from, value, duration);
    else if (kind === "bar") settleBar(el, from, value, duration);
    else if (kind === "fill" && typeof el.animate === "function") {
      el.animate([{ scale: `${from} 1`, opacity: 0.4 + 0.6 * from }, { scale: "1 1", opacity: 1 }],
        { duration, easing: css, delay, fill: "backwards" });
    }
  });
}

// ---------- Actualizar en su lugar ----------
// Repintar con innerHTML destruye y recrea todo: un botón de estado recién creado no tiene transición (su fondo salta),
// las entradas de tarjetas y barras se repiten y el foco se pierde. morphInto(root, html) deja root con el contenido de
// html tocando solo lo distinto: textos, atributos y los nodos que entran o salen. Filas y tarjetas se emparejan por id o
// por su data-* (MORPH_KEYS): una fila sigue siendo el mismo nodo aunque cambie su contenido; lo demás, por posición y
// etiqueta. Devuelve los elementos que no existían (quien llama decide su entrada).

const MORPH_KEYS = ["id", "data-plan-row", "data-skill-row", "data-goal-id", "data-group", "data-area", "data-area-filter",
  "data-skill-filter", "data-group-mode", "data-status", "data-context", "data-motion"];
// Clases que el código pone después de pintar (no vienen en el HTML): el repintado en su lugar las conserva
const MORPH_STICKY = ["is-update", "is-expanded"];

// Ids que cambian en cada pintado (máscara del Motivo de Ruta, route-motif.js): no identifican nada
const MORPH_GENERATED_ID = /^route-draw-mask-/;

function morphKey(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  for (const name of MORPH_KEYS) {
    const value = node.getAttribute(name);
    if (value && !(name === "id" && MORPH_GENERATED_ID.test(value))) return `${node.tagName}|${name}=${value}`;
  }
  return null;
}

function morphAttrs(el, next) {
  const sticky = MORPH_STICKY.filter(c => el.classList.contains(c) && !next.classList.contains(c));
  for (const { name, value } of [...next.attributes]) {
    const want = name === "class" && sticky.length ? `${value} ${sticky.join(" ")}` : value;
    if (el.getAttribute(name) !== want) el.setAttribute(name, want);
  }
  for (const { name } of [...el.attributes]) {
    if (next.hasAttribute(name)) continue;
    if (name === "class" && sticky.length) el.setAttribute("class", sticky.join(" "));
    else el.removeAttribute(name);
  }
}

function morphChildren(parent, next, added, keep) {
  const olds = [...parent.childNodes];
  const keyed = new Map();
  const free = [];
  olds.forEach(node => {
    const key = morphKey(node);
    if (!key) free.push(node);
    else if (!keyed.has(key)) keyed.set(key, node);
  });
  let f = 0;
  const news = [...next.childNodes];
  const pairs = news.map(node => {
    const key = morphKey(node);
    if (key) {
      const old = keyed.get(key) || null;
      keyed.delete(key);
      return old;
    }
    for (let i = f; i < free.length; i++) {
      const old = free[i];
      if (old.nodeType === node.nodeType && (old.nodeType !== Node.ELEMENT_NODE || old.tagName === node.tagName)) { f = i + 1; return old; }
    }
    return null;
  });
  // Primero sale lo que ya no está: así lo que queda suele seguir en orden y no se mueve (mover un nodo reinicia sus
  // animaciones y le quita el foco)
  const kept = new Set(pairs.filter(Boolean));
  olds.forEach(node => { if (!kept.has(node)) node.remove(); });
  let cursor = parent.firstChild;
  news.forEach((node, i) => {
    const old = pairs[i];
    if (!old) {
      parent.insertBefore(node, cursor);
      if (node.nodeType === Node.ELEMENT_NODE) added.push(node);
      return;
    }
    if (old === cursor) cursor = cursor.nextSibling;
    else parent.insertBefore(old, cursor);
    morphNode(old, node, added, keep);
  });
}

function morphNode(el, next, added, keep) {
  if (el.nodeType !== Node.ELEMENT_NODE) {
    if (el.nodeValue !== next.nodeValue) el.nodeValue = next.nodeValue;
    return;
  }
  if (keep && el.matches(keep)) return; // lo actualiza su dueño (p. ej. las ofertas, que llegan después)
  morphAttrs(el, next);
  morphChildren(el, next, added, keep);
}

// Como morphInto, pero el propio el pasa a ser el elemento raíz de html (misma etiqueta)
function morphElement(el, html, { keep = null } = {}) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const next = template.content.firstElementChild;
  const added = [];
  if (next) morphNode(el, next, added, keep);
  return added;
}

// keep: selector de partes que no se tocan (las pinta otro código)
function morphInto(root, html, { keep = null } = {}) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const added = [];
  morphChildren(root, template.content, added, keep);
  return added;
}

// ---------- Fundido, desplazamiento y entradas ----------
// Con las duraciones y la curva de styles.css (--dur, --dur-slow, --ease-out). Solo opacity y transform, sin
// will-change fijo (la animación promueve la capa mientras dura). Nada de esto corre con movimiento reducido.

function motionMs(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith("ms") ? n : n * 1000;
}

// Fundido corto de algo que cambió en su lugar: opacidad .35 → 1 en --dur (los valores de view-fade, styles.css). Si ya
// estaba en un fundido, sigue desde la opacidad que tenía (no vuelve a bajar)
function motionFade(el) {
  if (!el || typeof el.animate !== "function" || prefersReducedMotion()) return;
  const running = el.getAnimations().filter(a => a.id === "motion-fade");
  const from = running.length ? Math.max(0.35, Number(getComputedStyle(el).opacity) || 0.35) : 0.35;
  running.forEach(a => a.cancel());
  const anim = el.animate([{ opacity: from }, { opacity: 1 }], { duration: motionMs("--dur", 200), easing: motionEasing().css });
  anim.id = "motion-fade";
}

// Un elemento que vuelve a verse (pestaña, filtro) no repite su entrada (tarjetas que suben, barras que crecen desde 0):
// sus animaciones CSS de entrada se dan por terminadas; las que se repiten sin fin (cargando) siguen
function motionSkipEntry(root) {
  if (typeof root?.getAnimations !== "function") return;
  root.getAnimations({ subtree: true }).forEach(anim => {
    if (anim instanceof CSSAnimation && anim.effect?.getComputedTiming().iterations !== Infinity) anim.finish();
  });
}

// FLIP: motionRects(elementos) antes del cambio; motionFlip(rects) después lleva cada uno desde donde estaba hasta su
// lugar nuevo con transform (calc(--dur-slow * 2), como las barras), sin que nada salte
function motionRects(elements) {
  return new Map([...elements].map(el => [el, el.getBoundingClientRect()]));
}

function motionFlip(rects) {
  if (prefersReducedMotion()) return;
  const duration = motionMs("--dur-slow", 250) * 2;
  const easing = motionEasing().css;
  rects.forEach((before, el) => {
    if (!el.isConnected || typeof el.animate !== "function") return;
    el.getAnimations().filter(a => a.id === "motion-flip").forEach(a => a.cancel());
    if (!el.getClientRects().length) return; // quedó oculto (filtro): nada que deslizar
    const now = el.getBoundingClientRect();
    const dx = before.left - now.left, dy = before.top - now.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    const anim = el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration, easing });
    anim.id = "motion-flip";
  });
}

// ---------- Sin saltos de scroll ----------
// Si un cambio deja la página más baja que el punto que se está viendo, el navegador sube la página de golpe.
// keepScrollRoom(change) reserva, antes del cambio, el alto justo de <main> (min-height) para que su final siga en el
// borde inferior de la ventana; al subir el usuario ese hueco ya no se ve y la reserva baja con él hasta desaparecer.
let scrollRoom = null; // { main, base, onScroll }

function releaseScrollRoom() {
  if (!scrollRoom) return;
  scrollRoom.main.style.minHeight = "";
  window.removeEventListener("scroll", scrollRoom.onScroll);
  scrollRoom = null;
}

// Alto de <main> que necesita la ventana: hasta su borde inferior
function scrollRoomNeed(main) {
  const rect = main.getBoundingClientRect();
  const below = document.documentElement.scrollHeight - (rect.bottom + window.scrollY); // lo que hay después de <main>
  return Math.ceil(window.innerHeight - rect.top - below);
}

// Alto que tendría <main> sin la reserva: hasta el final de su último hijo a la vista, más su relleno inferior
function scrollRoomNatural(main) {
  const top = main.getBoundingClientRect().top;
  let bottom = top;
  for (const child of main.children) {
    if (!child.getClientRects().length || getComputedStyle(child).position === "fixed") continue;
    bottom = Math.max(bottom, child.getBoundingClientRect().bottom);
  }
  return bottom - top + (parseFloat(getComputedStyle(main).paddingBottom) || 0);
}

function fitScrollRoom() {
  if (!scrollRoom) return;
  const { main, base } = scrollRoom;
  const need = scrollRoomNeed(main);
  if (need <= base || scrollRoomNatural(main) >= need) releaseScrollRoom();
  else main.style.minHeight = `${need}px`;
}

function keepScrollRoom(change) {
  const main = document.querySelector("main");
  if (!main) { change(); return; }
  if (!scrollRoom) {
    main.style.minHeight = "";
    // Al desplazarse se ajusta una vez por cuadro (lee el layout), no en cada evento
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; fitScrollRoom(); });
    };
    scrollRoom = { main, base: parseFloat(getComputedStyle(main).minHeight) || 0, onScroll };
    window.addEventListener("scroll", scrollRoom.onScroll, { passive: true });
  }
  const need = scrollRoomNeed(main);
  if (need > scrollRoom.base) main.style.minHeight = `${need}px`;
  change();
  fitScrollRoom(); // si lo nuevo ya llena la ventana, no hace falta reservar nada
}

// Cambio de usuario: los valores del anterior no son punto de partida de nada
document.addEventListener("skillmap:user", () => motionValues.clear());
