"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, TextField } from "@costor/ui";
import { SCvSearch } from "@/components/cv-search/styles";
import { dashboardPath } from "@/utils/dashboard-path";

const SEARCH_DELAY_MS = 300;

/**
 * Searches the dashboard's CVs by name. The search lives in the URL
 * (`?search=`), which the dashboard page reads; typing updates it once it
 * pauses, and starts again from the first page.
 */
export const CvSearch = () => {
  const router = useRouter();
  const search = useSearchParams().get("search")?.trim() ?? "";
  const [query, setQuery] = useState(search);
  const [urlSearch, setUrlSearch] = useState(search);

  // The URL changed without typing (e.g. Back): show its search in the box.
  if (search !== urlSearch) {
    setUrlSearch(search);
    setQuery(search);
  }

  useEffect(() => {
    const next = query.trim();
    if (next === search) return;
    const timer = setTimeout(
      () => router.replace(dashboardPath(next)),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [query, search, router]);

  return (
    <SCvSearch>
      <TextField
        type="search"
        placeholder="Search CVs"
        aria-label="Search CVs"
        variant="subtle"
        startIcon={<SearchIcon />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </SCvSearch>
  );
};

export default CvSearch;
