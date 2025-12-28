import Anthropic from "@anthropic-ai/sdk";

// UPDATED: Use standard model names and default to v1beta for Gemini 1.5+ support
// Ignore .env GEMINI_MODELS for now as it likely contains deprecated models
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-pro-latest"
];

// UPDATED: Default to "v1beta" to support System Instructions and newer models
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || "v1beta";

const anthropicEnabled =
  process.env.ANTHROPIC_API_KEY && process.env.ENABLE_ANTHROPIC !== "false";

const anthropic =
  anthropicEnabled &&
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

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
  if (!geminiApiKey) return null;

  // v1beta supports 'systemInstruction', v1 does not.
  const supportsSystemInstruction = GEMINI_API_VERSION.startsWith("v1beta");

  const transcript = history
    .map(h => `${h.role === "assistant" ? "Agent" : "User"}: ${h.content}`)
    .join("\n");

  // If using v1, we hack the system prompt into the user prompt.
  // If using v1beta (supported), we send it cleanly in the payload.
  const prompt = `${supportsSystemInstruction ? "" : `${SYSTEM_PROMPT}\n\n`}Conversation so far:
${transcript}
User: ${userMessage}
Agent:`;

  for (const modelName of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${modelName}:generateContent?key=${geminiApiKey}`;

      const payload: Record<string, unknown> = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      };

      if (supportsSystemInstruction) {
        payload.systemInstruction = { parts: [{ text: SYSTEM_PROMPT }] };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Log specific error to help debugging
        console.warn(`Gemini call failed (${modelName}):`, data?.error?.message || response.statusText);
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) return text.trim();

    } catch (err: any) {
      const msg =
        err?.statusText ||
        err?.errorDetails ||
        err?.message ||
        "Gemini call failed";
      console.warn(`Gemini call failed (${modelName}):`, msg);
    }
  }

  return null;
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