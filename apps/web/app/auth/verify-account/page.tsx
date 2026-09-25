import { VerifyAccountPage } from "@/views";
import { getSearchParam, type TSearchParams } from "@/utils/search-param";

export default async ({ searchParams }: { searchParams: TSearchParams }) => (
  <VerifyAccountPage token={await getSearchParam(searchParams, "token")} />
);
