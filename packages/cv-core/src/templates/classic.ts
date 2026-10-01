import type { TTemplateSpec } from "./types.js";

export const classicTemplateSpec = {
  id: "classic",
  name: "Classic",
  defaultFontId: "merriweather",
  colorSchemes: [
    {
      id: "ink",
      name: "Ink",
      colors: { background: "#ffffff", text: "#111827", accent: "#1e3a8a" },
    },
    {
      id: "sepia",
      name: "Sepia",
      colors: { background: "#fbf7ef", text: "#3b2f24", accent: "#8b5e34" },
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
          size: { value: 24, min: 16, max: 34 },
        },
        { id: "body", label: "Body", size: { value: 76 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
