// Roles propios ("Otro objetivo" en Objetivo): crear, editar, elegir y eliminar un objetivo hecho por el usuario.
// - Diálogo accesible (<dialog> con showModal: el resto de la página queda inerte y el foco no sale; Esc cierra; al
//   cerrar el foco vuelve a quien lo abrió): nombre con contador, descripción corta opcional, selector de habilidades
//   por categoría con búsqueda, marca de las que ya dominas y "N de 8", y la vista previa en vivo con voz de GPS
//   ("Tu preparación hoy: X%", "Si aprendes {habilidad}, subes a N%"). Mismas reglas que el backend (todas las
//   habilidades pesan igual: el % es dominadas / elegidas). Validación en línea, sin alertas del navegador. Si el backend
//   o la red fallan, el error queda en el diálogo y lo escrito se conserva.
// - Crear: POST /api/goals/custom y se elige al instante (setActiveGoal: PUT /api/auth/me/goal); la vista se actualiza en
//   su lugar y sale el aviso de 3 s (toast.js). Editar: PUT /api/goals/custom/{id}.
// - Menú de 3 puntos de cada rol propio (en su tarjeta y en la del objetivo actual): Editar y Eliminar. Eliminar pide
//   confirmación en línea y espera los 3 s del aviso con "Deshacer" antes de borrar de verdad (DELETE, que devuelve el
//   objetivo elegido después: si era el actual, el backend vuelve al base anterior).
// Usa apiJson, apiFetch y sessionUser (session.js); fetchGoals, fetchSkills, loadGoals, setActiveGoal, getActiveGoalId,
// invalidateGoals, loadDashboard y PLAN_KEY (dashboard.js / plan-semanal.js); objetivoState, loadObjetivoData,
// refreshObjetivoInPlace, filterGoalCards, keepObjetivoInPlace y showObjetivoError (objetivo.js); showToast y hideToast
// (toast.js); escapeHtml (mapa.js); keepScrollRoom (motion.js); friendlyError (session.js) y t, tn, tSkill, tCategory,
// tGoalTitle y DATA_EN (i18n.js).

const ROL_MAX = 3;
const ROL_NAME = { min: 2, max: 40 };
const ROL_DESC_MAX = 120;
const ROL_SKILLS = { min: 3, max: 8 };
const ROL_GAPS_SHOWN = 3;

// editing: el rol que se edita (null al crear); opener: quién abrió el diálogo; selected: ids elegidos en su orden;
// catalog: /api/skills; touched: campos ya tocados (sus errores se muestran en vivo); pending: rol que se está borrando
// (esperando "Deshacer"); committing: la promesa del borrado en curso
const rol = { editing: null, opener: null, selected: [], catalog: [], query: "", touched: new Set(), busy: false,
  pending: null, committing: null };

const rolDialog = () => document.getElementById("rol-dialog");
const rolCollapse = text => (text || "").trim().replace(/\s+/g, " ");
const rolKey = text => rolCollapse(text).toLocaleLowerCase("es");
const rolLength = text => [...text].length; // un emoji cuenta uno, como en el backend

function rolPendingDelete(id) {
  return rol.pending !== null && String(rol.pending.id) === String(id);
}

// Roles propios que existen (sin contar el que se está borrando)
function ownGoalCount() {
  return (objetivoState.goals || []).filter(g => g.custom && !rolPendingDelete(g.id)).length;
}

// ---------- Menú de 3 puntos (tarjeta y objetivo actual) ----------

