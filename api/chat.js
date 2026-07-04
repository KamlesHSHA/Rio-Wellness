import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { messages, user } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages are required",
      });
    }

    // Get latest user message
    const latestMessage =
      messages[messages.length - 1]?.content || "";

    const prompt = `
You are Rio, an empathetic AI wellness companion.

Rules:
- Never diagnose diseases.
- Never replace therapy.
- Be warm and calming.
- Validate feelings before giving advice.
- Keep responses under 200 words.
- Suggest breathing, journaling or grounding when appropriate.
- Speak naturally and conversationally.
- Address the user as ${user?.nickname || "Friend"}.

User:
${latestMessage}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const reply = response.text;

    return res.status(200).json({
      reply,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to generate response.",
    });
  }
}