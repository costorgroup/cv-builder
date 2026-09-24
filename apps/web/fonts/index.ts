import {
  Inter,
  Lato,
  Merriweather,
  Montserrat,
  Playfair_Display,
  Roboto,
} from "next/font/google";

// next/font needs literal options, so every font is declared on its own.
const inter = Inter({ subsets: ["latin"], variable: "--font-cv-inter" });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-cv-roboto" });
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-cv-lato",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-cv-montserrat",
});
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-cv-merriweather",
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-cv-playfair-display",
});

export type TCvFont = {
  id: string;
  name: string;
  /** CSS `font-family` value. */
  family: string;
};

export const cvFonts: [TCvFont, ...TCvFont[]] = [
  { id: "inter", name: "Inter", family: `var(--font-cv-inter), sans-serif` },
  { id: "roboto", name: "Roboto", family: `var(--font-cv-roboto), sans-serif` },
  { id: "lato", name: "Lato", family: `var(--font-cv-lato), sans-serif` },
  {
    id: "montserrat",
    name: "Montserrat",
    family: `var(--font-cv-montserrat), sans-serif`,
  },
  {
    id: "merriweather",
    name: "Merriweather",
    family: `var(--font-cv-merriweather), serif`,
  },
  {
    id: "playfair-display",
    name: "Playfair Display",
    family: `var(--font-cv-playfair-display), serif`,
  },
];

export const findCvFont = (id?: string): TCvFont =>
  cvFonts.find((font) => font.id === id) ?? cvFonts[0];

/** Class names that define the `--font-cv-*` variables; set on `<html>`. */
export const cvFontVariables = [
  inter,
  roboto,
  lato,
  montserrat,
  merriweather,
  playfairDisplay,
]
  .map((font) => font.variable)
  .join(" ");
