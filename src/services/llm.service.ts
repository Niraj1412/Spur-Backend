import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const anthropicEnabled =
  process.env.ANTHROPIC_API_KEY && process.env.ENABLE_ANTHROPIC !== "false";

const anthropic =
  anthropicEnabled &&
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

const geminiClient =
  process.env.GOOGLE_API_KEY &&
  new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM_PROMPT = `
You are a helpful support agent for a small e-commerce store.

Store policies:
- Shipping: Ships worldwide. USA delivery takes 5-7 business days.
- Returns: 30-day no-questions-asked return.
- Support hours: Monday to Friday, 9am-6pm IST.

Rules:
- Be concise and polite.
- Answer like a real human support agent.
`;

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateReply(
  history: HistoryMessage[],
  userMessage: string
): Promise<string> {
  // Try Gemini first if available
  const geminiReply = await tryGemini(history, userMessage);
  if (geminiReply) return geminiReply;

  // Fallback to Anthropic if available
  const anthropicReply = await tryAnthropic(history, userMessage);
  if (anthropicReply) return anthropicReply;

  // Last resort canned FAQ
  return fallbackAnswer();
}

function fallbackAnswer() {
  return (
    "Our AI agent is temporarily unavailable. Here are quick answers:\n" +
    "- Shipping: Ships worldwide, USA delivery in 5-7 business days.\n" +
    "- Returns: 30-day no-questions-asked return.\n" +
    "- Support hours: Monday to Friday, 9am-6pm IST.\n" +
    "If you need more help, please try again in a bit."
  );
}

async function tryGemini(history: HistoryMessage[], userMessage: string) {
  if (!geminiClient) return null;

  const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
  const transcript = history
    .map(h => `${h.role === "assistant" ? "Agent" : "User"}: ${h.content}`)
    .join("\n");

  const prompt = `${SYSTEM_PROMPT}

Conversation so far:
${transcript}
User: ${userMessage}
Agent:`;

  try {
    const result = await model.generateContent([{ text: prompt }]);
    const text = result.response.text();
    return text?.trim() || null;
  } catch (err) {
    console.error("Gemini call failed, will fallback", err);
    return null;
  }
}

async function tryAnthropic(history: HistoryMessage[], userMessage: string) {
  if (!anthropic) return null;

  const messages = history.map(m => ({
    role: m.role,
    content: [{ type: "text" as const, text: m.content }]
  }));

  messages.push({
    role: "user",
    content: [{ type: "text" as const, text: userMessage }]
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      system: SYSTEM_PROMPT,
      max_tokens: 300,
      messages
    });

    const content = response.content[0];
    return content.type === "text" ? content.text : null;
  } catch (err: any) {
    const msg =
      err?.error?.error?.message ||
      err?.message ||
      "Anthropic call failed";
    console.warn("Anthropic call failed, will fallback:", msg);
    return null;
  }
}
