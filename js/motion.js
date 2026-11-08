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

// Llama a step(valor, terminó) en cada cuadro, de from a to en duration ms, con la curva de --ease-out
function motionTween(from, to, duration, step) {
  const { fn } = motionEasing();
  let start = null;
  const frame = now => {
    if (start === null) start = now;
    const p = Math.min(1, Math.max(0, (now - start) / duration));
    step(from + (to - from) * fn(p), p === 1);
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function settleRing(el, from, value, duration) {
  el.classList.add("is-update"); // sin la entrada desde 0 (styles.css)
  if (from === null) return;
  const circle = el.querySelector(".gauge-fill");
  const label = el.querySelector(".gauge-value");
  const circ = Number(circle?.getAttribute("stroke-dasharray")) || 0;
  const paint = pct => {
    circle?.setAttribute("stroke-dashoffset", String(circ - (pct / 100) * circ));
    label?.style.setProperty("--pct", String(Math.round(pct)));
  };
  paint(from);
  motionTween(from, value, duration, (v, done) => paint(done ? value : v));
}

function settleCount(el, from, value, duration) {
  const node = el.firstChild?.nodeType === Node.TEXT_NODE && el.childNodes.length > 1 ? el.firstChild : el;
  const final = node.textContent;
  node.textContent = String(Math.round(from));
  motionTween(from, value, duration, (v, done) => { node.textContent = done ? final : String(Math.round(v)); });
}

function settleBar(el, from, value, duration) {
  if (!(value > 0) || typeof el.animate !== "function") return;
  const ratio = Math.max(0, Math.min(4, from / value));
  el.animate([{ scale: `${ratio} 1` }, { scale: "1 1" }], { duration, easing: motionEasing().css, fill: "backwards" });
}

const MOTION_POP_MS = 420;

// Un latido corto (escala y opacidad) al cambiar de estado
function motionPop(el) {
  if (!el || typeof el.animate !== "function" || prefersReducedMotion()) return;
  el.animate([{ scale: "0.8", opacity: 0.55 }, { scale: "1", opacity: 1 }], { duration: MOTION_POP_MS, easing: motionEasing().css });
}

function settleMotion(root) {
  if (!root) return;
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

// Cambio de usuario: los valores del anterior no son punto de partida de nada
document.addEventListener("skillmap:user", () => motionValues.clear());
