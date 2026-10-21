// Selector de estado de una habilidad (Pendiente / Aprendiendo / Dominada), compartido por el panel del Mapa Visual,
// el detalle de habilidad y la lista de Perfil. Es un radiogroup: solo la opción elegida entra en el orden de tabulación
// y las flechas (también Inicio / Fin) eligen la vecina. En la lista de Perfil se abre desde un chip como menú
// (menuitemradio): las flechas solo mueven el foco y se elige con Enter, Espacio o clic. Guarda con PUT
// /api/skills/{id}/status.
// Usa apiJson (session.js), escapeHtml (mapa.js) y t, statusLabel y tSkill (i18n.js).

const SKILL_STATES = ["PENDING", "IN_PROGRESS", "MASTERED"];
const SKILL_STATE_CLASS = { MASTERED: "mastered", IN_PROGRESS: "progress", PENDING: "pending" };

// busy: guardando (las opciones siguen enfocables, pero no se elige otra hasta que termine); menu: variante menú
function renderStatusPicker(skill, busy, { menu = false } = {}) {
  const current = SKILL_STATES.includes(skill.status) ? skill.status : "PENDING";
  const options = SKILL_STATES.map(status => {
    const checked = status === current;
    return `<button type="button" role="${menu ? "menuitemradio" : "radio"}" class="status-option status-option--${SKILL_STATE_CLASS[status]}"
      aria-checked="${checked}" tabindex="${checked ? 0 : -1}" data-status="${status}">${statusLabel(status)}</button>`;
  }).join("");
  return `<div class="status-picker" role="${menu ? "menu" : "radiogroup"}" data-status-picker="${skill.id}"
    aria-label="${escapeHtml(t("state.group", { name: tSkill(skill.name) }))}"${busy ? ` aria-busy="true"` : ""}>${options}</div>`;
}

// Clic, Espacio o Enter en una opción, o flechas / Inicio / Fin dentro del grupo: onPick(id, estado). Un listener por
// contenedor, porque el selector se vuelve a pintar con cada cambio.
function bindStatusPicker(container, onPick) {
  container.addEventListener("click", e => {
    const option = e.target.closest(".status-picker [data-status]");
    if (option) onPick(Number(option.parentElement.dataset.statusPicker), option.dataset.status);
  });
  container.addEventListener("keydown", e => {
    const option = e.target.closest(".status-picker [data-status]");
    if (!option) return;
    const i = SKILL_STATES.indexOf(option.dataset.status);
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: SKILL_STATES.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const status = SKILL_STATES[(next + SKILL_STATES.length) % SKILL_STATES.length];
    const picker = option.parentElement;
    if (picker.getAttribute("role") === "menu") picker.querySelector(`[data-status="${status}"]`).focus();
    else onPick(Number(picker.dataset.statusPicker), status);
  });
}

// Tras repintar: si el foco estaba en el selector, vuelve a la opción elegida
function focusStatusPicker(root) {
  root.querySelector(".status-picker [aria-checked='true']")?.focus({ preventScroll: true });
}

// Devuelve la habilidad con el estado guardado para este usuario
function saveSkillStatus(id, status) {
  return apiJson(`/api/skills/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
