// Vista "Analizador". Usa API_BASE_URL, renderApiError y sampleTag (dashboard.js) y escapeHtml (mapa.js).

// ---------- Datos de ejemplo (el backend todavía no tiene el analizador) ----------

// DATOS DE EJEMPLO: resultado fijo (el del mockup) sin importar el texto.
// Tiene la misma forma que la respuesta esperada de POST /api/analyzer/analyze.
function sampleAnalysisData() {
  return {
    matchPercentage: 75,
    mastered: ["React 18", "TypeScript", "Tailwind CSS", "Git / GitHub", "REST APIs", "Responsive Design"],
    inProgress: ["Next.js", "Unit Testing"],
    missing: ["GraphQL", "Apollo Client", "E2E Testing"],
  };
}

// Versión asíncrona del ejemplo: la demora imita la red.
function sampleAnalysis(_text) {
  return new Promise(resolve => setTimeout(() => resolve(sampleAnalysisData()), 700));
}

const ANALYZER_USES_SAMPLE = true; // pasar a false cuando exista el endpoint

// Punto único de conexión con el backend. Para usar la API real, borrar la línea de ejemplo y ANALYZER_USES_SAMPLE.
async function analyzeOffer(text) {
  return sampleAnalysis(text);
  // const res = await fetch(`${API_BASE_URL}/api/analyzer/analyze`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ text }),
  // });
  // if (!res.ok) throw new Error("La API respondió " + res.status);
  // return res.json(); // { matchPercentage, mastered[], inProgress[], missing[] }
}

// ---------- Resultado ----------

function matchMessage(pct) {
  if (pct >= 70) return "Tienes una compatibilidad alta. Dominas los requisitos principales pero te faltan un par de herramientas secundarias.";
  if (pct >= 40) return "Tienes una compatibilidad media. Cubres parte de los requisitos; enfócate en las habilidades faltantes para acercarte al perfil.";
  return "Tienes una compatibilidad baja. Esta vacante pide varias habilidades que aún no dominas: úsala como guía para tu ruta.";
}

function renderMatch(pct) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  // --pct alimenta el conteo animado del número (styles.css); el texto del span queda como respaldo.
  return `
    <article class="analizador-card analizador-match">
      <h2 class="analizador-card-title">Match con el perfil</h2>
      <div class="analizador-ring">
        <svg viewBox="0 0 160 160" role="img" aria-label="${pct}% de compatibilidad">
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="14" class="gauge-track"/>
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="14" class="gauge-fill"
            transform="rotate(-90 80 80)" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <p class="analizador-ring-value" aria-hidden="true" style="--pct:${pct};"><span>${pct}%</span></p>
      </div>
      <p class="analizador-match-text">${matchMessage(pct)}</p>
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

function renderBreakdown(r) {
  return `
    <article class="analizador-card analizador-breakdown">
      <h2 class="analizador-card-title">Desglose de Habilidades</h2>
      ${renderBreakdownGroup("Habilidades dominadas", r.mastered, "mastered")}
      ${renderBreakdownGroup("En desarrollo", r.inProgress, "progress")}
      ${renderBreakdownGroup("Faltantes", r.missing, "missing")}
    </article>`;
}

function renderAnalysis(r) {
  const pct = Math.max(0, Math.min(100, Math.round(r.matchPercentage)));
  const note = ANALYZER_USES_SAMPLE
    ? `<p class="analizador-sample-note">${sampleTag} El análisis aún no usa el texto pegado: el backend del analizador no existe todavía.</p>`
    : "";
  return `
    ${note}
    <div class="analizador-grid">
      ${renderMatch(pct)}
      ${renderBreakdown(r)}
    </div>`;
}

// ---------- Eventos ----------

let analyzerRequest = 0; // evita que un análisis viejo pise al más reciente

// El botón nunca se deshabilita (mantiene su rosa); mientras analiza solo cambia el texto.
function setAnalyzing(isAnalyzing) {
  const button = document.getElementById("analizador-submit");
  button.querySelector("[data-label]").textContent = isAnalyzing ? "Analizando…" : "Analizar Compatibilidad";
  button.setAttribute("aria-busy", String(isAnalyzing));
}

function showEmptyWarning(show) {
  document.getElementById("analizador-warning").hidden = !show;
}

async function runAnalysis() {
  const textarea = document.getElementById("analizador-text");
  const text = textarea.value.trim();
  const result = document.getElementById("analizador-result");
  if (!text) {
    showEmptyWarning(true);
    textarea.focus();
    return;
  }
  if (document.getElementById("analizador-submit").getAttribute("aria-busy") === "true") return;
  showEmptyWarning(false);
  const requestId = ++analyzerRequest;
  setAnalyzing(true);
  try {
    const r = await analyzeOffer(text);
    if (requestId !== analyzerRequest) return;
    result.innerHTML = renderAnalysis(r);
  } catch (err) {
    if (requestId !== analyzerRequest) return;
    result.innerHTML = `<div class="analizador-grid">${renderApiError(err)}</div>`;
  }
  setAnalyzing(false);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
}

function initAnalizador() {
  const form = document.getElementById("analizador-form");
  const text = document.getElementById("analizador-text");
  // Desde que se abre la vista se ve el resultado de ejemplo (con su etiqueta), como en el mockup.
  document.getElementById("analizador-result").innerHTML = renderAnalysis(sampleAnalysisData());
  text.addEventListener("input", () => { if (text.value.trim()) showEmptyWarning(false); });
  form.addEventListener("submit", e => { e.preventDefault(); runAnalysis(); });
}

document.addEventListener("DOMContentLoaded", initAnalizador);
