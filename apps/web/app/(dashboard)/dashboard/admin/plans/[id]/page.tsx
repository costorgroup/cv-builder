import { AdminPlanPage } from "@/views";

export default async ({ params }: { params: Promise<{ id: string }> }) => (
  <AdminPlanPage id={(await params).id} />
);
