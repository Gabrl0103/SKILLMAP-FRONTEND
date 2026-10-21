// Vista "Analizador". Usa API_BASE_URL (dashboard.js), escapeHtml (mapa.js), apiFetch y apiJson (session.js), settingsState
// (theme.js), routeDivider y routeDraw (route-motif.js), formatSyncDate (ajustes.js) y t, tn, i18nError, errorText,
// formatNumber y tSkill (i18n.js). La IA no cambia con el idioma: solo la interfaz.

// ---------- API ----------

const ANALYZER_MAX_CHARS = 8000;   // mismo tope que el backend (JobAnalyzerServiceImpl.MAX_DESCRIPTION_LENGTH)
// Sin key propia el backend usa el servicio de IA en la nube: conexión 10 s + lectura 90 s (Render tarda en despertar).
const ANALYZER_TIMEOUT_MS = 110000;
const ANALYZER_WAKE_NOTICE_MS = 5000; // pasado esto se avisa de que el servicio puede estar despertando
const HISTORY_MAX = 100;              // el backend guarda como mucho 100 análisis por usuario
const HISTORY_PAGE = 20;              // los que se ven de entrada; "Mostrar más" suma otros tantos

// POST /api/analyzer/analyze → { matchPercentage, masteredSkills[], inProgressSkills[], missingSkills[], engine, historyId }.
// engine "cache": la misma oferta ya estaba en el historial y no se llamó a la IA.
// Si falla lanza un Error: el "message" del backend cuando lo hay (errorText lo traduce) o uno propio (i18nError).
async function analyzeOffer(jobDescription) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANALYZER_TIMEOUT_MS);
  let res;
  try {
    res = await apiFetch("/api/analyzer/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription }),
      signal: controller.signal,
    });
  } catch (err) {
    throw i18nError(err.name === "AbortError" ? "analyzer.timeout" : "analyzer.offline");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    // 503 = IA sin configurar en el backend: la key es opcional, así que nunca se pide aquí.
    if (res.status === 503) throw i18nError("analyzer.aiUnavailable");
    const body = await res.json().catch(() => null);
    throw body?.message ? new Error(body.message) : i18nError("error.server", { status: res.status });
  }
  return res.json();
}

// Historial: GET /api/analyzer/history?limit= → [{ id, title, engine, matchPercentage, skillCount, createdAt }] y
// GET /api/analyzer/history/{id} → el análisis recalculado con el progreso actual (sin IA). Sin conexión, error propio.
async function historyJson(path) {
  try {
    return await apiJson(path);
  } catch (err) {
    throw err instanceof TypeError ? i18nError("analyzer.offline") : err;
  }
}

// DELETE de uno (path con id) o de todo. Un 404 cuenta como hecho: ya no estaba.
async function historyDelete(path) {
  let res;
  try {
    res = await apiFetch(path, { method: "DELETE" });
  } catch {
    throw i18nError("analyzer.offline");
  }
  if (!res.ok && res.status !== 404) throw await apiError(res);
}

// ---------- Resultado ----------

function matchMessage(pct, detected) {
  if (!detected) return t("analyzer.match.none");
  if (pct >= 70) return t("analyzer.match.high");
  if (pct >= 40) return t("analyzer.match.mid");
  return t("analyzer.match.low");
}

function renderMatch(pct, detected) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  // Mismo gauge que Mi Ruta: --pct alimenta el conteo del número (styles.css); el span es el respaldo sin CSS.
  return `
    <article class="analizador-card analizador-match">
      <h2 class="analizador-card-title">${t("analyzer.match.title")}</h2>
      <div class="gauge-ring analizador-ring">
        <svg viewBox="0 0 160 160" role="img" aria-label="${t("analyzer.match.aria", { pct })}">
          <defs><linearGradient id="gauge-grad-analizador" x1="0" y1="0" x2="1" y2="1"><stop offset="0"/><stop offset="1"/></linearGradient></defs>
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="18" class="gauge-track"/>
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="18" class="gauge-fill" stroke="url(#gauge-grad-analizador)"
            transform="rotate(-90 80 80)" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <p class="gauge-value" aria-hidden="true" style="--pct:${pct};"><span>${pct}%</span></p>
      </div>
      <p class="analizador-match-text">${matchMessage(pct, detected)}</p>
    </article>`;
}

