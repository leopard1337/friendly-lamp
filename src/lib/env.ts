/**
 * Server-side env vars. Use process.env directly in client components for NEXT_PUBLIC_* only.
 */
const isProd = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
if (isProd && jwtSecret === "dev-secret-change-in-production") {
  throw new Error("JWT_SECRET must be set in production. Do not use the default.");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.trim()) {
  throw new Error("DATABASE_URL must be set.");
}

export const env = {
  databaseUrl,
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  jwtSecret,
  siweDomain: process.env.SIWE_DOMAIN ?? "localhost",
  heliusApiKey: process.env.HELIUS_API_KEY ?? "",
} as const;
