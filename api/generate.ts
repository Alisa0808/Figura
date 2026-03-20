import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const ATLAS_API_KEY = process.env.ATLAS_API_KEY || "";
const ATLAS_API_URL = "https://api.atlascloud.ai/api/v1/model/generateImage";

const TRIAL_LIMIT = 3;
const RATE_LIMIT_WINDOW = 24 * 60 * 60; // 24 hours in seconds

// Initialize Redis client (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-atlas-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customApiKey = req.headers['x-atlas-api-key'] as string;
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp;

  // Rate limiting with Upstash Redis (persistent storage)
  if (!customApiKey && redis) {
    try {
      const rateLimitKey = `rate_limit:${ip}`;

      // Get current usage from Redis
      const currentUsage = await redis.get<number>(rateLimitKey);
      const usage = currentUsage || 0;

      if (usage >= TRIAL_LIMIT) {
        return res.status(429).json({
          error: "Trial limit reached",
          message: "You have reached the 3-time free trial limit (24-hour window). Please provide your own Atlas Cloud API key to continue."
        });
      }

      // Increment usage in Redis with expiration
      await redis.incr(rateLimitKey);
      // Set expiration only if this is the first use
      if (usage === 0) {
        await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
      }
    } catch (redisError) {
      console.error('[Vercel Function] Redis error:', redisError);
      // If Redis fails, allow the request to proceed (fail-open)
      // This prevents Redis outages from breaking the entire app
    }
  }

  const apiKeyToUse = customApiKey || ATLAS_API_KEY;

  if (!apiKeyToUse) {
    return res.status(401).json({
      error: "Configuration Error",
      message: "The server is not configured with an Atlas Cloud API key. Please provide your own API key to continue."
    });
  }

  try {
    console.log(`[Vercel Function] Generating image for IP: ${ip}, Model: ${req.body.model}`);

    const response = await fetch(ATLAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKeyToUse}`,
      },
      body: JSON.stringify(req.body),
    });

    console.log(`[Vercel Function] Atlas API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[Vercel Function] Atlas API Error:`, errorData);

      // If it's a 429, it's likely a quota issue
      if (response.status === 429) {
        return res.status(429).json({
          error: "Resource exhausted",
          message: "The Atlas Cloud API key has reached its quota. Please try again later or provide your own API key."
        });
      }

      return res.status(response.status).json(errorData);
    }

    const result = await response.json();
    console.log(`[Vercel Function] Generation successful`);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("[Vercel Function] Atlas Cloud API Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "An unknown error occurred on the server."
    });
  }
}
