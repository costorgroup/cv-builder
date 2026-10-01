import type { TTemplateSpec } from "./types.js";

export const modernTemplateSpec = {
  id: "modern",
  name: "Modern",
  defaultFontId: "montserrat",
  colorSchemes: [
    {
      id: "ocean",
      name: "Ocean",
      colors: {
        background: "#ffffff",
        text: "#0f172a",
        sidebar: "#0e7490",
        sidebarText: "#ecfeff",
        accent: "#06b6d4",
      },
    },
    {
      id: "slate",
      name: "Slate",
      colors: {
        background: "#ffffff",
        text: "#1e293b",
        sidebar: "#e2e8f0",
        sidebarText: "#1e293b",
        accent: "#475569",
      },
    },
    {
      id: "sunset",
      name: "Sunset",
      colors: {
        background: "#fffbf5",
        text: "#292524",
        sidebar: "#9a3412",
        sidebarText: "#fff7ed",
        accent: "#f97316",
      },
    },
  ],
  groups: [
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        { id: "main", label: "Main", size: { value: 64, min: 55, max: 72 } },
        { id: "sidebar", label: "Sidebar", size: { value: 36 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
