// Vista "Habilidades": el catálogo completo (/api/skills) como lista, para quien prefiere leer en vez de recorrer el Mapa.
// Arriba, el resumen: cuántas dominas del total (barra y leyenda dominadas · aprendiendo · pendientes) y, al lado, tu
// objetivo con lo que llevas de su ruta. Debajo, una sola tarjeta con los filtros Todas · Dominadas · Aprendiendo ·
// Pendientes (con su cantidad; el elegido dura la sesión del navegador: sessionStorage), cuántas se muestran y la lista
// en el orden de la API por categoría (como los clusters del Mapa) y, dentro, por demanda.
// Cada fila: el estado como punto, el nombre (abre el contexto y preguntas frecuentes, skill-detalle.js), la categoría, si
// está en tu ruta, la demanda (barra y %) y el selector Pendiente / Aprendiendo / Dominada (skill-status.js), el mismo de
// Mi Ruta. El cambio se ve al instante, se guarda con PUT y avisa a Mapa, Mi Ruta y Perfil (skillmap:progress con source
// "habilidades"); si el backend falla vuelve al estado anterior con el error en la fila. Al guardar, el aviso breve de
// toast.js ofrece "Deshacer" (vuelve al estado anterior con otro PUT). Se repinta conservando el foco.
// renderSkillSummary también lo usa el resumen "Mis habilidades" de Perfil (perfil.js).
// Usa fetchSkills, fetchGoals, getActiveGoalId, savedGoalId, renderApiError y sampleDemandNote (dashboard.js),
// groupByCategory, escapeHtml y showView (mapa.js), renderStatusPicker, bindStatusPicker, focusStatusPicker,
// saveSkillStatus, SKILL_STATES y SKILL_STATE_CLASS (skill-status.js), skillDetail y openSkillDetail (skill-detalle.js),
// routeDraw (route-motif.js), prefersReducedMotion (theme.js), showToast y hideToast (toast.js), friendlyError
// (session.js) y t, tn, statusLabel, tSkill,
// tCategory y tGoalTitle (i18n.js).

const HAB_FILTER_KEY = "skillmap.habilidades.filter";
const HAB_FILTERS = ["all", "MASTERED", "IN_PROGRESS", "PENDING"];
const HAB_SUMMARY = ["MASTERED", "IN_PROGRESS", "PENDING"]; // orden del resumen: lo logrado primero

// skills: { skills } o { error }; null = todavía sin datos. goal: { title, ids } del objetivo activo o null. request
// descarta respuestas viejas. filter: filtro elegido; keep: habilidades que cambiaron de estado con este filtro y siguen a
// la vista hasta cambiarlo (así la fila no desaparece bajo el foco); saving: id que se está guardando; error/errorId:
// último error y la habilidad a la que pertenece (el texto se arma al pintar, en el idioma vigente); undo: último cambio
// guardado { id, status } (el estado al que vuelve "Deshacer")
const hab = { skills: null, goal: null, request: 0, filter: readHabFilter(), keep: new Set(), saving: null, error: null,
  errorId: null, undo: null };

function readHabFilter() {
  try {
    const saved = sessionStorage.getItem(HAB_FILTER_KEY);
    return HAB_FILTERS.includes(saved) ? saved : "all";
  } catch { return "all"; }
}

function saveHabFilter(filter) {
  try { sessionStorage.setItem(HAB_FILTER_KEY, filter); } catch { /* sin storage: se recuerda hasta recargar */ }
}

const habSkillStatus = skill => (SKILL_STATES.includes(skill.status) ? skill.status : "PENDING");

function habCounts(skills) {
  const counts = Object.fromEntries(HAB_SUMMARY.map(status => [status, 0]));
  skills.forEach(s => { counts[habSkillStatus(s)]++; });
  return counts;
}

// ---------- Resumen (también en Perfil) ----------

