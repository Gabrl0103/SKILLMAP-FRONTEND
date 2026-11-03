// Vista "Habilidades": el catálogo completo (/api/skills) como lista, para quien prefiere leer en vez de recorrer el Mapa.
// Encabezado con el resumen (dominadas · aprendiendo · pendientes y una barra), filtros segmentados Todas · Dominadas ·
// Aprendiendo · Pendientes en una fila (el elegido dura la sesión del navegador: sessionStorage) y una tarjeta por
// categoría (en el orden de la API, como los clusters del Mapa) con sus habilidades ordenadas por demanda.
// Cada fila: el nombre abre el contexto y preguntas frecuentes (skill-detalle.js), la demanda (barra y %) y un
// indicador de estado (círculo + etiqueta) que abre el selector Pendiente / Aprendiendo / Dominada (skill-status.js,
// variante menú) en un popover anclado que se abre hacia arriba si abajo no cabe. El cambio se ve al instante, se
// guarda con PUT y avisa a Mapa, Mi Ruta y Perfil (skillmap:progress con source "habilidades"); si el backend falla
// vuelve al estado anterior con el error en la fila. Se repinta conservando el foco.
// renderSkillSummary también lo usa el resumen "Mis habilidades" de Perfil (perfil.js).
// Usa fetchSkills, renderApiError y sampleDemandNote (dashboard.js), groupByCategory, escapeHtml y showView (mapa.js),
// renderStatusPicker, bindStatusPicker, focusStatusPicker, saveSkillStatus, SKILL_STATES y SKILL_STATE_CLASS
// (skill-status.js), skillDetail y openSkillDetail (skill-detalle.js), routeDraw (route-motif.js), prefersReducedMotion
// (theme.js), friendlyError (session.js) y t, tn, statusLabel, tSkill y tCategory (i18n.js).

const HAB_FILTER_KEY = "skillmap.habilidades.filter";
const HAB_FILTERS = ["all", "MASTERED", "IN_PROGRESS", "PENDING"];
const HAB_SUMMARY = ["MASTERED", "IN_PROGRESS", "PENDING"]; // orden del resumen: lo logrado primero

// skills: { skills } o { error }; null = todavía sin datos. request descarta respuestas viejas.
// filter: filtro elegido; keep: habilidades que cambiaron de estado con este filtro y siguen a la vista hasta cambiarlo
// (así la fila no desaparece bajo el foco); open: id con el selector abierto; saving: id que se está guardando;
// error/errorId: último error y la habilidad a la que pertenece (el texto se arma al pintar, en el idioma vigente);
// painting: repintando (quitar el elemento enfocado no cuenta como "el foco salió")
const hab = { skills: null, request: 0, filter: readHabFilter(), keep: new Set(), open: null, saving: null, error: null,
  errorId: null, painting: false };

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

// ---------- Resumen (también en Perfil) ----------

// "4 dominadas · 3 aprendiendo · 13 pendientes", cada uno con el círculo de su estado (menta, rosa→violeta, punteado).
// bar: debajo, la barra de proporciones (menta y rosa→violeta sólidos; lo pendiente, punteado: "todavía no"). La barra
// es decorativa: la lista ya dice los números.
function renderSkillSummary(skills, { bar = false } = {}) {
  const counts = Object.fromEntries(HAB_SUMMARY.map(status => [status, 0]));
  skills.forEach(s => { counts[habSkillStatus(s)]++; });
  const items = HAB_SUMMARY.map(status => `
    <li class="hab-summary-item">
      <span class="hab-dot hab-dot--${SKILL_STATE_CLASS[status]}" aria-hidden="true"></span>
      <strong>${counts[status]}</strong> ${tn(`habilidades.summary.${status}`, counts[status])}
    </li>`).join("");
  const segments = bar && skills.length ? HAB_SUMMARY.filter(status => counts[status]).map(status => {
    const width = status === "PENDING" ? "" : ` style="flex-basis:${(counts[status] / skills.length) * 100}%"`;
    return `<span class="hab-bar hab-bar--${SKILL_STATE_CLASS[status]}"${width}></span>`;
  }).join("") : "";
  return `
    <ul class="hab-summary" aria-label="${t("habilidades.summary.label")}">${items}</ul>
    ${segments ? `<div class="hab-summary-bar" aria-hidden="true">${segments}</div>` : ""}`;
}

// ---------- Marcado ----------

