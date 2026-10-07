// Vista "Mapa Visual": todas las habilidades del sistema como grafo de nodos agrupados por categoría, con la ruta
// sugerida del objetivo activo y un panel de detalle de la habilidad seleccionada.
// Usa API_BASE_URL, renderApiError, STATUS_LABEL, demandIsSample, sampleTag, SAMPLE_DEMAND_TEXT, jobStatsText,
// fetchJobStats, fetchGoals, fetchReadiness y getActiveGoalId (dashboard.js) y currentActiveGoalId (objetivo.js).
// También define la navegación entre vistas (showView) y el indicador del nav de la barra superior.

const NODE_SIZE = 96;       // diámetro de cada nodo (px)
const NODE_GAP = 20;        // separación mínima entre nodos vecinos de un mismo cluster
const CLUSTER_GAP = 28;     // separación mínima entre los bordes de dos clusters
const STAGE_PADDING = 8;    // margen alrededor del grafo dentro del stage (sombras y hover)
const LABEL_OFFSET = 10;    // distancia entre el borde del cluster y su etiqueta de categoría
// Tamaño estimado de la etiqueta: píldora de 11px en mayúsculas con tracking .12em, padding 10px y borde de 1px
const LABEL_CHAR_W = 8.5, LABEL_PAD_X = 22, LABEL_HEIGHT = 24;
const ZOOM_STEP = 0.1, ZOOM_MIN = 0.5, ZOOM_MAX = 2;
const FIT_MARGIN = 24;      // margen entre el grafo ajustado y los bordes / controles
const FIT_MIN = 0.6, FIT_MAX = 1.25;  // límites del zoom automático para que los nombres sigan legibles
const WHEEL_SPEED = 0.0015; // sensibilidad de la rueda (factor exponencial por px de delta)

