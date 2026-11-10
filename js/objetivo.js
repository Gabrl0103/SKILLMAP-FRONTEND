// Vista "Objetivo": el objetivo actual arriba (su preparación y "Ver mi ruta") y debajo las otras rutas posibles, cada una
// con su compatibilidad de hoy (el % de preparación que da /api/goals/{id}/readiness), cuántas habilidades comparte con
// el objetivo actual y la demanda de su mercado. Toda la tarjeta de una ruta es el botón para elegirla: al tocarla se
// elige al instante, sin que la página se mueva (solo cambia lo que cambia), y un aviso breve (3 s, toast.js) ofrece
// "Deshacer" (vuelve al objetivo anterior con el mismo PUT /api/auth/me/goal). El progreso por habilidad es del usuario,
// no del objetivo: cambiar no borra nada.
// Usa fetchGoals, fetchSkills, fetchReadiness, setActiveGoal, getActiveGoalId, savedGoalId, marketLevel y renderApiError
// (dashboard.js), escapeHtml/showView (mapa.js), routeDraw (route-motif.js), showToast (toast.js), friendlyError
// (session.js) y t, tn, tGoalTitle y tGoalDescription (i18n.js).

// Área de cada rol para los filtros y los grupos. Si el objetivo trae su área (goal.area) se usa esa; si no, este mapa —el
// único lugar donde se define— por el título del seed. Un rol que no esté aquí va a "Otras áreas".
const GOAL_AREAS = {
  "Frontend Senior": "development",
  "Backend Java": "development",
  "Mobile Lead": "development",
  "Data Scientist": "data",
  "Cloud Architect": "infrastructure",
};
const GOAL_AREA_ORDER = ["development", "data", "infrastructure", "other"];
const goalArea = goal => goal.area || GOAL_AREAS[goal.title] || "other";
// "Tus roles" (roles propios) y "Otro objetivo" quedan preparados y ocultos hasta que exista crear un rol propio
const OWN_ROLES_ENABLED = false;