const ROL_DOTS = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`;

function renderRolMenu(goal, place) {
  const id = String(goal.id);
  const menuId = `rol-menu-${place}-${id}`;
  return `
    <span class="rol-menu rol-menu--${place}" data-rol-menu="${id}">
      <button type="button" class="perfil-icon-btn rol-menu-button" data-rol-action="menu" data-goal-id="${id}"
        aria-haspopup="menu" aria-expanded="false" aria-controls="${menuId}"
        aria-label="${escapeHtml(t("rol.menuFor", { goal: tGoalTitle(goal.title) }))}">${ROL_DOTS}</button>
      <span class="user-popover rol-menu-list" role="menu" id="${menuId}" hidden>
        <button type="button" role="menuitem" tabindex="-1" class="user-menu-item" data-rol-action="edit" data-goal-id="${id}">${t("rol.edit")}</button>
        <button type="button" role="menuitem" tabindex="-1" class="user-menu-item rol-menu-danger" data-rol-action="delete" data-goal-id="${id}">${t("rol.delete")}</button>
      </span>
    </span>`;
}

function closeRolMenus({ focusButton = null } = {}) {
  document.querySelectorAll("#objetivo-content .rol-menu-list:not([hidden])").forEach(list => {
    list.hidden = true;
    const button = list.closest(".rol-menu").querySelector(".rol-menu-button");
    button.setAttribute("aria-expanded", "false");
    if (focusButton === list) button.focus({ preventScroll: true });
  });
}

function toggleRolMenu(button) {
  const list = document.getElementById(button.getAttribute("aria-controls"));
  const open = list.hidden;
  closeRolMenus();
  if (!open) return;
  list.hidden = false;
  button.setAttribute("aria-expanded", "true");
  list.querySelector("[role='menuitem']")?.focus({ preventScroll: true });
}

function rolMenuKeys(e) {
  const list = e.target.closest(".rol-menu-list");
  if (!list) return;
  const items = [...list.querySelectorAll("[role='menuitem']")];
  const i = items.indexOf(document.activeElement);
  const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
  if (next !== undefined) {
    e.preventDefault();
    items[(next + items.length) % items.length].focus({ preventScroll: true });
  } else if (e.key === "Escape") {
    e.preventDefault();
    closeRolMenus({ focusButton: list });
  } else if (e.key === "Tab") {
    closeRolMenus();
  }
}

// ---------- Eliminar: confirmación en línea y "Deshacer" ----------

function rolGoal(id) {
  return (objetivoState.goals || []).find(g => String(g.id) === String(id));
}

// La confirmación aparece en el lugar del rol (su tarjeta o bajo el título del objetivo actual), con el foco en Cancelar
function askDeleteRol(id, place) {
  const goal = rolGoal(id);
  if (!goal) return;
  const active = String(getActiveGoalId()) === String(id);
  const name = tGoalTitle(goal.title);
  const box = `
    <div class="perfil-confirm rol-confirm" role="group" aria-labelledby="rol-confirm-text" data-rol-confirm="${id}">
      <p id="rol-confirm-text" class="perfil-confirm-text">${escapeHtml(t("rol.confirm", { goal: name }))}${active ? ` ${escapeHtml(t("rol.confirmActive"))}` : ""}</p>
      <div class="perfil-form-actions">
        <button type="button" class="btn-pill perfil-btn-danger" data-rol-action="confirm-delete" data-goal-id="${id}">${t("rol.delete")}</button>
        <button type="button" class="btn-ghost" data-rol-action="cancel-delete" data-goal-id="${id}">${t("rol.cancel")}</button>
      </div>
    </div>`;
  cancelRolConfirm();
  keepObjetivoInPlace(() => {
    const host = place === "hero"
      ? document.querySelector("#objetivo-content .objetivo-hero-main")
      : document.querySelector(`#objetivo-content .objetivo-item[data-goal-id="${id}"]`);
    if (!host) return;
    if (place !== "hero") host.classList.add("is-confirming");
    host.insertAdjacentHTML(place === "hero" ? "beforeend" : "afterbegin", box);
  });
  document.querySelector(`[data-rol-confirm="${id}"] [data-rol-action='cancel-delete']`)?.focus({ preventScroll: true });
}

function cancelRolConfirm({ focus = false } = {}) {
  const box = document.querySelector("#objetivo-content [data-rol-confirm]");
  if (!box) return;
  const id = box.dataset.rolConfirm;
  keepObjetivoInPlace(() => {
    box.closest(".objetivo-item")?.classList.remove("is-confirming");
    box.remove();
  });
  if (focus) document.querySelector(`#objetivo-content [data-rol-menu="${id}"] .rol-menu-button`)?.focus({ preventScroll: true });
}

