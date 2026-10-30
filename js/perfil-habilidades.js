// "Mis Habilidades" de Perfil: el catálogo completo (/api/skills) en filas compactas, agrupado por categoría (en el
// orden de la API, como los clusters del Mapa) y, dentro de cada grupo, por demanda. Filtros segmentados
// Todas · Dominadas · Aprendiendo · Pendientes con su contador; el elegido dura la sesión del navegador (sessionStorage).
// Filas ligeras en tres columnas: el nombre abre el contexto y preguntas frecuentes (skill-detalle.js), la demanda en
// texto tenue y un indicador de estado (círculo + etiqueta) que abre el selector Pendiente / Aprendiendo / Dominada
// (skill-status.js, variante menú) en un popover anclado que se abre hacia arriba si abajo no cabe. El cambio se
// ve al instante, se guarda con PUT y avisa a Mapa, Mi Ruta y los logros de Perfil (skillmap:progress con
// source "perfil"); si el backend falla vuelve al estado anterior con el error en la fila. Se repinta conservando el foco.
// Usa groupByCategory y escapeHtml (mapa.js), showView (mapa.js), renderStatusPicker, bindStatusPicker,
// focusStatusPicker, saveSkillStatus y SKILL_STATE_CLASS (skill-status.js), renderApiError y sampleDemandNote
// (dashboard.js), routeDraw y routeDivider (route-motif.js), perfilState, announcePerfil y refreshPerfilProgress
// (perfil.js), prefersReducedMotion (theme.js), friendlyError (session.js) y t, tn, statusLabel, tSkill y tCategory
// (i18n.js).

const PERFIL_FILTER_KEY = "skillmap.perfil.filter";
const PERFIL_FILTERS = ["all", "MASTERED", "IN_PROGRESS", "PENDING"];

// filter: filtro elegido; keep: habilidades que cambiaron de estado con este filtro y siguen a la vista hasta cambiarlo
// (así la fila no desaparece bajo el foco); open: id con el selector abierto; saving: id que se está guardando;
// error/errorId: último error y la habilidad a la que pertenece (el texto se arma al pintar, en el idioma vigente)
// painting: repintando (quitar el elemento enfocado no cuenta como "el foco salió")
const perfilHab = { filter: readPerfilFilter(), keep: new Set(), open: null, saving: null, error: null, errorId: null,
  painting: false };

function readPerfilFilter() {
  try {
    const saved = sessionStorage.getItem(PERFIL_FILTER_KEY);
    return PERFIL_FILTERS.includes(saved) ? saved : "all";
  } catch { return "all"; }
}

function savePerfilFilter(filter) {
  try { sessionStorage.setItem(PERFIL_FILTER_KEY, filter); } catch { /* sin storage: se recuerda hasta recargar */ }
}

const perfilSkillStatus = skill => (SKILL_STATES.includes(skill.status) ? skill.status : "PENDING");

function perfilFilterCount(skills, filter) {
  return filter === "all" ? skills.length : skills.filter(s => perfilSkillStatus(s) === filter).length;
}

// ---------- Marcado ----------

function renderPerfilFilters(skills) {
  return PERFIL_FILTERS.map(filter => `
    <button type="button" data-skill-filter="${filter}" aria-pressed="${perfilHab.filter === filter}">
      ${t(`perfil.filter.${filter}`)}<span class="perfil-filter-count">${perfilFilterCount(skills, filter)}</span>
    </button>`).join("");
}