// Íconos inline (viewBox 24x24, trazo con currentColor). Sin librerías externas. Los usa Perfil; los nodos del mapa
// muestran solo el nombre, como el mockup.
const ICONS = {
  js: `<rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" stroke="none"/><text x="18.5" y="18.5" text-anchor="end" font-size="8.5" font-weight="800" fill="var(--mapa-node-bg)" stroke="none" font-family="inherit">JS</text>`,
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

// Ángulo de cada cluster en la órbita: cada tramo entre vecinos es proporcional a lo que ambos ocupan,
// así un cluster pequeño no reserva el mismo arco que uno grande.
function ringAngles(ring) {
  const start = ring.length === 2 ? Math.PI : -Math.PI / 2; // dos clusters: lado a lado
  const spans = ring.map((c, i) => c.extent + ring[(i + 1) % ring.length].extent + CLUSTER_GAP);
  const total = spans.reduce((sum, s) => sum + s, 0);
  let angle = start;
  return spans.map(span => {
    const current = angle;
    angle += (2 * Math.PI * span) / total;
    return current;
  });
}

// Radio mínimo de la órbita para que ningún par de clusters se toque (distancia entre centros ≥ eᵢ + eⱼ + gap).
function orbitRadius(ring, angles) {
  let orbit = 0;
  for (let i = 0; i < ring.length; i++) {
    for (let j = i + 1; j < ring.length; j++) {
      const chord = 2 * Math.sin(Math.abs(angles[i] - angles[j]) / 2);
      orbit = Math.max(orbit, (ring[i].extent + ring[j].extent + CLUSTER_GAP) / chord);
    }
  }
  return orbit;
}

// Posiciona los clusters lo más juntos posible. Si el hueco central del anillo deja espacio para el cluster
// más grande, ese va al centro y el resto lo rodea, para no dejar vacío en medio.
function placeClusters(clusters) {
  let ring = clusters;
  if (clusters.length >= 4) {
    const hub = clusters.reduce((a, b) => (b.extent > a.extent ? b : a));
    const rest = clusters.filter(c => c !== hub);
    const orbit = orbitRadius(rest, ringAngles(rest));
    if (rest.every(c => orbit - c.extent >= hub.extent + CLUSTER_GAP)) {
      Object.assign(hub, { x: 0, y: 0, angle: -Math.PI / 2 });
      ring = rest;
    }
  }
  if (ring.length === 1) {
    Object.assign(ring[0], { x: 0, y: 0, angle: -Math.PI / 2 });
    return;
  }
  const angles = ringAngles(ring);
  const orbit = orbitRadius(ring, angles);
  ring.forEach((c, i) => Object.assign(c, { x: orbit * Math.cos(angles[i]), y: orbit * Math.sin(angles[i]), angle: angles[i] }));
}

// Etiqueta de categoría por fuera del cluster, en la dirección opuesta al centro del grafo.
// alignX/alignY (en %) anclan el texto para que crezca hacia afuera y nunca tape sus nodos.
function clusterLabel(cluster) {
  const cos = Math.cos(cluster.angle), sin = Math.sin(cluster.angle);
  const dist = cluster.extent + LABEL_OFFSET;
  return {
    category: cluster.category,
    x: cluster.x + dist * cos,
    y: cluster.y + dist * sin,
    alignX: cos > 0.35 ? 0 : cos < -0.35 ? -100 : -50,
    alignY: sin > 0.35 ? 0 : sin < -0.35 ? -100 : -50,
  };
}

// Caja estimada de una etiqueta, para incluirla en el tamaño del stage y en el ajuste automático.
function labelBox(label) {
  const w = label.category.length * LABEL_CHAR_W + LABEL_PAD_X;
  const left = label.x + (w * label.alignX) / 100, top = label.y + (LABEL_HEIGHT * label.alignY) / 100;
  return { left, top, right: left + w, bottom: top + LABEL_HEIGHT };
}

// Layout automático: clusters compactos alrededor del centro y habilidades en círculo alrededor de su cluster.
function layoutGraph(skills) {
  const clusters = [...groupByCategory(skills)].map(([category, items]) => {
    const sorted = [...items].sort((a, b) => b.demandPercentage - a.demandPercentage);
    const radius = sorted.length === 2
      ? (NODE_SIZE + NODE_GAP) / 2
      : ringRadius(sorted.length, NODE_SIZE + NODE_GAP);
    return { category, items: sorted, radius, extent: radius + NODE_SIZE / 2 };
  });

  placeClusters(clusters);

  const nodes = [];
  for (const cluster of clusters) {
    cluster.nodes = cluster.items.map((skill, j) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * j) / cluster.items.length;
      const node = { skill, category: cluster.category, x: cluster.x + cluster.radius * Math.cos(angle), y: cluster.y + cluster.radius * Math.sin(angle) };
      nodes.push(node);
      return node;
    });
  }
  const labels = clusters.map(clusterLabel);

  // Caja que envuelve nodos y etiquetas; se desplaza todo para que empiece en (STAGE_PADDING, STAGE_PADDING).
  const half = NODE_SIZE / 2;
  const boxes = [
    ...nodes.map(n => ({ left: n.x - half, top: n.y - half, right: n.x + half, bottom: n.y + half })),
    ...labels.map(labelBox),
  ];
  const minX = Math.min(...boxes.map(b => b.left)), maxX = Math.max(...boxes.map(b => b.right));
  const minY = Math.min(...boxes.map(b => b.top)), maxY = Math.max(...boxes.map(b => b.bottom));
  for (const p of [...nodes, ...labels]) {
    p.x += STAGE_PADDING - minX;
    p.y += STAGE_PADDING - minY;
  }

  // Conexiones: anillo entre habilidades vecinas de la misma categoría.
  const links = [];
  for (const { nodes: ring } of clusters) {
    if (ring.length < 2) continue;
    const count = ring.length === 2 ? 1 : ring.length;
    for (let j = 0; j < count; j++) links.push([ring[j], ring[(j + 1) % ring.length]]);
  }

  return { nodes, links, labels, width: maxX - minX + 2 * STAGE_PADDING, height: maxY - minY + 2 * STAGE_PADDING };
}

const STATUS_CLASS = { MASTERED: "mastered", IN_PROGRESS: "progress", PENDING: "pending" };

// Solo el primer nodo entra en el orden de tabulación; las flechas mueven el foco entre nodos (tabindex móvil).
// Clic o Enter/Espacio seleccionan el nodo y llenan el panel de detalle.
function renderNode({ skill, category, x, y }, index) {
  const status = STATUS_CLASS[skill.status] || "pending";
  const tooltip = `${skill.name} — ${skill.demandPercentage}% de demanda`;
  const label = `${skill.name}, ${category}, ${STATUS_LABEL[skill.status] || STATUS_LABEL.PENDING}, `
    + `${skill.demandPercentage}% de demanda${demandIsSample([skill]) ? " (de ejemplo)" : ""}`;
  return `
    <div class="mapa-node mapa-node--${status}" tabindex="${index === 0 ? 0 : -1}" role="button" aria-pressed="false"
      style="left:${x - NODE_SIZE / 2}px; top:${y - NODE_SIZE / 2}px; width:${NODE_SIZE}px; height:${NODE_SIZE}px; --i:${index};"
      data-skill-id="${skill.id}" data-tooltip="${escapeHtml(tooltip)}" aria-label="${escapeHtml(label)}">
      <span class="mapa-node-label" lang="es" aria-hidden="true">${escapeHtml(skill.name)}</span>
    </div>`;
}

