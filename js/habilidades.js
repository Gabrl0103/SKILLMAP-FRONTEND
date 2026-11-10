// Vista "Habilidades": el catálogo completo (/api/skills) como lista, para quien prefiere leer en vez de recorrer el Mapa.
// Arriba, el resumen: cuántas dominas del total (barra y leyenda dominadas · aprendiendo · pendientes) y, al lado, tu
// objetivo con lo que llevas de su ruta. Debajo, una sola tarjeta con los filtros Todas · Dominadas · Aprendiendo ·
// Pendientes (con su cantidad; el elegido dura la sesión del navegador: sessionStorage), "Agrupar por: Categoría |
// Estado" (recordado por usuario en localStorage), cuántas se muestran y la lista en grupos con encabezado:
// - Categoría (por defecto): las categorías de la API en su orden (las mismas que los clusters del Mapa), cada una con
//   "N de M dominadas" y una mini barra con las Dos voces (menta, rosa→violeta y punteado).
// - Estado: Dominadas, Aprendiendo y Pendientes, con su cantidad. Al cambiar el estado de una fila, pasa a su grupo nuevo
//   (que se abre si estaba cerrado) con un fundido corto y queda a la vista.
// Dentro de cada grupo, por demanda. Cada grupo se pliega con su encabezado (aria-expanded; animación de alto con
// grid-template-rows). Todos abiertos salvo que haya muchos (HAB_MANY_*): entonces solo los que tienen habilidades de tu
// ruta. Un grupo sin filas con el filtro elegido no se muestra.
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
const HAB_GROUP_KEY = "skillmap.habilidades.group"; // + ".{userId}"
const HAB_GROUP_MODES = ["category", "status"];
const HAB_MANY_GROUPS = 6;  // con más grupos que esto, o
const HAB_MANY_SKILLS = 30; // más habilidades que esto, de entrada solo se abren los grupos con habilidades de tu ruta

// skills: { skills } o { error }; null = todavía sin datos. goal: { title, ids } del objetivo activo o null. request
// descarta respuestas viejas. filter: filtro elegido; keep: habilidades que cambiaron de estado con este filtro y siguen a
// la vista hasta cambiarlo (así la fila no desaparece bajo el foco); saving: id que se está guardando; error/errorId:
// último error y la habilidad a la que pertenece (el texto se arma al pintar, en el idioma vigente); undo: último cambio
// guardado { id, status } (el estado al que vuelve "Deshacer"). groupMode: "category" | "status" (null = leerlo del
// usuario al pintar); collapsed: por modo, las claves de los grupos plegados; collapseReady: modos en los que ya se aplicó
// la regla de "muchos grupos"
// onlyRoute: "Solo mi ruta" (solo las habilidades del objetivo activo; dura mientras la app está abierta)
const hab = { skills: null, goal: null, request: 0, filter: readHabFilter(), keep: new Set(), saving: null, error: null,
  errorId: null, undo: null, groupMode: null, collapsed: { category: new Set(), status: new Set() }, collapseReady: new Set(),
  onlyRoute: false };

const habGroupKey = () => `${HAB_GROUP_KEY}.${sessionUser?.id ?? "anon"}`; // session.js

function habGroupMode() {
  if (hab.groupMode) return hab.groupMode;
  let saved = null;
  try { saved = localStorage.getItem(habGroupKey()); } catch { /* sin storage: por categoría */ }
  hab.groupMode = HAB_GROUP_MODES.includes(saved) ? saved : "category";
  return hab.groupMode;
}

function saveHabGroupMode(mode) {
  try { localStorage.setItem(habGroupKey(), mode); } catch { /* sin storage: dura hasta recargar */ }
}

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
    <div class="hab-goal is-plain">
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

function renderHabFilters(all) {
  const skills = habScoped(all);
  const counts = habCounts(skills);
  return HAB_FILTERS.map(filter => {
    const n = filter === "all" ? skills.length : counts[filter];
    return `<button type="button" data-skill-filter="${filter}" aria-pressed="${hab.filter === filter}">${t(`habilidades.filter.${filter}`)}
      <span class="hab-filter-count">${n}</span></button>`;
  }).join("");
}

// "Agrupar por: Categoría | Estado" (mismo control segmentado que los filtros)
function renderHabGroupBy() {
  const mode = habGroupMode();
  return HAB_GROUP_MODES.map(m =>
    `<button type="button" data-group-mode="${m}" aria-pressed="${mode === m}">${t(`habilidades.groupBy.${m}`)}</button>`).join("");
}

