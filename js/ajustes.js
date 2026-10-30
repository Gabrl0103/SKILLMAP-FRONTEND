// Vista "Ajustes". Usa loadSettings, setTheme, setReduceMotion, setLanguage, getTheme, getReduceMotion y settingsState
// (theme.js); fetchJobStats y las cachés de datos (dashboard.js); resetPerfilSkills (perfil.js); apiFetch, apiError y
// friendlyError (session.js); escapeHtml (mapa.js); t, tn, tError, getLanguage y formatNumber (i18n.js).

const GEMINI_KEY_URL = "https://aistudio.google.com/app/apikey";

const ajustesState = {
  keyEditing: false,
  keyError: null,   // error al leer /api/settings (estado de la key desconocido)
  syncing: false,
  syncResult: null, // último recálculo: { data } o { error }, para volver a pintarlo al cambiar de idioma
};

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
        .then(() => setStatus("ajustes-apariencia-status", ""))
        .catch(() => setStatus("ajustes-apariencia-status", t("ajustes.languageError"), "warning"));
    });
  });

  document.querySelector(".ajustes-switch[data-setting='reduceMotion']").addEventListener("click", () => {
    setReduceMotion(!getReduceMotion())
      .then(() => setStatus("ajustes-apariencia-status", ""))
      .catch(() => setStatus("ajustes-apariencia-status", t("ajustes.settingError"), "warning"));
  });
}

// ---------- Key de Gemini ----------

function keyLink() {
  return `<a class="ajustes-link" href="${GEMINI_KEY_URL}" target="_blank" rel="noopener noreferrer">${t("ajustes.keyHelp")}<span class="sr-only">${t("common.newTab")}</span></a>`;
}

// La key nunca llega al navegador: con key, el campo muestra puntos fijos; sin ella, un texto
function renderKeyView() {
  const gemini = settingsState?.gemini;
  let field, chip = "";
  if (!settingsState) {
    field = `<span class="ajustes-key-empty">${t(ajustesState.keyError ? "ajustes.keyUnknown" : "common.loading")}</span>`;
  } else if (gemini.configured) {
    field = `<span class="ajustes-key-dots" aria-hidden="true">••••••••••••••••••••</span><span class="sr-only">${t("ajustes.keySavedHidden")}</span>`;
    chip = gemini.source === "env"
      ? `<span class="ajustes-chip ajustes-chip--env">${t("ajustes.keyEnv")}</span>`
      : `<span class="ajustes-chip ajustes-chip--ok">${t("ajustes.keySaved")}</span>`;
  } else {
    // Sin key propia no es un error: el Analizador usa la IA incluida
    field = `<span class="ajustes-key-empty">${t("ajustes.keyNone")}</span>`;
  }
  const action = t(gemini?.configured ? "ajustes.keyChange" : "ajustes.keyAdd");
  return `
    <p id="ajustes-key-label" class="ajustes-label">${t("ajustes.keyLabel")}</p>
    <div class="ajustes-key-row">
      <div class="ajustes-key-field" role="group" aria-labelledby="ajustes-key-label">${field}</div>
      ${chip}
    </div>
    <div class="ajustes-key-actions">
      <button type="button" class="btn-pill" data-key-action="edit">${action}</button>
      ${keyLink()}
    </div>`;
}

function renderKeyForm() {
  return `
    <form class="ajustes-key-form" novalidate>
      <label for="ajustes-key-input" class="ajustes-label">${t("ajustes.keyLabel")}</label>
      <div class="ajustes-key-row">
        <input id="ajustes-key-input" class="ajustes-key-input" type="password" autocomplete="off" spellcheck="false"
          autocapitalize="off" maxlength="200" placeholder="${t("ajustes.keyPlaceholder")}" aria-describedby="ajustes-key-status">
      </div>
      <div class="ajustes-key-actions">
        <button type="submit" class="btn-pill">${t("ajustes.save")}</button>
        <button type="button" class="btn-pill btn-pill--outline" data-key-action="cancel">${t("ajustes.cancel")}</button>
        ${keyLink()}
      </div>
    </form>`;
}

function renderKey({ focus = false } = {}) {
  const container = document.getElementById("ajustes-key");
  container.innerHTML = ajustesState.keyEditing ? renderKeyForm() : renderKeyView();
  if (!focus) return;
  const target = ajustesState.keyEditing ? "#ajustes-key-input" : "[data-key-action='edit']";
  container.querySelector(target)?.focus();
}