// "4 dominadas · 3 aprendiendo · 13 pendientes", cada uno con el círculo de su estado (menta, rosa→violeta, punteado).
// bar: debajo, la barra de proporciones (menta y rosa→violeta sólidos; lo pendiente, la pista vacía). La barra es
// decorativa: la leyenda ya dice los números.
// motion: prefijo de las claves de motion.js (los números y la barra van del valor anterior al nuevo); sin él, quietos
function renderSkillSummary(skills, { bar = false, motion = "" } = {}) {
  const counts = habCounts(skills);
  const mark = (kind, key, value) => (motion ? ` data-motion="${kind}:${motion}-${key}"${value == null ? "" : ` data-value="${value}"`}` : "");
  const items = HAB_SUMMARY.map(status => `
    <li class="hab-summary-item">
      <span class="hab-dot hab-dot--${SKILL_STATE_CLASS[status]}" aria-hidden="true"></span>
      <strong${mark("count", status)}>${counts[status]}</strong> ${tn(`habilidades.summary.${status}`, counts[status])}
    </li>`).join("");
  const segments = bar && skills.length ? ["MASTERED", "IN_PROGRESS"].filter(status => counts[status]).map(status =>
    `<span class="hab-bar hab-bar--${SKILL_STATE_CLASS[status]}" style="flex-basis:${(counts[status] / skills.length) * 100}%"${mark("bar", `bar-${status}`, (counts[status] / skills.length) * 100)}></span>`).join("") : "";
  return `
    ${bar && skills.length ? `<div class="hab-summary-bar" aria-hidden="true">${segments}</div>` : ""}
    <ul class="hab-summary" aria-label="${t("habilidades.summary.label")}">${items}</ul>`;
}

// Resumen de la vista: cuántas dominas del total y, al lado, el objetivo con su avance y "Ver mi ruta"
function renderHabOverview(skills) {
  const counts = habCounts(skills);
  const { goal } = hab;
  const goalSkills = goal ? skills.filter(s => goal.ids.has(s.id)) : [];
  const goalDone = goalSkills.filter(s => habSkillStatus(s) === "MASTERED").length;
  const side = goal && goalSkills.length ? `
    <div class="hab-goal">
      <span class="hab-goal-label">${t("habilidades.goal.label")}</span>
      <span class="hab-goal-name">${escapeHtml(tGoalTitle(goal.title))}</span>
      <span class="hab-goal-count">${t("habilidades.goal.count", { n: `<strong data-motion="count:hab-goal-done">${goalDone}</strong>`, total: `<strong>${goalSkills.length}</strong>` })}</span>
      <button type="button" class="hab-goal-link" data-action="view-route">${t("objetivo.viewRoute")}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </div>` : "";
  return `
    <section class="ruta-card hab-overview" aria-labelledby="hab-overview-title">
      <div class="hab-overview-main">
        <h2 id="hab-overview-title" class="hab-overview-title"><strong data-motion="count:hab-overview">${counts.MASTERED}</strong>
          <span>${t("habilidades.overview", { total: skills.length })}</span></h2>
        ${renderSkillSummary(skills, { bar: true, motion: "hab" })}
      </div>
      ${side}
    </section>`;
}

// ---------- Marcado ----------

function renderHabFilters(skills) {
  const counts = habCounts(skills);
  return HAB_FILTERS.map(filter => {
    const n = filter === "all" ? skills.length : counts[filter];
    return `<button type="button" data-skill-filter="${filter}" aria-pressed="${hab.filter === filter}">${t(`habilidades.filter.${filter}`)}
      <span class="hab-filter-count">${n}</span></button>`;
  }).join("");
}

function renderHabRow(skill) {
  const status = habSkillStatus(skill);
  const name = tSkill(skill.name);
  const busy = hab.saving === skill.id;
  const pct = Math.max(0, Math.min(100, Number(skill.demandPercentage) || 0));
  const onGoal = hab.goal?.ids.has(skill.id);
  return `
    <li class="hab-row" data-skill-row="${skill.id}">
      <span class="hab-row-dot hab-row-dot--${SKILL_STATE_CLASS[status]}" aria-hidden="true"></span>
      <div class="hab-row-main">
        <div class="hab-row-top">
          <button type="button" class="gap-name gap-context hab-name" data-context="${skill.id}" aria-describedby="hab-hint">${escapeHtml(name)}</button>
          ${skill.category ? `<span class="hab-cat">${escapeHtml(tCategory(skill.category))}</span>` : ""}
          ${onGoal ? `<span class="hab-on-goal">${t("habilidades.onGoal")}</span>` : ""}
        </div>
        <div class="hab-demand">
          <span class="gap-bar hab-demand-bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
          <span class="hab-demand-pct">${t("habilidades.demandPct", { pct })}</span>
        </div>
      </div>
      <div class="hab-status">${renderStatusPicker(skill, busy)}</div>
      ${hab.errorId === skill.id ? `<p class="hab-row-error" role="alert">${escapeHtml(t("state.error",
        { error: friendlyError(hab.error) }))}</p>` : ""}
    </li>`;
}