// Se oculta ya; se borra de verdad cuando el aviso se va sin "Deshacer" (toast.js: onDone)
function deleteRol(id) {
  const goal = rolGoal(id);
  if (!goal) return;
  flushRolDelete(); // otro borrado esperando: se hace ahora
  cancelRolConfirm();
  rol.pending = { id: String(id), title: goal.title };
  keepScrollRoom(() => keepObjetivoInPlace(() => {
    const card = document.querySelector(`#objetivo-content .objetivo-item[data-goal-id="${id}"]`);
    if (card) { card.hidden = true; card.setAttribute("data-pending", ""); }
    syncOtroCard();
    filterGoalCards();
  }));
  showToast({
    owner: "rol",
    text: t("rol.deletedToast", { goal: tGoalTitle(goal.title) }),
    onUndo: undoDeleteRol,
    onDone: () => { rol.committing = commitDeleteRol(); },
    fallbackFocus: () => document.querySelector("#objetivo-content [data-rol-action='create']") || document.getElementById("objetivo-current-title"),
  });
}

function undoDeleteRol() {
  const pending = rol.pending;
  if (!pending) return;
  rol.pending = null;
  keepScrollRoom(() => keepObjetivoInPlace(() => {
    const card = document.querySelector(`#objetivo-content .objetivo-item[data-goal-id="${pending.id}"]`);
    card?.removeAttribute("data-pending");
    syncOtroCard();
    filterGoalCards();
  }));
  document.getElementById("objetivo-live").textContent = t("rol.undone", { goal: tGoalTitle(pending.title) });
  document.querySelector(`#objetivo-content .objetivo-item[data-goal-id="${pending.id}"] .objetivo-card`)?.focus({ preventScroll: true });
}

async function commitDeleteRol() {
  const pending = rol.pending;
  if (!pending) return;
  const wasActive = String(getActiveGoalId()) === pending.id;
  try {
    const res = await apiJson(`/api/goals/custom/${pending.id}`, { method: "DELETE" });
    if (rol.pending === pending) rol.pending = null;
    forgetRolPlan(pending.id);
    if (sessionUser) sessionUser.goalId = res?.goalId ?? null;
    invalidateGoals(); // dashboard.js
    await loadGoals(); // dashboard.js: el selector de Mi Ruta y el objetivo activo (el que diga el backend)
    if (wasActive && getActiveGoalId()) loadDashboard(getActiveGoalId(), { swap: true });
    if (objetivoState.goals) {
      await loadObjetivoData();
      refreshObjetivoInPlace();
    }
  } catch (err) {
    // No se pudo: el rol vuelve a verse, con el error sobre la lista
    if (rol.pending === pending) rol.pending = null;
    objetivoState.error = err;
    keepObjetivoInPlace(() => {
      document.querySelector(`#objetivo-content .objetivo-item[data-goal-id="${pending.id}"]`)?.removeAttribute("data-pending");
      syncOtroCard();
      filterGoalCards();
      showObjetivoError();
    });
  }
}

// Un borrado esperando "Deshacer" se hace ya (antes de abrir el diálogo, de otro borrado o al salir)
function flushRolDelete() {
  if (rol.pending) hideToast("rol");
  return rol.committing || Promise.resolve();
}

// El plan de "Tu semana" de ese objetivo (plan-semanal.js: skillmap.plan.{usuario}.{objetivo}) ya no sirve
function forgetRolPlan(goalId) {
  try { localStorage.removeItem(`${PLAN_KEY}.${sessionUser?.id ?? "anon"}.${goalId}`); } catch { /* sin storage */ }
}

// La tarjeta "Otro objetivo" sigue a la cantidad de roles (deshabilitada con el máximo)
function syncOtroCard() {
  const item = document.querySelector("#objetivo-content .objetivo-item--otro");
  if (item) morphElement(item, renderOtroCard()); // motion.js
  const count = document.querySelector("#objetivo-content .objetivo-area[data-area='mine'] [data-area-count]");
  if (count) count.textContent = `· ${(objetivoState.goals || []).filter(g => g.custom && !rolPendingDelete(g.id) && String(g.id) !== String(getActiveGoalId())).length}`;
}

