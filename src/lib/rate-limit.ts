/**
 * Simple in-memory rate limiter. For production at scale, use Redis.
 */
const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;

function getKey(req: Request, prefix?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return prefix ? `${prefix}:${ip}` : ip;
}

export function checkRateLimit(
  req: Request,
  opts?: { windowMs?: number; maxRequests?: number; prefix?: string }
): { ok: boolean; retryAfter?: number } {
  const windowMs = opts?.windowMs ?? WINDOW_MS;
  const maxRequests = opts?.maxRequests ?? MAX_REQUESTS;
  const key = getKey(req, opts?.prefix);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}
