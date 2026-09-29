// Vista "Mapa Visual": todas las habilidades del sistema como grafo de nodos agrupados por categoría.
// Usa API_BASE_URL y renderApiError definidos en dashboard.js.

const NODE_SIZE = 112;      // diámetro de cada nodo (px)
const NODE_GAP = 36;        // separación mínima entre nodos vecinos de un mismo cluster
const CLUSTER_GAP = 90;     // separación mínima entre clusters vecinos
const STAGE_PADDING = 40;   // margen alrededor del grafo dentro del stage
const ZOOM_STEP = 0.1, ZOOM_MIN = 0.5, ZOOM_MAX = 2;

// Íconos inline (viewBox 24x24, trazo con currentColor). Sin librerías externas.
const ICONS = {
  js: `<rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" stroke="none"/><text x="18.5" y="18.5" text-anchor="end" font-size="8.5" font-weight="800" fill="var(--mapa-node-bg)" stroke="none" font-family="ui-sans-serif, system-ui, sans-serif">JS</text>`,
  atom: `<circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>`,
  bolt: `<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor"/>`,
  gauge: `<circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none"/><path d="M12 12l4-4" stroke="var(--mapa-node-bg)" stroke-width="2.2"/><path d="M6.5 13.5a5.5 5.5 0 0 1 11 0" stroke="var(--mapa-node-bg)" stroke-width="1.6" stroke-dasharray="1.5 2"/>`,
  puzzle: `<path d="M9 3.5a2 2 0 0 1 4 0V6h4a1 1 0 0 1 1 1v4h-1.5a2 2 0 1 0 0 4H18v4a1 1 0 0 1-1 1h-4v-1.5a2 2 0 1 0-4 0V20H5a1 1 0 0 1-1-1v-4h1.5a2 2 0 1 0 0-4H4V7a1 1 0 0 1 1-1h4V3.5z" fill="currentColor" stroke="none"/>`,
  server: `<rect x="3.5" y="4" width="17" height="7" rx="1.8"/><rect x="3.5" y="13" width="17" height="7" rx="1.8"/><path d="M7 7.5h.01M7 16.5h.01" stroke-width="2.6"/>`,
  database: `<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>`,
  box: `<path d="M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9L12 2.8z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9.2"/>`,
  cloud: `<path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.6A3.8 3.8 0 0 1 17.5 18.5H7z"/>`,
  branch: `<circle cx="6" cy="5.5" r="2.2"/><circle cx="6" cy="18.5" r="2.2"/><circle cx="18" cy="8" r="2.2"/><path d="M6 7.7v8.6M18 10.2c0 4-6 3.5-11 6.5"/>`,
  flask: `<path d="M9.5 3h5M10 3v6l-5.2 9.2A1.9 1.9 0 0 0 6.4 21h11.2a1.9 1.9 0 0 0 1.6-2.8L14 9V3"/><path d="M7.5 15h9"/>`,
  shield: `<path d="M12 2.8 19.5 6v5.5c0 4.6-3.2 8.3-7.5 9.7-4.3-1.4-7.5-5.1-7.5-9.7V6L12 2.8z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>`,
  palette: `<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.5-1.9-.4-1.3.5-2.6 1.9-2.6H17a4 4 0 0 0 4-4C21 7 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>`,
  code: `<path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15"/>`,
  users: `<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.8c2 .6 3.2 2.2 3.5 4.7"/>`,
  layers: `<path d="M12 3 21 8l-9 5-9-5 9-5z"/><path d="m3 12.5 9 5 9-5M3 16.5l9 5 9-5"/>`,
};

