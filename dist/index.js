"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const game_routes_1 = __importDefault(require("./routes/game.routes"));
const package_routes_1 = __importDefault(require("./routes/package.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setServers(["8.8.8.8", "8.8.4.4"]);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
// Health check
app.get("/health", (_req, res) => {
    res.json({ success: true, message: "GameCoins server running" });
});
// Routes
app.use("/api/games", game_routes_1.default);
app.use("/api/packages", package_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
// Global error handler (must be last)
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`GameCoins server running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map