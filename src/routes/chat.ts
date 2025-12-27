import { Router } from "express";
import {
  createConversation,
  saveMessage,
  getHistory,
  listMessages
} from "../services/chat.service";
import { generateReply } from "../services/llm.service";

const router = Router();

router.post("/message", async (req, res) => {
  try {
    let { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    if (message.length > 1000) {
      message = message.slice(0, 1000);
    }

    if (!sessionId) {
      sessionId = await createConversation();
    }

    await saveMessage(sessionId, "user", message);

    const history = await getHistory(sessionId);
    const reply = await generateReply(history, message);

    await saveMessage(sessionId, "ai", reply);

    res.json({ reply, sessionId });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      reply: "Our support agent is temporarily unavailable. Please try again shortly.",
      sessionId
    });
  }
});

router.get("/:sessionId/history", async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: "Session id is required" });
  }

  try {
    const messages = await listMessages(sessionId);
    if (!messages.length) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ sessionId, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to load conversation history" });
  }
});

export default router;
