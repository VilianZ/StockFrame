export interface RateLimiter {
  allow(key: string): boolean;
}

interface RateLimitEntry {
  count: number;
  windowStartedAt: number;
}

export interface InMemoryRateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
  now?: () => number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(options: InMemoryRateLimiterOptions = {}) {
    this.maxRequests = options.maxRequests ?? 5;
    this.windowMs = options.windowMs ?? 60_000;
    this.now = options.now ?? Date.now;
  }

  allow(key: string): boolean {
    const currentTime = this.now();
    for (const [entryKey, entry] of this.entries) {
      if (currentTime - entry.windowStartedAt >= this.windowMs) {
        this.entries.delete(entryKey);
      }
    }

    const entry = this.entries.get(key);

    if (!entry || currentTime - entry.windowStartedAt >= this.windowMs) {
      this.entries.set(key, { count: 1, windowStartedAt: currentTime });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count += 1;
    return true;
  }
}
