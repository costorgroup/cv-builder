import {
  Inter,
  Lato,
  Merriweather,
  Montserrat,
  Playfair_Display,
  Roboto,
} from "next/font/google";
import { CV_FONTS, type TCvFontSpec } from "@repo/cv-core";

// next/font needs literal options, so every font is declared on its own.
// Each `variable` must be `--font-cv-<id>` for its id in `CV_FONTS`.
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

const toCvFont = ({ id, name, generic }: TCvFontSpec): TCvFont => ({
  id,
  name,
  family: `var(--font-cv-${id}), ${generic}`,
});

/** `CV_FONTS` from `@repo/cv-core`, with the CSS to use each one. */
export const cvFonts: [TCvFont, ...TCvFont[]] = [
  toCvFont(CV_FONTS[0]),
  ...CV_FONTS.slice(1).map(toCvFont),
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
