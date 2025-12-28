# Spur AI Live Chat Agent - Backend

## Local Development

### Prerequisites
- Node.js (v18+)
- (Optional) PostgreSQL if you want persistence

### Steps
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Configure environment:
   - Copy `backend/.env.example` to `backend/.env`.
   - Set at least one LLM key:
     - `GEMINI_API_KEY=your_gemini_key`
     - `ANTHROPIC_API_KEY=your_anthropic_key`
   - Optional: set `DATABASE_URL` to enable Postgres.
3. Start the server:
   ```bash
   npm run dev
   ```
   The API runs at `http://localhost:4000`.

### Notes
- If Postgres is not configured or fails to connect, the service falls back to in-memory storage.
