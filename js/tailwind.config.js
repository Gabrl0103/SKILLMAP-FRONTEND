// Config de Tailwind (Play CDN 3.4.17 local, vendor/tailwind.js): se carga justo después del vendor.
// Los tokens apuntan a las variables de css/styles.css, así cambian solos con data-theme.
// Son var() sin canales RGB: los modificadores de opacidad (bg-card/50) no aplican.
tailwind.config = {
  theme: {
    extend: {
      colors: {
        bg: "var(--bg-solid)",
        card: { DEFAULT: "var(--surface)", solid: "var(--surface-solid)", border: "var(--card-border)" },
        ink: "var(--text)",
        muted: { DEFAULT: "var(--text-2)", page: "var(--text-2-page)" },
        mid: "var(--text-mid)",
        track: "var(--track)",
        divider: "var(--divider)",
        pink: { DEFAULT: "var(--pink)", ink: "var(--pink-ink)" },
        mint: { DEFAULT: "var(--mint)", ink: "var(--mint-ink)" },
        "chip-rosa": { DEFAULT: "var(--chip-rosa-bg)", fg: "var(--chip-rosa-fg)" },
        "chip-azul": { DEFAULT: "var(--chip-azul-bg)", fg: "var(--chip-azul-fg)" },
        "chip-violeta": { DEFAULT: "var(--chip-violeta-bg, var(--chip-rosa-bg))", fg: "var(--chip-violeta-fg, var(--chip-rosa-fg))" },
        focus: "var(--focus)",
      },
      backgroundImage: {
        action: "var(--action)",
        progress: "var(--progress-bg)",
        mastered: "var(--mastered-bg)",
        title: "var(--title-grad)",
      },
      boxShadow: {
        card: "var(--card-shadow)",
        action: "0 12px 24px var(--action-shadow-color)",
      },
      borderRadius: { card: "var(--radius-card)" },
      fontFamily: { sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"] },
      transitionTimingFunction: { out: "var(--ease-out)" },
    },
  },
};