// ---------- Diálogo ----------

async function openRolDialog(goal, opener) {
  if (rol.busy) return;
  await flushRolDelete();
  if (!goal && ownGoalCount() >= ROL_MAX) return;
  let catalog;
  try {
    catalog = await fetchSkills(); // dashboard.js (con caché)
  } catch (err) {
    objetivoState.error = err;
    keepObjetivoInPlace(showObjetivoError);
    return;
  }
  Object.assign(rol, {
    editing: goal || null, opener: opener || null, catalog, query: "", touched: new Set(), busy: false,
    selected: goal ? goal.skills.map(s => s.skillId).filter(id => catalog.some(c => c.id === id)) : [],
  });
  const dialog = rolDialog();
  dialog.querySelector("#rol-title").textContent = t(goal ? "rol.title.edit" : "rol.title.create");
  dialog.querySelector("#rol-name").value = goal ? goal.title : "";
  dialog.querySelector("#rol-desc").value = goal?.description || "";
  dialog.querySelector("#rol-search").value = "";
  dialog.querySelector("#rol-submit [data-label]").textContent = t(goal ? "rol.submitEdit" : "rol.submitCreate");
  dialog.querySelector("#rol-error").textContent = "";
  renderRolSkills();
  syncRolForm();
  dialog.showModal();
  dialog.querySelector(".rol-panel").scrollTop = 0;
  dialog.querySelector("#rol-name").focus();
}

function closeRolDialog() {
  const dialog = rolDialog();
  if (dialog.open) dialog.close();
}

