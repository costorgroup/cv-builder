import { EmbedLayout } from "@/layouts";

/** The embedded builder: its own shell, no site chrome or account. */
export default async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ publicKey: string }>;
}) => (
  <EmbedLayout publicKey={(await params).publicKey}>{children}</EmbedLayout>
);