async function saveGeminiKey(form) {
  const input = form.querySelector("#ajustes-key-input");
  const submit = form.querySelector("button[type='submit']");
  let key = input.value.trim();
  if (!key) {
    setStatus("ajustes-key-status", t("ajustes.keyMissing"), "error");
    input.focus();
    return;
  }
  submit.disabled = true;
  submit.setAttribute("aria-busy", "true");
  submit.textContent = t("ajustes.saving");
  setStatus("ajustes-key-status", "");
  try {
    const res = await apiFetch("/api/settings/gemini-key", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) throw await apiError(res);
    // 204: la key guardada es la que se usa. 200: se guardó, pero la variable de entorno tiene prioridad.
    const warning = res.status === 204 ? null : (await res.json().catch(() => null))?.warning;
    ajustesState.keyEditing = false;
    await loadSettings({ fresh: true }).catch(() => null);
    renderKey({ focus: true });
    if (warning) setStatus("ajustes-key-status", tError(warning), "warning");
    else setStatus("ajustes-key-status", t("ajustes.keyOk"), "ok");
  } catch (err) {
    setStatus("ajustes-key-status", t("ajustes.keyError", { error: friendlyError(err) }), "error");
    submit.disabled = false;
    submit.removeAttribute("aria-busy");
    submit.textContent = t("ajustes.save");
    input.focus();
  } finally {
    // La key no se queda en el campo ni en memoria, salga bien o mal
    key = null;
    input.value = "";
  }
}

function bindKey() {
  const container = document.getElementById("ajustes-key");
  container.addEventListener("click", e => {
    const action = e.target.closest("[data-key-action]")?.dataset.keyAction;
    if (!action) return;
    ajustesState.keyEditing = action === "edit";
    setStatus("ajustes-key-status", "");
    renderKey({ focus: true });
  });
  container.addEventListener("submit", e => {
    e.preventDefault();
    saveGeminiKey(e.target);
  });
  // Escape cancela la edición
  container.addEventListener("keydown", e => {
    if (e.key !== "Escape" || !ajustesState.keyEditing) return;
    ajustesState.keyEditing = false;
    setStatus("ajustes-key-status", "");
    renderKey({ focus: true });
  });
}

// ---------- Ofertas de empleo ----------

function offersText(n) {
  return tn("ajustes.offers", n, { n: formatNumber(n) });
}

