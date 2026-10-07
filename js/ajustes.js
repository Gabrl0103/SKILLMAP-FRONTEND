// Vista "Ajustes". Usa fetchSettings, loadSettings, setTheme, setReduceMotion, saveSettings, apiError, getTheme,
// getReduceMotion y settingsState (theme.js); API_BASE_URL, fetchJobStats y las cachés de datos (dashboard.js);
// escapeHtml (mapa.js).

const GEMINI_KEY_URL = "https://aistudio.google.com/app/apikey";
const OFFLINE_TEXT = "SkillMap no responde. Revisa que la app siga abierta e inténtalo de nuevo.";

const ajustesState = {
  keyEditing: false,
  keyError: null,   // error al leer /api/settings (estado de la key desconocido)
  syncing: false,
};

// fetch falla con TypeError cuando no hay conexión con el backend: se muestra un mensaje en lugar del técnico
function friendlyError(err) {
  return err instanceof TypeError ? OFFLINE_TEXT : err.message;
}

function setStatus(id, text, tone = "") {
  const el = document.getElementById(id);
  el.textContent = text;
  el.dataset.tone = tone; // "error" | "warning" | "ok" | ""
}

// ---------- Apariencia ----------

// Radios e interruptores reflejan el estado actual (también cuando el tema cambia desde la barra superior)
function syncApariencia() {
  const theme = getTheme();
  document.querySelectorAll("input[name='ajustes-theme']").forEach(radio => { radio.checked = radio.value === theme; });
  const motion = document.querySelector(".ajustes-switch[data-setting='reduceMotion']");
  motion.setAttribute("aria-checked", String(getReduceMotion()));
  const intro = document.querySelector(".ajustes-switch[data-setting='showIntro']");
  intro.disabled = !settingsState; // sin backend no hay dónde guardarla
  if (settingsState) intro.setAttribute("aria-checked", String(settingsState.showIntro));
}

function bindApariencia() {
  document.querySelectorAll("input[name='ajustes-theme']").forEach(radio => {
    radio.addEventListener("change", () => {
      setTheme(radio.value)
        .then(() => setStatus("ajustes-apariencia-status", ""))
        .catch(() => setStatus("ajustes-apariencia-status", "No se pudo guardar el tema: se mantiene solo hasta cerrar SkillMap.", "warning"));
    });
  });

  document.querySelector(".ajustes-switch[data-setting='reduceMotion']").addEventListener("click", () => {
    setReduceMotion(!getReduceMotion())
      .then(() => setStatus("ajustes-apariencia-status", ""))
      .catch(() => setStatus("ajustes-apariencia-status", "No se pudo guardar el ajuste: se mantiene solo hasta cerrar SkillMap.", "warning"));
  });

  // La introducción solo se guarda (la pantalla llega en otra fase): si el backend falla, el interruptor vuelve atrás
  const intro = document.querySelector(".ajustes-switch[data-setting='showIntro']");
  intro.addEventListener("click", async () => {
    const next = intro.getAttribute("aria-checked") !== "true";
    intro.setAttribute("aria-checked", String(next));
    try {
      await saveSettings({ showIntro: next });
      setStatus("ajustes-apariencia-status", "");
    } catch (err) {
      intro.setAttribute("aria-checked", String(!next));
      setStatus("ajustes-apariencia-status", `No se pudo guardar: ${friendlyError(err)}`, "error");
    }
  });
}

// ---------- Key de Gemini ----------

function keyLink() {
  return `<a class="ajustes-link" href="${GEMINI_KEY_URL}" target="_blank" rel="noopener noreferrer">¿Cómo conseguir una key?<span class="sr-only"> (se abre en otra pestaña)</span></a>`;
}

// La key nunca llega al navegador: con key, el campo muestra puntos fijos; sin ella, un texto
function renderKeyView() {
  const gemini = settingsState?.gemini;
  let field, chip = "";
  if (!settingsState) {
    field = ajustesState.keyError
      ? `<span class="ajustes-key-empty">Estado desconocido</span>`
      : `<span class="ajustes-key-empty">Cargando…</span>`;
  } else if (gemini.configured) {
    field = `<span class="ajustes-key-dots" aria-hidden="true">••••••••••••••••••••</span><span class="sr-only">Key guardada, oculta</span>`;
    chip = gemini.source === "env"
      ? `<span class="ajustes-chip ajustes-chip--env">Definida por variable de entorno</span>`
      : `<span class="ajustes-chip ajustes-chip--ok">Guardada</span>`;
  } else {
    field = `<span class="ajustes-key-empty">Sin key: el Analizador no funcionará hasta que añadas una</span>`;
  }
  const action = gemini?.configured ? "Cambiar key" : "Añadir key";
  return `
    <p id="ajustes-key-label" class="ajustes-label">Key de Gemini</p>
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
      <label for="ajustes-key-input" class="ajustes-label">Key de Gemini</label>
      <div class="ajustes-key-row">
        <input id="ajustes-key-input" class="ajustes-key-input" type="password" autocomplete="off" spellcheck="false"
          autocapitalize="off" maxlength="200" placeholder="Pega aquí tu key" aria-describedby="ajustes-key-status">
      </div>
      <div class="ajustes-key-actions">
        <button type="submit" class="btn-pill">Guardar</button>
        <button type="button" class="btn-pill btn-pill--outline" data-key-action="cancel">Cancelar</button>
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
    setStatus("ajustes-key-status", "Pega tu key antes de guardar.", "error");
    input.focus();
    return;
  }
  submit.disabled = true;
  submit.setAttribute("aria-busy", "true");
  submit.textContent = "Guardando…";
  setStatus("ajustes-key-status", "");
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings/gemini-key`, {
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
    if (warning) setStatus("ajustes-key-status", warning, "warning");
    else setStatus("ajustes-key-status", "Key guardada. El Analizador ya puede usarla.", "ok");
  } catch (err) {
    setStatus("ajustes-key-status", `No se pudo guardar la key: ${friendlyError(err)}`, "error");
    submit.disabled = false;
    submit.removeAttribute("aria-busy");
    submit.textContent = "Guardar";
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

const numberFormat = new Intl.NumberFormat("es");
const dateFormat = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });

function offersText(n) {
  return `${numberFormat.format(n)} ${n === 1 ? "oferta" : "ofertas"}`;
}

// Hora local: "3 oct 2026 · 02:16"
function formatSyncDate(iso) {
  const date = new Date(iso);
  return `${dateFormat.format(date).replace(/\./g, "")} · ${timeFormat.format(date)}`;
}

function formatWait(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function renderJobStats(stats) {
  const sources = stats.sources.length
    ? stats.sources.map(s => `<li><strong>${escapeHtml(s.name)}</strong> · ${offersText(s.jobs)}</li>`).join("")
    : `<li>Aún no hay fuentes sincronizadas</li>`;
  const updated = stats.lastSyncAt
    ? `Última actualización: <time datetime="${escapeHtml(stats.lastSyncAt)}">${formatSyncDate(stats.lastSyncAt)}</time>`
    : "Aún no se ha actualizado";
  return `
    <p class="ajustes-total"><span class="ajustes-total-num">${numberFormat.format(stats.totalJobs)}</span>
      <span class="ajustes-total-label">${stats.totalJobs === 1 ? "oferta real" : "ofertas reales"}</span></p>
    <div class="ajustes-sources">
      <ul>${sources}</ul>
      <p class="ajustes-updated">${updated}</p>
    </div>`;
}

async function loadJobStats() {
  const container = document.getElementById("ajustes-jobs-stats");
  try {
    container.innerHTML = renderJobStats(await fetchJobStats());
  } catch (err) {
    container.innerHTML = `<p class="ajustes-status" data-tone="error">No pudimos leer las ofertas: ${escapeHtml(friendlyError(err))}</p>`;
  }
}

function syncSourceText(s) {
  const name = escapeHtml(s.source);
  if (s.status === "SYNCED") {
    return `<strong>${name}</strong>: actualizada · ${s.added ? `${offersText(s.added)} ${s.added === 1 ? "nueva" : "nuevas"}` : "sin ofertas nuevas"}`;
  }
  if (s.status === "SKIPPED") {
    return s.minutesUntilNextSync > 0
      ? `<strong>${name}</strong>: ya está al día · podrás actualizarla en ${formatWait(s.minutesUntilNextSync)}`
      : `<strong>${name}</strong>: ya está al día`;
  }
  return `<strong>${name}</strong>: no se pudo actualizar${s.message ? ` · ${escapeHtml(s.message)}` : ""}`;
}

// Tras recalcular, los datos guardados en memoria quedan viejos: se descartan para que cada vista los vuelva a pedir.
// Mi Ruta se recarga ya; Mapa Visual y Perfil, la próxima vez que se abran.
function invalidateJobData(demandChanged) {
  jobStatsRequest = null;
  if (!demandChanged) return;
  skillsRequest = null;
  readinessRequests.clear();
  mapaRequest = null;
  if (!perfilState.loading) perfilState.skills = { skills: null, error: null };
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
  label.textContent = "Recalculando…";
  result.dataset.tone = "";
  result.innerHTML = `<p>Consultando las fuentes de ofertas. Puede tardar unos segundos.</p>`;
  try {
    const res = await fetch(`${API_BASE_URL}/api/jobs/sync`, { method: "POST" });
    if (!res.ok) throw await apiError(res);
    const data = await res.json();
    const anyUpdated = data.sources.some(s => s.updated);
    const summary = data.demandRecalculated
      ? "Tu ruta se recalculó con las ofertas nuevas."
      : anyUpdated ? "Hay ofertas nuevas, pero aún no bastan para recalcular la ruta." : "Tu ruta sigue igual.";
    result.innerHTML = `<p class="ajustes-sync-summary">${summary}</p><ul>${data.sources.map(s => `<li>${syncSourceText(s)}</li>`).join("")}</ul>`;
    invalidateJobData(data.demandRecalculated || anyUpdated);
    await loadJobStats();
  } catch (err) {
    result.dataset.tone = "error";
    result.innerHTML = `<p>No se pudo recalcular: ${escapeHtml(friendlyError(err))}</p>`;
  } finally {
    ajustesState.syncing = false;
    button.disabled = false;
    button.removeAttribute("aria-busy");
    label.textContent = "Recalcular ruta con ofertas nuevas";
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
      setStatus("ajustes-apariencia-status", `No pudimos leer tus ajustes: ${friendlyError(err)} Los cambios de tema y animaciones se aplican solo en esta sesión.`, "warning");
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

document.addEventListener("DOMContentLoaded", initAjustes);