function renderClusterLabel({ category, x, y, alignX, alignY }) {
  return `<span class="mapa-cluster-label" style="left:${x}px; top:${y}px; transform:translate(${alignX}%, ${alignY}%);">${escapeHtml(category)}</span>`;
}

function renderMapa(skills) {
  if (skills.length === 0) {
    return `<p class="text-sm text-muted-page">Aún no hay habilidades para mostrar en el mapa.</p>`;
  }
  const { nodes, links, labels, width, height } = layoutGraph(skills);
  // pathLength y --i solo sirven a la animación de entrada: cada línea se traza cuando ya apareció su segundo nodo.
  const lines = links
    .map(([a, b]) => `<line class="mapa-link" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" pathLength="1"
      style="--i:${Math.max(nodes.indexOf(a), nodes.indexOf(b))};"/>`)
    .join("");

  // Líneas y nodos comparten el mismo stage: el zoom (transform) se aplica solo a él y ambos escalan juntos.
  // La ruta sugerida (polyline) la llena updateMapaRoute cuando llega el objetivo activo.
  return `
    <div class="mapa-layout">
      <div class="mapa-card">
        <div class="mapa-viewport" id="mapa-viewport">
          <div class="mapa-stage" id="mapa-stage" style="width:${width}px; height:${height}px;"
            role="group" aria-label="Mapa de habilidades. Usa las flechas para recorrerlas y Enter para ver su detalle.">
            <svg class="mapa-links" width="${width}" height="${height}" aria-hidden="true">${lines}<polyline class="mapa-route" id="mapa-route" points=""/></svg>
            ${labels.map(renderClusterLabel).join("")}
            ${nodes.map(renderNode).join("")}
          </div>

          <div class="mapa-controls" role="group" aria-label="Zoom del mapa">
            <button type="button" data-zoom="in" aria-label="Acercar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button type="button" data-zoom="out" aria-label="Alejar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>
            </button>
            <button type="button" data-zoom="center" aria-label="Centrar mapa">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
              </svg>
            </button>
          </div>

          <div class="mapa-legend">
            <span><i class="mapa-dot mapa-dot--mastered"></i>Dominada</span>
            <span><i class="mapa-dot mapa-dot--progress"></i>En desarrollo</span>
            <span><i class="mapa-dot mapa-dot--pending"></i>Por aprender</span>
            <span id="mapa-legend-route" hidden><i class="mapa-key-route"></i>Ruta sugerida</span>
          </div>

          <div class="mapa-tooltip" id="mapa-tooltip" aria-hidden="true" hidden></div>
        </div>
      </div>

      <aside class="mapa-panel" id="mapa-panel" aria-label="Detalle de la habilidad">${renderMapaPanelEmpty()}</aside>
      <p class="sr-only" id="mapa-live" aria-live="polite"></p>
    </div>`;
}

// ---------- Panel de detalle ----------

let mapaSkills = [];          // /api/skills tal como llegó (el panel busca aquí la habilidad seleccionada)
let mapaSelectedId = null;    // id de la habilidad seleccionada (sobrevive a cambios de objetivo)
let mapaJobStats = null;      // /api/jobs/stats para la nota "Ruta calculada con N ofertas reales"
// Objetivo activo: brechas en orden de demanda (ruta sugerida) y todas sus habilidades
let mapaRoute = { goalId: null, goalTitle: "", gapIds: [], goalSkillIds: new Set() };

function renderMapaPanelEmpty() {
  return `
    <div class="mapa-panel-empty">
      <span class="mapa-panel-empty-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="10" cy="18" r="2.5"/><path d="M8.2 7l7.6.6M7.4 8.2l1.8 7.4M16.6 10.2l-5 6.2"/></svg>
      </span>
      <h2 class="mapa-panel-empty-title">Selecciona una habilidad</h2>
      <p class="mapa-panel-empty-text">Haz clic en un nodo del mapa (o recórrelos con las flechas y pulsa Enter) para ver su demanda y su lugar en tu ruta.</p>
    </div>`;
}

