// First match wins, so browsers built on others (Edge on Chrome, Chrome on
// Safari's engine…) come before them.
const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

const find = (list: [RegExp, string][], userAgent: string) =>
  list.find(([pattern]) => pattern.test(userAgent))?.[1];

/** "Chrome on Windows", from a User-Agent; a rough guess, for people. */
export const describeDevice = (userAgent: string | null) => {
  if (!userAgent) return "Unknown device";
  const browser = find(BROWSERS, userAgent);
  const system = find(SYSTEMS, userAgent);
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? "Unknown device";
};
