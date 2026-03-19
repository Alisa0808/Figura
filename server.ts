import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";

const ATLAS_API_KEY = process.env.ATLAS_API_KEY || "";
const ATLAS_API_URL = "https://api.atlascloud.ai/api/v1/model/generateImage";

// In-memory store for IP rate limiting
const ipUsage = new Map<string, number>();
const TRIAL_LIMIT = 3;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', true);

  app.use(express.json({ limit: '50mb' }));
  app.use(cors());

  // API routes
  app.post("/api/generate", async (req, res) => {
    const customApiKey = req.headers['x-atlas-api-key'] as string;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Rate limiting logic (only if no custom API key is provided)
    if (!customApiKey) {
      const currentUsage = ipUsage.get(clientIp) || 0;
      if (currentUsage >= TRIAL_LIMIT) {
        return res.status(429).json({ 
          error: "Trial limit reached", 
          message: "You have reached the 3-time free trial limit. Please provide your own Atlas Cloud API key to continue." 
        });
      }
      ipUsage.set(clientIp, currentUsage + 1);
    }

    const apiKeyToUse = customApiKey || ATLAS_API_KEY;

    if (!apiKeyToUse) {
      return res.status(401).json({
        error: "Configuration Error",
        message: "The server is not configured with an Atlas Cloud API key. Please provide your own API key to continue."
      });
    }

    try {
      console.log(`[Backend] Generating image for IP: ${clientIp}, Model: ${req.body.model}`);
      
      const response = await fetch(ATLAS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeyToUse}`,
        },
        body: JSON.stringify(req.body),
      });
      
      console.log(`[Backend] Atlas API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[Backend] Atlas API Error:`, errorData);
        
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
      console.log(`[Backend] Generation successful`);
      res.json(result);
    } catch (error: any) {
      console.error("[Backend] Atlas Cloud API Error:", error);
      res.status(500).json({ 
        error: "Internal Server Error", 
        message: error.message || "An unknown error occurred on the server." 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
