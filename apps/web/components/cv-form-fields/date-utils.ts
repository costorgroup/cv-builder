/**
 * CV dates are stored as `YYYY-MM-DD` strings (older entries and samples use
 * `YYYY-MM`). They are parsed as local dates, since `new Date("YYYY-MM-DD")`
 * reads UTC and can land on the previous day.
 */
export const parseCvDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3] ?? 1),
  );
};

export const formatCvDate = (date: Date | null) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
