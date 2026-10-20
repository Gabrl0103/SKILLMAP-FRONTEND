// Marca Cenit: estrella de brújula de 4 puntas. La punta de arriba es la más larga: el norte, el cenit de la carrera.
// Única definición del logo; la usan la barra superior, la Introducción y Acceso (index.html, con data-brand-mark) y el
// CV imprimible (perfil.js). El favicon (assets/cenit-star.svg) repite la misma figura con colores fijos porque un archivo
// aparte no lee los tokens del tema. Estilos en la sección "Marca" de styles.css.
// La estrella es el path .brand-star (transform-box y transform-origin ya puestos) para poder animarla más adelante.

const BRAND_NAME = "Cenit";
// viewBox 24×24, centro en (12,13): arriba 12, abajo 10 y a los lados 8, con los flancos curvados hacia dentro
const BRAND_STAR_PATH = "M12 1Q14.2 10.8 20 13Q14.2 15.2 12 23Q9.8 15.2 4 13Q9.8 10.8 12 1Z";

// Cada SVG necesita su propio id de degradado (el logo aparece varias veces en el DOM)
let brandMarkCount = 0;

// Logo decorativo (aria-hidden): siempre va junto al nombre "Cenit", que es el texto que se lee
function brandMark(size = 32) {
  const id = `brand-grad-${++brandMarkCount}`;
  return `<svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="brand-stop-from"/><stop offset="1" class="brand-stop-to"/></linearGradient></defs>
    <path class="brand-star" d="${BRAND_STAR_PATH}" fill="url(#${id})"/>
  </svg>`;
}

// Marcas estáticas de index.html: data-brand-mark lleva el tamaño en px
document.querySelectorAll("[data-brand-mark]").forEach(el => {
  el.innerHTML = brandMark(Number(el.dataset.brandMark) || 32);
});