function renderHabRow(skill) {
  const status = habSkillStatus(skill);
  const name = tSkill(skill.name);
  const busy = hab.saving === skill.id;
  const pct = Math.max(0, Math.min(100, Number(skill.demandPercentage) || 0));
  const onGoal = hab.goal?.ids.has(skill.id);
  // Agrupada por categoría, la categoría ya es el encabezado del grupo
  const showCat = skill.category && habGroupMode() !== "category";
  return `
    <li class="hab-row" data-skill-row="${skill.id}">
      <span class="hab-row-dot hab-row-dot--${SKILL_STATE_CLASS[status]}" aria-hidden="true"></span>
      <div class="hab-row-main">
        <div class="hab-row-top">
          <button type="button" class="gap-name gap-context hab-name" data-context="${skill.id}" aria-describedby="hab-hint">${escapeHtml(name)}</button>
          ${showCat ? `<span class="hab-cat">${escapeHtml(tCategory(skill.category))}</span>` : ""}
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

// "Solo mi ruta" encendido (y con objetivo): solo las habilidades del objetivo activo
function habScoped(skills) {
  return hab.onlyRoute && hab.goal ? skills.filter(s => hab.goal.ids.has(s.id)) : skills;
}

// "Solo mi ruta": un botón que se enciende y apaga (aria-pressed), con el mismo control que los filtros. Sin objetivo no sale
function renderHabRouteToggle() {
  if (!hab.goal) return "";
  return `<div class="hab-filters" role="group" aria-label="${escapeHtml(t("habilidades.onlyRoute"))}">
    <button type="button" data-only-route aria-pressed="${hab.onlyRoute}">${t("habilidades.onlyRoute")}</button></div>`;
}

function habVisible(skills) {
  const { filter, keep } = hab;
  return habScoped(skills).filter(s => filter === "all" || habSkillStatus(s) === filter || keep.has(s.id));
}

// Grupos con lo que deja ver el filtro (los vacíos no aparecen): { key, title, skills }
function habGroups(visible) {
  const ordered = habOrdered(visible);
  if (habGroupMode() === "status") {
    return HAB_SUMMARY.map(status => ({ key: status, title: t(`habilidades.filter.${status}`),
      skills: ordered.filter(s => habSkillStatus(s) === status) })).filter(g => g.skills.length);
  }
  return [...groupByCategory(ordered)].map(([category, items]) => ({ key: category,
    title: category ? tCategory(category) : t("habilidades.group.other"), skills: items }));
}

// La primera vez que se agrupa de un modo: con muchos grupos o habilidades, solo quedan abiertos los de tu ruta
function applyHabDefaultCollapse(groups, skills) {
  const mode = habGroupMode();
  if (hab.collapseReady.has(mode)) return;
  hab.collapseReady.add(mode);
  if (!hab.goal || (groups.length <= HAB_MANY_GROUPS && skills.length <= HAB_MANY_SKILLS)) return;
  groups.filter(g => !g.skills.some(s => hab.goal.ids.has(s.id))).forEach(g => hab.collapsed[mode].add(g.key));
}

// Mini barra de una categoría con las Dos voces: dominadas (menta), aprendiendo (rosa→violeta) y lo pendiente punteado
function renderHabGroupBar(counts, total) {
  const seg = (kind, n) => (n ? `<span class="hab-group-seg hab-group-seg--${kind}" style="flex-basis:${(n / total) * 100}%"></span>` : "");
  return `<span class="hab-group-bar" aria-hidden="true">${seg("mastered", counts.MASTERED)}${seg("progress", counts.IN_PROGRESS)}${seg("pending", counts.PENDING)}</span>`;
}

// Encabezado (botón que pliega el grupo) y sus filas. Por categoría, el avance cuenta toda la categoría aunque el filtro
// muestre solo una parte; por estado, cuántas hay en el grupo.
function renderHabGroup(group, index, skills) {
  const mode = habGroupMode();
  const open = !hab.collapsed[mode].has(group.key);
  const panel = `hab-group-${mode}-${index}`;
  let meta;
  if (mode === "category") {
    const all = skills.filter(s => (s.category || "") === group.key);
    const counts = habCounts(all);
    meta = `<span class="hab-group-count">${tn("habilidades.group.mastered", all.length, { done: counts.MASTERED, total: all.length })}</span>
      ${renderHabGroupBar(counts, all.length)}`;
  } else {
    meta = `<span class="hab-group-count">${tn("habilidades.group.count", group.skills.length)}</span>`;
  }
  return `
    <section class="hab-group" data-group="${escapeHtml(group.key)}">
      <h3 class="hab-group-heading">
        <button type="button" class="hab-group-toggle" data-group-toggle="${escapeHtml(group.key)}" aria-expanded="${open}" aria-controls="${panel}">
          <span class="hab-group-title">${escapeHtml(group.title)}</span>
          ${meta}
          <svg class="hab-group-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </h3>
      <div class="hab-group-panel" id="${panel}" data-open="${open}"${open ? "" : " inert"}>
        <div class="hab-group-inner"><ul class="hab-list">${group.skills.map(renderHabRow).join("")}</ul></div>
      </div>
    </section>`;
}

// La lista con lo que deja ver el filtro, en grupos; sin ninguna, el estado vacío del filtro con el Motivo de Ruta y
// "Ver todas"
function renderHabBody(skills) {
  const visible = habVisible(skills);
  if (!visible.length) {
    const scoped = hab.onlyRoute && hab.goal;
    return `
      <div class="route-state hab-empty">${routeDraw()}<p>${t(scoped ? "habilidades.empty.route" : `habilidades.empty.${hab.filter}`)}</p>
        ${hab.filter !== "all" || scoped ? `<button type="button" class="btn-ghost" data-skill-filter="all">${t("habilidades.clearFilter")}</button>` : ""}
      </div>`;
  }
  const groups = habGroups(visible);
  applyHabDefaultCollapse(groups, skills);
  return `<div class="hab-groups">${groups.map((g, i) => renderHabGroup(g, i, skills)).join("")}</div>`;
}

// Pliega o abre un grupo sin repintar la lista (así se anima el alto); el panel plegado queda inert (sin foco)
function toggleHabGroup(button) {
  const key = button.dataset.groupToggle;
  const set = hab.collapsed[habGroupMode()];
  const open = set.has(key);
  if (open) set.delete(key); else set.add(key);
  button.setAttribute("aria-expanded", String(open));
  const panel = document.getElementById(button.getAttribute("aria-controls"));
  if (!panel) return;
  panel.dataset.open = String(open);
  panel.inert = !open;
}

// Agrupada por estado, la fila que cambió de estado pasa a otro grupo: se abre ese grupo y la fila entra con un fundido
// corto y queda a la vista (sin animación con movimiento reducido)
const HAB_REVEAL_MS = 320;
let habReveal = null; // { id, start }: fundido de la fila en curso, para seguirlo si la lista se repinta (al confirmar el PUT)

function revealHabRow(id) {
  if (habGroupMode() !== "status") return;
  const row = document.querySelector(`#habilidades-content [data-skill-row="${id}"]`);
  if (!row) return;
  const reduced = prefersReducedMotion(); // theme.js
  row.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  if (reduced || typeof row.animate !== "function") return;
  habReveal = { id, start: performance.now() };
  animateHabReveal(row, 0);
}

