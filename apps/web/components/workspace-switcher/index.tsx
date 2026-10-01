"use client";

import { usePathname, useRouter } from "next/navigation";
import { NativeSelect } from "@costor/ui";
import { SWorkspaceSwitcher } from "@/components/workspace-switcher/styles";
import { useTeams } from "@/providers/teams-provider";
import { DASHBOARD_PATH } from "@/utils/dashboard-path";
import { teamPath } from "@/utils/team-path";

/** The slug of the team whose pages are open, if any. */
const slugIn = (pathname: string) => /^\/teams\/([^/]+)/.exec(pathname)?.[1];

/**
 * Switches between the user's own account and their teams. Shown only to
 * people in a team; needs a TeamsProvider above it.
 */
export const WorkspaceSwitcher = () => {
  const teams = useTeams();
  const router = useRouter();
  const pathname = usePathname();

  if (teams.status !== "ready" || teams.teams.length === 0) return null;
  const current = slugIn(pathname);

  return (
    <SWorkspaceSwitcher>
      <NativeSelect
        aria-label="Switch between your account and your teams"
        size="sm"
        variant="subtle"
        value={current ? decodeURIComponent(current) : ""}
        options={[
          { value: "", label: "My account" },
          ...teams.teams.map(({ slug, name }) => ({
            value: slug,
            label: name,
          })),
        ]}
        onChange={(_, value) =>
          router.push(value ? teamPath(value) : DASHBOARD_PATH)
        }
      />
    </SWorkspaceSwitcher>
  );
};

export default WorkspaceSwitcher;