// Orden de la lista: categorías en el orden de la API y, dentro, por demanda
function habOrdered(skills) {
  return [...groupByCategory(skills)].flatMap(([, items]) => [...items].sort((a, b) => b.demandPercentage - a.demandPercentage));
}

function habVisible(skills) {
  const { filter, keep } = hab;
  return skills.filter(s => filter === "all" || habSkillStatus(s) === filter || keep.has(s.id));
}

// La lista con lo que deja ver el filtro; sin ninguna, el estado vacío del filtro con el Motivo de Ruta y "Ver todas"
function renderHabBody(skills) {
  const visible = habVisible(skills);
  if (!visible.length) {
    return `
      <div class="route-state hab-empty">${routeDraw()}<p>${t(`habilidades.empty.${hab.filter}`)}</p>
        ${hab.filter !== "all" ? `<button type="button" class="btn-ghost" data-skill-filter="all">${t("habilidades.clearFilter")}</button>` : ""}
      </div>`;
  }
  return `<ul class="hab-list">${habOrdered(visible).map(renderHabRow).join("")}</ul>`;
}

function renderHabShowing(skills) {
  return t("habilidades.showing", { n: habVisible(skills).length, total: skills.length });
}

// Aviso breve tras guardar un cambio, con "Deshacer" (toast.js). Si al deshacer otra fila se está guardando, espera.
function showHabToast(skill) {
  showToast({
    owner: "habilidades",
    text: t("toast.status", { name: tSkill(skill.name), status: statusLabel(habSkillStatus(skill)) }),
    onUndo: () => { if (hab.undo && hab.saving === null) setHabSkillStatus(hab.undo.id, hab.undo.status, { undo: true }); },
    fallbackFocus: () => document.querySelector(`#habilidades-content [data-skill-row="${skill.id}"] .status-picker [aria-checked='true']`)
      || document.getElementById("habilidades-title"),
  });
}

// Vista completa: cargando, error o resumen + lista. La lista entra escalonada solo aquí (.is-new); los repintados de
// refreshHabList no repiten la entrada.
function paintHabilidades({ keepFocus = false } = {}) {
  const focus = keepFocus ? habFocus() : null;
  const summary = document.getElementById("hab-summary");
  const content = document.getElementById("habilidades-content");
  summary.classList.add("is-new");
  if (hab.skills?.error) {
    summary.innerHTML = "";
    content.innerHTML = renderApiError(hab.skills.error);
  } else if (!hab.skills) {
    summary.innerHTML = "";
    content.innerHTML = `<p class="route-state text-sm text-muted-page" role="status">${routeDraw({ loop: true })}${t("habilidades.loading")}</p>`;
  } else {
    const { skills } = hab.skills;
    summary.innerHTML = skills.length ? renderHabOverview(skills) : "";
    settleMotion(summary); // motion.js
    // La demanda se marca como ejemplo mientras alguna habilidad la tenga sembrada (demandIsSample)
    const note = skills.length ? sampleDemandNote("hab-sample-note", skills) : "";
    content.innerHTML = `
      <section class="ruta-card hab-card" aria-labelledby="hab-list-title">
        <h2 id="hab-list-title" class="ruta-card-title">${t("habilidades.listTitle")}</h2>
        <div class="hab-filters" id="hab-filters" role="group" aria-label="${t("habilidades.filter.group")}">${renderHabFilters(skills)}</div>
        <p class="hab-hint" id="hab-hint">${t("habilidades.hint")}</p>
        <p class="hab-showing" id="hab-showing" aria-live="polite">${renderHabShowing(skills)}</p>
        <div class="hab-body is-new" id="hab-body">${renderHabBody(skills)}</div>
        ${note}
      </section>`;
  }
  if (focus) focusHab(focus);
}