function renderPerfilSkillRow(skill) {
  const status = perfilSkillStatus(skill);
  const name = tSkill(skill.name);
  const open = perfilHab.open === skill.id;
  const pct = Math.max(0, Math.min(100, Number(skill.demandPercentage) || 0));
  return `
    <li class="perfil-hab-row" data-skill-row="${skill.id}">
      <button type="button" class="perfil-hab-name" data-context="${skill.id}" aria-describedby="perfil-hab-hint">${escapeHtml(name)}</button>
      <span class="perfil-hab-pct">${pct}%<span class="sr-only"> ${t("perfil.skills.demand")}</span></span>
      <span class="perfil-hab-state">
        <button type="button" class="perfil-hab-chip perfil-hab-chip--${SKILL_STATE_CLASS[status]}" data-status-chip="${skill.id}"
          aria-haspopup="menu" aria-expanded="${open}" ${open ? `aria-controls="perfil-hab-menu"` : ""}
          aria-label="${escapeHtml(t("perfil.skills.chip", { name, status: statusLabel(status) }))}"${perfilHab.saving === skill.id ? ` aria-busy="true"` : ""}>${statusLabel(status)}</button>
        ${open ? `<span class="perfil-hab-menu" id="perfil-hab-menu">${renderStatusPicker(skill, perfilHab.saving === skill.id, { menu: true })}</span>` : ""}
      </span>
      ${perfilHab.errorId === skill.id ? `<p class="perfil-hab-error" role="alert">${escapeHtml(t("state.error",
        { error: friendlyError(perfilHab.error) }))}</p>` : ""}
    </li>`;
}

// Grupos por categoría con lo que deja ver el filtro; sin ninguna, el estado vacío del filtro con el Motivo de Ruta
function renderPerfilSkillGroups(skills) {
  const { filter, keep } = perfilHab;
  const visible = skills.filter(s => filter === "all" || perfilSkillStatus(s) === filter || keep.has(s.id));
  if (!visible.length) return `<p class="route-state perfil-empty perfil-hab-empty">${routeDraw()}${t(`perfil.skills.empty.${filter}`)}</p>`;
  return [...groupByCategory(visible)].map(([category, items], i) => `
    <section class="perfil-hab-group" aria-labelledby="perfil-hab-group-${i}">
      <h3 class="perfil-hab-title" id="perfil-hab-group-${i}">${escapeHtml(tCategory(category))}
        <span class="perfil-hab-count">${tn("perfil.skills.count", items.length)}</span></h3>
      <ul class="perfil-hab-list">${[...items].sort((a, b) => b.demandPercentage - a.demandPercentage).map(renderPerfilSkillRow).join("")}</ul>
    </section>`).join("");
}

// Tarjeta completa (la pinta perfil.js al abrir la vista y con datos nuevos): cargando, error o la lista. Con datos
// nuevos el selector abierto se cierra y las filas retenidas vuelven a seguir el filtro.
function renderPerfilSkillsCard(skillsState) {
  perfilHab.keep.clear();
  perfilHab.open = null;
  let body;
  if (skillsState?.error) body = renderApiError(skillsState.error);
  else if (!skillsState) body = `<p class="route-state text-sm text-muted">${routeDraw({ loop: true })}${t("perfil.loadingSkills")}</p>`;
  else {
    const { skills } = skillsState;
    // La demanda se marca como ejemplo mientras alguna habilidad la tenga sembrada (demandIsSample)
    const note = skills.length ? sampleDemandNote("perfil-sample-note", skills) : "";
    body = `
      <div class="perfil-filters" id="perfil-hab-filters" role="group" aria-label="${t("perfil.filter.group")}">${renderPerfilFilters(skills)}</div>
      <p class="perfil-hint perfil-hab-hint" id="perfil-hab-hint">${t("perfil.skills.hint")}</p>
      <div class="perfil-hab-body" id="perfil-hab-body">${renderPerfilSkillGroups(skills)}</div>
      ${note ? routeDivider() + note : ""}`;
  }
  return `
    <article id="perfil-skills" class="perfil-card" aria-labelledby="perfil-skills-title">
      <h2 id="perfil-skills-title" class="perfil-card-title" tabindex="-1">${t("perfil.skills")}</h2>
      ${body}
    </article>`;
}

