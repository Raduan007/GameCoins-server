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
async function runOrderStatusUpdateVerification() {
    console.log("--------------------------------------------------");
    console.log("🚀 Starting Admin Update Order Status Verification Tests");
    console.log("--------------------------------------------------");
    try {
        await (0, db_1.default)();
        console.log("✅ Connected to Database successfully.");
        // 1. Setup test users
        const userEmail = "test-user-status@gamecoins.com";
        const adminEmail = "test-admin-status@gamecoins.com";
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
        const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";
        const tokenBuyer = jsonwebtoken_1.default.sign({ userId: buyer._id.toString(), email: buyer.email, role: buyer.role }, jwtSecret, { expiresIn: "1h" });
        const tokenAdmin = jsonwebtoken_1.default.sign({ userId: admin._id.toString(), email: admin.email, role: admin.role }, jwtSecret, { expiresIn: "1h" });
        // 2. Setup game and package
        let testGame = await game_model_1.default.findOne({ name: "Status Test Game" });
        if (!testGame) {
            testGame = await game_model_1.default.create({
                name: "Status Test Game",
                slug: "status-test-game",
                shortDescription: "A game for testing status",
                fullDescription: "Long description for testing status",
                category: "Action",
                platform: "PC",
                publisher: "GameCoins Test Lab",
                logo: "http://logo.com/img.png",
                banner: "http://logo.com/banner.png",
                isActive: true,
            });
        }
        let testPackage = await package_model_1.default.findOne({ name: "50 Coins Package" });
        if (!testPackage) {
            testPackage = await package_model_1.default.create({
                game: testGame._id,
                name: "50 Coins Package",
                amount: 50,
                price: 0.50,
                currency: "USD",
                description: "Status coins package",
                isPopular: true,
                isActive: true,
            });
        }
        // 3. Create test order
        const testOrder = await order_model_1.default.create({
            user: buyer._id,
            game: testGame._id,
            package: testPackage._id,
            playerId: "player222",
            playerName: "Buyer Status Test",
            quantity: 1,
            unitPrice: 0.50,
            totalPrice: 0.50,
            paymentMethod: "cod",
            paymentStatus: "pending",
            orderStatus: "pending",
        });
        console.log(`📦 Created verification test order with ID: ${testOrder._id}`);
        // Helper request patcher
        async function sendStatusUpdateRequest(orderId, body, token) {
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
                method: "PATCH",
                headers,
                body: JSON.stringify(body),
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
        console.log("\n🧪 Test Case 1: Update order status without token (unauthenticated)...");
        const res1 = await sendStatusUpdateRequest(testOrder._id.toString(), { orderStatus: "processing" });
        console.log(`➡️ Status: ${res1.status}, Error:`, res1.body.error);
        if (res1.status === 401) {
            console.log("🟢 SUCCESS: Correctly blocked unauthenticated request.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 401.");
        }
        // Test 2: Non-Admin request (Forbidden)
        console.log("\n🧪 Test Case 2: Update order status with regular user token (non-admin)...");
        const res2 = await sendStatusUpdateRequest(testOrder._id.toString(), { orderStatus: "processing" }, tokenBuyer);
        console.log(`➡️ Status: ${res2.status}, Error:`, res2.body.error);
        if (res2.status === 403) {
            console.log("🟢 SUCCESS: Correctly blocked non-admin user request.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 403.");
        }
        // Test 3: Admin request with invalid status (400)
        console.log("\n🧪 Test Case 3: Update order status with invalid status value...");
        const res3 = await sendStatusUpdateRequest(testOrder._id.toString(), { orderStatus: "invalid_status_value" }, tokenAdmin);
        console.log(`➡️ Status: ${res3.status}, Error:`, res3.body.error);
        if (res3.status === 400 && res3.body.error?.includes("Invalid order status")) {
            console.log("🟢 SUCCESS: Correctly rejected invalid order status.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 400 with 'Invalid order status' error.");
        }
        // Test 4: Successful admin update
        console.log("\n🧪 Test Case 4: Successful update by admin (orderStatus='processing', paymentStatus='paid')...");
        const res4 = await sendStatusUpdateRequest(testOrder._id.toString(), { orderStatus: "processing", paymentStatus: "paid" }, tokenAdmin);
        console.log(`➡️ Status: ${res4.status}`);
        if (res4.status === 200 && res4.body.success) {
            console.log("🟢 SUCCESS: Admin successfully updated the order status.");
            console.log(`🔍 Updated orderStatus: "${res4.body.data.orderStatus}" (should be processing)`);
            console.log(`🔍 Updated paymentStatus: "${res4.body.data.paymentStatus}" (should be paid)`);
            if (res4.body.data.orderStatus === "processing" && res4.body.data.paymentStatus === "paid") {
                console.log("🟢 SUCCESS: Properties correctly saved in database.");
            }
            else {
                console.log("🔴 FAILURE: Properties not correctly updated.");
            }
        }
        else {
            console.log("🔴 FAILURE: Admin failed to update order.");
        }
        // Cleanup
        await order_model_1.default.deleteOne({ _id: testOrder._id });
        console.log("\n🧹 Cleaned up status update test order from database.");
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
runOrderStatusUpdateVerification();
//# sourceMappingURL=verify-order-status-update.js.map