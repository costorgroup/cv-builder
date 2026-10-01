import type { TTemplateSpec } from "./types.js";

export const timelineTemplateSpec = {
  id: "timeline",
  name: "Timeline",
  defaultFontId: "montserrat",
  colorSchemes: [
    {
      id: "azure",
      name: "Azure",
      colors: {
        background: "#ffffff",
        text: "#1f2937",
        header: "#1d4ed8",
        headerText: "#eff6ff",
        accent: "#2563eb",
        line: "#bfdbfe",
      },
    },
    {
      id: "graphite",
      name: "Graphite",
      colors: {
        background: "#ffffff",
        text: "#27272a",
        header: "#3f3f46",
        headerText: "#fafafa",
        accent: "#52525b",
        line: "#d4d4d8",
      },
    },
    {
      id: "plum",
      name: "Plum",
      colors: {
        background: "#fffbfe",
        text: "#2e1f2c",
        header: "#6b2160",
        headerText: "#fdf2fa",
        accent: "#a21caf",
        line: "#f0c5e9",
      },
    },
    {
      id: "olive",
      name: "Olive",
      colors: {
        background: "#fcfcf7",
        text: "#2a2d1f",
        header: "#4d5b23",
        headerText: "#f7f9ec",
        accent: "#65a30d",
        line: "#d9e5b6",
      },
    },
  ],
  groups: [
    {
      id: "rows",
      label: "Rows",
      direction: "vertical",
      sections: [
        {
          id: "header",
          label: "Header",
          size: { value: 22, min: 15, max: 30 },
        },
        { id: "body", label: "Body", size: { value: 78 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
