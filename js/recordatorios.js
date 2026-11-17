// Recordatorios de escritorio (solo en Cenit.exe: el preload de cenit-desktop expone window.cenitDesktop.desktop).
// - Ajustes > Recordatorios (por cuenta): notificaciones sí/no y hora del aviso. Ajustes > Sistema (del equipo):
//   Iniciar con Windows y Minimizar a la bandeja. Todo lo guarda y valida main.js (desktop-settings.json); aquí solo se
//   pinta lo que devuelve. En el navegador estas dos categorías siguen ocultas.
// - Estado para los avisos: main.js decide CUÁNDO (reminders.js) y pide a la app el QUÉ con onReminderRequest. Se
//   calcula con la lógica de "Tu ritmo" (rachas.js): meta semanal, avance de esta semana y racha, más los textos ya
//   traducidos. No guarda nada: solo lee el registro de rachas.
// - Avisa a main.js de la cuenta abierta (setUser, también null al salir) y de cada avance (notifyChange). Clic en un
//   aviso: Mi Ruta.
// Usa sessionUser (session.js), getActiveGoalId, savedGoalId, fetchGoals y fetchGoalDemand (dashboard.js), readRitmo, updateRitmoWeeks y
// currentStreak (rachas.js), weekKey (plan-semanal.js), setStatus y selectAjustesCat (ajustes.js), showView (mapa.js) y
// t, tn y getLanguage (i18n.js).

const desktopApi = () => window.cenitDesktop?.desktop || null;

// Lo último que dijo main.js: { system: { background, openAtLogin }, reminders: { enabled, time, quietStart, quietEnd, … }, paused }
let desktopState = null;

// ---------- Estado para los avisos ----------

// null si no hay sesión, objetivo o habilidades (main.js entonces no avisa)
async function reminderSnapshot() {
  const user = sessionUser;
  if (!user) return null;
  // Mi Ruta pudo no haber cargado todavía (Cenit abierta en la bandeja): el objetivo guardado
  const goalId = getActiveGoalId() ?? savedGoalId(await fetchGoals());
  if (!goalId) return null;
  const { goalSkills, catalog } = await fetchGoalDemand(goalId);
  if (!catalog.length || sessionUser !== user) return null;
  const data = readRitmo();
  updateRitmoWeeks(data, goalSkills); // solo cuenta tu ruta, como la tarjeta
  const current = weekKey();
  const count = data.weeks[current].count;
  const goal = data.goal;
  const left = Math.max(0, goal - count);
  const streak = currentStreak(data, current);
  return {
    userId: String(user.id),
    goal,
    count,
    streak,
    texts: {
      weekly: { title: t("recordatorios.weekly.title"), body: tn("recordatorios.weekly.body", left) },
      streak: { title: tn("recordatorios.streak.title", streak), body: tn("recordatorios.streak.body", left) },
      met: { title: t("recordatorios.met.title"), body: tn("recordatorios.met.body", count) },
    },
  };
}

function notifyReminderChange() {
  desktopApi()?.notifyChange();
}

// ---------- Ajustes > Recordatorios y Sistema ----------

const TIME_STEP = 30; // como reminders.js: de media en media hora

function formatMinutes(minutes) {
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return new Intl.DateTimeFormat(getLanguage(), { hour: "numeric", minute: "2-digit" }).format(date);
}

// Solo horas fuera del silencio (si no, el aviso nunca saldría). La guardada se muestra aunque caiga dentro.
function renderTimeOptions(reminders) {
  const select = document.getElementById("ajustes-reminder-time");
  const { quietStart, quietEnd, time } = reminders;
  const quiet = h => quietStart !== quietEnd && (quietStart < quietEnd ? h >= quietStart && h < quietEnd : h >= quietStart || h < quietEnd);
  const options = [];
  for (let m = 0; m < 24 * 60; m += TIME_STEP) if (!quiet(Math.floor(m / 60)) || m === time) options.push(m);
  select.innerHTML = options.map(m => `<option value="${m}">${formatMinutes(m)}</option>`).join("");
  select.value = String(time);
}

