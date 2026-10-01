import type { TTemplateSpec } from "./types.js";

export const defaultTemplateSpec = {
  id: "default",
  name: "Default",
  defaultFontId: "inter",
  colorSchemes: [
    {
      id: "navy",
      name: "Navy",
      colors: {
        background: "#ffffff",
        text: "#1f2937",
        sidebar: "#1e3a5f",
        sidebarText: "#f8fafc",
        accent: "#60a5fa",
      },
    },
    {
      id: "forest",
      name: "Forest",
      colors: {
        background: "#ffffff",
        text: "#1c2a22",
        sidebar: "#1f4d3a",
        sidebarText: "#f0fdf4",
        accent: "#86c9a4",
      },
    },
    {
      id: "burgundy",
      name: "Burgundy",
      colors: {
        background: "#fffdfb",
        text: "#2b1b1e",
        sidebar: "#6b1f2e",
        sidebarText: "#fff1f2",
        accent: "#f2a7b4",
      },
    },
    {
      id: "graphite",
      name: "Graphite",
      colors: {
        background: "#ffffff",
        text: "#262626",
        sidebar: "#2d2d2d",
        sidebarText: "#fafafa",
        accent: "#f59e0b",
      },
    },
  ],
  groups: [
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        { id: "left", label: "Left", size: { value: 40, min: 30, max: 50 } },
        { id: "right", label: "Right", size: { value: 60 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
