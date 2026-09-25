import { redirect } from "next/navigation";
import { cvEditorStepPath } from "@/utils/cv-editor";

export default () => redirect(cvEditorStepPath());