const BREAKDOWN_ICONS = {
  mastered: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  progress: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="3.2 3.4" stroke-linecap="round"/></svg>`,
  missing: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 21.5 20h-19z" fill="currentColor"/></svg>`,
};

function renderBreakdownGroup(label, items, tone) {
  const chips = items.length
    ? `<ul class="analizador-chips">${items.map((name, i) => `<li class="analizador-chip analizador-chip--${tone}" style="--i:${i};">${escapeHtml(tSkill(name))}</li>`).join("")}</ul>`
    : `<p class="analizador-group-empty">${t("analyzer.groupEmpty")}</p>`;
  return `
    <section class="analizador-group">
      <h3 class="analizador-group-title analizador-group-title--${tone}">${BREAKDOWN_ICONS[tone]}${label} (${items.length})</h3>
      ${chips}
    </section>`;
}

function renderBreakdown(mastered, inProgress, missing) {
  return `
    <article class="analizador-card analizador-breakdown">
      <h2 class="analizador-card-title">${t("analyzer.breakdown")}</h2>
      ${renderBreakdownGroup(t("analyzer.mastered"), mastered, "mastered")}
      ${routeDivider()}
      ${renderBreakdownGroup(t("analyzer.progress"), inProgress, "progress")}
      ${routeDivider()}
      ${renderBreakdownGroup(t("analyzer.missing"), missing, "missing")}
    </article>`;
}

function renderAnalysis(r) {
  const pct = clampPct(r.matchPercentage);
  const mastered = r.masteredSkills ?? [];
  const inProgress = r.inProgressSkills ?? [];
  const missing = r.missingSkills ?? [];
  const detected = mastered.length + inProgress.length + missing.length > 0;
  return `
    <div class="analizador-grid">
      ${renderMatch(pct, detected)}
      ${renderBreakdown(mastered, inProgress, missing)}
    </div>`;
}

const clampPct = value => Math.max(0, Math.min(100, Math.round(value ?? 0)));

