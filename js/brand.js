// Marca Cenit: estrella de brújula de 4 puntas. La punta de arriba es la más larga: el norte, el cenit de la carrera.
// Única definición del logo; la usan la barra superior, la Introducción y Acceso (index.html, con data-brand-mark) y el
// CV imprimible (perfil.js). El favicon (assets/cenit-star.svg) repite la misma figura con colores fijos porque un archivo
// aparte no lee los tokens del tema. Estilos en la sección "Marca" de styles.css.
// La estrella es el path .brand-star (transform-box y transform-origin en el centro): la anima la aguja de abajo.

const BRAND_NAME = "Cenit";
// viewBox 24×24, centro en (12,13): arriba 12, abajo 10 y a los lados 8, con los flancos curvados hacia dentro
const BRAND_STAR_PATH = "M12 1Q14.2 10.8 20 13Q14.2 15.2 12 23Q9.8 15.2 4 13Q9.8 10.8 12 1Z";

// Cada SVG necesita su propio id de degradado (el logo aparece varias veces en el DOM)
let brandMarkCount = 0;

// Logo decorativo (aria-hidden): siempre va junto al nombre "Cenit", que es el texto que se lee
function brandMark(size = 32) {
  const id = `brand-grad-${++brandMarkCount}`;
  return `<svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="brand-stop-from"/><stop offset="1" class="brand-stop-to"/></linearGradient></defs>
    <path class="brand-star" d="${BRAND_STAR_PATH}" fill="url(#${id})"/>
  </svg>`;
}

// Marcas estáticas de index.html: data-brand-mark lleva el tamaño en px
document.querySelectorAll("[data-brand-mark]").forEach(el => {
  el.innerHTML = brandMark(Number(el.dataset.brandMark) || 32);
});

// ---------- Aguja: la estrella de la barra superior apunta a la sección activa ----------
// La punta de arriba gira hacia el ítem activo del nav (o Ajustes) con un rebote corto al llegar; con hover o foco en
// otro ítem se inclina un poco hacia él y vuelve al salir. Solo transform (Web Animations sobre .brand-star).
// El ángulo sale de las posiciones en pantalla del logo y del ítem. Como están a la misma altura, el ítem se mide contra
// un horizonte virtual a la distancia del centro del nav: el centro queda a 45° y cada ítem tiene su ángulo, con la
// separación entre ítems ampliada por NEEDLE_SPREAD.
// Sin ítem activo (detalle de habilidad) apunta al norte. Con animaciones reducidas (prefersReducedMotion, theme.js)
// queda quieta; el CSS también la fija.

const NEEDLE_BOUNCE_MS = 400;
const NEEDLE_LEAN_MS = 180;
const NEEDLE_LEAN = { share: .35, max: 10 }; // la inclinación por hover o foco: un tercio del camino, 10° como mucho
// Abre el abanico alrededor del centro del nav (45°): con el logo tan a la izquierda, los ítems quedaban a unos 5° entre
// sí y la aguja apenas se movía. El resultado se limita al cuadrante del nav (0° norte, 90° este)
const NEEDLE_SPREAD = 2.2;

const needle = { active: undefined, hover: null, focus: null };

function needleEase() {
  return getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "cubic-bezier(.16,1,.3,1)";
}

// Ángulo que tiene la estrella ahora (también a mitad de una animación)
function currentStarAngle(star) {
  const m = getComputedStyle(star).transform.match(/-?[\d.]+(e-?\d+)?/g);
  return m ? Math.atan2(Number(m[1]), Number(m[0])) * 180 / Math.PI : 0;
}

