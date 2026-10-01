import { CvEditorStepPage } from "@/views";

export default async ({ params }: { params: Promise<{ step: string }> }) => (
  <CvEditorStepPage step={(await params).step} />
);
