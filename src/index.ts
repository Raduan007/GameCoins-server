import "dotenv/config";
import express from "express";
import cors from "cors";
import gameRoutes from "./routes/game.routes";
import packageRoutes from "./routes/package.routes";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import adminRoutes from "./routes/admin.routes";
import { errorHandler } from "./middleware/errorHandler";
import connectDB from "./config/db";

import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://game-coins-client-delta.vercel.app",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ success: true, message: "GameCoins server running" });
});

// Routes
app.use("/api/games", gameRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dashboard/admin", adminRoutes);

// Global error handler (must be last)
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 GameCoins server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;