function normalizeText(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// goals: /api/goals; catalog: /api/skills ([] si falló); readiness: % de preparación por id de objetivo (null si falló).
// order: ids de la rejilla en su orden (al cambiar, la ruta elegida y la anterior se cambian de lugar); saving: ruta que
// se está guardando; query: búsqueda; focusOnOpen: al abrir desde "Cambiar objetivo" (Perfil) el foco va al objetivo
// actual.
// area: filtro por área ("all" o una de GOAL_AREA_ORDER; dura mientras la app está abierta)
const objetivoState = { goals: null, catalog: [], readiness: new Map(), order: null, saving: null, busy: false,
  error: null, query: "", area: "all", focusOnOpen: false };

// Objetivo activo actual: el de Mi Ruta; si aún no cargó, el guardado; si no, el primero.
function currentActiveGoalId(goals) {
  const active = getActiveGoalId(); // dashboard.js
  if (goals.some(g => String(g.id) === active)) return active;
  return savedGoalId(goals) ?? (goals[0] ? String(goals[0].id) : null);
}

const goalById = id => objetivoState.goals.find(g => String(g.id) === String(id));
const goalSkillIds = goal => new Set((goal?.skills || []).map(s => s.skillId));
const goalName = goal => escapeHtml(tGoalTitle(goal.title));

// Habilidades en común entre dos objetivos
function sharedSkills(a, b) {
  const ids = goalSkillIds(b);
  return [...goalSkillIds(a)].filter(id => ids.has(id)).length;
}

// "demanda baja" del objetivo (Mercado laboral de Mi Ruta), en minúscula para ir dentro de la frase; "" sin datos
function goalDemand(goal) {
  const ids = goalSkillIds(goal);
  const level = marketLevel(objetivoState.catalog.filter(s => ids.has(s.id)), objetivoState.catalog);
  return level ? level.label.toLocaleLowerCase(getLanguage()) : "";
}

const readinessOf = goal => objetivoState.readiness.get(String(goal.id)) ?? null;

// Orden de la rejilla (todas las rutas menos la actual): el guardado si sigue valiendo para estas rutas; si no, el de la API
function gridOrder(goals, current) {
  const ids = goals.filter(g => g !== current).map(g => String(g.id));
  const saved = objetivoState.order;
  const valid = saved && saved.length === ids.length && ids.every(id => saved.includes(id));
  return valid ? [...saved] : ids;
}

function goalMeta(goal, current) {
  const demand = goalDemand(goal);
  return [
    tn("objetivo.skills", goal.skills.length),
    current ? tn("objetivo.common", sharedSkills(goal, current)) : "",
    demand ? t("objetivo.demand", { demand }) : "",
  ].filter(Boolean).join(" · ");
}

function renderHero(goal) {
  const pct = readinessOf(goal);
  const score = pct == null ? "" : `
    <div class="objetivo-hero-score is-plain">
      <span class="objetivo-hero-score-label">${t("objetivo.readiness")}</span>
      <span class="objetivo-hero-pct" data-motion="count:objetivo-hero" data-value="${pct}">${pct}<span>%</span></span>
      <span class="objetivo-bar" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, pct))}%" data-motion="bar:objetivo-hero-bar" data-value="${Math.max(0, Math.min(100, pct))}"></span></span>
      <span class="objetivo-hero-score-note">${t("objetivo.readinessNote")}</span>
    </div>`;
  const desc = tGoalDescription(goal.title, goal.description || "");
  return `
    <section class="ruta-card objetivo-hero" aria-labelledby="objetivo-current-title">
      <div class="objetivo-hero-main">
        <div class="objetivo-hero-head">
          <span class="objetivo-chip">${t("objetivo.current")}</span>
          <h2 id="objetivo-current-title" class="objetivo-hero-title" tabindex="-1">${goalName(goal)}</h2>
          <p class="objetivo-hero-meta">${goalMeta(goal, null)}</p>
        </div>
        ${desc ? `<p class="objetivo-hero-desc">${escapeHtml(desc)}</p>` : ""}
        <button type="button" class="btn-pill objetivo-cta" data-action="view-route">
          ${t("objetivo.viewRoute")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
      ${score}
    </section>`;
}

// Partes comunes de todas las tarjetas de la rejilla (rutas y "Otro objetivo"): título con el % o la etiqueta a la derecha
// y la línea de datos
function goalCardBody(goal, current, id) {
  const pct = readinessOf(goal);
  return `
    <span class="objetivo-card-top">
      <span class="objetivo-card-title">${goalName(goal)}</span>
      ${pct == null ? "" : `<span class="objetivo-card-pct">${pct}%</span>`}
    </span>
    <span class="objetivo-card-meta" id="objetivo-meta-${id}">${goalMeta(goal, current)}</span>
    ${pct == null ? "" : `<span class="objetivo-bar objetivo-bar--thin" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, pct))}%"></span></span>`}`;
}

// Pie de la tarjeta: solo mientras se guarda ("Guardando…"). Toda la tarjeta es el botón: sin "Elegir esta ruta"
function goalCardCta(saving) {
  return saving ? t("objetivo.saving") : "";
}

// Toda la tarjeta es el botón para elegir la ruta: un toque la elige al instante. Mientras se guarda, la tarjeta tocada
// dice "Guardando…" y ninguna otra responde.
function renderGoalCard(goal, current, index) {
  const id = String(goal.id);
  const pct = readinessOf(goal);
  const title = normalizeText(`${goal.title} ${tGoalTitle(goal.title)}`);
  const saving = objetivoState.saving === id;
  const label = pct == null ? t("objetivo.chooseFor", { goal: tGoalTitle(goal.title) })
    : t("objetivo.chooseForPct", { goal: tGoalTitle(goal.title), pct });
  return `
    <li class="objetivo-item" data-goal-id="${id}" data-title="${escapeHtml(title)}" style="--i:${index};">
      <button type="button" class="objetivo-card objetivo-card--choose is-flat" data-action="choose" data-goal-id="${id}"
        aria-label="${escapeHtml(label)}" aria-describedby="objetivo-meta-${id}"${saving ? ` aria-busy="true"` : ""}${objetivoState.busy ? ` aria-disabled="true"` : ""}>
        ${goalCardBody(goal, current, id)}
        <span class="objetivo-card-cta" aria-hidden="true">${goalCardCta(saving)}</span>
      </button>
    </li>`;
}

