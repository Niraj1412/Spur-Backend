import app from "./app";
import { initDb } from "./config/db";

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.warn("Failed to initialize database, defaulting to in-memory mode:", err.message);
    // process.exit(1); // Don't crash, allow in-memory fallback
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT} (In-Memory Mode)`);
    });
  });
