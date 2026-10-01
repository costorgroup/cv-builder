import type { TTemplateSpec } from "./types.js";

export const elegantTemplateSpec = {
  id: "elegant",
  name: "Elegant",
  defaultFontId: "playfair-display",
  colorSchemes: [
    {
      id: "champagne",
      name: "Champagne",
      colors: {
        background: "#fdfbf6",
        text: "#2e2a24",
        accent: "#b08d57",
        frame: "#d8c3a0",
      },
    },
    {
      id: "midnight",
      name: "Midnight",
      colors: {
        background: "#141a2a",
        text: "#e8e6df",
        accent: "#d4b56a",
        frame: "#d4b56a",
      },
    },
    {
      id: "blush",
      name: "Blush",
      colors: {
        background: "#fff9f8",
        text: "#3b2a2c",
        accent: "#b76e79",
        frame: "#e8c4c8",
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
          size: { value: 30, min: 22, max: 40 },
        },
        { id: "body", label: "Body", size: { value: 70 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
