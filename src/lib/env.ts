/**
 * Minimal env helpers for Day 1.
 * API keys stay empty until Day 3.
 */
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  appName: process.env.APP_NAME ?? "BrandMirror",
  appEnv: process.env.APP_ENV ?? "development",
};
