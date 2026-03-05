import { getGeminiModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

const moods = ['neutral', 'happy', 'sad', 'peaceful', 'mysterious'];
const themes = ['love', 'nature', 'life', 'loss', 'hope', 'freedom', 'solitude', 'dream', 'general'];

export async function POST(req) {
    try {
        const { action, payload } = await req.json();
        const model = getGeminiModel();

        if (!model) {
            return NextResponse.json({ error: "Gemini API key missing" }, { status: 500 });
        }

        switch (action) {
            case "generate_daily_prompt":
                const prompt = `Generate 3 unique, poetic writing prompts for a poetry app. 
                Each prompt should be short (1-2 sentences) and evocative.
                Return only a JSON array of objects with 'text' and 'tag' (kebab-case) properties.
                Example format: [{"text": "Write about a color you can't name but can feel.", "tag": "unseen-color"}]`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text();

                // Clean up possible markdown code blocks from Gemini response
                text = text.replace(/```json|```/g, "").trim();

                try {
                    const prompts = JSON.parse(text);
                    return NextResponse.json({ prompts });
                } catch (parseError) {
                    console.error("JSON parse error:", text);
                    return NextResponse.json({ error: "Failed to parse Gemini response" }, { status: 500 });
                }

            case "assist_writing":
                const { currentText: assistText, type } = payload;
                let assistPrompt = "";

                if (type === "rhyme") {
                    assistPrompt = `Given this line of poetry: "${assistText}", suggest 5 contextually relevant rhyming words or phrases. Return as a simple list.`;
                } else if (type === "complete") {
                    assistPrompt = `Continue this poem: "${assistText}". Provide 2-4 lines that maintain the same mood and imagery.`;
                } else if (type === "critique") {
                    assistPrompt = `Provide a gentle, poetic critique of this poem: "${assistText}". Highlight its imagery and suggest one small improvement.`;
                } else if (type === "playful") {
                    assistPrompt = `Given this poem starting with: "${assistText}", continue it with a playful, witty, and slightly flirty tone. Keep it tasteful but cheeky. Provide 2-4 lines.`;
                }

                const assistResult = await model.generateContent(assistPrompt);
                return NextResponse.json({ suggestion: assistResult.response.text() });

            case "analyze":
                const { content } = payload;
                const analyzePrompt = `Analyze the following poem and suggest the most fitting 'mood' and 'theme' from these lists:
                Moods: [${moods.join(", ")}]
                Themes: [${themes.join(", ")}]
                
                Poem: "${content}"
                
                Return ONLY a JSON object with 'mood' and 'theme' keys.`;

                const analyzeResult = await model.generateContent(analyzePrompt);
                let analyzeText = analyzeResult.response.text().replace(/```json|```/g, "").trim();

                try {
                    return NextResponse.json(JSON.parse(analyzeText));
                } catch (e) {
                    return NextResponse.json({ error: "Failed to parse analysis" }, { status: 500 });
                }

            case "explain_line":
                const { line, fullPoem } = payload;
                const explainPrompt = `Provide a deep, poetic, and insightful explanation for this line of poetry: "${line}"
                Context (the whole poem): "${fullPoem}"
                
                Keep the explanation concise (2-3 sentences) but profound. Focus on metaphors, symbolism, or imagery.
                Return the explanation as plain text.`;

                const explainResult = await model.generateContent(explainPrompt);
                return NextResponse.json({ explanation: explainResult.response.text() });

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Gemini route error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
