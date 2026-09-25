import { SCreateCvMenuIcon } from "@/components/create-cv-menu/styles";

/** @costor/ui has no plus icon yet. */
export const PlusIcon = () => (
  <SCreateCvMenuIcon
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M12 5v14M5 12h14" />
  </SCreateCvMenuIcon>
);
