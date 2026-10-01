export type TCvFontSpec = {
  id: string;
  name: string;
  /** Generic family to fall back on while (or if) the font doesn't load. */
  generic: "sans-serif" | "serif";
};

/**
 * Fonts a CV can use; the first is the default. The web app loads each one
 * into the `--font-cv-<id>` CSS variable.
 */
export const CV_FONTS: [TCvFontSpec, ...TCvFontSpec[]] = [
  { id: "inter", name: "Inter", generic: "sans-serif" },
  { id: "roboto", name: "Roboto", generic: "sans-serif" },
  { id: "lato", name: "Lato", generic: "sans-serif" },
  { id: "montserrat", name: "Montserrat", generic: "sans-serif" },
  { id: "merriweather", name: "Merriweather", generic: "serif" },
  { id: "playfair-display", name: "Playfair Display", generic: "serif" },
];
