import { ModelType } from "../types";

/**
 * Generates the white line art character integration using the backend proxy.
 * @param base64Image The base64 string of the uploaded image.
 * @param mimeType The mime type of the image.
 * @param aspectRatio The target aspect ratio string (e.g., "16:9", "1:1") to match the original image.
 * @param model The model to use (Nano Banana Pro or Nano Banana 2).
 */
export const generateLineArtCharacter = async (
  base64Image: string, 
  mimeType: string,
  aspectRatio: string = "1:1",
  model: ModelType = ModelType.NANO_BANANA_PRO,
  apiKey?: string,
  maleCount: number = 0,
  femaleCount: number = 1
): Promise<string> => {
  const maleDesc = maleCount > 0 ? "\\n  Male character design: Short hair, wearing a T-shirt and long pants, approximately 1.8 meters tall." : "";
  const femaleDesc = femaleCount > 0 ? "\\n  Female character design: Hairstyle is slightly and elegantly soft waves, wearing a casual slim-fit top and pants, approximately 1.68 meters tall." : "";

  const prompt = `PRESERVE THE EXACT ORIGINAL BACKGROUND - DO NOT MODIFY ANY PART OF THE SCENE!

  Task: Add ONLY minimalist white line art characters as an overlay. The background must remain completely unchanged - no modifications to colors, lighting, objects, or composition.

  Draw exactly ${maleCount} male(s) and ${femaleCount} female(s).${maleDesc}${femaleDesc}

  Character Placement Rules (PHYSICS-BASED):
  - Analyze object heights relative to human proportions (1.68m-1.8m tall)
  - Standing figures can only reach arm height (shoulder to fingertip)
  - Low benches/surfaces: characters must SIT or BEND DOWN to interact
  - Waist-height railings: characters LEAN while standing
  - High objects: characters must REACH UP
  - Feet must be grounded on visible floor/ground surfaces
  - No floating, impossible reaches, or unnatural stretching

  Character Style: Clean white line art, no facial details, continuous contour drawing, minimalist and elegant.

  CRITICAL: The original scene is sacred - preserve every pixel of the background exactly as provided.`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["x-atlas-api-key"] = apiKey;
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        images: [base64Image],
        aspect_ratio: aspectRatio,
        resolution: "1k",
        enable_base64_output: true,
        enable_sync_mode: true,
        image_strength: 0.85, // High strength to preserve original image (0.0 = completely new, 1.0 = exact copy)
        guidance_scale: 7.5,   // Moderate guidance to follow prompt while preserving image
        num_inference_steps: 30 // Sufficient steps for quality while maintaining speed
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiErrorMessage = errorData.message || errorData.error || response.statusText;
      throw new Error(`Atlas Cloud API Error: ${response.status} ${apiErrorMessage}`);
    }

    const result = await response.json();
    
    if (result.data && result.data.outputs && result.data.outputs.length > 0) {
      const output = result.data.outputs[0];
      if (output.startsWith('data:image')) {
        return output;
      }
      return `data:image/png;base64,${output}`;
    } else if (result.image && result.image.data) {
      return `data:image/png;base64,${result.image.data}`;
    } else if (result.output && result.output.image && result.output.image.data) {
      return `data:image/png;base64,${result.output.image.data}`;
    } else if (result.data && result.data[0] && result.data[0].b64_json) {
      return `data:image/png;base64,${result.data[0].b64_json}`;
    } else if (typeof result.output === 'string' && result.output.startsWith('data:image')) {
      return result.output;
    } else if (result.url) {
      return result.url;
    }

    console.log("Atlas Cloud API Response:", result);
    throw new Error("No image data found in Atlas Cloud API response");

  } catch (error: any) {
    console.error("Atlas Cloud API Error:", error);
    if (error.message === 'Failed to fetch') {
      throw new Error("Atlas Cloud API Error: Failed to fetch. This is likely a network issue or the server is down.");
    }
    throw error;
  }
};