const NOTICE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>`;

// Aviso sobre el resultado (oferta repetida o abierta desde el historial). tabindex: recibe el foco al abrir un análisis.
function renderNotice(title, detail = "") {
  return `
    <div class="analizador-notice" tabindex="-1">
      ${NOTICE_ICON}
      <div>
        <p class="analizador-notice-title">${title}</p>
        ${detail ? `<p class="analizador-notice-text">${detail}</p>` : ""}
      </div>
    </div>`;
}

// Resultado de un análisis nuevo. Con engine "cache" se avisa: no se consultó a la IA.
function renderNewResult(r) {
  const notice = r.engine === "cache" ? renderNotice(t("analyzer.cached.title"), t("analyzer.cached.text")) : "";
  return notice + renderAnalysis(r);
}

// Análisis del historial: siempre recalculado con el progreso actual, y la oferta original plegada debajo.
function renderHistoryResult(r) {
  const meta = t("analyzer.history.savedMeta", {
    date: escapeHtml(formatSyncDate(r.createdAt)),
    engine: escapeHtml(engineLabel(r.engine)),
    pct: clampPct(r.savedMatchPercentage),
  });
  return `
    ${renderNotice(t("analyzer.history.recalculated"), meta)}
    ${renderAnalysis(r)}
    <details class="analizador-card analizador-offer">
      <summary>${t("analyzer.history.offer")}</summary>
      <p class="analizador-offer-text">${escapeHtml(r.jobDescription ?? "")}</p>
    </details>`;
}

// "gemini", "remote", "cache"…: nombre legible; uno desconocido, tal cual
function engineLabel(engine) {
  const key = `analyzer.engine.${engine}`;
  return key in I18N.es ? t(key) : String(engine ?? "");
}

// ---------- Estados: vacío, cargando y error ----------

// Antes del primer análisis: una sola tarjeta que explica qué aparecerá aquí. stale: había un resultado, pero el
// progreso cambió desde entonces (habilidad marcada en el Mapa) y su porcentaje ya no vale.
function renderAnalyzerEmpty({ stale = false } = {}) {
  const title = t(stale ? "analyzer.stale.title" : "analyzer.empty.title");
  const text = t(stale ? "analyzer.stale.text" : "analyzer.empty.text");
  return `
    <div class="analizador-card analizador-empty">
      <span class="analizador-label-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/><path d="M8 12v-1.5M10.5 12V8.5M13 12v-2.5"/></svg>
      </span>
      <div>
        <p class="analizador-empty-title">${title}</p>
        <p class="analizador-empty-text">${text}</p>
        ${routeDraw()}
      </div>
    </div>`;
}

// Skeleton: misma grilla y tarjetas que el resultado, para que no salte el layout. El texto solo lo leen los lectores
// de pantalla (labelKey: analizando una oferta o abriendo una del historial).
function renderAnalyzerSkeleton(labelKey = "analyzer.skeleton") {
  const group = widths => `
    <div class="analizador-group">
      <span class="skel skel-line analizador-skel-label"></span>
      <div class="analizador-chips">${widths.map(w => `<span class="skel analizador-skel-chip" style="width:${w}rem;"></span>`).join("")}</div>
    </div>`;
  return `
    <div class="analizador-grid analizador-skeleton" role="status">
      <span class="sr-only">${t(labelKey)}</span>
      <div class="analizador-card analizador-match" aria-hidden="true">
        <span class="skel skel-line skel-line--title"></span>
        <span class="skel skel-ring"></span>
        <span class="skel skel-line skel-line--short"></span>
        <span class="skel skel-line skel-line--shorter"></span>
      </div>
      <div class="analizador-card analizador-breakdown" aria-hidden="true">
        <div class="ruta-card-header"><span class="skel skel-line skel-line--title"></span>${routeDraw({ loop: true })}</div>
        ${group([5, 6.5, 6, 5.5, 4.5])}
        ${group([4.5, 6])}
        ${group([5.5, 6.5, 5])}
      </div>
    </div>`;
}

// Mismo aviso que los errores de la API en Mi Ruta (tarjeta con borde rosa punteado), con el mensaje del backend y
// "Reintentar". titleKey: no se pudo analizar la oferta o no se pudo abrir el análisis guardado.
function renderAnalyzerError(err, titleKey = "analyzer.error.title") {
  const offline = err.i18nKey === "analyzer.offline";
  const hint = offline
    ? `<p class="text-xs text-muted mt-2">${t("error.techDetail", { server: `<code>${API_BASE_URL || location.origin}</code>`,
      cmd: "<code>./mvnw spring-boot:run</code>" })}</p>`
    : "";
  return `
    <div class="card analizador-error" role="alert">
      <div class="min-w-0">
        <p class="text-sm font-medium text-ink">${t(titleKey)}</p>
        <p class="text-xs text-muted mt-1">${escapeHtml(errorText(err))}</p>
        ${hint}
      </div>
      <button type="button" class="btn-pill analizador-retry" data-retry>${t("analyzer.retry")}</button>
    </div>`;
}

// ---------- Eventos ----------

let analyzerRequest = 0;    // evita que un análisis viejo pise al más reciente (también al abrir uno del historial)
let analyzerShown = false;  // hay un resultado a la vista (lo que el cambio de progreso deja viejo)
let analyzerStale = false;  // el progreso cambió después de ese resultado
// Lo que muestra el área de resultado, para volver a pintarlo al cambiar de idioma: "empty" ({ stale }), "result" (la
// respuesta), "history" (un análisis guardado), "error" (el Error) u "historyError" ({ err, id }). Durante un análisis vale
// null: el skeleton se reemplaza al terminar.
let analyzerView = null;

function showAnalyzerResult(kind, data) {
  analyzerView = { kind, data };
  const render = {
    empty: renderAnalyzerEmpty,
    prefill: ({ title }) => renderNotice(t("analyzer.prefill.title", { title: escapeHtml(title) }), t("analyzer.prefill.text")),
    result: renderNewResult,
    history: renderHistoryResult,
    error: renderAnalyzerError,
    historyError: ({ err }) => renderAnalyzerError(err, "analyzer.history.openError"),
  }[kind];
  document.getElementById("analizador-result").innerHTML = render(data);
}

// Mientras analiza el botón queda deshabilitado (conserva su rosa) y el texto avisa de la espera.
function setAnalyzing(isAnalyzing) {
  const button = document.getElementById("analizador-submit");
  button.disabled = isAnalyzing;
  button.querySelector("[data-label]").textContent = t(isAnalyzing ? "analyzer.analyzing" : "analyzer.submit");
  button.setAttribute("aria-busy", String(isAnalyzing));
}

function showEmptyWarning(show) {
  document.getElementById("analizador-warning").hidden = !show;
}

// "1234 / 8.000" ("8,000" en inglés). Al llegar al tope el contador se pone rosa y se avisa una vez al lector de pantalla.
function updateCounter() {
  const length = document.getElementById("analizador-text").value.length;
  const atLimit = length >= ANALYZER_MAX_CHARS;
  const counter = document.getElementById("analizador-count");
  counter.textContent = `${formatNumber(length)} / ${formatNumber(ANALYZER_MAX_CHARS)}`;
  counter.classList.toggle("analizador-count--limit", atLimit);
  const live = document.getElementById("analizador-count-live");
  const message = atLimit ? t("analyzer.limit", { max: formatNumber(ANALYZER_MAX_CHARS) }) : "";
  if (live.textContent !== message) live.textContent = message;
}

async function runAnalysis() {
  const textarea = document.getElementById("analizador-text");
  const button = document.getElementById("analizador-submit");
  const text = textarea.value.trim();
  const result = document.getElementById("analizador-result");
  if (!text) {
    showEmptyWarning(true);
    textarea.focus();
    return;
  }
  if (button.disabled) return;
  showEmptyWarning(false);
  const requestId = ++analyzerRequest;
  const hadFocus = document.activeElement === button || result.contains(document.activeElement);
  setAnalyzing(true);
  analyzerView = null;
  result.innerHTML = renderAnalyzerSkeleton();
  result.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
  // Sin key propia se usa la IA en la nube, que se duerme (plan gratis de Render): si tarda, se explica la espera.
  const wakeTimer = setTimeout(() => {
    if (requestId !== analyzerRequest || settingsState?.gemini?.configured) return;
    result.insertAdjacentHTML("afterbegin", `<p class="analizador-wake" role="status">${t("analyzer.wake")}</p>`);
  }, ANALYZER_WAKE_NOTICE_MS);
  let failed = false;
  try {
    const r = await analyzeOffer(text.slice(0, ANALYZER_MAX_CHARS));
    // El backend ya lo guardó: el historial se pone al día aunque otro resultado haya ocupado la vista.
    if (requestId === analyzerRequest) historyState.current = r.historyId ?? null;
    loadHistory();
    if (requestId !== analyzerRequest) return;
    showAnalyzerResult("result", r);
    analyzerShown = true;
    analyzerStale = false;
  } catch (err) {
    if (requestId !== analyzerRequest) return;
    failed = true;
    showAnalyzerResult("error", err);
    analyzerShown = false;
  } finally {
    clearTimeout(wakeTimer);
  }
  setAnalyzing(false);
  // El botón pierde el foco al deshabilitarse: se devuelve a "Reintentar" si falló, o al botón principal.
  if (hadFocus) (failed ? result.querySelector("[data-retry]") : button).focus({ preventScroll: true });
}

// ---------- Historial ----------

// items: null = sin cargar; error: el último fallo al cargar. current: el análisis a la vista (se marca en la lista).
// confirm: id del que pide confirmación de borrado, "all" para todo el historial, o null. busy: borrando.
const historyState = { items: null, error: null, current: null, confirm: null, busy: false, visible: HISTORY_PAGE };
let historyRequest = 0;

const TRASH_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>`;

