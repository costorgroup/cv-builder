import type { TTemplateSpec } from "./types.js";

export const minimalTemplateSpec = {
  id: "minimal",
  name: "Minimal",
  defaultFontId: "lato",
  colorSchemes: [
    {
      id: "mono",
      name: "Mono",
      colors: {
        background: "#ffffff",
        text: "#171717",
        muted: "#737373",
        accent: "#171717",
      },
    },
    {
      id: "blue-ink",
      name: "Blue Ink",
      colors: {
        background: "#ffffff",
        text: "#1e293b",
        muted: "#64748b",
        accent: "#2563eb",
      },
    },
    {
      id: "sage",
      name: "Sage",
      colors: {
        background: "#fafaf7",
        text: "#27302a",
        muted: "#6b7a6f",
        accent: "#5f8a6b",
      },
    },
    {
      id: "clay",
      name: "Clay",
      colors: {
        background: "#fdfaf7",
        text: "#3a2a22",
        muted: "#8c7466",
        accent: "#c2410c",
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
          id: "labels",
          label: "Labels",
          size: { value: 30, min: 22, max: 40 },
        },
        { id: "content", label: "Content", size: { value: 70 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
