import { DashboardPage } from "@/views";
import { getSearchParam, type TSearchParams } from "@/utils/search-param";

export default async ({ searchParams }: { searchParams: TSearchParams }) => {
  const page = Number(await getSearchParam(searchParams, "page"));
  return (
    <DashboardPage
      search={(await getSearchParam(searchParams, "search"))?.trim()}
      page={Number.isInteger(page) && page > 0 ? page : 1}
    />
  );
};
