import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY,
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
