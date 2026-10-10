const hour = 3_600_000;

export const isFresh = (scannedAt: string, now = Date.now()) => now - Date.parse(scannedAt) < 24 * hour;

export const rescanAt = (scannedAt: string) => Date.parse(scannedAt) + hour;

export function rateLimiter(limit: number, windowMs: number) {
  const counts = new Map<string, number>();
  let windowStart = 0;
  return (key: string, now = Date.now()) => {
    if (now - windowStart >= windowMs) {
      counts.clear();
      windowStart = now;
    }
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    return count <= limit;
  };
}

export const allowScan = rateLimiter(10, 60_000);
export const allowSignup = rateLimiter(10, 60_000);
