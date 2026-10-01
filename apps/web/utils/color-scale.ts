import type { TThemeAccent } from "@costor/ui";

type TColorScale = TThemeAccent["palette"]["primary"];

const channels = (hex: string) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

const toHex = (values: number[]) =>
  `#${values
    .map((value) =>
      Math.round(Math.min(255, Math.max(0, value)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/** `hex` moved `amount` (0–1) of the way to `target`. */
const mix = (hex: string, target: number, amount: number) =>
  toHex(channels(hex).map((value) => value + (target - value) * amount));

/** Black or white, whichever reads better on `hex`. */
const contrastOn = (hex: string) => {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
  return luminance > 0.4 ? "#000000" : "#ffffff";
};

/**
 * A theme color scale from one color, e.g. an embed's brand color: lighter
 * and darker steps, and readable text on it. Hex throughout, since styles
 * add alpha to it.
 */
export const colorScaleOf = (hex: string): TColorScale => ({
  lighter: mix(hex, 255, 0.6),
  light: mix(hex, 255, 0.3),
  main: hex.toLowerCase(),
  dark: mix(hex, 0, 0.2),
  darker: mix(hex, 0, 0.4),
  contrastText: contrastOn(hex),
});
