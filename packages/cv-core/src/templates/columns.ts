import type { TTemplateSpec } from "./types.js";

export const columnsTemplateSpec = {
  id: "columns",
  name: "Columns",
  defaultFontId: "inter",
  colorSchemes: [
    {
      id: "nordic",
      name: "Nordic",
      colors: {
        background: "#ffffff",
        text: "#1f2a37",
        header: "#243b53",
        headerText: "#f0f4f8",
        accent: "#829ab1",
      },
    },
    {
      id: "sand",
      name: "Sand",
      colors: {
        background: "#fdfbf7",
        text: "#3d3426",
        header: "#e7dcc8",
        headerText: "#3d3426",
        accent: "#b08d57",
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
          id: "profile",
          label: "Profile",
          size: { value: 38, min: 28, max: 46 },
        },
        {
          id: "contact",
          label: "Contact",
          size: { value: 32, min: 22, max: 40 },
        },
        { id: "links", label: "Links", size: { value: 30, min: 20, max: 40 } },
      ],
    },
  ],
} satisfies TTemplateSpec;
