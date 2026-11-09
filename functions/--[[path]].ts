// ---------- Lightweight in-memory rate limiter (per isolate) ----------
// Complements Cloudflare's WAF / Rate Limiting rules for defence-in-depth.
const rateBuckets = new Map<string, number[]>();

function getClientIP(c: any): string {
  return c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'unknown';
}

function rateLimit(c: any, key: string, max: number, windowMs: number): boolean {
  const ip = getClientIP(c);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const arr = (rateBuckets.get(bucketKey) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now);
  rateBuckets.set(bucketKey, arr);
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) if (v.every((t) => now - t > windowMs)) rateBuckets.delete(k);
  }
  return true;
}