// mode: "snap" (sin animación; no corta un giro en curso), "lean" (giro corto) o "bounce" (giro con rebote de aguja)
function turnStar(star, to, mode, from = currentStarAngle(star)) {
  star.style.transform = `rotate(${to}deg)`;
  if (mode === "snap") return;
  star.getAnimations().forEach(a => { if (!(a instanceof CSSAnimation)) a.cancel(); });
  const delta = to - from;
  if (Math.abs(delta) < .5) return;
  const easing = needleEase();
  const frames = [{ transform: `rotate(${from}deg)`, easing }];
  if (mode === "bounce") {
    const over = Math.sign(delta) * Math.min(8, 2 + Math.abs(delta) * .12);
    frames.push({ transform: `rotate(${to + over}deg)`, offset: .6, easing }, { transform: `rotate(${to - over * .35}deg)`, offset: .82, easing });
  }
  frames.push({ transform: `rotate(${to}deg)` });
  star.animate(frames, { duration: mode === "bounce" ? NEEDLE_BOUNCE_MS : NEEDLE_LEAN_MS });
}

function needleAngle(star, item) {
  if (!item) return 0;
  const mark = star.closest(".logo-mark").getBoundingClientRect();
  const nav = document.querySelector(".topnav").getBoundingClientRect();
  const target = item.getBoundingClientRect();
  const sx = mark.left + mark.width / 2, sy = mark.top + mark.height / 2;
  const depth = Math.max(nav.left + nav.width / 2 - sx, 24);
  const angle = Math.atan2(target.left + target.width / 2 - sx, depth + sy - (target.top + target.height / 2)) * 180 / Math.PI;
  return Math.max(0, Math.min(90, 45 + (angle - 45) * NEEDLE_SPREAD));
}

// Lo llama positionNavIndicator (mapa.js): al cambiar de sección, al cargar y cuando el nav cambia de tamaño
function pointBrandNeedle(mode) {
  const star = document.querySelector(".topbar .brand-star");
  if (!star) return;
  const active = document.querySelector(".nav-item.active, .topbar-settings.active");
  if (!mode) mode = needle.active === undefined || needle.active === active ? "snap" : "bounce";
  needle.active = active;
  if (prefersReducedMotion()) {
    star.getAnimations().forEach(a => a.cancel());
    star.style.transform = "";
    return;
  }
  const base = needleAngle(star, active);
  const lean = needle.hover || needle.focus;
  let to = base;
  if (lean && lean !== active) {
    const pull = (needleAngle(star, lean) - base) * NEEDLE_LEAN.share;
    to += Math.max(-NEEDLE_LEAN.max, Math.min(NEEDLE_LEAN.max, pull));
  }
  turnStar(star, to, mode);
}

document.querySelectorAll(".topnav .nav-item, .topbar-settings").forEach(item => {
  item.addEventListener("pointerenter", () => { needle.hover = item; pointBrandNeedle("lean"); });
  item.addEventListener("pointerleave", () => { needle.hover = null; pointBrandNeedle("lean"); });
  item.addEventListener("focus", () => { needle.focus = item; pointBrandNeedle("lean"); });
  item.addEventListener("blur", () => { needle.focus = null; pointBrandNeedle("lean"); });
});
// "Reducir animaciones" de Ajustes o del sistema: quieta al activarlo, vuelve a apuntar al quitarlo
document.addEventListener("skillmap:settings", () => pointBrandNeedle("snap"));
window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", () => pointBrandNeedle("snap"));

// ---------- Búsqueda: Introducción y Acceso ----------
// Ahí la estrella oscila unos grados, como una aguja buscando el norte (brand-search en styles.css). Al avanzar
// (enviar el formulario de Acceso) se detiene y vuelve al norte con el rebote; si el envío falla, sigue buscando.
function setBrandSearchFound(root, found) {
  const mark = root?.querySelector(".logo-mark");
  const star = mark?.querySelector(".brand-star");
  if (!star || found === mark.classList.contains("is-found")) return;
  const from = currentStarAngle(star); // antes de quitar la oscilación
  mark.classList.toggle("is-found", found);
  if (found && !prefersReducedMotion()) turnStar(star, 0, "bounce", from);
  if (!found) {
    star.getAnimations().forEach(a => { if (!(a instanceof CSSAnimation)) a.cancel(); });
    star.style.transform = "";
  }
}
