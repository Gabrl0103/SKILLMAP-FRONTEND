// Vista "Analizador". Usa API_BASE_URL (dashboard.js) y escapeHtml (mapa.js).

// ---------- API ----------

const ANALYZER_MAX_CHARS = 8000;   // mismo tope que el backend (JobAnalyzerServiceImpl.MAX_DESCRIPTION_LENGTH)
const ANALYZER_TIMEOUT_MS = 45000; // el backend corta a Gemini a los 35 s; esto cubre un servidor colgado

// POST /api/analyzer/analyze → { matchPercentage, masteredSkills[], inProgressSkills[], missingSkills[] }.
// Si falla lanza un Error con un mensaje listo para mostrar: el "message" del backend cuando lo hay.
async function analyzeOffer(jobDescription) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANALYZER_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/analyzer/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription }),
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(err.name === "AbortError"
      ? "El análisis tardó demasiado. Intenta de nuevo en unos segundos."
      : "No se pudo conectar con el servidor.");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `El servidor respondió con un error (${res.status}).`);
  }
  return res.json();
}

// ---------- Resultado ----------

function matchMessage(pct, detected) {
  if (!detected) return "No reconocimos habilidades del catálogo en esta oferta. Prueba con la descripción completa, incluyendo requisitos y tecnologías.";
  if (pct >= 70) return "Tienes una compatibilidad alta. Dominas los requisitos principales pero te faltan un par de herramientas secundarias.";
  if (pct >= 40) return "Tienes una compatibilidad media. Cubres parte de los requisitos; enfócate en las habilidades faltantes para acercarte al perfil.";
  return "Tienes una compatibilidad baja. Esta vacante pide varias habilidades que aún no dominas: úsala como guía para tu ruta.";
}

function renderMatch(pct, detected) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  // Mismo gauge que Mi Ruta: --pct alimenta el conteo del número (styles.css); el span es el respaldo sin CSS.
  return `
    <article class="analizador-card analizador-match">
      <h2 class="analizador-card-title">Match con el perfil</h2>
      <div class="gauge-ring analizador-ring">
        <svg viewBox="0 0 160 160" role="img" aria-label="${pct}% de compatibilidad">
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
    ? `<ul class="analizador-chips">${items.map((name, i) => `<li class="analizador-chip analizador-chip--${tone}" style="--i:${i};">${escapeHtml(name)}</li>`).join("")}</ul>`
    : `<p class="analizador-group-empty">Ninguna en esta vacante.</p>`;
  return `
    <section class="analizador-group">
      <h3 class="analizador-group-title analizador-group-title--${tone}">${BREAKDOWN_ICONS[tone]}${label} (${items.length})</h3>
      ${chips}
    </section>`;
}

function renderBreakdown(mastered, inProgress, missing) {
  return `
    <article class="analizador-card analizador-breakdown">
      <h2 class="analizador-card-title">Desglose de Habilidades</h2>
      ${renderBreakdownGroup("Habilidades dominadas", mastered, "mastered")}
      ${renderBreakdownGroup("En desarrollo", inProgress, "progress")}
      ${renderBreakdownGroup("Faltantes", missing, "missing")}
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

// Antes del primer análisis: una sola tarjeta que explica qué aparecerá aquí.
function renderAnalyzerEmpty() {
  return `
    <div class="analizador-card analizador-empty">
      <span class="analizador-label-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/><path d="M8 12v-1.5M10.5 12V8.5M13 12v-2.5"/></svg>
      </span>
      <div>
        <p class="analizador-empty-title">Aún no hay análisis</p>
        <p class="analizador-empty-text">Pega la descripción de una oferta y pulsa “Analizar Compatibilidad” para ver tu porcentaje de match y las habilidades que te faltan.</p>
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
      <span class="sr-only">Analizando la oferta…</span>
      <div class="analizador-card analizador-match" aria-hidden="true">
        <span class="skel skel-line skel-line--title"></span>
        <span class="skel skel-ring"></span>
        <span class="skel skel-line skel-line--short"></span>
        <span class="skel skel-line skel-line--shorter"></span>
      </div>
      <div class="analizador-card analizador-breakdown" aria-hidden="true">
        <span class="skel skel-line skel-line--title analizador-skel-title"></span>
        ${group([5, 6.5, 6, 5.5, 4.5])}
        ${group([4.5, 6])}
        ${group([5.5, 6.5, 5])}
      </div>
    </div>`;
}

// Mismo aviso que los errores de la API en Mi Ruta (tarjeta con borde rosa punteado), con el mensaje del backend y "Reintentar".
function renderAnalyzerError(err) {
  const offline = err.message === "No se pudo conectar con el servidor.";
  const hint = offline
    ? `<p class="text-xs text-muted mt-2">Detalle técnico: servidor en <code>${API_BASE_URL || location.origin}</code> (<code>./mvnw spring-boot:run</code> desde skillmap-api)</p>`
    : "";
  return `
    <div class="card analizador-error" role="alert">
      <div class="min-w-0">
        <p class="text-sm font-medium text-ink">No pudimos analizar la oferta</p>
        <p class="text-xs text-muted mt-1">${escapeHtml(err.message)}</p>
        ${hint}
      </div>
      <button type="button" class="btn-pill analizador-retry" data-retry>Reintentar</button>
    </div>`;
}

// ---------- Eventos ----------

let analyzerRequest = 0; // evita que un análisis viejo pise al más reciente

// Mientras analiza el botón queda deshabilitado (conserva su rosa) y el texto avisa de la espera.
function setAnalyzing(isAnalyzing) {
  const button = document.getElementById("analizador-submit");
  button.disabled = isAnalyzing;
  button.querySelector("[data-label]").textContent = isAnalyzing ? "Analizando… puede tardar hasta 30 segundos" : "Analizar Compatibilidad";
  button.setAttribute("aria-busy", String(isAnalyzing));
}

function showEmptyWarning(show) {
  document.getElementById("analizador-warning").hidden = !show;
}

// "1234 / 8.000". Al llegar al tope el contador se pone rosa y se avisa una vez al lector de pantalla.
function formatCount(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function updateCounter() {
  const length = document.getElementById("analizador-text").value.length;
  const atLimit = length >= ANALYZER_MAX_CHARS;
  const counter = document.getElementById("analizador-count");
  counter.textContent = `${formatCount(length)} / ${formatCount(ANALYZER_MAX_CHARS)}`;
  counter.classList.toggle("analizador-count--limit", atLimit);
  const live = document.getElementById("analizador-count-live");
  const message = atLimit ? `Llegaste al límite de ${formatCount(ANALYZER_MAX_CHARS)} caracteres.` : "";
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
  result.innerHTML = renderAnalyzerSkeleton();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  let failed = false;
  try {
    const r = await analyzeOffer(text.slice(0, ANALYZER_MAX_CHARS));
    if (requestId !== analyzerRequest) return;
    result.innerHTML = renderAnalysis(r);
  } catch (err) {
    if (requestId !== analyzerRequest) return;
    failed = true;
    result.innerHTML = renderAnalyzerError(err);
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
  result.innerHTML = renderAnalyzerEmpty();
  updateCounter();
  text.addEventListener("input", () => {
    if (text.value.trim()) showEmptyWarning(false);
    updateCounter();
  });
  form.addEventListener("submit", e => { e.preventDefault(); runAnalysis(); });
  result.addEventListener("click", e => { if (e.target.closest("[data-retry]")) runAnalysis(); });
}

document.addEventListener("DOMContentLoaded", initAnalizador);