// Texto corto armado solo con datos de la API: lugar en la ruta del objetivo activo o, si no está en él, su estado.
function mapaSkillText(skill) {
  const { goalTitle, gapIds, goalSkillIds } = mapaRoute;
  const goal = escapeHtml(goalTitle);
  const gap = gapIds.indexOf(skill.id);
  if (gap === 0) return `Es tu siguiente giro hacia ${goal}: la brecha con más demanda de tu ruta.`;
  if (gap > 0) return `Es la brecha ${gap + 1} de ${gapIds.length} en tu ruta hacia ${goal}, ordenada por demanda.`;
  if (goalSkillIds.has(skill.id)) {
    return skill.status === "MASTERED" ? `Ya la dominas y suma a tu preparación para ${goal}.` : `Forma parte de tu objetivo ${goal}.`;
  }
  const byStatus = { MASTERED: "Ya la dominas.", IN_PROGRESS: "La estás desarrollando.", PENDING: "Aún no la has empezado." };
  const text = byStatus[skill.status] || byStatus.PENDING;
  return goalTitle ? `${text} No forma parte de tu objetivo ${goal}.` : text;
}

function renderMapaPanel(skill) {
  const status = STATUS_CLASS[skill.status] || "pending";
  const statsText = jobStatsText(mapaJobStats, "Ruta calculada con");
  const note = demandIsSample([skill]) ? `<p class="mapa-panel-note">${sampleTag} ${SAMPLE_DEMAND_TEXT}</p>`
    : statsText ? `<p class="mapa-panel-note">${statsText}</p>` : "";
  return `
    <div class="mapa-panel-chips">
      ${skill.category ? `<span class="mapa-chip mapa-chip--category">${escapeHtml(skill.category)}</span>` : ""}
      <span class="mapa-chip mapa-chip--${status}">${STATUS_LABEL[skill.status] || STATUS_LABEL.PENDING}</span>
    </div>
    <h2 class="mapa-panel-name">${escapeHtml(skill.name)}</h2>
    <p class="mapa-panel-demand"><span class="mapa-panel-pct">${skill.demandPercentage}</span><span class="mapa-panel-pct-label">% de las ofertas</span></p>
    <p class="mapa-panel-text">${mapaSkillText(skill)}</p>
    <div class="mapa-panel-actions">
      <!-- Próximamente: contexto y preguntas frecuentes (Fase 6) y marcado de skills -->
      <button type="button" class="btn-pill" aria-disabled="true" title="Próximamente">Ver contexto y preguntas frecuentes</button>
      <button type="button" class="btn-pill btn-pill--outline" aria-disabled="true" title="Próximamente">Marcar como dominada</button>
    </div>
    ${note}`;
}

function refreshMapaPanel() {
  const panel = document.getElementById("mapa-panel");
  if (!panel) return;
  const skill = mapaSkills.find(s => s.id === mapaSelectedId);
  panel.innerHTML = skill ? renderMapaPanel(skill) : renderMapaPanelEmpty();
}

function selectMapaNode(node) {
  const id = Number(node.dataset.skillId);
  document.querySelectorAll("#mapa-stage .mapa-node").forEach(n => n.setAttribute("aria-pressed", String(n === node)));
  if (id === mapaSelectedId) return;
  mapaSelectedId = id;
  refreshMapaPanel();
  const skill = mapaSkills.find(s => s.id === id);
  if (skill) document.getElementById("mapa-live").textContent = `${skill.name} seleccionada. Detalle en el panel.`;
}

// ---------- Ruta sugerida ----------

// Brechas del objetivo activo (readiness, ya ordenadas por demanda) y sus habilidades. Sin objetivo: ruta vacía.
async function fetchMapaRoute() {
  const goals = await fetchGoals();
  const goalId = currentActiveGoalId(goals);
  if (!goalId) return { goalId: null, goalTitle: "", gapIds: [], goalSkillIds: new Set() };
  const readiness = await fetchReadiness(goalId);
  const goal = goals.find(g => String(g.id) === goalId);
  return {
    goalId,
    goalTitle: readiness.goalTitle,
    gapIds: readiness.gaps.map(s => s.id),
    goalSkillIds: new Set((goal?.skills || []).map(s => s.skillId)),
  };
}

