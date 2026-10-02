"use client";

import { Global, type Theme } from "@emotion/react";
import { dataTableClasses } from "@costor/ui";

/**
 * Our fixes on top of @costor/ui's global styles.
 *
 * A DataTable's card is padded by its size, so compact (`sm`) tables got
 * half the padding of the other cards. They keep compact rows, but their
 * card is padded like SettingsCard.
 */
const styles = (theme: Theme) => ({
  // Doubled to beat the card's own `--card-spacing`.
  [`.${dataTableClasses.root}.${dataTableClasses.root}`]: {
    "--card-spacing": theme.spacing(6),
    [theme.breakpoints.down("sm")]: {
      "--card-spacing": theme.spacing(4),
    },
  },
});

export const AppGlobalStyles = () => <Global styles={styles} />;

export default AppGlobalStyles;
