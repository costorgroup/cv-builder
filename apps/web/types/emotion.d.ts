import "@emotion/react";
import type { TTheme } from "@costor/ui";

declare module "@emotion/react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Theme extends TTheme {}
}