// Traza la polyline punteada por los centros de las brechas en orden y marca sus nodos (resaltado de la leyenda).
function drawMapaRoute() {
  const route = document.getElementById("mapa-route");
  if (!route) return;
  const half = NODE_SIZE / 2;
  const byId = new Map([...document.querySelectorAll("#mapa-stage .mapa-node")].map(n => [Number(n.dataset.skillId), n]));
  byId.forEach((node, id) => node.classList.toggle("is-route", mapaRoute.gapIds.includes(id)));
  const points = mapaRoute.gapIds.map(id => byId.get(id)).filter(Boolean)
    .map(n => `${n.offsetLeft + half},${n.offsetTop + half}`);
  route.setAttribute("points", points.length > 1 ? points.join(" ") : "");
  document.getElementById("mapa-legend-route").hidden = points.length < 2;
}

// Al abrir la vista: si el objetivo activo cambió desde la última vez, se recalcula la ruta y el texto del panel.
async function updateMapaRoute() {
  if (!document.getElementById("mapa-route")) return;
  try {
    const goals = await fetchGoals();
    if (mapaRoute.goalId && currentActiveGoalId(goals) === mapaRoute.goalId) return;
    mapaRoute = await fetchMapaRoute();
  } catch {
    mapaRoute = { goalId: null, goalTitle: "", gapIds: [], goalSkillIds: new Set() }; // la ruta es complementaria
  }
  drawMapaRoute();
  refreshMapaPanel();
}

const PAN_MARGIN = 80; // px del grafo que siempre quedan visibles al arrastrar

let mapaZoom = 1;
let mapaPan = { x: 0, y: 0 }; // desplazamiento (px de pantalla) respecto a la posición centrada
let mapaNeedsFit = true;      // el ajuste automático se calcula en cuanto el viewport sea visible

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Área libre del viewport: todo el lienzo menos un margen, y abajo la franja de la leyenda. Los controles ocupan
// solo la esquina superior izquierda, donde el layout en anillo casi nunca pone nodos, así que no se descuentan.
function mapaSafeArea(viewport) {
  const legend = viewport.querySelector(".mapa-legend");
  const bottom = viewport.clientHeight - legend.offsetTop + FIT_MARGIN / 2;
  return {
    left: FIT_MARGIN,
    top: FIT_MARGIN,
    width: Math.max(0, viewport.clientWidth - 2 * FIT_MARGIN),
    height: Math.max(0, viewport.clientHeight - FIT_MARGIN - bottom),
  };
}

// Translate que deja el stage centrado en el área libre con el zoom dado (sin arrastre).
function mapaBaseOffset(viewport, stage, zoom) {
  const area = mapaSafeArea(viewport);
  return {
    x: area.left + (area.width - stage.offsetWidth * zoom) / 2,
    y: area.top + (area.height - stage.offsetHeight * zoom) / 2,
  };
}

// Zoom que hace caber todo el grafo en el área libre, dentro de límites que mantienen los nombres legibles.
function mapaFitZoom(viewport, stage) {
  const area = mapaSafeArea(viewport);
  return clamp(Math.min(area.width / stage.offsetWidth, area.height / stage.offsetHeight), FIT_MIN, FIT_MAX);
}

// Aplica zoom + arrastre al stage. El arrastre se limita para que el grafo no salga por completo de la vista.
function applyMapaTransform() {
  const viewport = document.getElementById("mapa-viewport");
  const stage = document.getElementById("mapa-stage");
  if (!viewport || !stage || viewport.clientWidth === 0) return; // vista oculta: se ajusta al volver a mostrarse
  if (mapaNeedsFit) {
    mapaZoom = mapaFitZoom(viewport, stage);
    mapaPan = { x: 0, y: 0 };
    mapaNeedsFit = false;
  }
  const base = mapaBaseOffset(viewport, stage, mapaZoom);
  const w = stage.offsetWidth * mapaZoom, h = stage.offsetHeight * mapaZoom;
  const tx = clamp(base.x + mapaPan.x, PAN_MARGIN - w, viewport.clientWidth - PAN_MARGIN);
  const ty = clamp(base.y + mapaPan.y, PAN_MARGIN - h, viewport.clientHeight - PAN_MARGIN);
  mapaPan = { x: tx - base.x, y: ty - base.y };
  stage.style.transform = `translate(${tx}px, ${ty}px) scale(${mapaZoom})`;
  // La transición se activa después del primer centrado para no animar desde la esquina al cargar.
  requestAnimationFrame(() => stage.classList.add("is-ready"));
  viewport.querySelector('[data-zoom="in"]').disabled = mapaZoom >= ZOOM_MAX - 1e-6;
  viewport.querySelector('[data-zoom="out"]').disabled = mapaZoom <= ZOOM_MIN + 1e-6;
}

