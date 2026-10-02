import type { ReactElement } from "react";
import { Small } from "@costor/ui";

// Tooltip re-measures (and sets state) whenever what `render` returns
// changes identity, so new content per render loops forever. Each label gets
// one render function that always returns the same element.
const navTooltips = new Map<string, () => ReactElement>();

/** A Tooltip `render` for an icon-only nav item's label. */
export const navTooltip = (label: string) => {
  let render = navTooltips.get(label);
  if (!render) {
    const content = <Small>{label}</Small>;
    render = () => content;
    navTooltips.set(label, render);
  }
  return render;
};

/** The tooltip's Panel, with only a sliver of padding around the label. */
export const NAV_TOOLTIP_PANEL = { style: { padding: "2px 8px" } };
