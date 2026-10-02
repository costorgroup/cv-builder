import { apiRequest } from "@/utils/api-client";

/** A stored file's link, e.g. "/api/assets/…", usable as an image source. */
export type TUploadedAsset = { id: string; url: string };

export const assetsApi = {
  /** Stores a photo for the signed-in user's CVs. */
  uploadPhoto: (file: Blob) => {
    const form = new FormData();
    form.append("file", file, "photo.jpg");
    return apiRequest<TUploadedAsset>("assets/photos", {
      body: form,
      authenticated: true,
    });
  },
};