// Cambia el zoom manteniendo fijo el punto del grafo que está bajo (px, py) (coordenadas del viewport).
function zoomMapaAt(nextZoom, px, py) {
  const viewport = document.getElementById("mapa-viewport");
  const stage = document.getElementById("mapa-stage");
  const zoom = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX);
  if (!viewport || !stage || zoom === mapaZoom) return;
  const before = mapaBaseOffset(viewport, stage, mapaZoom);
  const sx = (px - before.x - mapaPan.x) / mapaZoom; // punto del stage bajo el cursor
  const sy = (py - before.y - mapaPan.y) / mapaZoom;
  const after = mapaBaseOffset(viewport, stage, zoom);
  mapaPan = { x: px - sx * zoom - after.x, y: py - sy * zoom - after.y };
  mapaZoom = zoom;
  applyMapaTransform();
}

function setMapaZoom(action) {
  if (action === "center") {
    mapaNeedsFit = true; // "Centrar" vuelve al ajuste automático y sin arrastre
    applyMapaTransform();
    return;
  }
  const viewport = document.getElementById("mapa-viewport");
  const area = mapaSafeArea(viewport);
  const next = Math.round((mapaZoom + (action === "in" ? ZOOM_STEP : -ZOOM_STEP)) * 10) / 10;
  zoomMapaAt(next, area.left + area.width / 2, area.top + area.height / 2);
}

const FOCUS_MARGIN = 16; // espacio mínimo entre un nodo enfocado con teclado y el borde del área libre

// Posición en pantalla (px del viewport) del centro de un nodo y su radio, con el zoom y arrastre actuales.
function mapaNodeScreen(viewport, stage, node) {
  const base = mapaBaseOffset(viewport, stage, mapaZoom);
  const half = NODE_SIZE / 2;
  return {
    x: base.x + mapaPan.x + (node.offsetLeft + half) * mapaZoom,
    y: base.y + mapaPan.y + (node.offsetTop + half) * mapaZoom,
    r: half * mapaZoom,
  };
}

// Foco con teclado en un nodo fuera del área libre: se arrastra el mapa lo justo para mostrarlo.
function panMapaToNode(node) {
  const viewport = document.getElementById("mapa-viewport");
  const stage = document.getElementById("mapa-stage");
  const area = mapaSafeArea(viewport);
  const { x, y, r } = mapaNodeScreen(viewport, stage, node);
  const reach = r + FOCUS_MARGIN;
  const shift = (center, start, size) =>
    center - reach < start ? start - (center - reach) : center + reach > start + size ? start + size - (center + reach) : 0;
  const dx = shift(x, area.left, area.width), dy = shift(y, area.top, area.height);
  if (!dx && !dy) return;
  mapaPan = { x: mapaPan.x + dx, y: mapaPan.y + dy };
  applyMapaTransform();
}

// Contenido del tooltip: nombre y demanda (el detalle completo vive en el panel).
function fillMapaTooltip(tooltip, node) {
  if (tooltip.dataset.node === node.dataset.tooltip) return;
  tooltip.dataset.node = node.dataset.tooltip;
  tooltip.textContent = node.dataset.tooltip;
}

// Ubica el tooltip dentro del viewport: preferencia (x, y) y, si no cabe antes de maxBottom, del otro lado
// (flipX / flipY en px).
function placeMapaTooltip(viewport, tooltip, x, y, flipX, flipY, maxBottom = viewport.clientHeight) {
  tooltip.hidden = false;
  const w = tooltip.offsetWidth, h = tooltip.offsetHeight;
  const left = x + w > viewport.clientWidth ? flipX - w : x;
  const top = y + h > maxBottom ? flipY - h : y;
  tooltip.style.left = `${clamp(left, 8, viewport.clientWidth - w - 8)}px`;
  tooltip.style.top = `${clamp(top, 8, viewport.clientHeight - h - 8)}px`;
}

// Tooltip de un nodo enfocado con teclado: centrado debajo del nodo, o encima si taparía la leyenda.
function showMapaTooltipForNode(viewport, tooltip, node) {
  const stage = document.getElementById("mapa-stage");
  const { x, y, r } = mapaNodeScreen(viewport, stage, node);
  const area = mapaSafeArea(viewport);
  fillMapaTooltip(tooltip, node);
  tooltip.hidden = false;
  const w = tooltip.offsetWidth;
  placeMapaTooltip(viewport, tooltip, x - w / 2, y + r + 10, x + w / 2, y - r - 10, area.top + area.height);
}

