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
    console.error("Failed to initialize database", err);
    process.exit(1);
  });
