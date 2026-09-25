const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const ACCESS_TOKEN_TTL_MS = 15 * MINUTE;
export const REFRESH_TOKEN_TTL_MS = 30 * DAY;
export const VERIFY_ACCOUNT_TOKEN_TTL_MS = DAY;
export const RESET_PASSWORD_TOKEN_TTL_MS = HOUR;