// Flechas / Inicio / Fin: mueven el foco entre nodos. Solo el nodo activo queda en el orden de tabulación.
// Enter / Espacio: seleccionan el nodo enfocado.
function bindMapaKeys(viewport, tooltip) {
  const stage = document.getElementById("mapa-stage");
  const nodes = [...stage.querySelectorAll(".mapa-node")];

  stage.addEventListener("keydown", e => {
    const i = nodes.indexOf(e.target);
    if (i === -1) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectMapaNode(e.target);
      return;
    }
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: nodes.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    nodes[(next + nodes.length) % nodes.length].focus();
  });

  stage.addEventListener("focusin", e => {
    const node = e.target.closest(".mapa-node");
    if (!node) return;
    nodes.forEach(n => { n.tabIndex = n === node ? 0 : -1; });
    // Con el mouse el foco llega al empezar a arrastrar: ahí no se mueve el mapa ni se muestra el tooltip.
    if (!node.matches(":focus-visible")) return;
    panMapaToNode(node);
    showMapaTooltipForNode(viewport, tooltip, node);
  });
  stage.addEventListener("focusout", () => { tooltip.hidden = true; });
}

// Rueda del mouse: zoom centrado en el cursor. preventDefault evita el scroll de la página sobre el mapa.
function bindMapaWheel(viewport, tooltip) {
  let wheelTimer = null;
  viewport.addEventListener("wheel", e => {
    e.preventDefault();
    tooltip.hidden = true; // un tooltip anclado a un nodo quedaría fuera de lugar con el nuevo zoom
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; // Firefox puede reportar líneas en vez de px
    const rect = viewport.getBoundingClientRect();
    // Sin transición mientras se gira la rueda, para que el zoom siga al gesto sin retraso.
    viewport.classList.add("is-wheeling");
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => viewport.classList.remove("is-wheeling"), 150);
    zoomMapaAt(mapaZoom * Math.exp(-delta * WHEEL_SPEED), e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });
}

const CLICK_SLOP = 4; // px que puede moverse el puntero para que soltar sobre un nodo cuente como clic y no arrastre

// Arrastre con el mouse (pointer events: también funciona con touch). Sigue a un solo puntero:
// un segundo dedo o puntero a mitad del gesto se ignora en vez de hacer saltar el mapa.
// Si el gesto empezó sobre un nodo y casi no se movió, es un clic: selecciona ese nodo.
function bindMapaDrag(viewport, tooltip) {
  let drag = null;

  viewport.addEventListener("pointerdown", e => {
    if (drag || e.button !== 0 || e.target.closest(".mapa-controls, .mapa-legend")) return;
    drag = { id: e.pointerId, startX: e.clientX, startY: e.clientY, panX: mapaPan.x, panY: mapaPan.y,
      node: e.target.closest(".mapa-node"), moved: false };
    viewport.setPointerCapture(e.pointerId);
    tooltip.hidden = true;
  });

  viewport.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < CLICK_SLOP) return;
    drag.moved = true;
    viewport.classList.add("is-dragging");
    mapaPan = { x: drag.panX + dx, y: drag.panY + dy };
    applyMapaTransform();
  });

  // Fin del gesto: soltar, cancelación del navegador, captura perdida o la ventana pierde el foco.
  const endDrag = e => {
    if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.id)) return;
    const { node, moved } = drag;
    if (viewport.hasPointerCapture(drag.id)) viewport.releasePointerCapture(drag.id);
    drag = null;
    viewport.classList.remove("is-dragging");
    if (e.type === "pointerup" && node && !moved) selectMapaNode(node);
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  viewport.addEventListener("lostpointercapture", endDrag);
  window.addEventListener("blur", endDrag);
}

function bindMapaEvents() {
  const viewport = document.getElementById("mapa-viewport");
  if (!viewport) return;
  const tooltip = document.getElementById("mapa-tooltip");

  viewport.querySelectorAll("[data-zoom]").forEach(btn => {
    btn.addEventListener("click", () => setMapaZoom(btn.dataset.zoom));
  });

  // El viewport usa overflow:clip (styles.css) para que el foco no lo desplace y los controles no se muevan.
  // Respaldo para navegadores sin clip: cualquier scroll vuelve a 0.
  viewport.addEventListener("scroll", () => { viewport.scrollLeft = 0; viewport.scrollTop = 0; });

  bindMapaDrag(viewport, tooltip);
  bindMapaWheel(viewport, tooltip);
  bindMapaKeys(viewport, tooltip);

  // El tooltip vive fuera del stage para que no escale con el zoom.
  viewport.addEventListener("mousemove", e => {
    const node = e.target.closest(".mapa-node");
    if (!node || viewport.classList.contains("is-dragging")) { tooltip.hidden = true; return; }
    const rect = viewport.getBoundingClientRect();
    fillMapaTooltip(tooltip, node);
    // Abajo a la derecha del cursor; si no cabe, a la izquierda o encima.
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    placeMapaTooltip(viewport, tooltip, x + 14, y + 14, x - 14, y - 14);
  });
  viewport.addEventListener("mouseleave", () => { tooltip.hidden = true; });

  // El viewport cambia de tamaño con la ventana y cuando el panel pasa debajo del mapa: se vuelve a centrar.
  if ("ResizeObserver" in window) new ResizeObserver(() => applyMapaTransform()).observe(viewport);
}