// Habilidades por categoría (en el orden del catálogo), cada una un botón que se marca (aria-pressed). Las dominadas
// llevan la marca menta y lo dicen a los lectores de pantalla.
function renderRolSkills() {
  const groups = new Map();
  for (const skill of rol.catalog) {
    const key = skill.category || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(skill);
  }
  const check = `<svg class="rol-mastered" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
  let index = 0;
  document.getElementById("rol-skill-groups").innerHTML = [...groups].map(([category, skills]) => {
    const label = escapeHtml(category ? tCategory(category) : t("rol.otherCategory"));
    const id = `rol-group-${index++}`;
    return `
      <div class="rol-group" data-rol-group>
        <p id="${id}" class="ritmo-label">${label}</p>
        <div class="hab-filters rol-chips" role="group" aria-labelledby="${id}">
          ${skills.map(s => {
            const name = tSkill(s.name);
            const mastered = s.status === "MASTERED";
            return `<button type="button" data-rol-skill="${s.id}" data-name="${escapeHtml(rolKey(`${s.name} ${name} ${category} ${category ? tCategory(category) : ""}`))}" aria-pressed="false">${escapeHtml(name)}${mastered ? `${check}<span class="sr-only">, ${t("rol.mastered")}</span>` : ""}</button>`;
          }).join("")}
        </div>
      </div>`;
  }).join("");
}

// Lo que se ve según lo elegido y lo escrito: botones marcados, contadores, filtro, vista previa y errores
function syncRolForm() {
  const dialog = rolDialog();
  const full = rol.selected.length >= ROL_SKILLS.max;
  dialog.querySelectorAll("[data-rol-skill]").forEach(b => {
    const on = rol.selected.includes(Number(b.dataset.rolSkill));
    b.setAttribute("aria-pressed", String(on));
    if (full && !on) b.setAttribute("aria-disabled", "true"); else b.removeAttribute("aria-disabled");
  });
  const name = rolCollapse(dialog.querySelector("#rol-name").value);
  dialog.querySelector("#rol-name-count").textContent = t("rol.count", { n: rolLength(name), max: ROL_NAME.max });
  dialog.querySelector("#rol-desc-count").textContent = t("rol.count", { n: rolLength(rolCollapse(dialog.querySelector("#rol-desc").value)), max: ROL_DESC_MAX });
  dialog.querySelector("#rol-skills-count").textContent = t("rol.skillsCount", { n: rol.selected.length, max: ROL_SKILLS.max });
  filterRolSkills();
  renderRolPreview();
  showRolErrors(false);
}

function filterRolSkills() {
  const q = rolKey(rol.query);
  let shown = 0;
  rolDialog().querySelectorAll("[data-rol-group]").forEach(group => {
    let inGroup = 0;
    group.querySelectorAll("[data-rol-skill]").forEach(b => {
      b.hidden = Boolean(q) && !b.dataset.name.includes(q);
      if (!b.hidden) inGroup++;
    });
    group.hidden = inGroup === 0;
    shown += inGroup;
  });
  const empty = document.getElementById("rol-skills-empty");
  empty.hidden = shown > 0;
  empty.textContent = shown ? "" : t("rol.noMatch", { query: rol.query.trim() });
}

// Vista previa: el % con las mismas reglas del backend (todas pesan igual) y, con voz de GPS, cuánto subirías al
// aprender cada brecha, en orden de demanda (como la ruta)
function renderRolPreview() {
  const chosen = rol.selected.map(id => rol.catalog.find(s => s.id === id)).filter(Boolean);
  const total = chosen.length;
  const mastered = chosen.filter(s => s.status === "MASTERED").length;
  const pct = total ? Math.round((mastered * 100) / total) : 0;
  const box = document.getElementById("rol-preview-body");
  if (total < ROL_SKILLS.min) {
    box.innerHTML = `<p class="ruta-card-hint">${t("rol.previewEmpty", { min: ROL_SKILLS.min })}</p>`;
    document.getElementById("rol-preview-live").textContent = "";
    return;
  }
  const gaps = chosen.filter(s => s.status !== "MASTERED")
    .sort((a, b) => (Number(b.demandPercentage) || 0) - (Number(a.demandPercentage) || 0));
  const steps = gaps.slice(0, ROL_GAPS_SHOWN).map((s, i) => {
    const next = Math.round(((mastered + i + 1) * 100) / total);
    return `<li>${escapeHtml(t("rol.previewGap", { skill: tSkill(s.name), pct: next }))}</li>`;
  }).join("");
  const more = gaps.length - ROL_GAPS_SHOWN;
  box.innerHTML = `
    <p class="objetivo-hero-score-label">${t("rol.previewReadiness")}</p>
    <p class="objetivo-hero-pct">${pct}<span>%</span></p>
    <span class="objetivo-bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
    ${gaps.length ? `<ol class="rol-gps">${steps}</ol>` : `<p class="ruta-card-hint">${t("rol.previewDone")}</p>`}
    ${more > 0 ? `<p class="ruta-card-hint">${tn("rol.previewMore", more)}</p>` : ""}`;
  document.getElementById("rol-preview-live").textContent = t("rol.previewLive", { pct });
}

// Errores en línea de cada campo; all: también los campos que todavía no se tocaron (al enviar)
function rolErrors() {
  const dialog = rolDialog();
  const name = rolCollapse(dialog.querySelector("#rol-name").value);
  const desc = rolCollapse(dialog.querySelector("#rol-desc").value);
  const errors = {};
  if (rolLength(name) < ROL_NAME.min || rolLength(name) > ROL_NAME.max) errors.name = t("rol.err.nameLength", ROL_NAME);
  else if (/[<>]/.test(name)) errors.name = t("rol.err.plain");
  else if (rolNameTaken(name)) errors.name = t("rol.err.duplicate");
  if (/[<>]/.test(desc)) errors.desc = t("rol.err.plain");
  else if (rolLength(desc) > ROL_DESC_MAX) errors.desc = t("rol.err.descLength", { max: ROL_DESC_MAX });
  if (rol.selected.length < ROL_SKILLS.min) errors.skills = t("rol.err.skillsMin", { min: ROL_SKILLS.min, n: rol.selected.length });
  return errors;
}

// El nombre de un objetivo base (en los dos idiomas) o de otro rol propio, sin mayúsculas ni espacios de sobra
function rolNameTaken(name) {
  const key = rolKey(name);
  const editing = rol.editing ? String(rol.editing.id) : null;
  return (objetivoState.goals || []).filter(g => String(g.id) !== editing && !rolPendingDelete(g.id)).some(g => {
    const names = [g.title, g.custom ? null : DATA_EN.goals?.[g.title]?.title]; // i18n.js: el nombre en inglés
    return names.filter(Boolean).some(n => rolKey(n) === key);
  });
}

function showRolErrors(all) {
  const errors = rolErrors();
  for (const [field, input] of [["name", "#rol-name"], ["desc", "#rol-desc"], ["skills", "#rol-search"]]) {
    const shown = (all || rol.touched.has(field)) ? errors[field] || "" : "";
    document.getElementById(`rol-${field}-error`).textContent = shown;
    const target = field === "skills" ? document.getElementById("rol-skills") : rolDialog().querySelector(input);
    if (shown) target.setAttribute("aria-invalid", "true"); else target.removeAttribute("aria-invalid");
  }
  return errors;
}

function toggleRolSkill(button) {
  const id = Number(button.dataset.rolSkill);
  const at = rol.selected.indexOf(id);
  if (at >= 0) rol.selected.splice(at, 1);
  else if (rol.selected.length >= ROL_SKILLS.max) {
    document.getElementById("rol-skills-error").textContent = t("rol.err.skillsMax", { max: ROL_SKILLS.max });
    return;
  } else rol.selected.push(id);
  if (rol.selected.length >= ROL_SKILLS.min) rol.touched.add("skills");
  syncRolForm();
}

async function submitRol(e) {
  e.preventDefault();
  if (rol.busy) return;
  ["name", "desc", "skills"].forEach(f => rol.touched.add(f));
  const errors = showRolErrors(true);
  if (Object.keys(errors).length) {
    const first = errors.name ? "#rol-name" : errors.desc ? "#rol-desc" : "#rol-skill-groups [data-rol-skill]:not([hidden])";
    rolDialog().querySelector(first)?.focus();
    return;
  }
  const dialog = rolDialog();
  const editing = rol.editing;
  const payload = {
    name: rolCollapse(dialog.querySelector("#rol-name").value),
    description: rolCollapse(dialog.querySelector("#rol-desc").value) || null,
    skillIds: [...rol.selected],
  };
  const submit = dialog.querySelector("#rol-submit");
  rol.busy = true;
  submit.setAttribute("aria-busy", "true");
  submit.querySelector("[data-label]").textContent = t(editing ? "rol.saving" : "rol.creating");
  dialog.querySelector("#rol-error").textContent = "";
  let saved;
  try {
    saved = await apiJson(editing ? `/api/goals/custom/${editing.id}` : "/api/goals/custom", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Error recuperable: el diálogo sigue abierto con lo escrito
    rol.busy = false;
    submit.removeAttribute("aria-busy");
    submit.querySelector("[data-label]").textContent = t(editing ? "rol.submitEdit" : "rol.submitCreate");
    dialog.querySelector("#rol-error").textContent = t("rol.err.save", { error: friendlyError(err) });
    return;
  }
  invalidateGoals(); // dashboard.js
  let chosen = true;
  try {
    await loadGoals(); // el selector de Mi Ruta con el rol nuevo o con su nombre nuevo
    if (!editing) await setActiveGoal(saved.id); // dashboard.js: lo elige y recalcula Mi Ruta
    else {
      forgetRolPlan(saved.id); // sus habilidades pudieron cambiar: "Tu semana" se arma de nuevo
      if (String(getActiveGoalId()) === String(saved.id)) loadDashboard(saved.id, { swap: true });
    }
  } catch (err) {
    chosen = false;
    objetivoState.error = err;
  }
  rol.busy = false;
  submit.removeAttribute("aria-busy");
  rol.opener = null; // el foco va al rol, no a quien abrió el diálogo
  closeRolDialog();
  await loadObjetivoData().catch(() => { /* la vista conserva lo que tenía */ });
  refreshObjetivoInPlace(editing ? `.objetivo-item[data-goal-id="${saved.id}"] .objetivo-card` : "#objetivo-current-title");
  if (editing && String(getActiveGoalId()) === String(saved.id)) document.getElementById("objetivo-current-title")?.focus({ preventScroll: true });
  showToast({
    owner: "rol",
    text: t(editing ? "rol.savedToast" : chosen ? "rol.createdToast" : "rol.createdNotChosen", { goal: saved.title }),
  });
}

function initRolPropio() {
  const dialog = rolDialog();
  const content = document.getElementById("objetivo-content");

  content.addEventListener("click", e => {
    const action = e.target.closest("[data-rol-action]");
    if (!action) {
      if (!e.target.closest(".rol-menu")) closeRolMenus();
      return;
    }
    const id = action.dataset.goalId;
    switch (action.dataset.rolAction) {
      case "create":
        if (action.getAttribute("aria-disabled") !== "true") openRolDialog(null, action);
        break;
      case "menu":
        toggleRolMenu(action);
        break;
      case "edit": {
        closeRolMenus();
        const goal = rolGoal(id);
        const button = document.querySelector(`#objetivo-content [data-rol-menu="${id}"] .rol-menu-button`);
        if (goal) openRolDialog(goal, button);
        break;
      }
      case "delete":
        closeRolMenus();
        askDeleteRol(id, action.closest(".rol-menu--hero") ? "hero" : "card");
        break;
      case "confirm-delete":
        deleteRol(id);
        break;
      case "cancel-delete":
        cancelRolConfirm({ focus: true });
        break;
    }
  });
  content.addEventListener("keydown", e => {
    rolMenuKeys(e);
    if (e.key === "Escape" && e.target.closest("[data-rol-confirm]")) { e.preventDefault(); cancelRolConfirm({ focus: true }); }
  });
  document.addEventListener("click", e => { if (!e.target.closest("#objetivo-content .rol-menu")) closeRolMenus(); });

  dialog.addEventListener("click", e => {
    if (e.target.closest("[data-rol-close]")) { closeRolDialog(); return; }
    const skill = e.target.closest("[data-rol-skill]");
    if (skill) toggleRolSkill(skill);
  });
  dialog.addEventListener("input", e => {
    if (e.target.id === "rol-search") rol.query = e.target.value;
    syncRolForm();
  });
  dialog.addEventListener("focusout", e => {
    if (e.target.id === "rol-name") rol.touched.add("name");
    if (e.target.id === "rol-desc") rol.touched.add("desc");
    if (e.target.id === "rol-name" || e.target.id === "rol-desc") showRolErrors(false);
  });
  dialog.addEventListener("cancel", e => { if (rol.busy) e.preventDefault(); }); // Esc mientras guarda: espera
  dialog.addEventListener("close", () => {
    rol.opener?.focus({ preventScroll: true }); // el foco vuelve a quien lo abrió
    rol.opener = null;
  });
  dialog.querySelector("#rol-form").addEventListener("submit", submitRol);

  // Al cerrar o recargar la app con un borrado esperando "Deshacer", se borra igual (fetch keepalive)
  window.addEventListener("pagehide", () => {
    if (!rol.pending) return;
    apiFetch(`/api/goals/custom/${rol.pending.id}`, { method: "DELETE", keepalive: true }).catch(() => {});
    rol.pending = null;
  });
}

// Cambio de usuario: nada del anterior
document.addEventListener("skillmap:user", () => {
  closeRolDialog();
  Object.assign(rol, { editing: null, opener: null, selected: [], catalog: [], query: "", touched: new Set(), busy: false,
    pending: null, committing: null });
});

// Cambio de idioma con el diálogo abierto: categorías, nombres y textos en el idioma nuevo, conservando lo elegido
document.addEventListener("skillmap:language", () => {
  const dialog = rolDialog();
  if (!dialog?.open) return;
  dialog.querySelector("#rol-title").textContent = t(rol.editing ? "rol.title.edit" : "rol.title.create");
  dialog.querySelector("#rol-submit [data-label]").textContent = t(rol.editing ? "rol.submitEdit" : "rol.submitCreate");
  renderRolSkills();
  syncRolForm();
});

document.addEventListener("DOMContentLoaded", initRolPropio);
