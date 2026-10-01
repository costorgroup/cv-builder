import { InvitePage } from "@/views";

export default async ({ params }: { params: Promise<{ token: string }> }) => (
  <InvitePage token={(await params).token} />
);
