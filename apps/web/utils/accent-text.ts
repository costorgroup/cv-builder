import type { Theme } from "@emotion/react";

/** Primary color for text; the lighter shade in dark mode so it stays readable. */
export const accentText = (theme: Theme) =>
  theme.mode === "dark" ? theme.palette.primary.light : theme.palette.primary.main;
