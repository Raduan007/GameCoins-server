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
async function runPaymentDetailsVerification() {
    console.log("--------------------------------------------------");
    console.log("🚀 Starting Payment Details API Verification Tests");
    console.log("--------------------------------------------------");
    try {
        await (0, db_1.default)();
        console.log("✅ Connected to Database successfully.");
        // 1. Setup test users
        const userEmail = "test-user-pay-details@gamecoins.com";
        const adminEmail = "test-admin-pay-details@gamecoins.com";
        const otherUserEmail = "test-other-pay-details@gamecoins.com";
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
        let testGame = await game_model_1.default.findOne({ name: "Pay Details Test Game" });
        if (!testGame) {
            testGame = await game_model_1.default.create({
                name: "Pay Details Test Game",
                slug: "pay-details-test-game",
                shortDescription: "A game for testing pay details",
                fullDescription: "Long description for testing pay details",
                category: "Action",
                platform: "PC",
                publisher: "GameCoins Test Lab",
                logo: "http://logo.com/img.png",
                banner: "http://logo.com/banner.png",
                isActive: true,
            });
        }
        let testPackage = await package_model_1.default.findOne({ name: "10 Coins Package" });
        if (!testPackage) {
            testPackage = await package_model_1.default.create({
                game: testGame._id,
                name: "10 Coins Package",
                amount: 10,
                price: 0.10,
                currency: "USD",
                description: "Pay Details coins package",
                isPopular: true,
                isActive: true,
            });
        }
        // 3. Create order for buyer
        const testOrder = await order_model_1.default.create({
            user: buyer._id,
            game: testGame._id,
            package: testPackage._id,
            playerId: "playerDetails555",
            playerName: "Buyer Details Test",
            quantity: 1,
            unitPrice: 0.10,
            totalPrice: 0.10,
            paymentMethod: "nagad",
            paymentStatus: "pending",
            orderStatus: "pending",
        });
        // 4. Create payment
        const testPayment = await payment_model_1.default.create({
            user: buyer._id,
            order: testOrder._id,
            amount: 0.10,
            paymentMethod: "nagad",
            paymentStatus: "pending",
        });
        console.log(`📦 Created order ID: ${testOrder._id} and payment ID: ${testPayment._id}`);
        // Helper request fetcher
        async function getPaymentDetailsRequest(paymentId, token) {
            const headers = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            const response = await fetch(`${API_URL}/api/payments/${paymentId}`, {
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
        console.log("\n🧪 Test Case 1: Fetch payment details without token (unauthenticated)...");
        const res1 = await getPaymentDetailsRequest(testPayment._id.toString());
        console.log(`➡️ Status: ${res1.status}, Error:`, res1.body.error);
        if (res1.status === 401) {
            console.log("🟢 SUCCESS: Correctly blocked unauthenticated request.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 401.");
        }
        // Test 2: Fetch by owner (buyer)
        console.log("\n🧪 Test Case 2: Fetch payment details by owner...");
        const res2 = await getPaymentDetailsRequest(testPayment._id.toString(), tokenBuyer);
        console.log(`➡️ Status: ${res2.status}`);
        if (res2.status === 200 && res2.body.success) {
            console.log("🟢 SUCCESS: Owner successfully fetched payment details.");
            console.log("\n🔍 Checking population:");
            console.log(`Populated User name: "${res2.body.data.user?.name}", Email: "${res2.body.data.user?.email}"`);
            console.log(`Populated Order playerId: "${res2.body.data.order?.playerId}"`);
            console.log(`Populated Nested Game name: "${res2.body.data.order?.game?.name}"`);
            if (res2.body.data.user?.name === "Buyer User" &&
                res2.body.data.user?.email === "test-user-pay-details@gamecoins.com" &&
                res2.body.data.order?.playerId === "playerDetails555" &&
                res2.body.data.order?.game?.name === "Pay Details Test Game") {
                console.log("🟢 SUCCESS: User and nested Order details populated correctly.");
            }
            else {
                console.log("🔴 FAILURE: Populated fields resolved incorrectly.");
            }
        }
        else {
            console.log("🔴 FAILURE: Owner failed to fetch details.");
        }
        // Test 3: Fetch by admin
        console.log("\n🧪 Test Case 3: Fetch payment details by admin (non-owner)...");
        const res3 = await getPaymentDetailsRequest(testPayment._id.toString(), tokenAdmin);
        console.log(`➡️ Status: ${res3.status}`);
        if (res3.status === 200 && res3.body.success) {
            console.log("🟢 SUCCESS: Admin successfully fetched details.");
        }
        else {
            console.log("🔴 FAILURE: Admin failed to fetch details.");
        }
        // Test 4: Fetch by other user (non-owner, non-admin)
        console.log("\n🧪 Test Case 4: Fetch payment details by other user...");
        const res4 = await getPaymentDetailsRequest(testPayment._id.toString(), tokenOther);
        console.log(`➡️ Status: ${res4.status}, Error:`, res4.body.error);
        if (res4.status === 403) {
            console.log("🟢 SUCCESS: Correctly blocked unauthorized access.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 403.");
        }
        // Test 5: Fetch non-existent payment ID
        console.log("\n... Test Case 5: Fetch details with non-existent payment ID...");
        const res5 = await getPaymentDetailsRequest(new mongoose_1.default.Types.ObjectId().toString(), tokenBuyer);
        console.log(`➡️ Status: ${res5.status}, Error:`, res5.body.error);
        if (res5.status === 404) {
            console.log("🟢 SUCCESS: Correctly returned 404 for missing ID.");
        }
        else {
            console.log("🔴 FAILURE: Expected status 404.");
        }
        // Cleanup
        await payment_model_1.default.deleteMany({ _id: testPayment._id });
        await order_model_1.default.deleteMany({ _id: testOrder._id });
        console.log("\n🧹 Cleaned up details test records from database.");
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
runPaymentDetailsVerification();
//# sourceMappingURL=verify-payment-details.js.map