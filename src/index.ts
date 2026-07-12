import "dotenv/config";
import express from "express";
import cors from "cors";
import gameRoutes from "./routes/game.routes";
import packageRoutes from "./routes/package.routes";
import { errorHandler } from "./middleware/errorHandler";

import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ success: true, message: "GameCoins server running" });
});

// Routes
app.use("/api/games", gameRoutes);
app.use("/api/packages", packageRoutes);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GameCoins server running on http://localhost:${PORT}`);
});

export default app;