async function loadHistory() {
  const requestId = ++historyRequest;
  document.getElementById("analizador-history-live").textContent = ""; // el último aviso de borrado ya se leyó
  if (!historyState.items) renderHistory(); // carga inicial: estado de carga; si ya hay lista, se queda a la vista
  try {
    const items = await historyJson(`/api/analyzer/history?limit=${HISTORY_MAX}`);
    if (requestId !== historyRequest) return;
    historyState.items = Array.isArray(items) ? items : [];
    historyState.error = null;
    if (historyState.confirm !== "all" && !historyState.items.some(i => i.id === historyState.confirm)) historyState.confirm = null;
  } catch (err) {
    if (requestId !== historyRequest) return;
    historyState.error = err;
  }
  renderHistory();
}

function renderHistoryItem(item) {
  const title = escapeHtml(item.title || t("analyzer.history.untitled"));
  if (historyState.confirm === item.id) {
    return `
      <li class="analizador-history-item analizador-history-item--confirm">
        ${renderHistoryConfirm(t("analyzer.history.confirm", { title }), "analyzer.history.confirmYes", item.id)}
      </li>`;
  }
  const pct = clampPct(item.matchPercentage);
  const current = item.id === historyState.current ? ` aria-current="true"` : "";
  const deleteLabel = t("analyzer.history.delete", { title });
  return `
    <li class="analizador-history-item">
      <button type="button" class="analizador-history-open" data-history-open="${Number(item.id)}"${current}>
        <span class="analizador-history-pct" aria-hidden="true">${pct}%</span>
        <span class="analizador-history-main">
          <span class="analizador-history-name">${title}</span>
          <span class="analizador-history-meta"><time datetime="${escapeHtml(item.createdAt)}">${escapeHtml(formatSyncDate(item.createdAt))}</time>
            <span aria-hidden="true">·</span> ${escapeHtml(engineLabel(item.engine))}</span>
        </span>
        <span class="sr-only">, ${t("analyzer.match.aria", { pct })}</span>
      </button>
      <button type="button" class="analizador-icon-btn" data-history-delete="${Number(item.id)}" aria-label="${deleteLabel}" title="${deleteLabel}">${TRASH_ICON}</button>
    </li>`;
}