function renderHabFilters() {
  return HAB_FILTERS.map(filter => `
    <button type="button" data-skill-filter="${filter}" aria-pressed="${hab.filter === filter}">${t(`habilidades.filter.${filter}`)}</button>`).join("");
}

const HAB_CARET = `<svg class="hab-chip-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;

function renderHabRow(skill) {
  const status = habSkillStatus(skill);
  const name = tSkill(skill.name);
  const open = hab.open === skill.id;
  const busy = hab.saving === skill.id;
  const pct = Math.max(0, Math.min(100, Number(skill.demandPercentage) || 0));
  return `
    <li class="hab-row" data-skill-row="${skill.id}">
      <button type="button" class="hab-name" data-context="${skill.id}" aria-describedby="hab-hint">${escapeHtml(name)}</button>
      <span class="hab-demand">
        <span class="hab-demand-bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
        <span class="hab-demand-pct">${pct}%<span class="sr-only"> ${t("habilidades.demand")}</span></span>
      </span>
      <span class="hab-state">
        <button type="button" class="hab-chip hab-chip--${SKILL_STATE_CLASS[status]}" data-status-chip="${skill.id}"
          aria-haspopup="menu" aria-expanded="${open}" ${open ? `aria-controls="hab-menu"` : ""}
          aria-label="${escapeHtml(t("habilidades.chip", { name, status: statusLabel(status) }))}"${busy ? ` aria-busy="true"` : ""}>${statusLabel(status)}${HAB_CARET}</button>
        ${open ? `<span class="hab-menu" id="hab-menu">${renderStatusPicker(skill, busy, { menu: true })}</span>` : ""}
      </span>
      ${hab.errorId === skill.id ? `<p class="hab-row-error" role="alert">${escapeHtml(t("state.error",
        { error: friendlyError(hab.error) }))}</p>` : ""}
    </li>`;
}

// Una tarjeta por categoría con lo que deja ver el filtro; la cabecera rotula las columnas de las filas (solo a la
// vista: cada fila ya dice su demanda y su estado). Sin ninguna, el estado vacío del filtro con el Motivo de Ruta.
function renderHabGroups(skills) {
  const { filter, keep } = hab;
  const visible = skills.filter(s => filter === "all" || habSkillStatus(s) === filter || keep.has(s.id));
  if (!visible.length) return `<p class="ruta-card route-state hab-empty">${routeDraw()}${t(`habilidades.empty.${filter}`)}</p>`;
  return [...groupByCategory(visible)].map(([category, items], i) => `
    <section class="ruta-card hab-group" style="--i:${i}" aria-labelledby="hab-group-${i}">
      <header class="hab-group-header">
        <h2 class="hab-group-title" id="hab-group-${i}">${escapeHtml(tCategory(category))}
          <span class="hab-group-count">${tn("habilidades.count", items.length)}</span></h2>
        <span class="hab-col-label hab-col-label--demand" aria-hidden="true">${t("habilidades.col.demand")}</span>
        <span class="hab-col-label hab-col-label--state" aria-hidden="true">${t("habilidades.col.state")}</span>
      </header>
      <ul class="hab-list">${[...items].sort((a, b) => b.demandPercentage - a.demandPercentage).map(renderHabRow).join("")}</ul>
    </section>`).join("");
}

// Vista completa: cargando, error o resumen + filtros + tarjetas. Las tarjetas entran escalonadas solo aquí (.is-new);
// los repintados de refreshHabList no repiten la entrada.
function paintHabilidades({ keepFocus = false } = {}) {
  const focus = keepFocus ? habFocus() : null;
  const summary = document.getElementById("hab-summary");
  const content = document.getElementById("habilidades-content");
  hab.open = null;
  hab.painting = true;
  summary.classList.add("is-new");
  if (hab.skills?.error) {
    summary.innerHTML = "";
    content.innerHTML = renderApiError(hab.skills.error);
  } else if (!hab.skills) {
    summary.innerHTML = "";
    content.innerHTML = `<p class="route-state text-sm text-muted-page">${routeDraw({ loop: true })}${t("habilidades.loading")}</p>`;
  } else {
    const { skills } = hab.skills;
    summary.innerHTML = skills.length ? renderSkillSummary(skills, { bar: true }) : "";
    // La demanda se marca como ejemplo mientras alguna habilidad la tenga sembrada (demandIsSample)
    const note = skills.length ? sampleDemandNote("hab-sample-note", skills) : "";
    content.innerHTML = `
      <div class="hab-toolbar">
        <div class="hab-filters" id="hab-filters" role="group" aria-label="${t("habilidades.filter.group")}">${renderHabFilters()}</div>
        <p class="hab-hint" id="hab-hint">${t("habilidades.hint")}</p>
      </div>
      <div class="hab-body is-new" id="hab-body">${renderHabGroups(skills)}</div>
      ${note}`;
  }
  hab.painting = false;
  if (focus) focusHab(focus);
}

// Repinta resumen, filtros y tarjetas. focus: { id, kind: "chip" | "name" | "menu" } o { filter }; sin él, se devuelve
// el foco a donde estaba (repintar lo quita)
function refreshHabList(focus = habFocus()) {
  const body = document.getElementById("hab-body");
  const skills = hab.skills?.skills;
  if (!body || !skills) return;
  hab.painting = true;
  const summary = document.getElementById("hab-summary");
  summary.classList.remove("is-new");
  summary.innerHTML = skills.length ? renderSkillSummary(skills, { bar: true }) : "";
  document.getElementById("hab-filters").innerHTML = renderHabFilters();
  body.classList.remove("is-new");
  body.innerHTML = renderHabGroups(skills);
  hab.painting = false;
  placeHabStatusMenu();
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
  else if (focus.kind === "menu" && hab.open !== null) focusStatusPicker(row);
  else row.querySelector(focus.kind === "name" ? "[data-context]" : "[data-status-chip]")?.focus({ preventScroll: true });
}

function habFocus() {
  const active = document.activeElement;
  if (!active?.closest("#habilidades-content")) return null;
  if (active.dataset.skillFilter) return { filter: active.dataset.skillFilter };
  const row = active.closest("[data-skill-row]");
  if (!row) return null;
  return { id: row.dataset.skillRow, kind: active.closest(".status-picker") ? "menu" : active.matches("[data-context]") ? "name" : "chip" };
}

function announceHab(text) {
  const status = document.getElementById("habilidades-status");
  status.textContent = "";
  setTimeout(() => { status.textContent = text; }, 50);
}

// ---------- Selector de estado ----------

// El popover se ancla bajo el indicador, alineado con su inicio. Si abajo no cabe en la ventana se abre hacia arriba, y
// si se saldría por la derecha se alinea con el final del indicador
function placeHabStatusMenu() {
  const menu = document.getElementById("hab-menu");
  if (!menu) return;
  const anchor = menu.parentElement.getBoundingClientRect();
  const { height, right } = menu.getBoundingClientRect();
  menu.classList.toggle("is-up", anchor.bottom + 8 + height > window.innerHeight - 8 && anchor.top - 8 - height > 8);
  menu.classList.toggle("is-end", right > document.documentElement.clientWidth - 8);
}

function openHabStatusMenu(id) {
  hab.open = id;
  refreshHabList({ id, kind: "menu" });
}

// returnFocus: Esc o elegir devuelven el foco al chip; un clic o Tab fuera lo dejan donde fue. No se repinta: se quita
// solo el popover, así el elemento al que va el foco (Tab) o el clic (otro chip, otro nombre) sigue existiendo
function closeHabStatusMenu({ returnFocus = false } = {}) {
  if (hab.open === null) return;
  const chip = document.querySelector(`#habilidades-content [data-status-chip="${hab.open}"]`);
  hab.open = null;
  hab.painting = true;
  document.getElementById("hab-menu")?.remove();
  hab.painting = false;
  chip?.setAttribute("aria-expanded", "false");
  chip?.removeAttribute("aria-controls");
  if (returnFocus) chip?.focus({ preventScroll: true });
}

