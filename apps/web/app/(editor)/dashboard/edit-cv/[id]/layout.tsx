import { ManageCvLayout } from "@/layouts";

export default async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) => <ManageCvLayout cvId={(await params).id}>{children}</ManageCvLayout>;
