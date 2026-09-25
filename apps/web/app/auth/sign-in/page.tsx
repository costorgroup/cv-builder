import { SignInPage } from "@/views";
import { getSearchParam, type TSearchParams } from "@/utils/search-param";

export default async ({ searchParams }: { searchParams: TSearchParams }) => (
  <SignInPage next={await getSearchParam(searchParams, "next")} />
);
