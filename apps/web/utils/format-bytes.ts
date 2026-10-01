const UNITS = ["B", "KB", "MB", "GB", "TB"];

/** A size for people, e.g. "24.3 MB"; 1 KB is 1,024 bytes. */
export const formatBytes = (bytes: number) => {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
};
