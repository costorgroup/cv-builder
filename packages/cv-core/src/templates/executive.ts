import type { TTemplateSpec } from "./types.js";

export const executiveTemplateSpec = {
  id: "executive",
  name: "Executive",
  defaultFontId: "roboto",
  colorSchemes: [
    {
      id: "corporate",
      name: "Corporate",
      colors: {
        background: "#ffffff",
        text: "#1f2937",
        header: "#1e293b",
        headerText: "#f8fafc",
        aside: "#f1f5f9",
        accent: "#3b82f6",
      },
    },
    {
      id: "charcoal",
      name: "Charcoal",
      colors: {
        background: "#ffffff",
        text: "#262626",
        header: "#262626",
        headerText: "#fafafa",
        aside: "#f5f5f4",
        accent: "#d4a017",
      },
    },
    {
      id: "emerald",
      name: "Emerald",
      colors: {
        background: "#ffffff",
        text: "#1c2b24",
        header: "#065f46",
        headerText: "#ecfdf5",
        aside: "#ecfdf5",
        accent: "#10b981",
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
          size: { value: 26, min: 18, max: 36 },
        },
        { id: "body", label: "Body", size: { value: 74 } },
      ],
    },
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        { id: "aside", label: "Aside", size: { value: 34, min: 26, max: 44 } },
        { id: "main", label: "Main", size: { value: 66 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
