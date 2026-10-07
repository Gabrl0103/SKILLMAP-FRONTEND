// Preferencias de la app: tema (data-theme en <html>, claro por defecto) y "Reducir animaciones" (data-motion="reduced");
// showIntro lo lee js/intro.js. El backend (/api/settings) es la fuente de verdad; localStorage solo guarda una copia del
// tema y de las animaciones para que el script del <head> los aplique antes del primer pintado (sin parpadeo).
// Si el backend no responde, los cambios se aplican igual en esta sesión y quedan en la copia local.
// Usa API_BASE_URL (dashboard.js): las peticiones salen después de DOMContentLoaded.

const THEME_KEY = "skillmap-theme";   // mismas claves que el script del <head> en index.html
const MOTION_KEY = "skillmap-motion";
const THEMES = ["light", "dark"];

let settingsState = null;             // última respuesta de /api/settings (null hasta que llega)
let settingsRequest = null;
const settingsTouched = new Set();    // campos que el usuario cambió en esta sesión: la respuesta del GET no los pisa

function cacheSetting(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* almacenamiento bloqueado: solo falta la copia local */ }
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function getReduceMotion() {
  return document.documentElement.getAttribute("data-motion") === "reduced";
}

// "Reducir animaciones" de Ajustes o la preferencia del sistema: los dos valen lo mismo
function prefersReducedMotion() {
  return getReduceMotion() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Avisa a las vistas (Ajustes) de que una preferencia cambió
function notifySettingsChange() {
  document.dispatchEvent(new CustomEvent("skillmap:settings"));
}

function applyTheme(theme) {
  if (!THEMES.includes(theme)) return;
  document.documentElement.setAttribute("data-theme", theme);
  cacheSetting(THEME_KEY, theme);
  syncThemeSwitch();
  notifySettingsChange();
}

function applyReduceMotion(reduced) {
  if (reduced) document.documentElement.setAttribute("data-motion", "reduced");
  else document.documentElement.removeAttribute("data-motion");
  cacheSetting(MOTION_KEY, reduced ? "reduced" : "");
  notifySettingsChange();
}

// Mensaje listo para mostrar: el "message" del backend cuando lo hay
async function apiError(res) {
  const body = await res.json().catch(() => null);
  return new Error(body?.message || `El servidor respondió con un error (${res.status}).`);
}

function fetchSettings({ fresh = false } = {}) {
  if (fresh) settingsRequest = null;
  if (!settingsRequest) {
    settingsRequest = fetch(`${API_BASE_URL}/api/settings`)
      .then(async res => {
        if (!res.ok) throw await apiError(res);
        settingsState = await res.json();
        return settingsState;
      })
      .catch(err => { settingsRequest = null; throw err; }); // si falla, se reintenta en la próxima llamada
  }
  return settingsRequest;
}

// Lee los ajustes del backend y aplica lo que difiera de la copia local (gana el backend)
async function loadSettings(options) {
  const settings = await fetchSettings(options);
  if (!settingsTouched.has("theme") && settings.theme !== getTheme()) applyTheme(settings.theme);
  if (!settingsTouched.has("reduceMotion") && settings.reduceMotion !== getReduceMotion()) applyReduceMotion(settings.reduceMotion);
  notifySettingsChange();
  return settings;
}

// Guarda solo los campos dados (PATCH parcial). Rechaza si el backend no responde o no lo acepta.
async function saveSettings(changes) {
  Object.keys(changes).forEach(field => settingsTouched.add(field));
  const res = await fetch(`${API_BASE_URL}/api/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw await apiError(res);
  settingsState = await res.json();
  return settingsState;
}

// Tema y animaciones se aplican al instante; el guardado va detrás y, si falla, el cambio dura igual en esta sesión
function setTheme(theme) {
  if (!THEMES.includes(theme)) return Promise.resolve();
  settingsTouched.add("theme");
  applyTheme(theme);
  return saveSettings({ theme });
}

function setReduceMotion(reduced) {
  settingsTouched.add("reduceMotion");
  applyReduceMotion(reduced);
  return saveSettings({ reduceMotion: reduced });
}

// Sol y luna: el botón del tema activo queda presionado
function syncThemeSwitch() {
  const theme = getTheme();
  document.querySelectorAll("[data-theme-option]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.themeOption === theme));
  });
}

document.querySelectorAll("[data-theme-option]").forEach(button => {
  button.addEventListener("click", () => setTheme(button.dataset.themeOption).catch(() => { /* sin backend: solo esta sesión */ }));
});
syncThemeSwitch();
document.addEventListener("DOMContentLoaded", () => loadSettings().catch(() => { /* sin backend: queda la copia local */ }));
