import { redirect } from "next/navigation";
import { OverviewPage } from "@/views";
import { MY_CVS_PATH } from "@/utils/dashboard-path";
import type { TSearchParams } from "@/utils/search-param";

export default async ({ searchParams }: { searchParams: TSearchParams }) => {
  // The CV list used to live here; old links with a search or page go to it.
  const params = await searchParams;
  if (params.search !== undefined || params.page !== undefined) {
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(params)) {
      for (const each of [value ?? []].flat()) query.append(name, each);
    }
    redirect(`${MY_CVS_PATH}?${query}`);
  }
  return <OverviewPage />;
};
