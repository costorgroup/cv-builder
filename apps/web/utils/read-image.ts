/** Longest side of a stored photo, in px. A CV photo never needs more. */
const MAX_PHOTO_SIZE = 600;

/** Turns a data URL (e.g. a stored photo) back into a `File`. */
export const dataUrlToFile = (dataUrl: string, name: string) => {
  const [header = "", base64 = ""] = dataUrl.split(",");
  const type = /data:([^;]+)/.exec(header)?.[1] ?? "application/octet-stream";
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new File([bytes], name, { type });
};

/**
 * Reads an image file as a JPEG data URL, scaled down so its longest side is
 * at most `maxSize` px. Transparent areas become white. Rejects files the
 * browser can't decode as an image.
 */
export const readImageAsDataUrl = async (
  file: File,
  maxSize = MAX_PHOTO_SIZE,
): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.9);
};
