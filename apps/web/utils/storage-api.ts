import { apiRequest } from "@/utils/api-client";

/** A connected bucket as the API shows it: never the secret. */
export type TStorageConfig = {
  provider: "S3";
  bucket: string;
  region: string;
  endpoint: string | null;
  prefix: string;
  /** The access key id's last characters, e.g. "…7EXA". */
  accessKey: string;
  verifiedAt: string | null;
  /** In use for new uploads. */
  active: boolean;
};

export type TStorageInput = {
  bucket: string;
  region: string;
  endpoint?: string;
  prefix?: string;
  /** Both, to set or change the keys; neither, to keep them. */
  accessKeyId?: string;
  secretAccessKey?: string;
};

/** A team's bucket with `teamId`; the signed-in user's own without. */
const base = (teamId?: string) =>
  teamId ? `teams/${encodeURIComponent(teamId)}/storage` : "account/storage";

export const storageApi = {
  get: (teamId?: string, signal?: AbortSignal) =>
    apiRequest<{ storage: TStorageConfig | null }>(base(teamId), {
      method: "GET",
      authenticated: true,
      signal,
    }),
  save: (body: TStorageInput, teamId?: string) =>
    apiRequest<TStorageConfig>(base(teamId), {
      method: "PATCH",
      body,
      authenticated: true,
    }),
  verify: (teamId?: string) =>
    apiRequest<TStorageConfig>(`${base(teamId)}/verify`, {
      authenticated: true,
    }),
  remove: (teamId?: string) =>
    apiRequest(base(teamId), { method: "DELETE", authenticated: true }),
};
