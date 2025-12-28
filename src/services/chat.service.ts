import { pool } from "../config/db";
import { v4 as uuid } from "uuid";

const mockConversations = new Set<string>();
interface MockMessage {
  id: string;
  conversation_id: string;
  sender: "user" | "ai";
  text: string;
  created_at: Date;
}
const mockMessages: MockMessage[] = [];

export async function createConversation(): Promise<string> {
  const id = uuid();
  try {
    await pool.query("INSERT INTO conversations (id) VALUES ($1)", [id]);
  } catch (err) {
    console.warn("DB Error (createConversation), using in-memory:", (err as Error).message);
    mockConversations.add(id);
  }
  return id;
}

export async function saveMessage(
  conversationId: string,
  sender: "user" | "ai",
  text: string
) {
  const id = uuid();
  try {
    await pool.query(
      "INSERT INTO messages (id, conversation_id, sender, text) VALUES ($1,$2,$3,$4)",
      [id, conversationId, sender, text]
    );
  } catch (err) {
    console.warn("DB Error (saveMessage), using in-memory:", (err as Error).message);
    mockMessages.push({
      id,
      conversation_id: conversationId,
      sender,
      text,
      created_at: new Date()
    });
  }
}

export async function getHistory(conversationId: string) {
  try {
    const result = await pool.query(
      "SELECT sender, text FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",
      [conversationId]
    );

    return result.rows.map((r: { sender: string; text: string }) => ({
      role: r.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: r.text
    }));
  } catch (err) {
    console.warn("DB Error (getHistory), using in-memory:", (err as Error).message);
    return mockMessages
      .filter(m => m.conversation_id === conversationId)
      .map(m => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text
      }));
  }
}

export async function listMessages(conversationId: string) {
  try {
    const result = await pool.query(
      "SELECT id, sender, text, created_at FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",
      [conversationId]
    );

    return result.rows.map((r: { id: string; sender: "user" | "ai"; text: string; created_at: Date }) => ({
      id: r.id,
      sender: r.sender,
      text: r.text,
      createdAt: r.created_at
    }));
  } catch (err) {
    console.warn("DB Error (listMessages), using in-memory:", (err as Error).message);
    return mockMessages
      .filter(m => m.conversation_id === conversationId)
      .map(m => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        createdAt: m.created_at
      }));
  }
}
