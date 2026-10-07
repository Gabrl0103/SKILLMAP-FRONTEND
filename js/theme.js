// Tema claro/oscuro: atributo data-theme en <html> (claro por defecto). El script inline del <head> aplica el tema
// guardado antes del primer pintado; aquí van setTheme y el interruptor sol/luna de la barra superior.
// TEMPORAL: la preferencia vive en localStorage; en Fase 4 pasa al backend.

const THEME_KEY = "skillmap-theme"; // misma clave que el script del <head> en index.html
const THEMES = ["light", "dark"];

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* almacenamiento bloqueado: el tema dura la sesión */ }
  syncThemeSwitch();
}

// Sol y luna: el botón del tema activo queda presionado
function syncThemeSwitch() {
  const theme = getTheme();
  document.querySelectorAll("[data-theme-option]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.themeOption === theme));
  });
}

document.querySelectorAll("[data-theme-option]").forEach(button => {
  button.addEventListener("click", () => setTheme(button.dataset.themeOption));
});
syncThemeSwitch();