function animateHabReveal(row, from) {
  const left = HAB_REVEAL_MS * (1 - from);
  row.animate([{ opacity: from, translate: `0 ${8 * (1 - from)}px` }, { opacity: 1, translate: "0 0" }], { duration: left, easing: motionEasing().css });
}

// La lista se repintó con la fila a mitad de su fundido: sigue desde donde iba en vez de saltar al final
function continueHabReveal() {
  if (!habReveal) return;
  const p = (performance.now() - habReveal.start) / HAB_REVEAL_MS;
  const row = document.querySelector(`#habilidades-content [data-skill-row="${habReveal.id}"]`);
  if (p >= 1 || !row) { habReveal = null; return; }
  animateHabReveal(row, motionEasing().fn(p));
}

// Antes de repintar: si la fila va a un grupo plegado (por estado), se abre
function openHabGroupFor(status) {
  if (habGroupMode() === "status") hab.collapsed.status.delete(status);
}

function renderHabShowing(skills) {
  return t("habilidades.showing", { n: habVisible(skills).length, total: habScoped(skills).length });
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
      <section class="ruta-card hab-card is-flat" aria-labelledby="hab-list-title">
        <h2 id="hab-list-title" class="ruta-card-title">${t("habilidades.listTitle")}</h2>
        <div class="hab-toolbar">
          <div class="hab-groupby">
            <div class="hab-filters" id="hab-filters" role="group" aria-label="${t("habilidades.filter.group")}">${renderHabFilters(skills)}</div>
            <div id="hab-route-toggle" class="hab-groupby">${renderHabRouteToggle()}</div>
          </div>
          <div class="hab-groupby">
            <span class="hab-groupby-label" id="hab-groupby-label">${t("habilidades.groupBy")}</span>
            <div class="hab-filters" id="hab-groupby" role="group" aria-labelledby="hab-groupby-label">${renderHabGroupBy()}</div>
          </div>
        </div>
        <p class="hab-hint" id="hab-hint">${t("habilidades.hint")}</p>
        <p class="hab-showing" id="hab-showing" aria-live="polite">${renderHabShowing(skills)}</p>
        <div class="hab-body is-new" id="hab-body">${renderHabBody(skills)}</div>
        ${note}
      </section>`;
  }
  if (focus) focusHab(focus);
}

// Actualiza resumen, filtros y lista en su lugar (motion.js: morphInto): una fila que cambia de estado sigue siendo el
// mismo nodo (su opción elegida hace el fundido y nada más se repinta) y las barras de demanda no vuelven a crecer. Las
// filas que reaparecen (filtro, agrupar) entran con un fundido corto; si la lista encoge, la página no salta
// (keepScrollRoom). focus: { id, kind: "picker" | "name" } o { filter }; sin él, el foco vuelve a donde estaba.
function refreshHabList(focus = habFocus()) {
  const body = document.getElementById("hab-body");
  const skills = hab.skills?.skills;
  if (!body || !skills) return;
  const summary = document.getElementById("hab-summary");
  summary.classList.remove("is-new");
  morphInto(summary, skills.length ? renderHabOverview(skills) : "");
  settleMotion(summary); // motion.js: números y barra desde el valor anterior
  morphInto(document.getElementById("hab-filters"), renderHabFilters(skills));
  morphInto(document.getElementById("hab-groupby"), renderHabGroupBy());
  morphInto(document.getElementById("hab-route-toggle"), renderHabRouteToggle());
  queueMicrotask(continueHabReveal);
  document.getElementById("hab-showing").textContent = renderHabShowing(skills);
  body.classList.remove("is-new");
  let added = [];
  keepScrollRoom(() => { added = morphInto(body, renderHabBody(skills)); });
  added.forEach(el => { motionSkipEntry(el); motionFade(el); });
  if (focus) focusHab(focus);
}

// Tras repintar. Si el filtro ya no muestra la fila (p. ej. quedó dominada con "Pendientes"), al título de la vista
function focusHab(focus) {
  if (focus.filter) {
    document.querySelector(`#hab-filters [data-skill-filter="${focus.filter}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (focus.onlyRoute) {
    document.querySelector("#habilidades-content [data-only-route]")?.focus({ preventScroll: true });
    return;
  }
  if (focus.groupMode) {
    document.querySelector(`#hab-groupby [data-group-mode="${focus.groupMode}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (focus.groupToggle !== undefined) {
    [...document.querySelectorAll("#habilidades-content [data-group-toggle]")]
      .find(b => b.dataset.groupToggle === focus.groupToggle)?.focus({ preventScroll: true });
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
  if (active.dataset.groupMode) return { groupMode: active.dataset.groupMode };
  if (active.hasAttribute("data-only-route")) return { onlyRoute: true };
  if (active.dataset.groupToggle !== undefined) return { groupToggle: active.dataset.groupToggle };
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
  if (undo) pulseStatus(id, status); // skill-status.js: Deshacer vuelve con el mismo fundido
  replaceHabSkill(id, { status });
  Object.assign(hab, { saving: id, errorId: null });
  hab.keep.add(id);
  openHabGroupFor(status);
  refreshHabList(undo ? { id, kind: "picker" } : habFocus());
  revealHabRow(id);
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
    openHabGroupFor(previous.status);
    refreshHabList();
    revealHabRow(id);
    return;
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
    const toggle = e.target.closest("[data-group-toggle]");
    if (toggle) { toggleHabGroup(toggle); return; }
    const mode = e.target.closest("[data-group-mode]");
    if (mode) {
      if (mode.dataset.groupMode === habGroupMode()) return;
      hab.groupMode = mode.dataset.groupMode;
      saveHabGroupMode(hab.groupMode);
      refreshHabList({ groupMode: hab.groupMode });
      return;
    }
    if (e.target.closest("[data-only-route]")) {
      hab.onlyRoute = !hab.onlyRoute;
      hab.keep.clear();
      refreshHabList({ onlyRoute: true });
      return;
    }
    const filter = e.target.closest("[data-skill-filter]");
    if (filter) {
      const clearsRoute = filter.closest(".hab-empty") && hab.onlyRoute;
      if (clearsRoute) hab.onlyRoute = false; // "Ver todas" del estado vacío también quita "Solo mi ruta"
      if (filter.dataset.skillFilter === hab.filter && !clearsRoute) return;
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
  Object.assign(hab, { skills: null, goal: null, saving: null, error: null, errorId: null, undo: null, groupMode: null, onlyRoute: false });

  hab.keep.clear();
  hab.collapsed.category.clear();
  hab.collapsed.status.clear();
  hab.collapseReady.clear();
  document.getElementById("hab-summary").innerHTML = "";
  document.getElementById("habilidades-content").replaceChildren();
});

// Cambio de idioma: si la vista ya se pintó, se vuelve a pintar con los datos ya cargados (el foco se conserva)
document.addEventListener("skillmap:language", () => {
  if (document.getElementById("habilidades-content").childElementCount) paintHabilidades({ keepFocus: true });
});

document.addEventListener("DOMContentLoaded", initHabilidades);