// Confirmación en el lugar: el borrado no se puede deshacer. target: id del análisis o "all".
function renderHistoryConfirm(text, yesKey, target) {
  const busy = historyState.busy;
  return `
    <form class="analizador-confirm" data-history-confirm="${target}" aria-labelledby="analizador-confirm-text" novalidate>
      <p id="analizador-confirm-text" class="analizador-confirm-text">${text}</p>
      <p class="analizador-confirm-error" role="alert"></p>
      <div class="analizador-confirm-actions">
        <button type="submit" class="btn-pill perfil-btn-danger"${busy ? ` aria-busy="true" disabled` : ""}>${t(busy ? "analyzer.history.deleting" : yesKey)}</button>
        <button type="button" class="btn-pill perfil-btn-outline" data-history-cancel${busy ? " disabled" : ""}>${t("analyzer.history.cancel")}</button>
      </div>
    </form>`;
}

function renderHistory() {
  const body = document.getElementById("analizador-history-body");
  const count = document.getElementById("analizador-history-count");
  const actions = document.getElementById("analizador-history-actions");
  const { items, error } = historyState;
  count.textContent = items?.length ? tn("analyzer.history.count", items.length, { n: formatNumber(items.length) }) : "";
  actions.innerHTML = items?.length && historyState.confirm !== "all"
    ? `<button type="button" class="analizador-history-clear" data-history-clear>${TRASH_ICON}${t("analyzer.history.clear")}</button>`
    : "";

  if (error && !items) {
    body.innerHTML = `
      <div class="analizador-history-error" role="alert">
        <div class="min-w-0">
          <p class="text-sm font-medium text-ink">${t("analyzer.history.error.title")}</p>
          <p class="text-xs text-muted mt-1">${escapeHtml(errorText(error))}</p>
        </div>
        <button type="button" class="btn-pill analizador-retry" data-history-retry>${t("analyzer.retry")}</button>
      </div>`;
    return;
  }
  if (!items) {
    body.innerHTML = `<p class="route-state analizador-history-state" role="status">${routeDraw({ loop: true })}${t("analyzer.history.loading")}</p>`;
    return;
  }
  if (!items.length) {
    body.innerHTML = `
      <div class="route-state analizador-history-state">
        ${routeDraw()}
        <p class="analizador-history-empty-title">${t("analyzer.history.empty.title")}</p>
        <p class="analizador-history-empty-text">${t("analyzer.history.empty.text")}</p>
      </div>`;
    return;
  }
  const clearConfirm = historyState.confirm === "all"
    ? renderHistoryConfirm(tn("analyzer.history.clearConfirm", items.length, { n: formatNumber(items.length) }), "analyzer.history.clearYes", "all")
    : "";
  const shown = items.slice(0, historyState.visible);
  const more = items.length > shown.length
    ? `<button type="button" class="btn-pill perfil-btn-outline analizador-history-more" data-history-more>${t("analyzer.history.more")}</button>`
    : "";
  // Un error al refrescar no tapa la lista que ya había: se avisa encima.
  const refreshError = error
    ? `<p class="analizador-history-refresh-error" role="alert">${escapeHtml(errorText(error))}</p>`
    : "";
  body.innerHTML = `${refreshError}${clearConfirm}<ul class="analizador-history-list">${shown.map(renderHistoryItem).join("")}</ul>${more}`;
}