// Repinta resumen, filtros y lista. focus: { id, kind: "picker" | "name" } o { filter }; sin él, se devuelve el foco a
// donde estaba (repintar lo quita)
function refreshHabList(focus = habFocus()) {
  const body = document.getElementById("hab-body");
  const skills = hab.skills?.skills;
  if (!body || !skills) return;
  const summary = document.getElementById("hab-summary");
  summary.classList.remove("is-new");
  summary.innerHTML = skills.length ? renderHabOverview(skills) : "";
  settleMotion(summary); // motion.js: números y barra desde el valor anterior
  document.getElementById("hab-filters").innerHTML = renderHabFilters(skills);
  document.getElementById("hab-showing").textContent = renderHabShowing(skills);
  body.classList.remove("is-new");
  body.innerHTML = renderHabBody(skills);
  if (focus) focusHab(focus);
}

// Tras repintar. Si el filtro ya no muestra la fila (p. ej. quedó dominada con "Pendientes"), al título de la vista
function focusHab(focus) {
  if (focus.filter) {
    document.querySelector(`#hab-filters [data-skill-filter="${focus.filter}"]`)?.focus({ preventScroll: true });
    return;
  }
  const row = document.querySelector(`#habilidades-content [data-skill-row="${focus.id}"]`);
  if (!row) document.getElementById("habilidades-title")?.focus({ preventScroll: true });
  else if (focus.kind === "picker") focusStatusPicker(row);
  else row.querySelector("[data-context]")?.focus({ preventScroll: true });
}

function habFocus() {
  const active = document.activeElement;
  if (!active?.closest("#habilidades-content")) return null;
  if (active.dataset.skillFilter) return { filter: active.dataset.skillFilter };
  const row = active.closest("[data-skill-row]");
  if (!row) return null;
  return { id: row.dataset.skillRow, kind: active.closest(".status-picker") ? "picker" : "name" };
}

function announceHab(text) {
  const status = document.getElementById("habilidades-status");
  status.textContent = "";
  setTimeout(() => { status.textContent = text; }, 50);
}

// ---------- Cambio de estado ----------

// Copia nueva de la lista (el arreglo puede ser el mismo que usa el Mapa: no se modifica en el lugar)
function replaceHabSkill(id, changes) {
  const list = hab.skills.skills.map(s => (s.id === id ? { ...s, ...changes } : s));
  hab.skills = { skills: list };
  return list.find(s => s.id === id);
}

// La fila cambia al instante; si el backend falla vuelve al estado anterior y muestra el error. Mientras se guarda no se
// elige otro estado en ninguna fila. undo: el cambio viene de "Deshacer" (no ofrece deshacerlo otra vez)
async function setHabSkillStatus(id, status, { undo = false } = {}) {
  const skill = hab.skills?.skills?.find(s => s.id === id);
  if (!skill || hab.saving !== null || habSkillStatus(skill) === status) return;
  const previous = { status: habSkillStatus(skill) };
  replaceHabSkill(id, { status });
  Object.assign(hab, { saving: id, errorId: null });
  hab.keep.add(id);
  refreshHabList(undo ? { id, kind: "picker" } : habFocus());
  try {
    const updated = await saveSkillStatus(id, status);
    if (hab.saving !== id) return; // cambió el usuario mientras se guardaba
    const saved = replaceHabSkill(id, updated);
    hab.saving = null;
    hab.undo = undo ? null : { id, status: previous.status };
    if (undo) announceHab(t("habilidades.undone", { name: tSkill(saved.name), status: statusLabel(saved.status) }));
    else showHabToast(saved); // el aviso (role="status") lo leen los lectores de pantalla
    // Mapa actualiza el nodo, Mi Ruta y el Analizador descartan sus datos y Perfil recalcula estadísticas y logros
    document.dispatchEvent(new CustomEvent("skillmap:progress", { detail: { skill: saved, source: "habilidades" } }));
  } catch (err) {
    if (hab.saving !== id) return;
    replaceHabSkill(id, previous);
    Object.assign(hab, { saving: null, error: err, errorId: id });
  }
  refreshHabList();
}

// ---------- Carga ----------

