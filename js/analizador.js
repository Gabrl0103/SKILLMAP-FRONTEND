// Vista "Analizador". Usa API_BASE_URL (dashboard.js), escapeHtml (mapa.js), apiFetch (session.js), settingsState
// (theme.js), routeDivider y routeDraw (route-motif.js) y t, i18nError, errorText, formatNumber y tSkill (i18n.js). La IA no cambia con el idioma: solo la interfaz.

// ---------- API ----------

const ANALYZER_MAX_CHARS = 8000;   // mismo tope que el backend (JobAnalyzerServiceImpl.MAX_DESCRIPTION_LENGTH)
// Sin key propia el backend usa el servicio de IA en la nube: conexión 10 s + lectura 90 s (Render tarda en despertar).
const ANALYZER_TIMEOUT_MS = 110000;
const ANALYZER_WAKE_NOTICE_MS = 5000; // pasado esto se avisa de que el servicio puede estar despertando

// POST /api/analyzer/analyze → { matchPercentage, masteredSkills[], inProgressSkills[], missingSkills[] }.
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
  const pct = Math.max(0, Math.min(100, Math.round(r.matchPercentage ?? 0)));
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

// Skeleton: misma grilla y tarjetas que el resultado, para que no salte el layout. El texto solo lo leen los lectores de pantalla.
function renderAnalyzerSkeleton() {
  const group = widths => `
    <div class="analizador-group">
      <span class="skel skel-line analizador-skel-label"></span>
      <div class="analizador-chips">${widths.map(w => `<span class="skel analizador-skel-chip" style="width:${w}rem;"></span>`).join("")}</div>
    </div>`;
  return `
    <div class="analizador-grid analizador-skeleton" role="status">
      <span class="sr-only">${t("analyzer.skeleton")}</span>
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

// Mismo aviso que los errores de la API en Mi Ruta (tarjeta con borde rosa punteado), con el mensaje del backend y "Reintentar".
function renderAnalyzerError(err) {
  const offline = err.i18nKey === "analyzer.offline";
  const hint = offline
    ? `<p class="text-xs text-muted mt-2">${t("error.techDetail", { server: `<code>${API_BASE_URL || location.origin}</code>`,
      cmd: "<code>./mvnw spring-boot:run</code>" })}</p>`
    : "";
  return `
    <div class="card analizador-error" role="alert">
      <div class="min-w-0">
        <p class="text-sm font-medium text-ink">${t("analyzer.error.title")}</p>
        <p class="text-xs text-muted mt-1">${escapeHtml(errorText(err))}</p>
        ${hint}
      </div>
      <button type="button" class="btn-pill analizador-retry" data-retry>${t("analyzer.retry")}</button>
    </div>`;
}

// ---------- Eventos ----------

let analyzerRequest = 0;    // evita que un análisis viejo pise al más reciente
let analyzerShown = false;  // hay un resultado a la vista (lo que el cambio de progreso deja viejo)
let analyzerStale = false;  // el progreso cambió después de ese resultado
// Lo que muestra el área de resultado, para volver a pintarlo al cambiar de idioma: "empty" ({ stale }), "result" (la
// respuesta) o "error" (el Error). Durante un análisis vale null: el skeleton se reemplaza al terminar.
let analyzerView = null;

function showAnalyzerResult(kind, data) {
  analyzerView = { kind, data };
  const render = { empty: renderAnalyzerEmpty, result: renderAnalysis, error: renderAnalyzerError }[kind];
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
  result.addEventListener("click", e => { if (e.target.closest("[data-retry]")) runAnalysis(); });
}

// Al abrir la vista (showView en mapa.js): un resultado calculado con el progreso anterior se retira. No se vuelve a
// analizar solo: cada análisis gasta cuota de IA.
function openAnalizador() {
  if (!analyzerStale) return;
  analyzerStale = false;
  analyzerShown = false;
  showAnalyzerResult("empty", { stale: true });
}

document.addEventListener("skillmap:progress", () => { if (analyzerShown) analyzerStale = true; });

// Cambio de usuario: ni el texto ni el resultado del anterior se quedan a la vista
document.addEventListener("skillmap:user", () => {
  analyzerRequest++;
  analyzerShown = false;
  analyzerStale = false;
  setAnalyzing(false);
  showEmptyWarning(false);
  document.getElementById("analizador-text").value = "";
  updateCounter();
  showAnalyzerResult("empty", {});
});

// Cambio de idioma: botón, contador y lo que esté a la vista (un análisis en curso se pinta al terminar)
document.addEventListener("skillmap:language", () => {
  setAnalyzing(document.getElementById("analizador-submit").disabled);
  updateCounter();
  if (analyzerView) showAnalyzerResult(analyzerView.kind, analyzerView.data);
});

document.addEventListener("DOMContentLoaded", initAnalizador);