// Repinta filtros y filas. focus: { id, kind: "chip" | "name" | "menu" } o { filter }; sin él, se devuelve el foco a
// donde estaba (repintar lo quita)
function refreshPerfilSkillsList(focus = perfilSkillsFocus()) {
  const body = document.getElementById("perfil-hab-body");
  const skills = perfilState.skills?.skills;
  if (!body || !skills) return;
  perfilHab.painting = true;
  document.getElementById("perfil-hab-filters").innerHTML = renderPerfilFilters(skills);
  body.innerHTML = renderPerfilSkillGroups(skills);
  perfilHab.painting = false;
  placePerfilStatusMenu();
  if (focus) focusPerfilSkills(focus);
}

// Tras repintar. Si el filtro ya no muestra la fila (p. ej. quedó dominada con "Pendientes"), al título de la tarjeta
function focusPerfilSkills(focus) {
  if (focus.filter) {
    document.querySelector(`#perfil-hab-filters [data-skill-filter="${focus.filter}"]`)?.focus({ preventScroll: true });
    return;
  }
  const row = document.querySelector(`[data-skill-row="${focus.id}"]`);
  if (!row) document.getElementById("perfil-skills-title")?.focus();
  else if (focus.kind === "menu" && perfilHab.open !== null) focusStatusPicker(row);
  else row.querySelector(focus.kind === "name" ? "[data-context]" : "[data-status-chip]")?.focus({ preventScroll: true });
}

function perfilSkillsFocus() {
  const active = document.activeElement;
  if (!active?.closest("#perfil-skills")) return null;
  if (active.dataset.skillFilter) return { filter: active.dataset.skillFilter };
  const row = active.closest("[data-skill-row]");
  if (!row) return null;
  return { id: row.dataset.skillRow, kind: active.closest(".status-picker") ? "menu" : active.matches("[data-context]") ? "name" : "chip" };
}

// ---------- Selector de estado ----------

// El popover se ancla bajo el indicador, alineado con su inicio. Si abajo no cabe en la ventana se abre hacia arriba, y
// si se saldría por la derecha se alinea con el final del indicador
function placePerfilStatusMenu() {
  const menu = document.getElementById("perfil-hab-menu");
  if (!menu) return;
  const anchor = menu.parentElement.getBoundingClientRect();
  const { height, right } = menu.getBoundingClientRect();
  menu.classList.toggle("is-up", anchor.bottom + 8 + height > window.innerHeight - 8 && anchor.top - 8 - height > 8);
  menu.classList.toggle("is-end", right > document.documentElement.clientWidth - 8);
}

function openPerfilStatusMenu(id) {
  perfilHab.open = id;
  refreshPerfilSkillsList({ id, kind: "menu" });
}

// returnFocus: Esc o elegir devuelven el foco al chip; un clic o Tab fuera lo dejan donde fue
function closePerfilStatusMenu({ returnFocus = false } = {}) {
  if (perfilHab.open === null) return;
  const id = perfilHab.open;
  perfilHab.open = null;
  refreshPerfilSkillsList(returnFocus ? { id, kind: "chip" } : null);
}

// Copia nueva de la lista (el arreglo puede ser el mismo que usa el Mapa: no se modifica en el lugar)
function replacePerfilSkill(id, changes) {
  const list = perfilState.skills.skills.map(s => (s.id === id ? { ...s, ...changes } : s));
  perfilState.skills = { skills: list };
  return list.find(s => s.id === id);
}

