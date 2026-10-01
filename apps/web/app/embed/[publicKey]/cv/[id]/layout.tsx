import { EmbedEditorLayout } from "@/layouts";

export default async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) => (
  <EmbedEditorLayout cvId={(await params).id}>{children}</EmbedEditorLayout>
);
