import { PlatformRole } from '../generated/prisma/client.js';

/** Each platform role can do everything the ones below it can. */
const RANK: Record<PlatformRole, number> = {
  [PlatformRole.USER]: 0,
  [PlatformRole.ADMIN]: 1,
  [PlatformRole.SUPER_ADMIN]: 2,
};

export const hasPlatformRole = (role: PlatformRole, required: PlatformRole) =>
  RANK[role] >= RANK[required];
