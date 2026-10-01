import type { TTemplateSpec } from "./types.js";

export const techTemplateSpec = {
  id: "tech",
  name: "Tech",
  defaultFontId: "roboto",
  colorSchemes: [
    {
      id: "terminal",
      name: "Terminal",
      colors: {
        background: "#0d1117",
        text: "#e6edf3",
        sidebar: "#161b22",
        muted: "#7d8590",
        accent: "#3fb950",
      },
    },
    {
      id: "dracula",
      name: "Dracula",
      colors: {
        background: "#282a36",
        text: "#f8f8f2",
        sidebar: "#21222c",
        muted: "#6272a4",
        accent: "#bd93f9",
      },
    },
    {
      id: "solarized",
      name: "Solarized",
      colors: {
        background: "#fdf6e3",
        text: "#073642",
        sidebar: "#eee8d5",
        muted: "#93a1a1",
        accent: "#268bd2",
      },
    },
  ],
  groups: [
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        {
          id: "sidebar",
          label: "Sidebar",
          size: { value: 32, min: 24, max: 40 },
        },
        { id: "main", label: "Main", size: { value: 68 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
