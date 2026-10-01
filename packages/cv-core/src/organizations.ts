/**
 * A member's role in a team. Owners can do anything, including billing and
 * deleting the team; admins manage members (but not owners) and settings;
 * members can look.
 */
export type TOrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

export type TOrganizationType = "PERSONAL" | "TEAM";

/** Roles from most to least access. */
export const ORGANIZATION_ROLES: readonly TOrganizationRole[] = [
  "OWNER",
  "ADMIN",
  "MEMBER",
];

/** Whether `role` is `required` or above. */
export const hasOrganizationRole = (
  role: TOrganizationRole,
  required: TOrganizationRole,
) => ORGANIZATION_ROLES.indexOf(role) <= ORGANIZATION_ROLES.indexOf(required);

/** A team the signed-in user belongs to, as `GET /organizations` lists it. */
export type TTeamSummary = {
  id: string;
  name: string;
  slug: string;
  /** The signed-in user's role in it. */
  role: TOrganizationRole;
};

export type TTeamMember = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TOrganizationRole;
  joinedAt: string;
};

export type TTeamInvite = {
  id: string;
  email: string;
  role: TOrganizationRole;
  invitedBy: string | null;
  expiresAt: string;
  createdAt: string;
};

/** What an invite link shows before it's accepted. */
export type TInvitePreview = {
  teamName: string;
  email: string;
  role: TOrganizationRole;
  invitedBy: string | null;
  expiresAt: string;
};
