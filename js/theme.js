// Tema claro/oscuro: atributo data-theme en <html> (claro por defecto). El script inline del <head> aplica el tema
// guardado antes del primer pintado; aquí van setTheme y el botón temporal para alternar.
// TEMPORAL: la preferencia vive en localStorage; en Fase 4 pasa al backend y el botón se quita.

const THEME_KEY = "skillmap-theme"; // misma clave que el script del <head> en index.html
const THEMES = ["light", "dark"];

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* almacenamiento bloqueado: el tema dura la sesión */ }
  syncThemeToggle();
}

function syncThemeToggle() {
  const button = document.getElementById("theme-toggle");
  if (!button) return;
  button.setAttribute("aria-pressed", String(getTheme() === "dark")); // etiqueta fija "Modo oscuro"
}

document.getElementById("theme-toggle")?.addEventListener("click", () => setTheme(getTheme() === "dark" ? "light" : "dark"));
syncThemeToggle();
