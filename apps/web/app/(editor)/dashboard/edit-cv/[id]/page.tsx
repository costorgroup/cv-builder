import { redirect } from "next/navigation";
import { cvEditorStepPath } from "@/utils/cv-editor";

export default async ({ params }: { params: Promise<{ id: string }> }) =>
  redirect(cvEditorStepPath((await params).id));