window.addEventListener("resize", applyMapaTransform);

let mapaRequest = null; // se reutiliza para no volver a pedir /api/skills en cada apertura

function loadMapa() {
  if (mapaRequest) return mapaRequest;
  const container = document.getElementById("mapa-content");
  container.innerHTML = `<p class="text-sm text-muted-page">Cargando tu mapa de habilidades…</p>`;

  mapaRequest = (async () => {
    try {
      // Las estadísticas solo alimentan la nota del panel: si fallan, el mapa se muestra igual.
      const [skills, jobStats] = await Promise.all([fetchSkills(), fetchJobStats().catch(() => null)]);
      mapaSkills = skills;
      mapaJobStats = jobStats;
      container.innerHTML = renderMapa(skills);
      mapaNeedsFit = true;
      bindMapaEvents();
      applyMapaTransform();
    } catch (err) {
      mapaRequest = null; // si falla, se reintenta la próxima vez que se abra la vista
      container.innerHTML = renderApiError(err);
    }
  })();
  return mapaRequest;
}

// ---------- Navegación ----------

// Indicador del nav: píldora con el gradiente de acción que se desliza (transform + width) hasta el ítem activo.
// El primer posicionado no se anima; con animaciones reducidas el CSS quita la transición y salta directo.
// En Ajustes (fuera del nav) ningún ítem está activo y el indicador se oculta.
function positionNavIndicator() {
  const nav = document.querySelector(".topnav");
  if (!nav) return;
  const active = nav.querySelector(".nav-item.active");
  nav.classList.toggle("has-active", Boolean(active));
  if (!active) return;
  const indicator = nav.querySelector(".topnav-indicator");
  indicator.style.width = `${active.offsetWidth}px`;
  indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  if (!nav.classList.contains("is-ready")) {
    void indicator.offsetWidth; // fija la posición inicial antes de activar la transición
    nav.classList.add("is-ready");
  }
  // Nav con scroll horizontal (pantallas angostas): el ítem activo siempre a la vista
  if (nav.scrollWidth > nav.clientWidth) active.scrollIntoView({ block: "nearest", inline: "nearest" });
}

// Navegación sin router: muestra la sección elegida, oculta las demás y marca el item activo (nav o botón Ajustes).
function showView(view) {
  document.querySelectorAll("main > section[id^='view-']").forEach(section => {
    section.classList.toggle("hidden", section.id !== `view-${view}`);
  });
  document.querySelectorAll(".nav-item[data-view], .topbar-settings[data-view]").forEach(item => {
    const isActive = item.dataset.view === view;
    item.classList.toggle("active", isActive);
    if (isActive) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  positionNavIndicator();
  // Si la carga terminó mientras la vista estaba oculta, se centra al volver a mostrarla; la ruta sigue al objetivo activo.
  if (view === "mapa") loadMapa().then(() => { applyMapaTransform(); updateMapaRoute(); });
  if (view === "objetivo") openObjetivo(); // definido en objetivo.js
  if (view === "perfil") openPerfil();     // definido en perfil.js
  if (view === "ajustes") openAjustes();   // definido en ajustes.js
}

document.querySelectorAll(".nav-item[data-view], .topbar-settings[data-view]").forEach(item => {
  item.addEventListener("click", () => showView(item.dataset.view));
});

// Indicador: al cargar, cuando llega la fuente (cambia el ancho de los ítems) y cuando el nav cambia de tamaño
// (redimensionar, paso a solo íconos).
positionNavIndicator();
document.fonts?.ready.then(positionNavIndicator);
window.addEventListener("resize", positionNavIndicator);
if ("ResizeObserver" in window) {
  const nav = document.querySelector(".topnav");
  if (nav) new ResizeObserver(positionNavIndicator).observe(nav);
}
