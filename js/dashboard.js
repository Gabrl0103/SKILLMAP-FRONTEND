const API_BASE_URL = "http://localhost:8080";

// Mapea el enum de Java (MASTERED/IN_PROGRESS/PENDING) al atributo que espera <skill-card>.
function toCardStatus(backendStatus) {
  return { MASTERED: "mastered", IN_PROGRESS: "progress", PENDING: "pending" }[backendStatus] || "pending";
}

function renderGauge(score, mastered, total) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return `
    <div class="card p-6 flex flex-col items-center justify-center">
      <p class="text-[11px] text-gray-400 mb-3">NIVEL DE PREPARACIÓN</p>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke-width="10" class="gauge-track"/>
        <circle cx="70" cy="70" r="54" fill="none" stroke-width="10" class="gauge-fill" stroke-linecap="round"
          transform="rotate(-90 70 70)" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        <text x="70" y="66" text-anchor="middle" font-size="28" font-weight="600" fill="#27272a">${score}%</text>
        <text x="70" y="86" text-anchor="middle" font-size="10" fill="#9ca3af">LISTO</text>
      </svg>
      <p class="text-xs text-gray-400 mt-3">${mastered} de ${total} habilidades dominadas</p>
    </div>`;
}

function renderBrechas(gaps) {
  const brechas = gaps.slice(0, 5); // la API ya las manda ordenadas por demanda

  const rows = brechas.length
    ? brechas.map(s => `<skill-card name="${s.name}" status="${toCardStatus(s.status)}" demand="${s.demandPercentage}"></skill-card>`).join("")
    : `<p class="text-sm text-gray-400">Sin brechas pendientes — todo dominado 🎉</p>`;

  return `
    <div class="card p-6">
      <p class="text-[11px] text-gray-400 mb-4">BRECHAS PRIORITARIAS</p>
      <div class="flex flex-col gap-2">${rows}</div>
    </div>`;
}

function renderCta(topGap) {
  if (!topGap) return "";
  return `
    <div class="card p-6 md:col-span-2" style="background:#D95F8E; color:#fff;">
      <p class="text-[11px] opacity-80 mb-1">PRÓXIMA ACCIÓN RECOMENDADA</p>
      <p class="font-semibold">Enfócate en ${topGap.name}</p>
      <p class="text-sm opacity-90 mt-1">Es la habilidad pendiente con más demanda en el mercado (${topGap.demandPercentage}%).</p>
    </div>`;
}

async function loadDashboard() {
  const container = document.getElementById("app-content");
  try {
    const goalId = 1; // por ahora fijo; luego lo elegirá el GoalSelector
    const res = await fetch(`${API_BASE_URL}/api/goals/${goalId}/readiness`);
    if (!res.ok) throw new Error("La API respondió " + res.status);
    const r = await res.json();

    document.getElementById("goal-title").textContent = r.goalTitle;
    container.innerHTML =
      renderGauge(r.readinessPercentage, r.masteredCount, r.totalCount) +
      renderBrechas(r.gaps) +
      renderCta(r.gaps[0]);
  } catch (err) {
    container.innerHTML = `
      <div class="card p-6 md:col-span-2 border border-dashed" style="border-color:#D95F8E;">
        <p class="text-sm font-medium text-gray-700">No se pudo conectar con la API</p>
        <p class="text-xs text-gray-400 mt-1">Verifica que el backend esté corriendo en <code>${API_BASE_URL}</code>
        (<code>./mvnw spring-boot:run</code> desde skillmap-api).</p>
        <p class="text-xs text-gray-300 mt-2">Detalle técnico: ${err.message}</p>
      </div>`;
  }
}

loadDashboard();
