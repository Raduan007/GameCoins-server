"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const user_model_1 = __importDefault(require("../models/user.model"));
const game_model_1 = __importDefault(require("../models/game.model"));
const package_model_1 = __importDefault(require("../models/package.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const db_1 = __importDefault(require("../config/db"));
const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET;
function makeToken(userId, email, role) {
    return jsonwebtoken_1.default.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "1h" });
}
async function req(method, path, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token)
        headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}
async function main() {
    console.log("\n📋 Dashboard Orders Verification\n" + "=".repeat(50));
    await (0, db_1.default)();
    // Cleanup old test users
    await user_model_1.default.deleteMany({
        email: { $in: ["dashboard-orders-user-a@gamecoins.test", "dashboard-orders-user-b@gamecoins.test"] }
    });
    // Create test users
    const userA = await user_model_1.default.create({
        name: "Orders User A",
        email: "dashboard-orders-user-a@gamecoins.test",
        password: "Test@123",
        role: "user",
    });
    const userB = await user_model_1.default.create({
        name: "Orders User B",
        email: "dashboard-orders-user-b@gamecoins.test",
        password: "Test@123",
        role: "user",
    });
    const tokenA = makeToken(userA._id.toString(), userA.email, "user");
    // Test 1: No token
    console.log("\n🧪 Test 1: Access dashboard orders without token...");
    const t1 = await req("GET", "/dashboard/orders");
    console.log(`➡️ Status: ${t1.status}`);
    if (t1.status === 401) {
        console.log("🟢 PASS: Unauthenticated access blocked correctly.");
    }
    else {
        console.error("🔴 FAIL: Expected 401 Unauthorized.");
        process.exit(1);
    }
    // Test 2: Authenticated user with zero orders
    console.log("\n🧪 Test 2: Access with token (0 orders)...");
    const t2 = await req("GET", "/dashboard/orders", undefined, tokenA);
    console.log(`➡️ Status: ${t2.status}`);
    console.log("➡️ Data:", JSON.stringify(t2.data));
    if (t2.status === 200 &&
        t2.data?.success &&
        Array.isArray(t2.data?.data) &&
        t2.data?.data.length === 0 &&
        t2.data?.message === "No orders found") {
        console.log("🟢 PASS: Correct empty order list response returned.");
    }
    else {
        console.error("🔴 FAIL: Incorrect response for empty order list.");
        process.exit(1);
    }
    // Find or create Game and Package
    let game = await game_model_1.default.findOne({ isActive: true });
    if (!game) {
        game = await game_model_1.default.create({
            name: "Orders Test Game",
            slug: "orders-test-game",
            shortDescription: "Short desc",
            fullDescription: "Full desc",
            category: "Action",
            platform: "PC",
            publisher: "Test Pub",
            logo: "https://example.com/logo.png",
            banner: "https://example.com/banner.png",
            isActive: true,
        });
    }
    let pkg = await package_model_1.default.findOne({ game: game._id, isActive: true });
    if (!pkg) {
        pkg = await package_model_1.default.create({
            game: game._id,
            name: "Orders Test Package",
            amount: 100,
            price: 15,
            isActive: true,
        });
    }
    // Create multiple orders for User A with different timestamps (using custom createdAt via save to bypass defaults or creating one-by-one with delay)
    // Let's create Order A1, wait 100ms, then create Order A2
    console.log("Seeding orders for User A and User B...");
    const oA1 = await order_model_1.default.create({
        user: userA._id,
        game: game._id,
        package: pkg._id,
        playerId: "playerA1",
        quantity: 1,
        unitPrice: 15,
        totalPrice: 15,
        paymentMethod: "bkash",
        paymentStatus: "pending",
        orderStatus: "pending",
    });
    // Delay slightly to ensure distinct createdAt timestamps
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const oA2 = await order_model_1.default.create({
        user: userA._id,
        game: game._id,
        package: pkg._id,
        playerId: "playerA2",
        quantity: 2,
        unitPrice: 15,
        totalPrice: 30,
        paymentMethod: "nagad",
        paymentStatus: "paid",
        orderStatus: "completed",
    });
    // Create order for User B (to test security isolation)
    const oB = await order_model_1.default.create({
        user: userB._id,
        game: game._id,
        package: pkg._id,
        playerId: "playerB",
        quantity: 1,
        unitPrice: 15,
        totalPrice: 15,
        paymentMethod: "sslcommerz",
        paymentStatus: "pending",
        orderStatus: "pending",
    });
    // Test 3 & 4: Fetch User A's orders
    console.log("\n🧪 Test 3 & 4: Access with token (multiple orders & security isolation)...");
    const t3 = await req("GET", "/dashboard/orders", undefined, tokenA);
    console.log(`➡️ Status: ${t3.status}`);
    if (t3.status !== 200 || !t3.data?.success) {
        console.error("🔴 FAIL: Expected status 200 with success: true.");
        process.exit(1);
    }
    const orders = t3.data?.data;
    if (!Array.isArray(orders) || orders.length !== 2) {
        console.error(`🔴 FAIL: Expected exactly 2 orders for User A, got ${orders?.length}`);
        process.exit(1);
    }
    // Verify security: User B's order must not be present
    const containsUserBOrder = orders.some((o) => o.playerId === "playerB");
    if (containsUserBOrder) {
        console.error("🔴 FAIL (SECURITY): User B's orders were returned to User A.");
        process.exit(1);
    }
    else {
        console.log("🟢 PASS: Security isolation verified. User B's orders are absent.");
    }
    // Verify sorting: newest first (oA2 should be index 0, oA1 should be index 1)
    const isSortedCorrectly = orders[0]._id.toString() === oA2._id.toString() &&
        orders[1]._id.toString() === oA1._id.toString();
    if (isSortedCorrectly) {
        console.log("🟢 PASS: Sorting verified. Orders returned in newest-first order.");
    }
    else {
        console.error("🔴 FAIL: Sorting is incorrect. Expected oA2 first, then oA1.");
        console.error(`Index 0: ${orders[0].playerId}, Index 1: ${orders[1].playerId}`);
        process.exit(1);
    }
    // Verify population
    const firstOrder = orders[0];
    if (firstOrder.game &&
        typeof firstOrder.game === "object" &&
        firstOrder.game.name === game.name &&
        firstOrder.package &&
        typeof firstOrder.package === "object" &&
        firstOrder.package.name === pkg.name) {
        console.log("🟢 PASS: Populate verified. Game and Package are correctly populated.");
    }
    else {
        console.error("🔴 FAIL: Populate failed. Game or Package are not populated correctly.");
        console.error(`Game populated: ${typeof firstOrder.game === "object"}, Package populated: ${typeof firstOrder.package === "object"}`);
        process.exit(1);
    }
    // Cleanup test data
    await order_model_1.default.deleteMany({ _id: { $in: [oA1._id, oA2._id, oB._id] } });
    await user_model_1.default.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    console.log("\n🧹 Cleaned up test database resources.");
    await mongoose_1.default.disconnect();
    console.log("=".repeat(50));
    console.log("🟢 ALL DASHBOARD ORDERS TESTS PASSED!");
    console.log("=".repeat(50) + "\n");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=verify-dashboard-orders.js.map