// Áreas con al menos una ruta (sin contar el objetivo actual), en su orden
function presentAreas(others) {
  const areas = new Set(others.map(goalArea));
  return GOAL_AREA_ORDER.filter(area => areas.has(area));
}

// Filtros por área: Todas, cada área presente y "Tus roles" (preparado: oculto hasta que existan roles propios)
function renderAreaFilters(others) {
  const chip = (area, label) =>
    `<button type="button" data-area-filter="${area}" aria-pressed="${objetivoState.area === area}">${label}</button>`;
  return `
    <div class="hab-filters" role="group" aria-label="${escapeHtml(t("objetivo.areas"))}">
      ${chip("all", t("objetivo.area.all"))}
      ${presentAreas(others).map(area => chip(area, t(`objetivo.area.${area}`))).join("")}
      ${OWN_ROLES_ENABLED ? chip("mine", t("objetivo.area.mine")) : ""}
    </div>`;
}

// Rutas agrupadas por área, cada grupo con su cantidad; mosaicos planos de borde fino (toda la tarjeta es el botón).
// "Tus roles" va primero, preparado y oculto, con la tarjeta "Otro objetivo" (todavía no disponible: borde punteado).
function renderAreaGroups(others, current) {
  let index = 0;
  const groups = presentAreas(others).map(area => {
    const items = others.filter(g => goalArea(g) === area);
    return `
      <section class="objetivo-area" data-area="${area}" aria-labelledby="objetivo-area-${area}">
        <h3 class="objetivo-area-title" id="objetivo-area-${area}">
          <span class="hab-group-title">${t(`objetivo.area.${area}`)}</span>
          <span class="hab-group-count" data-area-count>· ${items.length}</span>
        </h3>
        <ul class="objetivo-grid">${items.map(g => renderGoalCard(g, current, index++)).join("")}</ul>
      </section>`;
  }).join("");
  const mine = `
      <section class="objetivo-area" data-area="mine" aria-labelledby="objetivo-area-mine" hidden>
        <h3 class="objetivo-area-title" id="objetivo-area-mine"><span class="hab-group-title">${t("objetivo.area.mine")}</span></h3>
        <ul class="objetivo-grid">
          <li class="objetivo-item objetivo-item--otro">
            <div class="objetivo-card objetivo-card--otro" aria-disabled="true">
              <span class="objetivo-card-top">
                <span class="objetivo-card-title">${t("objetivo.other")}</span>
                <span class="sample-tag">${t("common.soon")}</span>
              </span>
              <span class="objetivo-card-meta">${t("objetivo.otherText")}</span>
            </div>
          </li>
        </ul>
      </section>`;
  return `${OWN_ROLES_ENABLED ? mine : ""}${groups}`;
}

function renderObjetivo() {
  const { goals } = objetivoState;
  if (!goals.length) return `<p class="objetivo-empty">${t("objetivo.empty")}</p>`;
  const current = goalById(currentActiveGoalId(goals));
  const others = gridOrder(goals, current).map(goalById);
  return `
    ${renderHero(current)}
    <section class="objetivo-others" aria-labelledby="objetivo-others-title">
      <div class="objetivo-others-head">
        <div>
          <h2 id="objetivo-others-title" class="ruta-card-title" tabindex="-1">${t("objetivo.others")}</h2>
          <p class="objetivo-others-text">${t("objetivo.othersText")}</p>
        </div>
        <label class="objetivo-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <span class="sr-only">${t("objetivo.search")}</span>
          <input id="objetivo-search" type="search" autocomplete="off" placeholder="${escapeHtml(t("objetivo.searchPlaceholder"))}" value="${escapeHtml(objetivoState.query)}">
        </label>
      </div>
      <div class="objetivo-tools">${renderAreaFilters(others)}</div>
      <p class="objetivo-error" role="alert"${objetivoState.error ? "" : " hidden"}>${objetivoState.error ? escapeHtml(t("goal.error", { error: friendlyError(objetivoState.error) })) : ""}</p>
      <p class="objetivo-empty" role="status" hidden></p>
      <div class="objetivo-areas-list">${renderAreaGroups(others, current)}</div>
    </section>`;
}

