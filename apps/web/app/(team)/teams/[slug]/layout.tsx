import { TeamLayout } from "@/layouts";

export default async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) => <TeamLayout slug={(await params).slug}>{children}</TeamLayout>;
