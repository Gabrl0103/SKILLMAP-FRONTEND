// Fondo con patrón de las vistas (.bg-pattern en index.html, estilos en "Fondo con patrón" de styles.css): el halo que
// sigue al cursor. El patrón y sus colores son del CSS (cambian solos con el tema); aquí solo se mueve el halo.
// - Un solo listener global de pointermove, pasivo: guarda la posición y pide un cuadro (requestAnimationFrame). Cada
//   cuadro acerca el halo al puntero con una fracción fija de la distancia (llega rápido y frena al final, como
//   --ease-out) y se detiene cuando ya llegó: con el cursor quieto no hay bucle.
// - Solo transform: el halo va a (x - r, y - r) y su contenido a -(x - r, y - r), así el patrón queda alineado con la
//   base. Nada de layout ni repintado.
// - Se apaga (fundido) cuando el puntero sale de la ventana, la ventana pierde el foco, la pestaña se oculta, con un
//   botón apretado (arrastrar el Mapa, seleccionar texto), sobre el lienzo del Mapa (tiene su propia rejilla) y con la
//   Introducción o Acceso abiertos. Con movimiento reducido (prefersReducedMotion, theme.js) o sin ratón no se usa;
//   el CSS además lo oculta.

(() => {
  const layer = document.querySelector(".bg-pattern");
  const glow = layer && layer.querySelector(".bg-pattern-glow");
  const inner = glow && glow.querySelector(".bg-pattern-glow-in");
  if (!inner) return;

  const FOLLOW = 0.28;                 // fracción de la distancia que recorre el halo en cada cuadro
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const target = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  let radius = 0;
  let frame = 0;
  let lit = false;
  let enabled = false;

  function covered() {
    const root = document.documentElement;
    return root.getAttribute("data-intro") === "open" || root.getAttribute("data-acceso") === "open";
  }

  function place() {
    const x = Math.round(pos.x - radius);
    const y = Math.round(pos.y - radius);
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    inner.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function tick() {
    frame = 0;
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) { pos.x = target.x; pos.y = target.y; place(); return; }
    pos.x += dx * FOLLOW;
    pos.y += dy * FOLLOW;
    place();
    frame = requestAnimationFrame(tick);
  }

  function setLit(on) {
    if (lit === on) return;
    lit = on;
    layer.classList.toggle("is-lit", on);
  }

  function dim() {
    setLit(false);
    stop();
  }

  function onMove(event) {
    if (!enabled || event.pointerType === "touch") return;
    if (event.buttons || covered() || (event.target instanceof Element && event.target.closest(".mapa-card"))) { dim(); return; }
    target.x = event.clientX;
    target.y = event.clientY;
    if (!lit) {
      // Aparece donde está el puntero (sin barrido desde la última posición) y se funde
      radius = glow.offsetWidth / 2;
      pos.x = target.x;
      pos.y = target.y;
      place();
      setLit(true);
      return;
    }
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function sync() {
    enabled = finePointer.matches && !prefersReducedMotion();
    if (!enabled) dim();
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerout", event => { if (!event.relatedTarget) dim(); }); // salió de la ventana
  window.addEventListener("blur", dim);
  document.addEventListener("visibilitychange", () => { if (document.hidden) dim(); });
  document.addEventListener("skillmap:settings", sync);   // "Reducir animaciones" de Ajustes (theme.js)
  reducedQuery.addEventListener("change", sync);
  finePointer.addEventListener("change", sync);
  sync();
})();
