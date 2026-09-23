import { cookies } from "next/headers";
import type { TThemeAppearance } from "@costor/ui";

// Must match the ThemeProvider's cookie (its default storage key).
export const THEME_COOKIE = "cui-theme";

const APPEARANCES: TThemeAppearance[] = ["light", "dark", "auto"];

const isAppearance = (value: unknown): value is TThemeAppearance =>
  APPEARANCES.includes(value as TThemeAppearance);

// Reads the appearance saved by the ThemeProvider so the server renders
// the same theme the client will hydrate with.
export const getThemeAppearance = async (): Promise<
  TThemeAppearance | undefined
> => {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  if (!value) return undefined;

  try {
    const { appearance } = JSON.parse(decodeURIComponent(value));
    return isAppearance(appearance) ? appearance : undefined;
  } catch {
    return undefined;
  }
};