// Copia nueva de la lista (el arreglo puede ser el mismo que usa el Mapa: no se modifica en el lugar)
function replaceHabSkill(id, changes) {
  const list = hab.skills.skills.map(s => (s.id === id ? { ...s, ...changes } : s));
  hab.skills = { skills: list };
  return list.find(s => s.id === id);
}

// La fila cambia al instante; si el backend falla vuelve al estado anterior y muestra el error. Mientras se guarda no se
// elige otro estado en ninguna fila.
async function setHabSkillStatus(id, status) {
  const skill = hab.skills?.skills?.find(s => s.id === id);
  if (!skill || hab.saving !== null || habSkillStatus(skill) === status) {
    closeHabStatusMenu({ returnFocus: true });
    return;
  }
  const previous = { status: skill.status };
  replaceHabSkill(id, { status });
  Object.assign(hab, { saving: id, errorId: null, open: null });
  hab.keep.add(id);
  refreshHabList({ id, kind: "chip" });
  try {
    const updated = await saveSkillStatus(id, status);
    if (hab.saving !== id) return; // cambió el usuario mientras se guardaba
    const saved = replaceHabSkill(id, updated);
    hab.saving = null;
    announceHab(t("state.saved", { name: tSkill(saved.name), status: statusLabel(saved.status) }));
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

// Cada vez que se abre la vista (la petición está en caché en dashboard.js). Con la lista ya pintada, los datos nuevos
// se repintan sin repetir la entrada y conservando el foco (vuelta del detalle de habilidad)
async function loadHabilidades() {
  const request = ++hab.request;
  const skills = await fetchSkills().then(list => ({ skills: list }), error => ({ error }));
  if (request !== hab.request) return; // cambió el usuario o su progreso mientras cargaba
  const painted = Boolean(hab.skills?.skills && document.getElementById("hab-body"));
  hab.skills = skills;
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
      Object.assign(hab, { filter: filter.dataset.skillFilter, open: null });
      hab.keep.clear();
      saveHabFilter(hab.filter);
      refreshHabList({ filter: hab.filter });
      return;
    }
    const chip = e.target.closest("[data-status-chip]");
    if (chip) {
      const id = Number(chip.dataset.statusChip);
      if (hab.open === id) closeHabStatusMenu({ returnFocus: true });
      else openHabStatusMenu(id);
      return;
    }
    const context = e.target.closest("[data-context]");
    if (context) openSkillDetail(Number(context.dataset.context), context); // skill-detalle.js
  });
  bindStatusPicker(view, (id, status) => {
    if (hab.open === id) setHabSkillStatus(id, status);
  });

  // Flecha abajo o arriba en el chip abren el selector (como Enter y Espacio); Esc lo cierra y vuelve al chip
  view.addEventListener("keydown", e => {
    const chip = e.target.closest("[data-status-chip]");
    if (chip && hab.open === null && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      openHabStatusMenu(Number(chip.dataset.statusChip));
      return;
    }
    if (e.key !== "Escape" || hab.open === null || !e.target.closest("#hab-menu, [data-status-chip]")) return;
    e.preventDefault();
    closeHabStatusMenu({ returnFocus: true });
  });
  // El foco sale del chip y del selector (Tab, clic en otro lado): se cierra sin mover el foco
  view.addEventListener("focusout", e => {
    if (hab.open === null || hab.painting) return;
    const state = e.target.closest?.(".hab-state");
    if (state && !state.contains(e.relatedTarget)) closeHabStatusMenu();
  });
  document.addEventListener("pointerdown", e => {
    if (hab.open !== null && !e.target.closest?.(".hab-state")) closeHabStatusMenu();
  });
}

