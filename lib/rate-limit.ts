/**
 * Postgres-backed fixed-window rate limiting.
 *
 * Single atomic UPSERT per check, no transactions needed. The window resets
 * when (now - window_start) > windowMs. Slightly less accurate than a true
 * sliding window but simple, free, and sufficient for blocking abuse.
 */
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type RateLimitResult = {
  allowed: boolean;
  /** how many attempts have been made in the current window */
  count: number;
  /** when the current window resets */
  resetAt: Date;
};

/**
 * Atomically increment the counter for `key` and check against `maxAttempts`
 * within `windowMs`. Returns whether the action is allowed (counter <= max).
 *
 * If the window has expired, resets the bucket to count=1 and a new window.
 * If not expired, increments the existing counter.
 */
export async function checkAndIncrement(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowMs);

  // UPSERT: insert if new, otherwise reset-or-increment based on window age
  const result = await db.execute<{ count: number; window_start: string }>(sql`
    INSERT INTO rate_limit_buckets (key, window_start, count)
    VALUES (${key}, ${now}, 1)
    ON CONFLICT (key) DO UPDATE SET
      window_start = CASE
        WHEN rate_limit_buckets.window_start < ${cutoff} THEN ${now}
        ELSE rate_limit_buckets.window_start
      END,
      count = CASE
        WHEN rate_limit_buckets.window_start < ${cutoff} THEN 1
        ELSE rate_limit_buckets.count + 1
      END
    RETURNING count, window_start
  `);

  const row = result.rows[0];
  const count = Number(row.count);
  const windowStart = new Date(row.window_start);
  const resetAt = new Date(windowStart.getTime() + windowMs);
  return {
    allowed: count <= maxAttempts,
    count,
    resetAt,
  };
}

/**
 * Convenience for the magic-link signin endpoint. Returns true if allowed,
 * false if either the email or the IP have exceeded their respective limits.
 *
 * Default limits:
 *   - 5 requests per hour per email address
 *   - 10 requests per hour per IP address
 */
export async function checkSignInRateLimit(
  email: string,
  ip: string | null,
): Promise<RateLimitResult> {
  const hour = 60 * 60 * 1000;
  const normalisedEmail = email.trim().toLowerCase();

  const emailCheck = await checkAndIncrement(
    `signin:email:${normalisedEmail}`,
    5,
    hour,
  );
  if (!emailCheck.allowed) return emailCheck;

  if (ip) {
    const ipCheck = await checkAndIncrement(`signin:ip:${ip}`, 10, hour);
    if (!ipCheck.allowed) return ipCheck;
  }

  return emailCheck;
}
