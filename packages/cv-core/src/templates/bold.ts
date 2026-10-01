import type { TTemplateSpec } from "./types.js";

export const boldTemplateSpec = {
  id: "bold",
  name: "Bold",
  defaultFontId: "inter",
  colorSchemes: [
    {
      id: "electric",
      name: "Electric",
      colors: {
        background: "#ffffff",
        text: "#0a0a0a",
        hero: "#2f3cff",
        heroText: "#ffffff",
      },
    },
    {
      id: "lime",
      name: "Lime",
      colors: {
        background: "#ffffff",
        text: "#111111",
        hero: "#c6f432",
        heroText: "#111111",
      },
    },
    {
      id: "tomato",
      name: "Tomato",
      colors: {
        background: "#fffaf8",
        text: "#1c1210",
        hero: "#f0452b",
        heroText: "#fff5f2",
      },
    },
    {
      id: "noir",
      name: "Noir",
      colors: {
        background: "#ffffff",
        text: "#0a0a0a",
        hero: "#0a0a0a",
        heroText: "#ffffff",
      },
    },
  ],
  groups: [
    {
      id: "rows",
      label: "Rows",
      direction: "vertical",
      sections: [
        { id: "hero", label: "Hero", size: { value: 36, min: 26, max: 46 } },
        { id: "body", label: "Body", size: { value: 64 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
