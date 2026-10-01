import type { TTemplateSpec } from "./types.js";

export const creativeTemplateSpec = {
  id: "creative",
  name: "Creative",
  defaultFontId: "playfair-display",
  colorSchemes: [
    {
      id: "coral",
      name: "Coral",
      colors: {
        background: "#fffaf7",
        text: "#2d1f1a",
        strip: "#e2574c",
        stripText: "#fff4ef",
        accent: "#ffd166",
      },
    },
    {
      id: "violet",
      name: "Violet",
      colors: {
        background: "#fbfaff",
        text: "#221d33",
        strip: "#5b3cc4",
        stripText: "#f3f0ff",
        accent: "#f472b6",
      },
    },
    {
      id: "mustard",
      name: "Mustard",
      colors: {
        background: "#fffdf5",
        text: "#29251a",
        strip: "#d99a0b",
        stripText: "#1f1a0e",
        accent: "#1f1a0e",
      },
    },
    {
      id: "teal",
      name: "Teal",
      colors: {
        background: "#f7fdfc",
        text: "#15302c",
        strip: "#0f766e",
        stripText: "#f0fdfa",
        accent: "#fb923c",
      },
    },
    {
      id: "rose",
      name: "Rose",
      colors: {
        background: "#fff8f9",
        text: "#3a1f27",
        strip: "#be185d",
        stripText: "#fff1f5",
        accent: "#fda4af",
      },
    },
  ],
  groups: [
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        { id: "strip", label: "Strip", size: { value: 36, min: 28, max: 46 } },
        { id: "main", label: "Main", size: { value: 64 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
