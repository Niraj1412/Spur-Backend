import express from "express";
import cors from "cors";
import "./config/env";
import chatRoutes from "./routes/chat";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/chat", chatRoutes);

export default app;
