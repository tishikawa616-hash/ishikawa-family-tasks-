import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini (Checking multiple possible env var names)
const rawApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const apiKey = (rawApiKey || "").trim(); // Ensure no trailing spaces
const genAI = new GoogleGenerativeAI(apiKey);

export interface ReceiptData {
  amount: number;
  date: string;       // YYYY-MM-DD
  category: string;
  description: string;
  ocr_text: string;   // Full text content from the receipt
}

export async function analyzeReceipt(imageBase64: string): Promise<ReceiptData> {
  // Helper to try a model
  const tryModel = async (modelName: string) => {
    console.log(`Gemini: Attempting with model ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - amount: Total amount (number)
      - date: Date of transaction (YYYY-MM-DD). If year is missing, assume 2024 or current year.
      - category: Infer the agricultural category (e.g., "Seed", "Fertilizer", "Equipment", "Other")
      - description: Brief description of items
      - ocr_text: All visible text content from the receipt, preserving layout with newlines where possible.
      
      Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
    `;

    // Note: In a real implementation, we need to strip the base64 header if present
    const imageParts = [
      {
        inlineData: {
          data: imageBase64.split(",")[1] || imageBase64,
          mimeType: "image/jpeg", // Assuming JPEG for now
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text();
  };

  let text = "";
  try {
    // Try primary model (Newest Experimental)
    text = await tryModel("gemini-2.0-flash-exp");
  } catch (error: any) {
    if (error.message.includes("429") || error.message.includes("Quota")) {
        console.warn("Gemini 2.0 Quota Exceeded:", error.message);
        // If quota exceeded, we might want to fail fast or try a cheaper model?
        // But if 1.5 is 404, we have no choice.
        // Let's try 1.5 just in case.
    }
    console.warn("Gemini 2.0-flash-exp failed:", error.message);
    try {
      // Fallback 1
      console.log("Gemini: Falling back to gemini-1.5-flash...");
      text = await tryModel("gemini-1.5-flash");
    } catch (fallbackError: any) {
        console.warn("Gemini 1.5-flash failed:", fallbackError.message);
        try {
            // Fallback 2 (Legacy)
            console.log("Gemini: Falling back to gemini-pro...");
            text = await tryModel("gemini-pro");
        } catch (finalError: any) {
             throw new Error(`All Gemini Models Failed. Last error: ${finalError.message}`);
        }
    }
  }

  try {
    console.log("Gemini Raw Response:", text); // Debug log

    // Cleanup JSON string (remove backticks if any)
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(jsonString) as ReceiptData;
  } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      throw new Error("Failed to parse Gemini response: " + (parseError as Error).message);
  }
}