function announceHistory(message) {
  const live = document.getElementById("analizador-history-live");
  live.textContent = "";
  // Vacío y luego el texto: el mismo mensaje dos veces seguidas también se anuncia
  requestAnimationFrame(() => { live.textContent = message; });
}

function focusHistory(selector) {
  (document.querySelector(selector) || document.getElementById("analizador-history-title")).focus();
}

// Abre un análisis guardado en el área de resultado, recalculado con el progreso actual (el backend no llama a la IA)
async function openHistoryEntry(id) {
  const result = document.getElementById("analizador-result");
  const requestId = ++analyzerRequest;
  setAnalyzing(false); // si había un análisis en curso, su resultado ya no se pinta (sí se guarda en el historial)
  showEmptyWarning(false);
  historyState.current = id;
  historyState.confirm = null;
  renderHistory();
  analyzerView = null;
  result.innerHTML = renderAnalyzerSkeleton("analyzer.history.opening");
  result.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
  try {
    const r = await historyJson(`/api/analyzer/history/${Number(id)}`);
    if (requestId !== analyzerRequest) return;
    showAnalyzerResult("history", r);
    analyzerShown = true;
    analyzerStale = false;
    result.querySelector(".analizador-notice")?.focus({ preventScroll: true });
  } catch (err) {
    if (requestId !== analyzerRequest) return;
    showAnalyzerResult("historyError", { err, id });
    analyzerShown = false;
    loadHistory(); // pudo borrarse en otra ventana: la lista se pone al día
  }
}

async function confirmHistoryDelete(form) {
  const target = form.dataset.historyConfirm;
  const all = target === "all";
  const id = all ? null : Number(target);
  const items = historyState.items || [];
  const index = items.findIndex(i => i.id === id);
  const title = items[index]?.title || t("analyzer.history.untitled");
  historyState.busy = true;
  renderHistory();
  try {
    await historyDelete(all ? "/api/analyzer/history" : `/api/analyzer/history/${id}`);
  } catch (err) {
    historyState.busy = false;
    renderHistory();
    const error = document.querySelector(".analizador-confirm-error");
    if (error) error.textContent = errorText(err);
    document.querySelector(".analizador-confirm [type='submit']")?.focus();
    return;
  }
  historyState.busy = false;
  historyState.confirm = null;
  historyState.items = all ? [] : items.filter(i => i.id !== id);
  if (all || historyState.current === id) historyState.current = null;
  renderHistory();
  announceHistory(all ? t("analyzer.history.cleared") : t("analyzer.history.deleted", { title }));
  // El foco pasa al siguiente de la lista (o al anterior si era el último); sin ninguno, al título del historial
  const next = historyState.items[Math.min(index, historyState.items.length - 1)];
  focusHistory(all || !next ? "#analizador-history-title" : `[data-history-open='${Number(next.id)}']`);
}

function setHistoryConfirm(target) {
  const previous = historyState.confirm;
  historyState.confirm = target;
  renderHistory();
  if (target !== null) {
    document.querySelector(".analizador-confirm [data-history-cancel]")?.focus();
    return;
  }
  // Al cancelar, el foco vuelve a lo que abrió la confirmación
  focusHistory(previous === "all" ? "[data-history-clear]" : `[data-history-delete='${Number(previous)}']`);
}

function initHistory() {
  const section = document.getElementById("analizador-history");
  section.addEventListener("click", e => {
    const el = e.target.closest("button");
    if (!el || el.disabled) return;
    if (el.dataset.historyOpen) openHistoryEntry(Number(el.dataset.historyOpen));
    else if (el.dataset.historyDelete) setHistoryConfirm(Number(el.dataset.historyDelete));
    else if (el.hasAttribute("data-history-clear")) setHistoryConfirm("all");
    else if (el.hasAttribute("data-history-cancel")) setHistoryConfirm(null);
    else if (el.hasAttribute("data-history-retry")) loadHistory();
    else if (el.hasAttribute("data-history-more")) {
      const first = historyState.visible;
      historyState.visible += HISTORY_PAGE;
      renderHistory();
      focusHistory(`.analizador-history-item:nth-child(${first + 1}) [data-history-open]`);
    }
  });
  section.addEventListener("submit", e => {
    e.preventDefault();
    if (!historyState.busy) confirmHistoryDelete(e.target);
  });
  section.addEventListener("keydown", e => {
    if (e.key === "Escape" && historyState.confirm !== null && !historyState.busy) setHistoryConfirm(null);
  });
}

