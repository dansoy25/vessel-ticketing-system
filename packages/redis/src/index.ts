import { Redis } from "@upstash/redis";
import { redisKeys, type PassengerCacheEntry } from "@vessel/shared";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

/** Ride passes are long-lived; cache generously and let writes refresh it. */
const PASSENGER_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h

/**
 * Populate/refresh the cache so gate scans can validate without hitting Postgres.
 * Best-effort: Postgres remains the source of truth, so a cache outage should
 * never fail a registration or scan.
 */
export async function cachePassenger(qrToken: string, entry: PassengerCacheEntry): Promise<void> {
  try {
    await redis.set(redisKeys.passenger(qrToken), entry, { ex: PASSENGER_CACHE_TTL_SECONDS });
  } catch {
    // best-effort cache write
  }
}

export async function getCachedPassenger(qrToken: string): Promise<PassengerCacheEntry | null> {
  try {
    return await redis.get<PassengerCacheEntry>(redisKeys.passenger(qrToken));
  } catch {
    return null;
  }
}

export async function evictPassenger(qrToken: string): Promise<void> {
  try {
    await redis.del(redisKeys.passenger(qrToken));
  } catch {
    // best-effort cache write
  }
}