// Estado cambiado en otra vista. Desde el detalle (skill-detalle.js) llega la habilidad: la fila se actualiza ya, para
// que "Volver" encuentre la fila y le devuelva el foco; si el detalle se abrió desde aquí, la fila sigue a la vista
// aunque el filtro ya no la incluya. Una carga en vuelo se descarta: al abrir la vista se vuelve a pedir.
document.addEventListener("skillmap:progress", e => {
  if (e.detail?.source === "habilidades") return;
  hab.request++;
  const skill = e.detail?.skill;
  if (!skill || !hab.skills?.skills?.some(s => s.id === skill.id)) return;
  replaceHabSkill(skill.id, skill);
  if (skillDetail.from === "habilidades") hab.keep.add(skill.id);
  refreshHabList(null);
});

document.addEventListener("skillmap:user", () => {
  hab.request++;
  Object.assign(hab, { skills: null, open: null, saving: null, error: null, errorId: null });
  hab.keep.clear();
  document.getElementById("hab-summary").innerHTML = "";
  document.getElementById("habilidades-content").replaceChildren();
});

// Cambio de idioma: si la vista ya se pintó, se vuelve a pintar con los datos ya cargados (el foco se conserva)
document.addEventListener("skillmap:language", () => {
  if (document.getElementById("habilidades-content").childElementCount) paintHabilidades({ keepFocus: true });
});

document.addEventListener("DOMContentLoaded", initHabilidades);
