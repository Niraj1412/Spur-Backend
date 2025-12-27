import { pool } from "../config/db";
import { v4 as uuid } from "uuid";

export async function createConversation(): Promise<string> {
  const id = uuid();
  await pool.query("INSERT INTO conversations (id) VALUES ($1)", [id]);
  return id;
}

export async function saveMessage(
  conversationId: string,
  sender: "user" | "ai",
  text: string
) {
  await pool.query(
    "INSERT INTO messages (id, conversation_id, sender, text) VALUES ($1,$2,$3,$4)",
    [uuid(), conversationId, sender, text]
  );
}

export async function getHistory(conversationId: string) {
  const result = await pool.query(
    "SELECT sender, text FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",
    [conversationId]
  );

  return result.rows.map((r: { sender: string; text: string }) => ({
    role: r.sender === "user" ? ("user" as const) : ("assistant" as const),
    content: r.text
  }));
}

export async function listMessages(conversationId: string) {
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
}
