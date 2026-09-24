import type {
  TCvData,
  TCvListKey,
  TCvObjectKey,
} from "@/providers/cv-provider/types";

/**
 * Shown in the CV preview while a required field is still empty. The form
 * inputs themselves stay empty.
 */
export const cvPlaceholderData: {
  [K in TCvObjectKey]?: Partial<TCvData[K]>;
} = {
  personalInformation: {
    firstName: "John",
    lastName: "Doe",
    aboutMe:
      "Motivated professional with a passion for solving problems and building great products. Quick learner, strong communicator and reliable team player.",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, New York, NY 10001",
  },
};

/** Sample entries shown in the preview while a list is still empty. */
export const cvPlaceholderLists: { [K in TCvListKey]: TCvData[K] } = {
  workExperience: [
    {
      id: "placeholder-work-1",
      position: "Senior Product Designer",
      company: "Acme Inc.",
      location: "New York, NY",
      startDate: "2021-03",
      endDate: "",
      current: true,
      description:
        "Lead the design of the core product, working closely with engineering and research to ship features used by millions.",
    },
    {
      id: "placeholder-work-2",
      position: "Product Designer",
      company: "Globex",
      location: "Boston, MA",
      startDate: "2018-06",
      endDate: "2021-02",
      current: false,
      description:
        "Designed onboarding and billing flows and built the company's first design system.",
    },
  ],
  education: [
    {
      id: "placeholder-education-1",
      degree: "BSc Computer Science",
      institution: "State University",
      location: "Boston, MA",
      startDate: "2014-09",
      endDate: "2018-06",
      current: false,
      description: "",
    },
  ],
  skills: [
    { id: "placeholder-skill-1", name: "Product Design", level: 5 },
    { id: "placeholder-skill-2", name: "Prototyping", level: 4 },
    { id: "placeholder-skill-3", name: "User Research", level: 4 },
    { id: "placeholder-skill-4", name: "HTML & CSS", level: 3 },
    { id: "placeholder-skill-5", name: "Leadership", level: 3 },
  ],
  languages: [
    { id: "placeholder-language-1", name: "English", level: 5 },
    { id: "placeholder-language-2", name: "Spanish", level: 3 },
  ],
  projects: [
    {
      id: "placeholder-project-1",
      name: "Open Design Kit",
      role: "Creator",
      url: "github.com/johndoe/odk",
      startDate: "2022-01",
      endDate: "",
      description: "An open-source UI kit used by 2,000+ designers.",
    },
  ],
  certificates: [
    {
      id: "placeholder-certificate-1",
      name: "Certified UX Professional",
      issuer: "UX Institute",
      date: "2020-05",
      url: "",
    },
  ],
};

/**
 * Fills every empty field that has a placeholder, and every empty list with
 * its sample entries.
 */
export const withCvPlaceholders = (data: TCvData): TCvData => {
  const result = { ...data };

  for (const key of Object.keys(cvPlaceholderData) as TCvObjectKey[]) {
    const placeholders: Record<string, string> = cvPlaceholderData[key] ?? {};
    const section: Record<string, string> = { ...data[key] };
    for (const [field, placeholder] of Object.entries(placeholders)) {
      if (!section[field]?.trim()) section[field] = placeholder;
    }
    result[key] = section as never;
  }

  for (const key of Object.keys(cvPlaceholderLists) as TCvListKey[]) {
    if (data[key].length === 0) result[key] = cvPlaceholderLists[key] as never;
  }

  return result;
};
