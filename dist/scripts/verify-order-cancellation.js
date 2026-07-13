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
const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}`;
async function runOrderCancellationVerification() {
    console.log("--------------------------------------------------");
    console.log("🚀 Starting Order Cancellation API Verification Tests");
    console.log("--------------------------------------------------");
    try {
        await (0, db_1.default)();
        console.log("✅ Connected to Database successfully.");
        // 1. Setup test users
        const userEmail = "test-user-cancel@gamecoins.com";
        const adminEmail = "test-admin-cancel@gamecoins.com";
        const otherUserEmail = "test-other-cancel@gamecoins.com";
        const setupUser = async (email, role, name) => {
            let u = await user_model_1.default.findOne({ email });
            if (!u) {
                u = await user_model_1.default.create({
                    name,
                    email,
                    password: "mocked_hashed_password",
                    role,
                    isActive: true,
                });
            }
            return u;
        };
        const buyer = await setupUser(userEmail, "user", "Buyer User");
        const admin = await setupUser(adminEmail, "admin", "Admin User");
        const other = await setupUser(otherUserEmail, "user", "Other User");
        const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";
        const tokenBuyer = jsonwebtoken_1.default.sign({ userId: buyer._id.toString(), email: buyer.email, role: buyer.role }, jwtSecret, { expiresIn: "1h" });
        const tokenAdmin = jsonwebtoken_1.default.sign({ userId: admin._id.toString(), email: admin.email, role: admin.role }, jwtSecret, { expiresIn: "1h" });
        const tokenOther = jsonwebtoken_1.default.sign({ userId: other._id.toString(), email: other.email, role: other.role }, jwtSecret, { expiresIn: "1h" });
        // 2. Setup game and package
        let testGame = await game_model_1.default.findOne({ name: "Cancellation Test Game" });
        if (!testGame) {
            testGame = await game_model_1.default.create({
                name: "Cancellation Test Game",
                slug: "cancellation-test-game",
                shortDescription: "A game for testing cancellations",
                fullDescription: "Long description for testing cancellations",
                category: "Action",
                platform: "PC",
                publisher: "GameCoins Test Lab",
                logo: "http://logo.com/img.png",
                banner: "http://logo.com/banner.png",
                isActive: true,
            });
        }
        let testPackage = await package_model_1.default.findOne({ name: "100 Coins Package" });
        if (!testPackage) {
            testPackage = await package_model_1.default.create({
                game: testGame._id,
                name: "100 Coins Package",
                amount: 100,
                price: 1.00,
                currency: "USD",
                description: "Cancellation coins package",
                isPopular: true,
                isActive: true,
            });
        }
        // Helper constructor for test orders
        const createTestOrder = async (orderStatus) => {
            return order_model_1.default.create({
                user: buyer._id,
                game: testGame._id,
                package: testPackage._id,
                playerId: "player111",
                playerName: "Buyer One",
                quantity: 1,
                unitPrice: 1.00,
                totalPrice: 1.00,
                paymentMethod: "bkash",
                paymentStatus: "pending",
                orderStatus,
            });
        };
        // Create test orders
        const orderPending = await createTestOrder("pending");
        const orderCompleted = await createTestOrder("completed");
        const orderCancelled = await createTestOrder("cancelled");
        console.log("📦 Created orderPending ID:", orderPending._id);
        console.log("📦 Created orderCompleted ID:", orderCompleted._id);
        console.log("📦 Created orderCancelled ID:", orderCancelled._id);
        // Helper request patcher
        async function sendCancelRequest(orderId, token) {
            const headers = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
                method: "PATCH",
                headers,
            });
            const text = await response.text();
            let resBody = {};
            try {
                resBody = JSON.parse(text);
            }
            catch {
                resBody = { raw: text };
            }
            return { status: response.status, body: resBody };
        }
        // Test 1: Unauthenticated request
        console.log("\n🧪 Test Case 1: Cancel order without token (unauthenticated)...");
        const res1 = await sendCancelRequest(orderPending._id.toString());
        console.log(`➡️ Status: ${res1.status}, Error:`, res1.body.error);
        if (res1.status === 401) {
            console.log("🟢 SUCCESS: Correctly blocked unauthenticated request.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 401.");
        }
        // Test 2: Cancel pending order by owner (buyer)
        console.log("\n🧪 Test Case 2: Cancel pending order by owner (buyer)...");
        const res2 = await sendCancelRequest(orderPending._id.toString(), tokenBuyer);
        console.log(`➡️ Status: ${res2.status}`);
        if (res2.status === 200 && res2.body.success) {
            console.log("🟢 SUCCESS: Owner successfully cancelled the order.");
            console.log(`🔍 Updated Order Status: "${res2.body.data.orderStatus}"`);
            if (res2.body.data.orderStatus === "cancelled") {
                console.log("🟢 SUCCESS: orderStatus correctly updated to 'cancelled'.");
            }
            else {
                console.log("🔴 FAILURE: orderStatus not updated to 'cancelled'.");
            }
        }
        else {
            console.log("🔴 FAILURE: Owner failed to cancel the order.");
        }
        // Test 3: Cancel already cancelled order
        console.log("\n🧪 Test Case 3: Cancel already cancelled order...");
        const res3 = await sendCancelRequest(orderCancelled._id.toString(), tokenBuyer);
        console.log(`➡️ Status: ${res3.status}, Error:`, res3.body.error);
        if (res3.status === 400 && res3.body.error?.includes("already cancelled")) {
            console.log("🟢 SUCCESS: Correctly blocked cancelling an already cancelled order.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 400 with 'already cancelled' error.");
        }
        // Test 4: Cancel completed order
        console.log("\n🧪 Test Case 4: Cancel completed order...");
        const res4 = await sendCancelRequest(orderCompleted._id.toString(), tokenBuyer);
        console.log(`➡️ Status: ${res4.status}, Error:`, res4.body.error);
        if (res4.status === 400 && res4.body.error?.includes("Completed orders cannot be cancelled")) {
            console.log("🟢 SUCCESS: Correctly blocked cancelling a completed order.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 400 with 'completed orders cannot be cancelled' error.");
        }
        // Test 5: Cancel by admin (non-owner)
        console.log("\n🧪 Test Case 5: Cancel pending order by admin...");
        const orderPendingAdmin = await createTestOrder("pending");
        const res5 = await sendCancelRequest(orderPendingAdmin._id.toString(), tokenAdmin);
        console.log(`➡️ Status: ${res5.status}`);
        if (res5.status === 200 && res5.body.success) {
            console.log("🟢 SUCCESS: Admin successfully cancelled a non-owned pending order.");
            await order_model_1.default.deleteOne({ _id: orderPendingAdmin._id });
        }
        else {
            console.log("🔴 FAILURE: Admin failed to cancel the order.");
        }
        // Test 6: Cancel by other user (non-owner, non-admin)
        console.log("\n🧪 Test Case 6: Cancel pending order by another user...");
        const orderPendingOther = await createTestOrder("pending");
        const res6 = await sendCancelRequest(orderPendingOther._id.toString(), tokenOther);
        console.log(`➡️ Status: ${res6.status}, Error:`, res6.body.error);
        if (res6.status === 403) {
            console.log("🟢 SUCCESS: Correctly blocked non-owner, non-admin cancellation.");
            await order_model_1.default.deleteOne({ _id: orderPendingOther._id });
        }
        else {
            console.log("🔴 FAILURE: Expected status 403.");
        }
        // Cleanup
        await order_model_1.default.deleteMany({ _id: { $in: [orderPending._id, orderCompleted._id, orderCancelled._id] } });
        console.log("\n🧹 Cleaned up details cancellation orders from database.");
        console.log("\n--------------------------------------------------");
        console.log("🏁 Verification Tests Completed");
        console.log("--------------------------------------------------");
    }
    catch (error) {
        console.error("❌ Verification tests encountered an error:", error);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
runOrderCancellationVerification();
//# sourceMappingURL=verify-order-cancellation.js.map