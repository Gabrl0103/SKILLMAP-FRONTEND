// Vista "Ajustes": Apariencia, Idioma y Seguridad (perfil.js). Las ofertas de empleo ya no se ven ni se recalculan aquí:
// el backend actualiza Arbeitnow y Remotive solo al abrir la app, y Mi Ruta y el Mapa citan las fuentes. Usa
// loadSettings, setTheme, setReduceMotion, setLanguage, getTheme y getReduceMotion (theme.js); friendlyError
// (session.js) y t y getLanguage (i18n.js).

function setStatus(id, text, tone = "") {
  const el = document.getElementById(id);
  el.textContent = text;
  el.dataset.tone = tone; // "error" | "warning" | "ok" | ""
}

// ---------- Apariencia ----------

// Radios e interruptor reflejan el estado actual (también cuando el tema cambia desde la barra superior)
function syncApariencia() {
  const theme = getTheme();
  document.querySelectorAll("input[name='ajustes-theme']").forEach(radio => { radio.checked = radio.value === theme; });
  document.querySelectorAll("input[name='ajustes-language']").forEach(radio => { radio.checked = radio.value === getLanguage(); });
  const motion = document.querySelector(".ajustes-switch[data-setting='reduceMotion']");
  motion.setAttribute("aria-checked", String(getReduceMotion()));
}

function bindApariencia() {
  document.querySelectorAll("input[name='ajustes-theme']").forEach(radio => {
    radio.addEventListener("change", () => {
      setTheme(radio.value)
        .then(() => setStatus("ajustes-apariencia-status", ""))
        .catch(() => setStatus("ajustes-apariencia-status", t("ajustes.themeError"), "warning"));
    });
  });

  // Idioma: se aplica al instante (toda la app se vuelve a pintar) y se guarda en el backend como el tema
  document.querySelectorAll("input[name='ajustes-language']").forEach(radio => {
    radio.addEventListener("change", () => {
      setLanguage(radio.value)
        .then(() => setStatus("ajustes-idioma-status", ""))
        .catch(() => setStatus("ajustes-idioma-status", t("ajustes.languageError"), "warning"));
    });
  });

  document.querySelector(".ajustes-switch[data-setting='reduceMotion']").addEventListener("click", () => {
    setReduceMotion(!getReduceMotion())
      .then(() => setStatus("ajustes-apariencia-status", ""))
      .catch(() => setStatus("ajustes-apariencia-status", t("ajustes.settingError"), "warning"));
  });
}

// ---------- Vista ----------

// Cada apertura vuelve a leer ajustes (tema, animaciones e idioma guardados)
function openAjustes() {
  syncApariencia();
  loadSettings({ fresh: true })
    .then(() => setStatus("ajustes-apariencia-status", ""))
    .catch(err => setStatus("ajustes-apariencia-status", t("ajustes.readError", { error: friendlyError(err) }), "warning"))
    .finally(syncApariencia);
}

function initAjustes() {
  bindApariencia();
  // Tema o animaciones cambiados desde otro sitio (barra superior, respuesta del backend)
  document.addEventListener("skillmap:settings", syncApariencia);
  syncApariencia();
}

// Cambio de usuario: no quedan mensajes de la sesión anterior
document.addEventListener("skillmap:user", () => {
  ["ajustes-apariencia-status", "ajustes-idioma-status"].forEach(id => setStatus(id, ""));
});

// Cambio de idioma: se vuelve a pintar lo dibujado con JS. Los avisos de guardado se borran (eran del otro idioma)
document.addEventListener("skillmap:language", () => {
  ["ajustes-apariencia-status", "ajustes-idioma-status"].forEach(id => setStatus(id, ""));
  syncApariencia();
});

document.addEventListener("DOMContentLoaded", initAjustes);