// ---------- Arranque ----------

function initAnalizador() {
  const form = document.getElementById("analizador-form");
  const text = document.getElementById("analizador-text");
  const result = document.getElementById("analizador-result");
  text.maxLength = ANALYZER_MAX_CHARS;
  showAnalyzerResult("empty", {});
  updateCounter();
  text.addEventListener("input", () => {
    if (text.value.trim()) showEmptyWarning(false);
    updateCounter();
  });
  form.addEventListener("submit", e => { e.preventDefault(); runAnalysis(); });
  // "Reintentar" repite lo que falló: el análisis o la apertura del guardado
  result.addEventListener("click", e => {
    if (!e.target.closest("[data-retry]")) return;
    if (analyzerView?.kind === "historyError") openHistoryEntry(analyzerView.data.id);
    else runAnalysis();
  });
  initHistory();
}

// Desde "Ofertas para ti" (Mi Ruta, ofertas.js): pega el texto de la oferta, abre la vista y enfoca el campo. No analiza:
// cada análisis gasta cuota de IA y lo decide el usuario con "Analizar Compatibilidad". El resultado que hubiera era de
// otro texto: se reemplaza por un aviso. Si hay un análisis en curso, su resultado se pinta igual al terminar.
function prefillAnalyzer(text, title) {
  const textarea = document.getElementById("analizador-text");
  textarea.value = text.slice(0, ANALYZER_MAX_CHARS);
  updateCounter();
  showEmptyWarning(false);
  if (!document.getElementById("analizador-submit").disabled) {
    analyzerRequest++; // una apertura del historial en vuelo ya no pisa el aviso
    analyzerShown = false;
    analyzerStale = false;
    historyState.current = null;
    renderHistory();
    showAnalyzerResult("prefill", { title });
  }
  showView("analizador");
  textarea.scrollTop = 0;
  textarea.setSelectionRange(0, 0);
  textarea.focus();
  const live = document.getElementById("analizador-live");
  live.textContent = "";
  requestAnimationFrame(() => { live.textContent = t("analyzer.prefill.live", { title }); });
}

// Al abrir la vista (showView en mapa.js): un resultado calculado con el progreso anterior se retira. No se vuelve a
// analizar solo: cada análisis gasta cuota de IA. El historial se carga la primera vez (no gasta IA).
function openAnalizador() {
  if (!historyState.items && !historyState.error) loadHistory();
  if (!analyzerStale) return;
  analyzerStale = false;
  analyzerShown = false;
  showAnalyzerResult("empty", { stale: true });
}

document.addEventListener("skillmap:progress", () => { if (analyzerShown) analyzerStale = true; });

// Cambio de usuario: ni el texto, ni el resultado, ni el historial del anterior se quedan a la vista
document.addEventListener("skillmap:user", () => {
  analyzerRequest++;
  historyRequest++;
  analyzerShown = false;
  analyzerStale = false;
  setAnalyzing(false);
  showEmptyWarning(false);
  document.getElementById("analizador-text").value = "";
  updateCounter();
  showAnalyzerResult("empty", {});
  Object.assign(historyState, { items: null, error: null, current: null, confirm: null, busy: false, visible: HISTORY_PAGE });
  renderHistory();
  if (!document.getElementById("view-analizador").classList.contains("hidden")) loadHistory();
});

// Cambio de idioma: botón, contador, historial y lo que esté a la vista (un análisis en curso se pinta al terminar)
document.addEventListener("skillmap:language", () => {
  setAnalyzing(document.getElementById("analizador-submit").disabled);
  updateCounter();
  renderHistory();
  if (analyzerView) showAnalyzerResult(analyzerView.kind, analyzerView.data);
});

document.addEventListener("DOMContentLoaded", initAnalizador);