// Filtra por la búsqueda y el área: cada grupo dice cuántas rutas muestra y se oculta si no queda ninguna
function filterGoalCards() {
  const q = normalizeText(objetivoState.query.trim());
  // El área elegida puede quedar sin rutas tras cambiar de objetivo (su única ruta pasó a ser la actual): vuelve a Todas
  if (objetivoState.area !== "all" && !document.querySelector(`#objetivo-content [data-area-filter="${objetivoState.area}"]`)) {
    objetivoState.area = "all";
  }
  const { area } = objetivoState;
  let visible = 0;
  document.querySelectorAll("#objetivo-content .objetivo-area[data-area]").forEach(group => {
    if (group.dataset.area === "mine") { group.hidden = !OWN_ROLES_ENABLED || (area !== "all" && area !== "mine"); return; }
    const inArea = area === "all" || area === group.dataset.area;
    let shown = 0;
    group.querySelectorAll(".objetivo-item[data-title]").forEach(card => {
      card.hidden = !inArea || !card.dataset.title.includes(q);
      if (!card.hidden) shown++;
    });
    group.hidden = shown === 0;
    const count = group.querySelector("[data-area-count]");
    if (count) count.textContent = `· ${shown}`;
    visible += shown;
  });
  document.querySelectorAll("#objetivo-content [data-area-filter]").forEach(chip => chip.setAttribute("aria-pressed", String(chip.dataset.areaFilter === area)));
  const empty = document.querySelector("#objetivo-content .objetivo-empty");
  const any = document.querySelector("#objetivo-content .objetivo-item[data-title]");
  if (empty && any) {
    empty.hidden = visible > 0;
    empty.textContent = visible ? "" : q ? t("objetivo.noMatch", { query: objetivoState.query.trim() }) : t("objetivo.noArea");
  }
}

// Vuelve a pintar la vista entera (al abrirla y al cambiar de idioma) sin mover la página: conserva scrollY y deja el foco
// en el control indicado (selector CSS) o en el que lo tenía, siempre con preventScroll
function paintObjetivo(focusSelector) {
  const container = document.getElementById("objetivo-content");
  const active = document.activeElement;
  const keep = !focusSelector && active && container.contains(active)
    ? (active.id ? `#${active.id}` : active.dataset.areaFilter ? `[data-area-filter='${active.dataset.areaFilter}']`
      : active.dataset.action ? `[data-action='${active.dataset.action}'][data-goal-id='${active.dataset.goalId || ""}']` : null) : null;
  const y = window.scrollY;
  container.innerHTML = renderObjetivo();
  settleMotion(container.querySelector(".objetivo-hero")); // motion.js: registra el % que se ve
  filterGoalCards();
  if (window.scrollY !== y) window.scrollTo(0, y);
  const target = focusSelector || keep;
  if (target) container.querySelector(target)?.focus({ preventScroll: true });
}

function announceObjetivo(text) {
  document.getElementById("objetivo-live").textContent = text;
}

// Hace un cambio en la vista sin que la página salte: la rejilla de rutas queda en el mismo punto de la pantalla aunque
// cambie el alto de lo de arriba (tarjeta del objetivo actual, aviso de error). El anclaje de scroll del navegador está
// apagado en #objetivo-content (styles.css) para no compensar dos veces.
function keepObjetivoInPlace(change) {
  const anchor = document.querySelector("#objetivo-content .objetivo-areas-list");
  const before = anchor?.getBoundingClientRect().top;
  change();
  if (!anchor?.isConnected) return;
  const delta = anchor.getBoundingClientRect().top - before;
  if (Math.abs(delta) >= 1) window.scrollBy(0, delta);
}

