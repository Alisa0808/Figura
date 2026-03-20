import type { VercelRequest, VercelResponse } from '@vercel/node';

const ATLAS_API_KEY = process.env.ATLAS_API_KEY || "";
const ATLAS_API_URL = "https://api.atlascloud.ai/api/v1/model/generateImage";

// In-memory store for IP rate limiting (Note: Vercel serverless functions are stateless,
// so this resets on each cold start - consider using Vercel KV for production)
const ipUsage = new Map<string, number>();
const TRIAL_LIMIT = 3;

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

  // Rate limiting logic (only if no custom API key is provided)
  if (!customApiKey) {
    const currentUsage = ipUsage.get(ip) || 0;
    if (currentUsage >= TRIAL_LIMIT) {
      return res.status(429).json({
        error: "Trial limit reached",
        message: "You have reached the 3-time free trial limit. Please provide your own Atlas Cloud API key to continue."
      });
    }
    ipUsage.set(ip, currentUsage + 1);
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
