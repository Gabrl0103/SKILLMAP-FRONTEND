// Tarjeta "Ofertas para ti" de Mi Ruta: GET /api/jobs/recommended?limit=10&goalId= → [{ id, title, company, source, url, publishedAt,
// matchPercentage, masteredSkills[], missingSkills[{ name, status }] }]. El backend detecta las habilidades de cada oferta con
// reglas (sin IA) y la recalcula en cada petición con el progreso actual. "Analizar con IA" pide el texto (GET /api/jobs/{id})
// y lo pega en el Analizador sin analizarlo: cada análisis gasta cuota de IA y lo decide el usuario.
// Usa escapeHtml (mapa.js), apiJson y friendlyError (session.js), SKILL_STATE_CLASS (skill-status.js), routeDraw (route-motif.js),
// prefillAnalyzer (analizador.js) y t, errorText, formatNumber, getLanguage, statusLabel y tSkill (i18n.js). La pinta loadDashboard
// (dashboard.js), así que se vuelve a pedir al cambiar el progreso, el objetivo o el idioma.

const OFFERS_LIMIT = 10;   // lo que se pide al backend
const OFFERS_VISIBLE = 5;  // los que se ven de entrada; "Ver más" muestra el resto

// items: null = cargando; error: el fallo al cargar. expanded: "Ver más" pulsado. busyId: la oferta cuyo texto se está
// pidiendo para el Analizador; analyzeError: { id, err } si eso falló.
const offersState = { items: null, error: null, expanded: false, goal: "", goalId: null, busyId: null, analyzeError: null };
let offersRequest = 0;
let offersEnterFrom = Infinity;