// Mientras se guarda: la tarjeta tocada dice "Guardando…" (aria-busy) y ninguna responde (aria-disabled). Solo cambian
// atributos y el pie de las tarjetas: nada se vuelve a pintar.
function syncObjetivoBusy() {
  document.querySelectorAll("#objetivo-content [data-action='choose']").forEach(button => {
    const saving = objetivoState.saving === button.dataset.goalId;
    if (saving) button.setAttribute("aria-busy", "true"); else button.removeAttribute("aria-busy");
    if (objetivoState.busy) button.setAttribute("aria-disabled", "true"); else button.removeAttribute("aria-disabled");
    const cta = button.querySelector(".objetivo-card-cta");
    if (cta) cta.innerHTML = goalCardCta(saving);
  });
}

function showObjetivoError() {
  const box = document.querySelector("#objetivo-content .objetivo-error");
  if (!box) return;
  box.hidden = !objetivoState.error;
  box.textContent = objetivoState.error ? t("goal.error", { error: friendlyError(objetivoState.error) }) : "";
}

// Tras cambiar de "from" a "to": la tarjeta del objetivo actual pasa a ser la de "to" y, en el hueco de la tarjeta tocada,
// entra "from" (la rejilla no se reordena bajo el puntero); el dato "en común" de las demás se recalcula. Si el foco estaba
// en la tarjeta tocada, en la del objetivo actual o se perdió, queda en la tarjeta que ocupó el hueco.
function swapObjetivo(fromId, toId) {
  const container = document.getElementById("objetivo-content");
  const current = goalById(toId);
  const previous = goalById(fromId);
  if (!container.querySelector(".objetivo-hero") || !current || !previous) { paintObjetivo(); return; }
  keepObjetivoInPlace(() => {
    const active = document.activeElement;
    const slot = container.querySelector(`.objetivo-item[data-goal-id="${toId}"]`);
    const hero = container.querySelector(".objetivo-hero");
    const refocus = !active || active === document.body || Boolean(slot?.contains(active)) || hero.contains(active);
    const order = gridOrder(objetivoState.goals, previous);
    const at = order.indexOf(String(toId));
    if (at >= 0) order[at] = String(fromId);
    objetivoState.order = order;
    hero.outerHTML = renderHero(current);
    // El contenido nuevo entra con un fundido corto (styles.css, .is-swapping) y el % y la barra van desde el valor del
    // objetivo anterior (motion.js); la tarjeta en sí no se mueve
    const fresh = container.querySelector(".objetivo-hero");
    fresh?.classList.add("is-swapping");
    settleMotion(fresh);
    // Los grupos por área se vuelven a armar (la ruta anterior puede ser de otra área que la tocada) con el nuevo orden:
    // la anterior queda en el lugar de la tocada si son de la misma área y entra con un fundido; el dato "en común" de
    // las demás se recalcula al pintar
    const others = order.map(goalById);
    container.querySelector(".objetivo-tools").innerHTML = renderAreaFilters(others);
    const list = container.querySelector(".objetivo-areas-list");
    list.classList.add("is-static"); // las demás no repiten su entrada
    list.innerHTML = renderAreaGroups(others, current);
    const card = container.querySelector(`.objetivo-item[data-goal-id="${fromId}"]`);
    card?.classList.add("is-swapped");
    filterGoalCards();
    showObjetivoError();
    if (refocus) (card?.querySelector("[data-action='choose']") || document.getElementById("objetivo-current-title"))?.focus({ preventScroll: true });
  });
}

async function loadObjetivoData() {
  const goals = await fetchGoals();
  const [catalog, readiness] = await Promise.all([
    fetchSkills().catch(() => []),
    Promise.all(goals.map(g => fetchReadiness(g.id).then(r => r.readinessPercentage).catch(() => null))),
  ]);
  Object.assign(objetivoState, { goals, catalog, readiness: new Map(goals.map((g, i) => [String(g.id), readiness[i]])) });
}

