import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

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
  const messages = history.map(m => ({
    role: m.role,
    content: [{ type: "text" as const, text: m.content }]
  }));

  messages.push({
    role: "user",
    content: [{ type: "text" as const, text: userMessage }]
  });

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    system: SYSTEM_PROMPT,
    max_tokens: 300,
    messages
  });

  const content = response.content[0];
  return content.type === "text"
    ? content.text
    : "Sorry, I couldn't generate a response.";
}
