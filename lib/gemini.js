import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables. Gemini features will be disabled.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Get a generative model instance
 * @param {string} modelName - The name of the model (default: "gemini-1.5-flash")
 * @returns {import("@google/generative-ai").GenerativeModel | null}
 */
export const getGeminiModel = (modelName = "gemini-2.5-flash") => {
    if (!genAI) return null;
    return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Simple helper to generate text based on a prompt
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - The generated text
 */
export const generateText = async (prompt) => {
    try {
        const model = getGeminiModel();
        if (!model) throw new Error("Gemini API not initialized");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini generation error:", error);
        throw error;
    }
};
