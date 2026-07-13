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
const payment_model_1 = __importDefault(require("../models/payment.model"));
const db_1 = __importDefault(require("../config/db"));
const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}`;
async function runPaymentStatusVerification() {
    console.log("--------------------------------------------------");
    console.log("🚀 Starting Admin Update Payment Status Verification Tests");
    console.log("--------------------------------------------------");
    try {
        await (0, db_1.default)();
        console.log("✅ Connected to Database successfully.");
        // 1. Setup test users
        const userEmail = "test-user-pay-status@gamecoins.com";
        const adminEmail = "test-admin-pay-status@gamecoins.com";
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
        let testGame = await game_model_1.default.findOne({ name: "Pay Status Test Game" });
        if (!testGame) {
            testGame = await game_model_1.default.create({
                name: "Pay Status Test Game",
                slug: "pay-status-test-game",
                shortDescription: "A game for testing pay status",
                fullDescription: "Long description for testing pay status",
                category: "Action",
                platform: "PC",
                publisher: "GameCoins Test Lab",
                logo: "http://logo.com/img.png",
                banner: "http://logo.com/banner.png",
                isActive: true,
            });
        }
        let testPackage = await package_model_1.default.findOne({ name: "15 Coins Package" });
        if (!testPackage) {
            testPackage = await package_model_1.default.create({
                game: testGame._id,
                name: "15 Coins Package",
                amount: 15,
                price: 0.15,
                currency: "USD",
                description: "Pay Status coins package",
                isPopular: true,
                isActive: true,
            });
        }
        // 3. Create test order for buyer
        const testOrder = await order_model_1.default.create({
            user: buyer._id,
            game: testGame._id,
            package: testPackage._id,
            playerId: "playerStatus333",
            playerName: "Buyer Status Test",
            quantity: 1,
            unitPrice: 0.15,
            totalPrice: 0.15,
            paymentMethod: "bkash",
            paymentStatus: "pending",
            orderStatus: "pending",
        });
        // 4. Create payment
        const testPayment = await payment_model_1.default.create({
            user: buyer._id,
            order: testOrder._id,
            amount: 0.15,
            paymentMethod: "bkash",
            paymentStatus: "pending",
        });
        console.log(`📦 Created order ID: ${testOrder._id} and payment ID: ${testPayment._id}`);
        // Helper request patcher
        async function sendStatusPatchRequest(paymentId, body, token) {
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            const response = await fetch(`${API_URL}/api/payments/${paymentId}/status`, {
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
        console.log("\n🧪 Test Case 1: Update payment status without token (unauthenticated)...");
        const res1 = await sendStatusPatchRequest(testPayment._id.toString(), { paymentStatus: "paid" });
        console.log(`➡️ Status: ${res1.status}, Error:`, res1.body.error);
        if (res1.status === 401) {
            console.log("🟢 SUCCESS: Correctly blocked unauthenticated request.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 401.");
        }
        // Test 2: Regular user request (Forbidden)
        console.log("\n🧪 Test Case 2: Update payment status by normal user...");
        const res2 = await sendStatusPatchRequest(testPayment._id.toString(), { paymentStatus: "paid" }, tokenBuyer);
        console.log(`➡️ Status: ${res2.status}, Error:`, res2.body.error);
        if (res2.status === 403) {
            console.log("🟢 SUCCESS: Correctly blocked non-admin user request.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 403.");
        }
        // Test 3: Update with invalid payment status (400)
        console.log("\n🧪 Test Case 3: Update with invalid status value...");
        const res3 = await sendStatusPatchRequest(testPayment._id.toString(), { paymentStatus: "invalid_status" }, tokenAdmin);
        console.log(`➡️ Status: ${res3.status}, Error:`, res3.body.error);
        if (res3.status === 400 && res3.body.error?.includes("Invalid payment status")) {
            console.log("🟢 SUCCESS: Correctly rejected invalid payment status.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 400 with 'Invalid payment status' error.");
        }
        // Test 4: Successful update by admin to paid, verifying order synchronization
        console.log("\n🧪 Test Case 4: Admin updates payment status to paid...");
        const res4 = await sendStatusPatchRequest(testPayment._id.toString(), { paymentStatus: "paid" }, tokenAdmin);
        console.log(`➡️ Status: ${res4.status}`);
        if (res4.status === 200 && res4.body.success) {
            console.log("🟢 SUCCESS: Admin successfully updated payment status.");
            console.log(`🔍 Updated paymentStatus: "${res4.body.data.paymentStatus}" (should be paid)`);
            // Fetch related order to check status
            const updatedOrder = await order_model_1.default.findById(testOrder._id);
            if (updatedOrder) {
                console.log(`🔍 Synchronized Order status: "${updatedOrder.orderStatus}" (should be completed)`);
                console.log(`🔍 Synchronized Order paymentStatus: "${updatedOrder.paymentStatus}" (should be paid)`);
                if (updatedOrder.orderStatus === "completed" && updatedOrder.paymentStatus === "paid" && res4.body.data.paymentStatus === "paid") {
                    console.log("🟢 SUCCESS: Payment and related order status correctly synchronized.");
                }
                else {
                    console.log("🔴 FAILURE: Sync failed. Statuses mismatch.");
                }
            }
            else {
                console.log("🔴 FAILURE: Related order not found.");
            }
        }
        else {
            console.log("🔴 FAILURE: Admin update request failed.");
        }
        // Test 5: Update non-existent payment ID (404)
        console.log("\n🧪 Test Case 5: Update non-existing payment ID...");
        const res5 = await sendStatusPatchRequest(new mongoose_1.default.Types.ObjectId().toString(), { paymentStatus: "paid" }, tokenAdmin);
        console.log(`➡️ Status: ${res5.status}, Error:`, res5.body.error);
        if (res5.status === 404) {
            console.log("🟢 SUCCESS: Correctly returned 404 for missing payment ID.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 404.");
        }
        // Cleanup
        await payment_model_1.default.deleteMany({ _id: testPayment._id });
        await order_model_1.default.deleteMany({ _id: testOrder._id });
        console.log("\n🧹 Cleaned up details test status verification records from database.");
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
runPaymentStatusVerification();
//# sourceMappingURL=verify-payment-status.js.map