import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import AppearancePage from "@/views/appearance-page";
import CertificatesPage from "@/views/certificates-page";
import EducationPage from "@/views/education-page";
import InterestsPage from "@/views/interests-page";
import LanguagesPage from "@/views/languages-page";
import PersonalInformationPage from "@/views/personal-information-page";
import ProjectsPage from "@/views/projects-page";
import SkillsPage from "@/views/skills-page";
import SocialMediaPage from "@/views/social-media-page";
import TemplatesPage from "@/views/templates-page";
import WorkExperiencePage from "@/views/work-experience-page";
import { isCvEditorStep, type TCvEditorStep } from "@/utils/cv-editor";
import type { TCvEditorStepPageProps } from "@/views/cv-editor-step-page/types";

const STEP_PAGES: Record<TCvEditorStep, ComponentType> = {
  templates: TemplatesPage,
  appearance: AppearancePage,
  "personal-information": PersonalInformationPage,
  "social-media": SocialMediaPage,
  "work-experience": WorkExperiencePage,
  education: EducationPage,
  skills: SkillsPage,
  languages: LanguagesPage,
  projects: ProjectsPage,
  certificates: CertificatesPage,
  interests: InterestsPage,
};

/** The form for one editor step; 404 for an unknown step. */
const CvEditorStepPage = ({ step }: TCvEditorStepPageProps) => {
  if (!isCvEditorStep(step)) notFound();
  const StepPage = STEP_PAGES[step];
  return <StepPage />;
};

export default CvEditorStepPage;
