// Vista "Objetivo". Usa fetchGoals, setActiveGoal y renderApiError (dashboard.js) y escapeHtml/showView (mapa.js).

// Ícono y color de cada tarjeta según palabras clave del título (sin acentos, en minúsculas).
// Gana el primer tema que coincide; sin coincidencia se usa GENERIC_THEME.
const ICON_STROKE = `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
const GOAL_THEMES = [
  { match: /front|react|angular|vue|\bweb\b/, color: "#D95F8E", bg: "#FCE8EF",
    icon: `<svg viewBox="0 0 24 24" ${ICON_STROKE}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/></svg>` },
  { match: /data|datos|analis|analyst|machine|\bml\b|\bia\b|\bai\b/, color: "#3B82F6", bg: "#EAF2FE",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 8.4v3.1c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V8.4c-1.5 1.2-4.3 1.9-7.5 1.9s-6-.7-7.5-1.9zm0 6v3.6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-3.6c-1.5 1.2-4.3 1.9-7.5 1.9s-6-.7-7.5-1.9z"/></svg>` },
  { match: /disen|design|\bux\b|\bui\b/, color: "#A855F7", bg: "#F4EAFE",
    icon: `<svg viewBox="0 0 24 24" ${ICON_STROKE}><path d="m12 19 7-7 3 3-7 7z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="m2 2 7.6 7.6"/><circle cx="11" cy="11" r="2"/></svg>` },
  { match: /cloud|nube|devops|aws|azure|infra/, color: "#F97316", bg: "#FEF0E6",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 19H7a5 5 0 1 1 .9-9.9A6 6 0 0 1 19.3 11a4 4 0 0 1-1.8 8z"/></svg>` },
  { match: /mobile|movil|android|\bios\b|flutter/, color: "#14B8A6", bg: "#E3F7F4",
    icon: `<svg viewBox="0 0 24 24" ${ICON_STROKE}><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18h2"/></svg>` },
  { match: /back|java|\bapi\b|server|servidor/, color: "#22A06B", bg: "#E6F6EE",
    icon: `<svg viewBox="0 0 24 24" ${ICON_STROKE}><rect x="3.5" y="4" width="17" height="7" rx="2"/><rect x="3.5" y="13" width="17" height="7" rx="2"/><path d="M7.5 7.5h.01M7.5 16.5h.01"/></svg>` },
];
const GENERIC_THEME = { color: "#8A8792", bg: "#F2EEF1",
  icon: `<svg viewBox="0 0 24 24" ${ICON_STROKE}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>` };

