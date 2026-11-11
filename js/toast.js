// Aviso breve compartido por Objetivo (cambio de objetivo), Habilidades y Mi Ruta ("Tu semana": cambio de estado). Es una
// píldora chica de vidrio en la esquina inferior derecha, ajustada a su texto, con una marca menta (el cambio quedó hecho)
// y "Deshacer" si quien lo muestra lo ofrece. Se va solo a los 3 s (TOAST_MS); mientras el puntero o el foco están encima
// espera (WCAG 2.2.1) y Esc lo cierra. Entra y sale con transform y opacity (sin animación con movimiento reducido).
// Va en #app-toast (role="status", primer hijo de <main>): los lectores de pantalla lo leen al aparecer y Mayús+Tab desde
// el principio de la vista llega a "Deshacer". Uno a la vez: el nuevo reemplaza al anterior.
// Usa escapeHtml (mapa.js) y t (i18n.js).

const TOAST_MS = 3000;
const TOAST_GRACE_MS = 1500; // lo que espera de más si al cumplirse el tiempo el puntero o el foco siguen encima
const toastState = { timer: null, left: TOAST_MS, start: 0, owner: null, onUndo: null, fallbackFocus: null, onDone: null };

function toastRegion() {
  return document.getElementById("app-toast");
}

const TOAST_CHECK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;

// owner: quién lo muestra ("objetivo", "habilidades", "semana"), para que solo ese lo quite; text: sin HTML; onUndo:
// acción de "Deshacer" (sin ella no hay botón); fallbackFocus: adónde va el foco si estaba en el aviso cuando se va;
// onDone: se llama una vez cuando el aviso se va sin "Deshacer" (se cumplió el tiempo, Esc, otro aviso lo reemplazó o
// cambió el usuario): así un cambio puede esperar los 3 s antes de hacerse (borrar un objetivo propio)
function showToast({ owner, text, onUndo = null, fallbackFocus = null, onDone = null }) {
  clearTimeout(toastState.timer);
  settleToast();
  Object.assign(toastState, { owner, onUndo, fallbackFocus, onDone, left: TOAST_MS });
  toastRegion().innerHTML = `
    <div class="app-toast">
      <span class="app-toast-mark">${TOAST_CHECK}</span>
      <p class="app-toast-text">${escapeHtml(text)}</p>
      ${onUndo ? `<button type="button" class="app-toast-undo" data-toast-undo>${t("objetivo.undo")}</button>` : ""}
    </div>`;
  resumeToast();
}

function resumeToast() {
  clearTimeout(toastState.timer);
  if (!toastRegion().firstElementChild) return;
  toastState.start = Date.now();
  toastState.timer = setTimeout(toastTimeUp, toastState.left);
}

function pauseToast() {
  if (!toastState.timer) return;
  clearTimeout(toastState.timer);
  toastState.timer = null;
  toastState.left = Math.max(TOAST_GRACE_MS, toastState.left - (Date.now() - toastState.start));
}

function toastTimeUp() {
  const region = toastRegion();
  if (region.matches(":hover") || region.contains(document.activeElement)) {
    toastState.left = TOAST_GRACE_MS;
    resumeToast();
    return;
  }
  hideToast();
}

// Quita el aviso (owner: solo si es de ese dueño). Si el foco estaba en él, pasa a fallbackFocus para no perderse.
function hideToast(owner = null, { instant = false, undone = false } = {}) {
  if (owner && toastState.owner !== owner) return;
  clearTimeout(toastState.timer);
  if (undone) toastState.onDone = null;
  settleToast();
  const fallback = toastState.fallbackFocus;
  Object.assign(toastState, { timer: null, owner: null, onUndo: null, fallbackFocus: null });
  const toast = toastRegion()?.firstElementChild;
  if (!toast) return;
  if (toast.contains(document.activeElement)) fallback?.()?.focus({ preventScroll: true });
  if (instant || getComputedStyle(toast).animationName === "none") { toast.remove(); return; }
  toast.classList.add("is-leaving");
  if (getComputedStyle(toast).animationName === "none") { toast.remove(); return; }
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}

// El aviso se va sin "Deshacer": lo que esperaba (onDone) se hace ahora, una sola vez
function settleToast() {
  const done = toastState.onDone;
  toastState.onDone = null;
  done?.();
}

function initToast() {
  const region = toastRegion();
  region.addEventListener("click", e => {
    if (!e.target.closest("[data-toast-undo]") || !toastState.onUndo) return;
    const undo = toastState.onUndo;
    hideToast(null, { undone: true }); // sale con su animación (.is-leaving), como al irse solo; sin onUndo, otro clic no hace nada
    undo();
  });
  region.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); hideToast(); }
  });
  region.addEventListener("pointerenter", pauseToast);
  region.addEventListener("pointerleave", () => { if (!region.contains(document.activeElement)) resumeToast(); });
  region.addEventListener("focusin", pauseToast);
  region.addEventListener("focusout", e => { if (!region.contains(e.relatedTarget)) resumeToast(); });
}

// Cambio de usuario o de idioma: el aviso ya no corresponde (o quedó en el otro idioma). Al cambiar de usuario lo que
// esperaba (onDone) ya no se hace: la sesión que lo pidió terminó
document.addEventListener("skillmap:user", () => { toastState.onDone = null; hideToast(null, { instant: true }); });
document.addEventListener("skillmap:language", () => hideToast(null, { instant: true }));

document.addEventListener("DOMContentLoaded", initToast);
