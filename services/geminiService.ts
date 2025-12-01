
import { GoogleGenAI } from "@google/genai";

// Helper to delay execution
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to check for Veo Key selection (Specific to Veo/High-end models)
export const checkApiKeySelection = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return true; // Fallback for environments where aistudio isn't injected, assuming env var works
};

export const promptForKeySelection = async () => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  } else {
    console.warn("Billing environment check failed: window.aistudio not found.");
    alert("Vui lòng đảm bảo tài khoản Google AI Ultra (Paid Project) đã được kích hoạt.");
  }
};

/**
 * Generates an image using Gemini.
 * Supports Multimodal prompt (Reference images + Text).
 */
export const generateImage = async (
  prompt: string, 
  aspectRatio: string, 
  model: string = 'gemini-3-pro-image-preview',
  referenceImages: string[] = []
): Promise<{ data: string; mimeType: string }> => {
  // Always instantiate new client to capture latest key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Config varies by model
  const imageConfig: any = {
    aspectRatio: aspectRatio,
  };

  // Only gemini-3-pro-image-preview supports imageSize
  if (model === 'gemini-3-pro-image-preview') {
    imageConfig.imageSize = "1K";
  }

  // Construct contents
  const parts: any[] = [];
  
  // Add reference images if provided
  if (referenceImages && referenceImages.length > 0) {
    let hasRef = false;
    for (const refBase64 of referenceImages) {
        // Extract base64 data and mime type from data URL
        // Format: "data:image/png;base64,....."
        const match = refBase64.match(/^data:(.+);base64,(.+)$/);
        if (match) {
            parts.push({
                inlineData: {
                    mimeType: match[1],
                    data: match[2]
                }
            });
            hasRef = true;
        }
    }
    
    // Append instruction to prompt if references were added
    if (hasRef) {
        prompt = `${prompt} . (Use the attached images as strict visual references for character consistency and environment style)`;
    }
  }

  // Add text prompt
  parts.push({ text: prompt });
  
  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: parts,
    },
    config: {
      imageConfig: imageConfig
    },
  });

  // Extract image
  const responseParts = response.candidates?.[0]?.content?.parts;
  if (!responseParts) throw new Error("No content generated");

  for (const part of responseParts) {
    if (part.inlineData && part.inlineData.data) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      };
    }
  }

  throw new Error("No image data found in response");
};

/**
 * Generates a video using Veo (Image-to-Video).
 */
export const generateVideo = async (
  prompt: string, 
  imageBase64: string, 
  imageMime: string,
  resolution: string = '720p',
  aspectRatio: string = '16:9'
): Promise<string> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Start Operation
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview', // Fast model for bulk work
    prompt: prompt || "Animate this image naturally",
    image: {
      imageBytes: imageBase64,
      mimeType: imageMime,
    },
    config: {
      numberOfVideos: 1,
      resolution: resolution, 
      aspectRatio: aspectRatio 
    }
  });

  // 2. Poll for completion
  while (!operation.done) {
    await wait(5000); // Wait 5 seconds between checks
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  if (operation.error) {
    throw new Error(`Video generation failed: ${operation.error.message}`);
  }

  // 3. Get URI
  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("No video URI returned");

  // Append Key for direct download/viewing
  return `${uri}&key=${process.env.API_KEY}`;
};