// Hora local en el idioma actual: "3 oct 2026 · 02:16" o "Oct 3, 2026 · 02:16"
function formatSyncDate(iso) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat(getLanguage(), { day: "numeric", month: "short", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat(getLanguage(), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `${day.replace(/\./g, "")} · ${time}`;
}

function formatWait(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Debajo de cada fuente: su última actualización y, si el backend la sincroniza sola, cada cuántos días
function sourceMeta(s) {
  const updated = s.lastSyncAt
    ? t("ajustes.sourceUpdated", { date: `<time datetime="${escapeHtml(s.lastSyncAt)}">${formatSyncDate(s.lastSyncAt)}</time>` })
    : t("ajustes.sourceNever");
  const auto = s.autoSyncDays ? ` · ${t("ajustes.autoSync", { name: escapeHtml(s.name), n: s.autoSyncDays })}` : "";
  return `<span class="ajustes-source-meta">${updated}${auto}</span>`;
}

function renderJobStats(stats) {
  const sources = stats.sources.length
    ? stats.sources.map(s => `<li><strong>${escapeHtml(s.name)}</strong> · ${offersText(s.jobs)}${sourceMeta(s)}</li>`).join("")
    : `<li>${t("ajustes.noSources")}</li>`;
  return `
    <p class="ajustes-total"><span class="ajustes-total-num">${formatNumber(stats.totalJobs)}</span>
      <span class="ajustes-total-label">${tn("ajustes.realOffers", stats.totalJobs)}</span></p>
    <div class="ajustes-sources">
      <ul>${sources}</ul>
    </div>`;
}

async function loadJobStats() {
  const container = document.getElementById("ajustes-jobs-stats");
  try {
    container.innerHTML = renderJobStats(await fetchJobStats());
  } catch (err) {
    container.innerHTML = `<p class="ajustes-status" data-tone="error">${t("ajustes.jobsError", { error: escapeHtml(friendlyError(err)) })}</p>`;
  }
}

function syncSourceText(s) {
  const name = `<strong>${escapeHtml(s.source)}</strong>`;
  if (s.status === "SYNCED") {
    const detail = s.added ? tn("ajustes.newOffers", s.added, { n: formatNumber(s.added) }) : t("ajustes.noNewOffers");
    return t("ajustes.synced", { name, detail });
  }
  if (s.status === "SKIPPED") {
    return s.minutesUntilNextSync > 0
      ? t("ajustes.upToDateWait", { name, wait: formatWait(s.minutesUntilNextSync) })
      : t("ajustes.upToDate", { name });
  }
  return t("ajustes.syncFailed", { name }) + (s.message ? ` · ${escapeHtml(tError(s.message))}` : "");
}

// Resultado del último recálculo (o su error) en el idioma actual
function renderSyncResult() {
  const result = document.getElementById("ajustes-sync-result");
  const last = ajustesState.syncResult;
  result.dataset.tone = last?.error ? "error" : "";
  if (!last) { result.innerHTML = ""; return; }
  if (last.error) { result.innerHTML = `<p>${t("ajustes.syncError", { error: escapeHtml(friendlyError(last.error)) })}</p>`; return; }
  const data = last.data;
  const anyUpdated = data.sources.some(s => s.updated);
  const summary = t(data.demandRecalculated ? "ajustes.syncRecalculated" : anyUpdated ? "ajustes.syncNotEnough" : "ajustes.syncSame");
  result.innerHTML = `<p class="ajustes-sync-summary">${summary}</p><ul>${data.sources.map(s => `<li>${syncSourceText(s)}</li>`).join("")}</ul>`;
}

// Tras recalcular, los datos guardados en memoria quedan viejos: se descartan para que cada vista los vuelva a pedir.
// Mi Ruta se recarga ya; Mapa Visual y Perfil, la próxima vez que se abran.
function invalidateJobData(demandChanged) {
  jobStatsRequest = null;
  if (!demandChanged) return;
  skillsRequest = null;
  readinessRequests.clear();
  mapaRequest = null;
  resetPerfilSkills();
  if (getActiveGoalId()) loadDashboard(getActiveGoalId());
}

async function syncJobs() {
  if (ajustesState.syncing) return;
  ajustesState.syncing = true;
  const button = document.getElementById("ajustes-sync");
  const label = button.querySelector("[data-label]");
  const result = document.getElementById("ajustes-sync-result");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  label.textContent = t("ajustes.syncing");
  ajustesState.syncResult = null;
  result.dataset.tone = "";
  result.innerHTML = `<p>${t("ajustes.syncConsulting")}</p>`;
  try {
    const res = await apiFetch("/api/jobs/sync", { method: "POST" });
    if (!res.ok) throw await apiError(res);
    const data = await res.json();
    ajustesState.syncResult = { data };
    renderSyncResult();
    invalidateJobData(data.demandRecalculated || data.sources.some(s => s.updated));
    await loadJobStats();
  } catch (err) {
    ajustesState.syncResult = { error: err };
    renderSyncResult();
  } finally {
    ajustesState.syncing = false;
    button.disabled = false;
    button.removeAttribute("aria-busy");
    label.textContent = t("ajustes.sync");
  }
}

// ---------- Vista ----------

// Cada apertura vuelve a leer ajustes (estado de la key) y estadísticas
function openAjustes() {
  syncApariencia();
  if (!ajustesState.keyEditing) renderKey();
  loadSettings({ fresh: true })
    .then(() => { ajustesState.keyError = null; setStatus("ajustes-apariencia-status", ""); })
    .catch(err => {
      ajustesState.keyError = err;
      setStatus("ajustes-apariencia-status", t("ajustes.readError", { error: friendlyError(err) }), "warning");
    })
    .finally(() => { syncApariencia(); if (!ajustesState.keyEditing) renderKey(); });
  loadJobStats();
}

function initAjustes() {
  bindApariencia();
  bindKey();
  document.getElementById("ajustes-sync").addEventListener("click", syncJobs);
  // Tema o animaciones cambiados desde otro sitio (barra superior, respuesta del backend)
  document.addEventListener("skillmap:settings", syncApariencia);
  syncApariencia();
}

// Cambio de usuario: no quedan mensajes ni formularios a medias de la sesión anterior
document.addEventListener("skillmap:user", () => {
  ajustesState.keyEditing = false;
  ajustesState.keyError = null;
  renderKey();
  ["ajustes-apariencia-status", "ajustes-key-status"].forEach(id => setStatus(id, ""));
  ajustesState.syncResult = null;
  renderSyncResult();
});

// Cambio de idioma: se vuelve a pintar lo dibujado con JS. Los avisos de guardado se borran (eran del otro idioma);
// el formulario de la key, si está abierto, no se toca para no perder lo escrito.
document.addEventListener("skillmap:language", () => {
  ["ajustes-apariencia-status", "ajustes-key-status"].forEach(id => setStatus(id, ""));
  if (!ajustesState.keyEditing) renderKey();
  document.querySelector("#ajustes-sync [data-label]").textContent = t(ajustesState.syncing ? "ajustes.syncing" : "ajustes.sync");
  if (!ajustesState.syncing) renderSyncResult();
  if (!document.getElementById("view-ajustes").classList.contains("hidden")) loadJobStats();
  syncApariencia();
});

document.addEventListener("DOMContentLoaded", initAjustes);
