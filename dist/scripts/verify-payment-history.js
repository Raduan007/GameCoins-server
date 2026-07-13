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
async function runPaymentHistoryVerification() {
    console.log("--------------------------------------------------");
    console.log("🚀 Starting Payment History API Verification Tests");
    console.log("--------------------------------------------------");
    try {
        await (0, db_1.default)();
        console.log("✅ Connected to Database successfully.");
        // 1. Setup test user
        const userEmail = "test-user-pay-history@gamecoins.com";
        let testUser = await user_model_1.default.findOne({ email: userEmail });
        if (!testUser) {
            testUser = await user_model_1.default.create({
                name: "Test Payment History Buyer",
                email: userEmail,
                password: "mocked_hashed_password",
                role: "user",
                isActive: true,
            });
        }
        const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";
        const userToken = jsonwebtoken_1.default.sign({ userId: testUser._id.toString(), email: testUser.email, role: testUser.role }, jwtSecret, { expiresIn: "1h" });
        console.log("🔑 Generated user JWT token.");
        // Ensure we start with no payments/orders for this user
        await payment_model_1.default.deleteMany({ user: testUser._id });
        await order_model_1.default.deleteMany({ user: testUser._id });
        // Helper request fetcher
        async function getPaymentHistoryRequest(token) {
            const headers = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            const response = await fetch(`${API_URL}/api/payments`, {
                method: "GET",
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
        console.log("\n🧪 Test Case 1: Fetch payment history without token (unauthenticated)...");
        const res1 = await getPaymentHistoryRequest();
        console.log(`➡️ Status: ${res1.status}, Error:`, res1.body.error);
        if (res1.status === 401) {
            console.log("🟢 SUCCESS: Correctly blocked unauthenticated request.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 401.");
        }
        // Test 2: Fetch history with no payments
        console.log("\n🧪 Test Case 2: Fetch payment history with zero payments...");
        const res2 = await getPaymentHistoryRequest(userToken);
        console.log(`➡️ Status: ${res2.status}`);
        console.log(`➡️ Message: "${res2.body.message}"`);
        console.log(`➡️ Data Length: ${res2.body.data.length}`);
        if (res2.status === 200 && res2.body.data.length === 0 && res2.body.message === "No payments found") {
            console.log("🟢 SUCCESS: Correctly returned empty payment history.");
        }
        else {
            console.log("🔴 FAILURE: Expected empty history response.");
        }
        // Test 3: Setup populated payment history
        console.log("\n🧪 Test Case 3: Create order and payment, and fetch history...");
        // Setup test game and package
        let testGame = await game_model_1.default.findOne({ name: "Pay Hist Test Game" });
        if (!testGame) {
            testGame = await game_model_1.default.create({
                name: "Pay Hist Test Game",
                slug: "pay-hist-test-game",
                shortDescription: "A game for testing pay history",
                fullDescription: "Long description for testing pay history",
                category: "Action",
                platform: "PC",
                publisher: "GameCoins Test Lab",
                logo: "http://logo.com/logo.png",
                banner: "http://logo.com/banner.png",
                isActive: true,
            });
        }
        let testPackage = await package_model_1.default.findOne({ name: "300 Coins Package" });
        if (!testPackage) {
            testPackage = await package_model_1.default.create({
                game: testGame._id,
                name: "300 Coins Package",
                amount: 300,
                price: 3.00,
                currency: "USD",
                description: "Pay Hist coins package",
                isPopular: true,
                isActive: true,
            });
        }
        // Create order
        const testOrder = await order_model_1.default.create({
            user: testUser._id,
            game: testGame._id,
            package: testPackage._id,
            playerId: "playerHist999",
            playerName: "Hist Buyer",
            quantity: 1,
            unitPrice: 3.00,
            totalPrice: 3.00,
            paymentMethod: "nagad",
            paymentStatus: "pending",
            orderStatus: "pending",
        });
        // Create payment
        const testPayment = await payment_model_1.default.create({
            user: testUser._id,
            order: testOrder._id,
            amount: 3.00,
            paymentMethod: "nagad",
            paymentStatus: "pending",
        });
        console.log(`📦 Created order ID: ${testOrder._id} and payment ID: ${testPayment._id}`);
        // Fetch history
        const res3 = await getPaymentHistoryRequest(userToken);
        console.log(`➡️ Status: ${res3.status}`);
        console.log(`➡️ Message: "${res3.body.message}"`);
        console.log(`➡️ Data Length: ${res3.body.data.length}`);
        if (res3.status === 200 && res3.body.data.length === 1) {
            console.log("🟢 SUCCESS: Correctly returned payment history record.");
            const returnedPayment = res3.body.data[0];
            console.log("\n🔍 Checking population:");
            console.log(`Populated Order playerId: "${returnedPayment.order?.playerId}"`);
            console.log(`Populated Nested Game name: "${returnedPayment.order?.game?.name}"`);
            console.log(`Populated Nested Package name: "${returnedPayment.order?.package?.name}"`);
            if (returnedPayment.order?.playerId === "playerHist999" &&
                returnedPayment.order?.game?.name === "Pay Hist Test Game" &&
                returnedPayment.order?.package?.name === "300 Coins Package") {
                console.log("🟢 SUCCESS: Nested population of Order -> Game & Package resolved correctly.");
            }
            else {
                console.log("🔴 FAILURE: Populated fields resolved incorrectly.");
            }
        }
        else {
            console.log("🔴 FAILURE: Failed to return populated payment history.");
        }
        // Cleanup
        await payment_model_1.default.deleteMany({ user: testUser._id });
        await order_model_1.default.deleteMany({ user: testUser._id });
        console.log("\n🧹 Cleaned up verification database records.");
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
runPaymentHistoryVerification();
//# sourceMappingURL=verify-payment-history.js.map