// Objetivo activo y sus habilidades ("En tu ruta" y el resumen); null si no hay o si /api/goals falla
async function fetchHabGoal() {
  const goals = await fetchGoals().catch(() => null);
  if (!goals?.length) return null;
  const active = getActiveGoalId() ?? savedGoalId(goals);
  const goal = goals.find(g => String(g.id) === String(active));
  return goal ? { title: goal.title, ids: new Set(goal.skills.map(s => s.skillId)) } : null;
}

// Cada vez que se abre la vista (la petición está en caché en dashboard.js). Con la lista ya pintada, los datos nuevos
// se repintan sin repetir la entrada y conservando el foco (vuelta del detalle de habilidad)
async function loadHabilidades() {
  const request = ++hab.request;
  const [skills, goal] = await Promise.all([fetchSkills().then(list => ({ skills: list }), error => ({ error })), fetchHabGoal()]);
  if (request !== hab.request) return; // cambió el usuario o su progreso mientras cargaba
  const painted = Boolean(hab.skills?.skills && document.getElementById("hab-body"));
  Object.assign(hab, { skills, goal });
  if (painted && skills.skills) refreshHabList();
  else paintHabilidades({ keepFocus: true });
}

// Al abrir la vista (showView en mapa.js): se pinta una vez y los datos se refrescan siempre
function openHabilidades() {
  if (!document.getElementById("habilidades-content").childElementCount) paintHabilidades();
  loadHabilidades();
}

// "Ver mis habilidades como lista" (Mapa) y "Ver todas mis habilidades" (Perfil): abre la vista con el foco en su título
function openHabilidadesList() {
  showView("habilidades");
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  document.getElementById("habilidades-title").focus({ preventScroll: true });
}

// ---------- Eventos ----------

function initHabilidades() {
  const view = document.getElementById("view-habilidades");
  view.addEventListener("click", e => {
    const filter = e.target.closest("[data-skill-filter]");
    if (filter) {
      if (filter.dataset.skillFilter === hab.filter) return;
      hab.filter = filter.dataset.skillFilter;
      hab.keep.clear();
      saveHabFilter(hab.filter);
      refreshHabList({ filter: hab.filter });
      return;
    }
    const action = e.target.closest("[data-action]");
    if (action?.dataset.action === "view-route") {
      showView("dashboard");
      window.scrollTo(0, 0);
      document.getElementById("goal-button").focus();
      return;
    }
    const context = e.target.closest("[data-context]");
    if (context) openSkillDetail(Number(context.dataset.context), context); // skill-detalle.js
  });
  bindStatusPicker(view, (id, status) => setHabSkillStatus(id, status));
}

// Estado cambiado en otra vista. Desde el detalle (skill-detalle.js) llega la habilidad: la fila se actualiza ya, para
// que "Volver" encuentre la fila y le devuelva el foco; si el detalle se abrió desde aquí, la fila sigue a la vista
// aunque el filtro ya no la incluya. Una carga en vuelo se descarta: al abrir la vista se vuelve a pedir. El aviso con
// "Deshacer" se quita: el último cambio ya no es el de esta vista.
document.addEventListener("skillmap:progress", e => {
  if (e.detail?.source === "habilidades") return;
  hab.request++;
  hab.undo = null;
  hideToast("habilidades");
  const skill = e.detail?.skill;
  if (!skill || !hab.skills?.skills?.some(s => s.id === skill.id)) return;
  replaceHabSkill(skill.id, skill);
  if (skillDetail.from === "habilidades") hab.keep.add(skill.id);
  refreshHabList(null);
});

document.addEventListener("skillmap:user", () => {
  hab.request++;
  Object.assign(hab, { skills: null, goal: null, saving: null, error: null, errorId: null, undo: null });
  hab.keep.clear();
  document.getElementById("hab-summary").innerHTML = "";
  document.getElementById("habilidades-content").replaceChildren();
});

// Cambio de idioma: si la vista ya se pintó, se vuelve a pintar con los datos ya cargados (el foco se conserva)
document.addEventListener("skillmap:language", () => {
  if (document.getElementById("habilidades-content").childElementCount) paintHabilidades({ keepFocus: true });
});

document.addEventListener("DOMContentLoaded", initHabilidades);