const OFFER_EXTERNAL_ICON = `<svg class="offer-external" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;

// Tarjeta vacía con su estado de carga; loadOffers la llena. goal: título del objetivo ya traducido y escapado.
function renderOffersCard(goal) {
  return `
    <article id="ofertas-card" class="ruta-card ruta-ofertas" aria-labelledby="ofertas-title">
      <header class="ruta-card-header">
        <h2 id="ofertas-title" class="ruta-card-title" tabindex="-1">${t("ruta.offers.title")}</h2>
        <span class="ruta-card-hint">${t("ruta.offers.hint")}</span>
      </header>
      <div id="ofertas-body">${renderOffersLoading()}</div>
    </article>`;
}

function renderOffersLoading() {
  return `<p class="route-state ofertas-state" role="status">${routeDraw({ loop: true })}<span>${t("ruta.offers.loading")}</span></p>`;
}

// "15 oct 2026" en el idioma vigente; vacío si la fecha no llega
function offerDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(getLanguage(), { day: "numeric", month: "short", year: "numeric" }).format(date).replace(/\./g, "");
}

// Solo enlaces http(s): la URL viene de una fuente externa
function offerUrl(url) {
  return /^https?:\/\//i.test(url || "") ? url : null;
}

function renderOfferChips(o) {
  const mastered = (o.masteredSkills || []).map(name =>
    `<li class="offer-chip offer-chip--mastered">${escapeHtml(tSkill(name))}</li>`).join("");
  const missing = (o.missingSkills || []).map(s => {
    const state = SKILL_STATE_CLASS[s.status] === "progress" ? "progress" : "pending";
    return `<li class="offer-chip offer-chip--${state}">${escapeHtml(tSkill(s.name))}<span class="sr-only"> (${statusLabel(s.status).toLowerCase()})</span></li>`;
  }).join("");
  return `
    <div class="offer-chips">
      ${mastered ? `<ul class="offer-chip-list" aria-label="${escapeHtml(t("ruta.offers.have"))}">${mastered}</ul>` : ""}
      ${missing ? `<ul class="offer-chip-list" aria-label="${escapeHtml(t("ruta.offers.missing"))}">${missing}</ul>` : ""}
    </div>`;
}

function renderOffer(o, i) {
  const title = escapeHtml(o.title || t("ruta.offers.untitled"));
  const url = offerUrl(o.url);
  const heading = url
    ? `<a class="offer-title" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${title}<span class="sr-only">${t("common.newTab")}</span>${OFFER_EXTERNAL_ICON}</a>`
    : `<span class="offer-title">${title}</span>`;
  const pct = Math.max(0, Math.min(100, Math.round(o.matchPercentage ?? 0)));
  const meta = [
    o.company ? escapeHtml(o.company) : "",
    o.source ? `<span class="offer-source">${t("ruta.offers.source", { source: escapeHtml(o.source) })}</span>` : "",
    offerDate(o.publishedAt) ? `<time datetime="${escapeHtml(o.publishedAt)}">${offerDate(o.publishedAt)}</time>` : "",
  ].filter(Boolean).join(` <span aria-hidden="true">·</span> `);
  const busy = offersState.busyId === o.id;
  const error = offersState.analyzeError?.id === o.id
    ? `<p class="offer-error" role="alert">${escapeHtml(errorText(offersState.analyzeError.err))}</p>` : "";
  return `
    <li class="offer-item"${i >= offersEnterFrom ? ` data-enter style="--i:${i - offersEnterFrom};"` : ""}>
      <span class="offer-pct" aria-hidden="true">${pct}%</span>
      <div class="offer-main">
        <h3 class="offer-heading">${heading}</h3>
        <p class="offer-meta">${meta}<span class="sr-only">. ${t("ruta.offers.matchAria", { pct })}</span></p>
        ${renderOfferChips(o)}
        ${error}
      </div>
      <button type="button" class="btn-pill perfil-btn-outline offer-analyze" data-offer-analyze="${Number(o.id)}"
        aria-label="${escapeHtml(t("ruta.offers.analyzeFor", { title: o.title || t("ruta.offers.untitled") }))}"${busy ? ` aria-busy="true" disabled` : ""}>
        ${t(busy ? "ruta.offers.opening" : "ruta.offers.analyze")}
      </button>
    </li>`;
}

// enterFrom: desde qué fila entran con animación (0 al cargar, las nuevas con "Ver más"; al repintar por un botón, ninguna)
function renderOffersBody({ enterFrom = Infinity } = {}) {
  offersEnterFrom = enterFrom;
  const body = document.getElementById("ofertas-body");
  if (!body) return;
  const { items, error } = offersState;
  if (error) {
    body.innerHTML = `
      <div class="ofertas-error" role="alert">
        <div class="min-w-0">
          <p class="text-sm font-medium text-ink">${t("ruta.offers.error")}</p>
          <p class="text-xs text-muted mt-1">${escapeHtml(friendlyError(error))}</p>
        </div>
        <button type="button" class="btn-pill ofertas-retry" data-offers-retry>${t("analyzer.retry")}</button>
      </div>`;
    return;
  }
  if (!items) { body.innerHTML = renderOffersLoading(); return; }
  if (!items.length) {
    body.innerHTML = `
      <div class="route-state ofertas-state">
        ${routeDraw()}
        <p class="text-sm text-muted">${t("ruta.offers.empty", { goal: offersState.goal })}</p>
      </div>`;
    return;
  }
  const shown = offersState.expanded ? items : items.slice(0, OFFERS_VISIBLE);
  const more = items.length > shown.length
    ? `<button type="button" class="btn-pill perfil-btn-outline ofertas-more" data-offers-more>${t("ruta.offers.more", { n: formatNumber(items.length - shown.length) })}</button>`
    : "";
  body.innerHTML = `<ul class="offer-list">${shown.map(renderOffer).join("")}</ul>${more}`;
}

// goal: título del objetivo ya traducido y escapado (para el estado vacío). goalId: el objetivo que muestra Mi Ruta; se
// manda siempre porque en cuentas antiguas puede venir del navegador y no coincidir con el guardado en el backend.
async function loadOffers(goal, goalId) {
  const requestId = ++offersRequest;
  Object.assign(offersState, { items: null, error: null, expanded: false, goal, goalId, busyId: null, analyzeError: null });
  renderOffersBody();
  try {
    const goalParam = goalId == null ? "" : `&goalId=${encodeURIComponent(goalId)}`;
    const items = await apiJson(`/api/jobs/recommended?limit=${OFFERS_LIMIT}${goalParam}`);
    if (requestId !== offersRequest) return;
    offersState.items = Array.isArray(items) ? items : [];
  } catch (err) {
    if (requestId !== offersRequest) return;
    offersState.error = err;
  }
  renderOffersBody({ enterFrom: 0 });
}

// Pide el texto de la oferta y lo deja pegado en el Analizador (prefillAnalyzer abre la vista y enfoca el campo)
async function openOfferInAnalyzer(id) {
  const requestId = offersRequest;
  offersState.busyId = id;
  offersState.analyzeError = null;
  renderOffersBody();
  document.querySelector(`[data-offer-analyze='${id}']`)?.focus({ preventScroll: true });
  let job;
  try {
    job = await apiJson(`/api/jobs/${id}`);
  } catch (err) {
    if (requestId !== offersRequest) return;
    offersState.busyId = null;
    offersState.analyzeError = { id, err };
    renderOffersBody();
    document.querySelector(`[data-offer-analyze='${id}']`)?.focus({ preventScroll: true });
    return;
  }
  if (requestId !== offersRequest) return;
  offersState.busyId = null;
  renderOffersBody();
  const text = [job.title, job.company].filter(Boolean).join("\n") + (job.description ? `\n\n${job.description}` : "");
  prefillAnalyzer(text, job.title || t("ruta.offers.untitled"));
}

function initOffers() {
  document.getElementById("app-content").addEventListener("click", e => {
    const el = e.target.closest("button");
    if (!el || el.disabled || !el.closest("#ofertas-card")) return;
    if (el.dataset.offerAnalyze) {
      openOfferInAnalyzer(Number(el.dataset.offerAnalyze));
    } else if (el.hasAttribute("data-offers-retry")) {
      loadOffers(offersState.goal, offersState.goalId);
      document.getElementById("ofertas-title")?.focus({ preventScroll: true });
    } else if (el.hasAttribute("data-offers-more")) {
      offersState.expanded = true;
      renderOffersBody({ enterFrom: OFFERS_VISIBLE });
      // El foco pasa a la primera oferta que no se veía
      document.querySelector(`#ofertas-card .offer-item:nth-child(${OFFERS_VISIBLE + 1}) :is(a.offer-title, .offer-analyze)`)?.focus();
    }
  });
}

// Cambio de usuario: una respuesta en vuelo del anterior se descarta
document.addEventListener("skillmap:user", () => { offersRequest++; });

document.addEventListener("DOMContentLoaded", initOffers);
