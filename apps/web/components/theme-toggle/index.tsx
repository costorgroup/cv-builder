"use client";

import { useTheme } from "@costor/ui";
import { MoonIcon, SunIcon } from "./icons";
import { SThemeToggle } from "./styles";
import type { TThemeToggleProps } from "./types";

export const ThemeToggle = (props: TThemeToggleProps) => {
  const { mode, setAppearance } = useTheme();
  const isDark = mode === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <SThemeToggle
      variant="ghost"
      aria-label={label}
      title={label}
      {...props}
      onClick={() => setAppearance(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </SThemeToggle>
  );
};

export type { TThemeToggleProps };
