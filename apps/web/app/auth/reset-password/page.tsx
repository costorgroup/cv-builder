import { ResetPasswordPage } from "@/views";
import { getSearchParam, type TSearchParams } from "@/utils/search-param";

export default async ({ searchParams }: { searchParams: TSearchParams }) => (
  <ResetPasswordPage token={await getSearchParam(searchParams, "token")} />
);
