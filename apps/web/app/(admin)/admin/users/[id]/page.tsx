import { AdminUserPage } from "@/views";

export default async ({ params }: { params: Promise<{ id: string }> }) => (
  <AdminUserPage id={(await params).id} />
);