// Palabra clave en el nombre de la habilidad → ícono. El orden importa (lo más específico primero).
const SKILL_ICON_RULES = [
  [/react/, "atom"],
  [/next|vite|webpack|svelte|astro/, "bolt"],
  [/performance|vitals|optimiz|rendimiento/, "gauge"],
  [/micro|m[oó]dul|arquitect|architecture/, "puzzle"],
  [/node|express|spring|nest|django|flask|api|rest|graphql|server|servidor/, "server"],
  [/typescript|javascript|\bjs\b|\bts\b/, "js"],
  [/sql|postgres|mysql|mongo|redis|database|base de datos/, "database"],
  [/docker|kubernetes|k8s|contenedor|container/, "box"],
  [/aws|azure|gcp|cloud|nube/, "cloud"],
  [/git|ci\/cd|devops|pipeline/, "branch"],
  [/test|jest|cypress|junit|playwright|\bqa\b/, "flask"],
  [/secur|segur|auth|jwt/, "shield"],
  [/css|tailwind|sass|html|figma|\bui\b|\bux\b|diseñ|design/, "palette"],
  [/java|kotlin|python|golang|rust|c#|php|ruby/, "code"],
];

// Ícono genérico por categoría cuando el nombre no coincide con ninguna regla.
const CATEGORY_ICON_RULES = [
  [/front/, "code"],
  [/back/, "server"],
  [/dat|base/, "database"],
  [/devops|cloud|infra|nube/, "cloud"],
  [/test|calidad|qa/, "flask"],
  [/segur|secur/, "shield"],
  [/diseñ|design|ui|ux/, "palette"],
  [/soft|bland|equipo|team|lider|lead/, "users"],
];

function pickIcon(name, category) {
  const n = name.toLowerCase(), c = (category || "").toLowerCase();
  const byName = SKILL_ICON_RULES.find(([re]) => re.test(n));
  if (byName) return byName[1];
  const byCategory = CATEGORY_ICON_RULES.find(([re]) => re.test(c));
  return byCategory ? byCategory[1] : "layers";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

// Agrupa por "category" en el orden en que llegan de la API (sin lista hardcodeada).
function groupByCategory(skills) {
  const groups = new Map();
  for (const s of skills) {
    const category = s.category || "Sin categoría";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(s);
  }
  return groups;
}

// Radio mínimo para repartir n elementos en círculo sin que dos vecinos (separados `chord`) se toquen.
function ringRadius(n, chord) {
  return n <= 1 ? 0 : chord / (2 * Math.sin(Math.PI / n));
}

// Layout automático: clusters en círculo alrededor del centro y habilidades en círculo alrededor de su cluster.
function layoutGraph(skills) {
  const clusters = [...groupByCategory(skills)].map(([category, items]) => {
    const sorted = [...items].sort((a, b) => b.demandPercentage - a.demandPercentage);
    const radius = sorted.length === 2
      ? (NODE_SIZE + NODE_GAP) / 2
      : ringRadius(sorted.length, NODE_SIZE + NODE_GAP);
    return { category, items: sorted, radius, extent: radius + NODE_SIZE / 2 };
  });

  const maxExtent = Math.max(...clusters.map(c => c.extent));
  const orbit = ringRadius(clusters.length, 2 * maxExtent + CLUSTER_GAP);

  const nodes = [];
  clusters.forEach((cluster, i) => {
    const clusterAngle = -Math.PI / 2 + (2 * Math.PI * i) / clusters.length;
    const cx = orbit * Math.cos(clusterAngle);
    const cy = orbit * Math.sin(clusterAngle);
    cluster.nodes = cluster.items.map((skill, j) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * j) / cluster.items.length;
      const node = { skill, category: cluster.category, x: cx + cluster.radius * Math.cos(angle), y: cy + cluster.radius * Math.sin(angle) };
      nodes.push(node);
      return node;
    });
  });

  // Desplaza todo para que el grafo empiece en (STAGE_PADDING, STAGE_PADDING).
  const half = NODE_SIZE / 2;
  const minX = Math.min(...nodes.map(n => n.x)) - half, maxX = Math.max(...nodes.map(n => n.x)) + half;
  const minY = Math.min(...nodes.map(n => n.y)) - half, maxY = Math.max(...nodes.map(n => n.y)) + half;
  for (const n of nodes) {
    n.x += STAGE_PADDING - minX;
    n.y += STAGE_PADDING - minY;
  }

  // Conexiones: anillo entre habilidades vecinas de la misma categoría.
  const links = [];
  for (const { nodes: ring } of clusters) {
    if (ring.length < 2) continue;
    const count = ring.length === 2 ? 1 : ring.length;
    for (let j = 0; j < count; j++) links.push([ring[j], ring[(j + 1) % ring.length]]);
  }

  return { nodes, links, width: maxX - minX + 2 * STAGE_PADDING, height: maxY - minY + 2 * STAGE_PADDING };
}