function normalizeText(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function goalTheme(title) {
  const t = normalizeText(title);
  return GOAL_THEMES.find(theme => theme.match.test(t)) || GENERIC_THEME;
}

const objetivoState = { goals: null, selectedId: null };

function renderGoalCard(goal) {
  const theme = goalTheme(goal.title);
  const count = goal.skills.length;
  return `
    <button type="button" class="objetivo-card" role="radio" aria-checked="false" tabindex="-1" data-goal-id="${goal.id}"
      data-title="${escapeHtml(normalizeText(goal.title))}" style="--goal-color:${theme.color}; --goal-bg:${theme.bg};">
      <span class="objetivo-card-icon" aria-hidden="true">${theme.icon}</span>
      <svg class="objetivo-card-check" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="objetivo-card-title">${escapeHtml(goal.title)}</span>
      <span class="objetivo-card-desc">${escapeHtml(goal.description || "")}</span>
      <span class="objetivo-card-count">${count} ${count === 1 ? "habilidad requerida" : "habilidades requeridas"}
        <svg width="12" height="12" viewBox="0 0 24 24" ${ICON_STROKE} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </button>`;
}

function renderObjetivo(goals) {
  const cards = goals.map(renderGoalCard).join("");
  return `
    <p class="objetivo-empty" role="status" ${goals.length ? "hidden" : ""}>${goals.length ? "" : "Aún no hay objetivos profesionales disponibles."}</p>
    <div class="objetivo-grid">
      <!-- display:contents: las tarjetas participan de la grilla y "Otro objetivo" queda fuera del grupo de radios -->
      <div class="objetivo-radios" role="radiogroup" aria-label="Objetivos profesionales">${cards}</div>
      <div class="objetivo-card objetivo-card--otro" aria-disabled="true" title="Próximamente">
        <span class="objetivo-otro-plus" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </span>
        <span class="objetivo-card-title">Otro objetivo</span>
        <span class="objetivo-otro-text">Crea tu propio rol personalizado</span>
        <span class="sample-tag">Próximamente</span>
      </div>
    </div>
    <div class="objetivo-actions">
      <button type="button" class="btn-pill objetivo-cta" data-action="trazar-ruta" ${goals.length ? "" : "disabled"}>Trazar mi ruta personalizada</button>
    </div>`;
}

// Marca la tarjeta elegida; solo ella queda en el orden de tabulación (patrón radio group).
function selectGoalCard(goalId, { focus = false } = {}) {
  objetivoState.selectedId = goalId == null ? null : String(goalId);
  const cards = [...document.querySelectorAll("#objetivo-content .objetivo-card[role='radio']")];
  let selected = null;
  cards.forEach(card => {
    const isSelected = card.dataset.goalId === objetivoState.selectedId;
    card.setAttribute("aria-checked", String(isSelected));
    card.tabIndex = isSelected ? 0 : -1;
    if (isSelected) selected = card;
  });
  // Sin selección visible, la primera tarjeta visible recibe el foco del Tab.
  if (!selected || selected.hidden) cards.find(c => !c.hidden)?.setAttribute("tabindex", "0");
  if (focus && selected) selected.focus();
}

function filterGoalCards(query) {
  const q = normalizeText(query.trim());
  const cards = [...document.querySelectorAll("#objetivo-content .objetivo-card[role='radio']")];
  let visible = 0;
  cards.forEach(card => {
    card.hidden = !card.dataset.title.includes(q);
    if (!card.hidden) visible++;
  });
  const empty = document.querySelector("#objetivo-content .objetivo-empty");
  if (empty && cards.length) {
    empty.hidden = visible > 0;
    empty.textContent = visible ? "" : `Ningún objetivo coincide con “${query.trim()}”. Prueba con otra palabra o borra la búsqueda.`;
  }
  selectGoalCard(objetivoState.selectedId);
}

// Flechas: mueven la selección entre las tarjetas visibles, como en un grupo de radios.
function handleObjetivoKeys(e) {
  const card = e.target.closest(".objetivo-card[role='radio']");
  if (!card) return;
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!step) return;
  e.preventDefault();
  const visible = [...document.querySelectorAll("#objetivo-content .objetivo-card[role='radio']:not([hidden])")];
  const next = visible[(visible.indexOf(card) + step + visible.length) % visible.length];
  selectGoalCard(next.dataset.goalId, { focus: true });
}

// Objetivo activo actual: el del selector de Mi Ruta; si aún no cargó, el guardado; si no, el primero.
function currentActiveGoalId(goals) {
  const selector = document.getElementById("goal-selector");
  const candidates = [selector.disabled ? null : selector.value, readSavedGoalId()];
  return candidates.find(id => goals.some(g => String(g.id) === id)) ?? (goals[0] ? String(goals[0].id) : null);
}

async function openObjetivo() {
  const container = document.getElementById("objetivo-content");
  if (!objetivoState.goals) {
    container.innerHTML = `<p class="text-sm text-gray-400">Cargando objetivos…</p>`;
    try {
      objetivoState.goals = await fetchGoals();
    } catch (err) {
      container.innerHTML = renderApiError(err); // se reintenta la próxima vez que se abra la vista
      return;
    }
    container.innerHTML = renderObjetivo(objetivoState.goals);
  }
  selectGoalCard(currentActiveGoalId(objetivoState.goals));
  filterGoalCards(document.getElementById("objetivo-search").value);
}

function initObjetivo() {
  const container = document.getElementById("objetivo-content");
  document.getElementById("objetivo-search").addEventListener("input", e => filterGoalCards(e.target.value));
  container.addEventListener("keydown", handleObjetivoKeys);
  container.addEventListener("click", e => {
    const card = e.target.closest(".objetivo-card[role='radio']");
    if (card) { selectGoalCard(card.dataset.goalId); return; }
    if (e.target.closest("[data-action='trazar-ruta']") && objetivoState.selectedId) {
      setActiveGoal(objetivoState.selectedId);
      showView("dashboard");
      window.scrollTo(0, 0);
    }
  });
}

document.addEventListener("DOMContentLoaded", initObjetivo);