// La fila cambia al instante; si el backend falla vuelve al estado anterior y muestra el error. Mientras se guarda no se
// elige otro estado en ninguna fila.
async function setPerfilSkillStatus(id, status) {
  const skill = perfilState.skills?.skills?.find(s => s.id === id);
  if (!skill || perfilHab.saving !== null || perfilSkillStatus(skill) === status) {
    closePerfilStatusMenu({ returnFocus: true });
    return;
  }
  const previous = { status: skill.status };
  replacePerfilSkill(id, { status });
  Object.assign(perfilHab, { saving: id, errorId: null, open: null });
  perfilHab.keep.add(id);
  refreshPerfilSkillsList({ id, kind: "chip" });
  try {
    const updated = await saveSkillStatus(id, status);
    if (perfilHab.saving !== id) return; // cambió el usuario mientras se guardaba
    const saved = replacePerfilSkill(id, updated);
    perfilHab.saving = null;
    announcePerfil(t("state.saved", { name: tSkill(saved.name), status: statusLabel(saved.status) }));
    // Mapa actualiza el nodo, Mi Ruta y el Analizador descartan sus datos y Perfil recalcula estadísticas y logros
    document.dispatchEvent(new CustomEvent("skillmap:progress", { detail: { skill: saved, source: "perfil" } }));
  } catch (err) {
    if (perfilHab.saving !== id) return;
    replacePerfilSkill(id, previous);
    Object.assign(perfilHab, { saving: null, error: err, errorId: id });
  }
  refreshPerfilSkillsList();
}

// ---------- Desde otras vistas ----------

// "Ver mis habilidades como lista" (Mapa): abre Perfil con la tarjeta a la vista y el foco en su título
function openPerfilSkills() {
  showView("perfil");
  const title = document.getElementById("perfil-skills-title");
  if (!title) return;
  title.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  title.focus({ preventScroll: true });
}

// ---------- Eventos ----------

function initPerfilSkills() {
  const view = document.getElementById("view-perfil");
  view.addEventListener("click", e => {
    if (!e.target.closest("#perfil-skills")) return;
    const filter = e.target.closest("[data-skill-filter]");
    if (filter) {
      if (filter.dataset.skillFilter === perfilHab.filter) return;
      Object.assign(perfilHab, { filter: filter.dataset.skillFilter, open: null });
      perfilHab.keep.clear();
      savePerfilFilter(perfilHab.filter);
      refreshPerfilSkillsList({ filter: perfilHab.filter });
      return;
    }
    const chip = e.target.closest("[data-status-chip]");
    if (chip) {
      const id = Number(chip.dataset.statusChip);
      if (perfilHab.open === id) closePerfilStatusMenu({ returnFocus: true });
      else openPerfilStatusMenu(id);
      return;
    }
    const context = e.target.closest("[data-context]");
    if (context) openSkillDetail(Number(context.dataset.context), context); // skill-detalle.js
  });
  bindStatusPicker(view, (id, status) => {
    if (perfilHab.open === id) setPerfilSkillStatus(id, status);
  });

  // Flecha abajo o arriba en el chip abren el selector (como Enter y Espacio); Esc lo cierra y vuelve al chip
  view.addEventListener("keydown", e => {
    const chip = e.target.closest("[data-status-chip]");
    if (chip && perfilHab.open === null && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      openPerfilStatusMenu(Number(chip.dataset.statusChip));
      return;
    }
    if (e.key !== "Escape" || perfilHab.open === null || !e.target.closest("#perfil-hab-menu, [data-status-chip]")) return;
    e.preventDefault();
    closePerfilStatusMenu({ returnFocus: true });
  });
  // El foco sale del chip y del selector (Tab, clic en otro lado): se cierra sin mover el foco
  view.addEventListener("focusout", e => {
    if (perfilHab.open === null || perfilHab.painting) return;
    const state = e.target.closest?.(".perfil-hab-state");
    if (state && !state.contains(e.relatedTarget)) closePerfilStatusMenu();
  });
  document.addEventListener("pointerdown", e => {
    if (perfilHab.open !== null && !e.target.closest?.(".perfil-hab-state")) closePerfilStatusMenu();
  });
}

document.addEventListener("skillmap:user", () => {
  Object.assign(perfilHab, { open: null, saving: null, error: null, errorId: null });
  perfilHab.keep.clear();
});

document.addEventListener("DOMContentLoaded", initPerfilSkills);