const STATUS_CLASS = { MASTERED: "mastered", IN_PROGRESS: "progress", PENDING: "pending" };

function renderNode({ skill, category, x, y }) {
  const status = STATUS_CLASS[skill.status] || "pending";
  const tooltip = `${skill.name} — ${skill.demandPercentage}% demanda`;
  return `
    <div class="mapa-node mapa-node--${status}" tabindex="0" role="img"
      style="left:${x - NODE_SIZE / 2}px; top:${y - NODE_SIZE / 2}px; width:${NODE_SIZE}px; height:${NODE_SIZE}px;"
      data-tooltip="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}">
      <svg class="mapa-node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[pickIcon(skill.name, category)]}</svg>
      <span class="mapa-node-label" lang="es">${escapeHtml(skill.name)}</span>
    </div>`;
}

function renderMapa(skills) {
  if (skills.length === 0) {
    return `<p class="text-sm text-gray-400">No hay habilidades registradas en la API.</p>`;
  }
  const { nodes, links, width, height } = layoutGraph(skills);
  const lines = links
    .map(([a, b]) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`)
    .join("");

  // Líneas y nodos comparten el mismo stage: el zoom (transform) se aplica solo a él y ambos escalan juntos.
  return `
    <div class="mapa-viewport" id="mapa-viewport">
      <div class="mapa-stage" id="mapa-stage" style="width:${width}px; height:${height}px;">
        <svg class="mapa-links" width="${width}" height="${height}" aria-hidden="true">${lines}</svg>
        ${nodes.map(renderNode).join("")}
      </div>

      <div class="mapa-controls">
        <div class="mapa-zoom">
          <button type="button" data-zoom="in" aria-label="Acercar">+</button>
          <button type="button" data-zoom="out" aria-label="Alejar">−</button>
        </div>
        <button type="button" class="mapa-center" data-zoom="center" aria-label="Centrar mapa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
          </svg>
        </button>
      </div>

      <div class="mapa-legend">
        <span><i class="mapa-dot mapa-dot--mastered"></i>Dominada</span>
        <span><i class="mapa-dot mapa-dot--progress"></i>En Desarrollo</span>
        <span><i class="mapa-dot mapa-dot--pending"></i>Por Aprender</span>
      </div>

      <div class="mapa-tooltip" id="mapa-tooltip" hidden></div>
    </div>`;
}

const PAN_MARGIN = 80; // px del grafo que siempre quedan visibles al arrastrar

let mapaZoom = 1;
let mapaPan = { x: 0, y: 0 }; // desplazamiento (px de pantalla) respecto a la posición centrada

// Limita el arrastre para que el grafo no pueda sacarse por completo del área visible.
function clampMapaPan(viewport, stage) {
  const maxX = Math.max(0, (viewport.clientWidth + stage.offsetWidth * mapaZoom) / 2 - PAN_MARGIN);
  const maxY = Math.max(0, (viewport.clientHeight + stage.offsetHeight * mapaZoom) / 2 - PAN_MARGIN);
  mapaPan.x = Math.min(maxX, Math.max(-maxX, mapaPan.x));
  mapaPan.y = Math.min(maxY, Math.max(-maxY, mapaPan.y));
}

// Centra el stage en el área visible del viewport con el zoom actual, más el desplazamiento del arrastre.
function applyMapaTransform() {
  const viewport = document.getElementById("mapa-viewport");
  const stage = document.getElementById("mapa-stage");
  if (!viewport || !stage || viewport.clientWidth === 0) return; // vista oculta: se centra al volver a mostrarse
  clampMapaPan(viewport, stage);
  const tx = (viewport.clientWidth - stage.offsetWidth * mapaZoom) / 2 + mapaPan.x;
  const ty = (viewport.clientHeight - stage.offsetHeight * mapaZoom) / 2 + mapaPan.y;
  stage.style.transform = `translate(${tx}px, ${ty}px) scale(${mapaZoom})`;
  // La transición se activa después del primer centrado para no animar desde la esquina al cargar.
  requestAnimationFrame(() => stage.classList.add("is-ready"));
  viewport.querySelector('[data-zoom="in"]').disabled = mapaZoom >= ZOOM_MAX;
  viewport.querySelector('[data-zoom="out"]').disabled = mapaZoom <= ZOOM_MIN;
}

function setMapaZoom(action) {
  if (action === "center") {
    mapaZoom = 1;
    mapaPan = { x: 0, y: 0 };
  } else {
    const next = mapaZoom + (action === "in" ? ZOOM_STEP : -ZOOM_STEP);
    const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 10) / 10));
    // Escala el desplazamiento para que el punto en el centro de la vista siga ahí tras el zoom.
    mapaPan = { x: mapaPan.x * zoom / mapaZoom, y: mapaPan.y * zoom / mapaZoom };
    mapaZoom = zoom;
  }
  applyMapaTransform();
}

// Arrastre con el mouse (pointer events: también funciona con touch).
function bindMapaDrag(viewport, tooltip) {
  let drag = null;

  viewport.addEventListener("pointerdown", e => {
    if (e.button !== 0 || e.target.closest(".mapa-controls, .mapa-legend")) return;
    drag = { startX: e.clientX, startY: e.clientY, panX: mapaPan.x, panY: mapaPan.y };
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add("is-dragging");
    tooltip.hidden = true;
  });

  viewport.addEventListener("pointermove", e => {
    if (!drag) return;
    mapaPan = { x: drag.panX + e.clientX - drag.startX, y: drag.panY + e.clientY - drag.startY };
    applyMapaTransform();
  });

  const endDrag = e => {
    if (!drag) return;
    drag = null;
    viewport.releasePointerCapture(e.pointerId);
    viewport.classList.remove("is-dragging");
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
}

function bindMapaEvents() {
  const viewport = document.getElementById("mapa-viewport");
  if (!viewport) return;
  const tooltip = document.getElementById("mapa-tooltip");

  viewport.querySelectorAll("[data-zoom]").forEach(btn => {
    btn.addEventListener("click", () => setMapaZoom(btn.dataset.zoom));
  });

  bindMapaDrag(viewport, tooltip);

  // El tooltip vive fuera del stage para que no escale con el zoom.
  viewport.addEventListener("mousemove", e => {
    const node = e.target.closest(".mapa-node");
    if (!node || viewport.classList.contains("is-dragging")) { tooltip.hidden = true; return; }
    const rect = viewport.getBoundingClientRect();
    tooltip.textContent = node.dataset.tooltip;
    tooltip.hidden = false;
    // Si no cabe a la derecha del cursor, se muestra a la izquierda.
    const x = e.clientX - rect.left + 14;
    tooltip.style.left = `${x + tooltip.offsetWidth > rect.width ? x - tooltip.offsetWidth - 28 : x}px`;
    tooltip.style.top = `${e.clientY - rect.top + 14}px`;
  });
  viewport.addEventListener("mouseleave", () => { tooltip.hidden = true; });
}

window.addEventListener("resize", applyMapaTransform);

let mapaRequest = null; // se reutiliza para no volver a pedir /api/skills en cada apertura

function loadMapa() {
  if (mapaRequest) return mapaRequest;
  const container = document.getElementById("mapa-content");
  container.innerHTML = `<p class="text-sm text-gray-400">Cargando mapa de habilidades desde la API…</p>`;

  mapaRequest = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/skills`);
      if (!res.ok) throw new Error("La API respondió " + res.status);
      container.innerHTML = renderMapa(await res.json());
      mapaZoom = 1;
      mapaPan = { x: 0, y: 0 };
      bindMapaEvents();
      applyMapaTransform();
    } catch (err) {
      mapaRequest = null; // si falla, se reintenta la próxima vez que se abra la vista
      container.innerHTML = renderApiError(err);
    }
  })();
  return mapaRequest;
}

// Navegación sin router: muestra la sección elegida, oculta las demás y marca el item activo.
function showView(view) {
  document.querySelectorAll("main > section[id^='view-']").forEach(section => {
    section.classList.toggle("hidden", section.id !== `view-${view}`);
  });
  document.querySelectorAll(".nav-item[data-view]").forEach(item => {
    const isActive = item.dataset.view === view;
    item.classList.toggle("active", isActive);
    if (isActive) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  // Si la carga terminó mientras la vista estaba oculta, se centra al volver a mostrarla.
  if (view === "mapa") loadMapa().then(applyMapaTransform);
}

document.querySelectorAll(".nav-item[data-view]").forEach(item => {
  item.addEventListener("click", () => showView(item.dataset.view));
});