function syncDesktopControls() {
  if (!desktopState) return;
  document.querySelectorAll("#view-ajustes [data-desktop]").forEach(button => {
    const [group, key] = button.dataset.desktop.split(".");
    button.setAttribute("aria-checked", String(Boolean(desktopState[group]?.[key])));
  });
  renderTimeOptions(desktopState.reminders);
  document.getElementById("ajustes-reminder-time").disabled = !desktopState.reminders.enabled;
}

const panelStatus = group => (group === "system" ? "ajustes-sistema-status" : "ajustes-recordatorios-status");

function showPausedNotice() {
  if (desktopState?.paused) setStatus("ajustes-recordatorios-status", t("ajustes.remindersPaused"));
}

async function loadDesktopSettings() {
  const api = desktopApi();
  if (!api) return;
  try {
    desktopState = await api.getSettings();
    if (!desktopState) throw new Error("forbidden");
    syncDesktopControls();
    setStatus("ajustes-recordatorios-status", "");
    setStatus("ajustes-sistema-status", "");
    showPausedNotice();
  } catch {
    ["ajustes-recordatorios-status", "ajustes-sistema-status"].forEach(id => setStatus(id, t("ajustes.desktopReadError"), "warning"));
  }
}

// Guarda un cambio y pinta lo que quedó (si falla, main.js devuelve el estado anterior)
async function saveDesktop(group, patch, control) {
  const api = desktopApi();
  if (!api || !desktopState) return;
  control.disabled = true;
  let result;
  try {
    result = group === "system" ? await api.setSystem(patch) : await api.setReminders(patch);
  } catch {
    result = { ok: false, error: "failed" };
  }
  if (result?.state) desktopState = result.state;
  control.disabled = false;
  syncDesktopControls();
  if (result?.ok) { setStatus(panelStatus(group), ""); showPausedNotice(); }
  else setStatus(panelStatus(group), t(result?.error === "login-item" ? "ajustes.loginItemError" : "ajustes.desktopError"), "warning");
}

function bindDesktopSettings() {
  document.querySelectorAll("#view-ajustes [data-desktop]").forEach(button => {
    button.addEventListener("click", () => {
      if (!desktopState || button.disabled) return;
      const [group, key] = button.dataset.desktop.split(".");
      saveDesktop(group, { [key]: !desktopState[group][key] }, button);
    });
  });
  const select = document.getElementById("ajustes-reminder-time");
  select.addEventListener("change", () => saveDesktop("reminders", { time: Number(select.value) }, select));
}

// ---------- Arranque ----------

function initRecordatorios() {
  const api = desktopApi();
  if (!api) return; // navegador: las categorías siguen ocultas
  document.querySelectorAll(".ajustes-nav [data-ajustes-cat='recordatorios'], .ajustes-nav [data-ajustes-cat='sistema']")
    .forEach(button => { button.hidden = false; });
  bindDesktopSettings();
  api.onReminderRequest(reminderSnapshot);
  api.onOpenRuta(() => { if (sessionUser) showView("dashboard"); });
  // Cada apertura de Ajustes vuelve a leer (openAjustes en ajustes.js llama a loadDesktopSettings): la bandeja pudo
  // pausar los avisos o Windows quitar el inicio automático
  if (sessionUser) api.setUser(sessionUser.id);
}

// Entra o sale una cuenta: los recordatorios (y su configuración) son de la cuenta abierta
document.addEventListener("skillmap:user", () => {
  const api = desktopApi();
  if (!api) return;
  desktopState = null;
  api.setUser(sessionUser ? sessionUser.id : null);
  if (sessionUser) loadDesktopSettings();
});

// Avance marcado o quitado, o roles propios cambiados: el estado guardado en main.js ya no vale
document.addEventListener("skillmap:progress", notifyReminderChange);
document.addEventListener("skillmap:catalog", notifyReminderChange);

// Otro idioma: las horas se vuelven a escribir y los avisos de estado se borran (eran del otro idioma)
document.addEventListener("skillmap:language", () => {
  if (!desktopApi()) return;
  syncDesktopControls();
  ["ajustes-recordatorios-status", "ajustes-sistema-status"].forEach(id => setStatus(id, ""));
  showPausedNotice();
});

document.addEventListener("DOMContentLoaded", initRecordatorios);