async function openObjetivo() {
  const container = document.getElementById("objetivo-content");
  if (!objetivoState.goals) container.innerHTML = `<p class="route-state text-sm text-muted-page" role="status">${routeDraw({ loop: true })}${t("objetivo.loading")}</p>`;
  try {
    await loadObjetivoData(); // con caché; la preparación se vuelve a pedir si cambió el progreso
  } catch (err) {
    container.innerHTML = renderApiError(err); // se reintenta la próxima vez que se abra la vista
    return;
  }
  objetivoState.error = null;
  paintObjetivo(objetivoState.focusOnOpen ? "#objetivo-current-title" : null);
  objetivoState.focusOnOpen = false;
}

// "Cambiar objetivo" (Perfil): la vista Objetivo con el foco en el objetivo actual
function openGoalSelection() {
  objetivoState.focusOnOpen = true;
  showView("objetivo");
  window.scrollTo(0, 0);
}

// Cambia el objetivo (al tocar una tarjeta o desde Deshacer) sin mover la página: solo se actualiza lo que cambia
// (swapObjetivo). Si falla, sigue el anterior y el error queda sobre la lista. Al cambiar sale el aviso breve con
// "Deshacer" (toast.js); deshacer se anuncia a los lectores de pantalla.
async function switchGoal(goalId, { undo = false } = {}) {
  if (objetivoState.busy) return;
  const before = currentActiveGoalId(objetivoState.goals);
  const target = String(goalId);
  if (target === before) return;
  Object.assign(objetivoState, { busy: true, saving: undo ? null : target, error: null });
  syncObjetivoBusy();
  let changed = false;
  try {
    await setActiveGoal(goalId); // dashboard.js: guarda en el backend y recalcula Mi Ruta
    changed = true;
  } catch (err) {
    objetivoState.error = err;
  }
  Object.assign(objetivoState, { busy: false, saving: null });
  if (!changed) {
    syncObjetivoBusy();
    keepObjetivoInPlace(showObjetivoError);
    return;
  }
  swapObjetivo(before, target);
  const goal = goalById(target);
  if (undo) {
    announceObjetivo(t("objetivo.undone", { goal: tGoalTitle(goal.title) }));
    return;
  }
  showToast({
    owner: "objetivo",
    text: t("objetivo.changedToast", { goal: tGoalTitle(goal.title) }),
    onUndo: () => switchGoal(before, { undo: true }),
    fallbackFocus: () => document.querySelector(`#objetivo-content .objetivo-item[data-goal-id="${before}"] [data-action='choose']`)
      || document.getElementById("objetivo-current-title"),
  });
}

function initObjetivo() {
  const container = document.getElementById("objetivo-content");
  container.addEventListener("input", e => {
    if (e.target.id !== "objetivo-search") return;
    objetivoState.query = e.target.value;
    filterGoalCards();
  });
  container.addEventListener("click", e => {
    const areaChip = e.target.closest("[data-area-filter]");
    if (areaChip) {
      objetivoState.area = areaChip.dataset.areaFilter;
      keepObjetivoInPlace(filterGoalCards);
      return;
    }
    const button = e.target.closest("[data-action]");
    if (!button || button.disabled) return;
    switch (button.dataset.action) {
      case "view-route":
        showView("dashboard");
        window.scrollTo(0, 0);
        document.getElementById("goal-button").focus();
        break;
      case "choose":
        switchGoal(button.dataset.goalId);
        break;
    }
  });
}

// Cambio de usuario: la vista se vuelve a armar la próxima vez que se abra
document.addEventListener("skillmap:user", () => {
  Object.assign(objetivoState, { goals: null, catalog: [], readiness: new Map(), order: null, saving: null, busy: false,
    error: null, query: "", area: "all", focusOnOpen: false });
  document.getElementById("objetivo-content").innerHTML = "";
});

// Cambio de idioma: se vuelve a pintar conservando la búsqueda y la posición (el aviso lo quita toast.js)
document.addEventListener("skillmap:language", () => {
  if (objetivoState.goals) paintObjetivo();
});

document.addEventListener("DOMContentLoaded", initObjetivo);
