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
const db_1 = __importDefault(require("../config/db"));
const user_model_1 = __importDefault(require("../models/user.model"));
const game_model_1 = __importDefault(require("../models/game.model"));
const package_model_1 = __importDefault(require("../models/package.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const index_1 = __importDefault(require("../index"));
async function runVerification() {
    console.log("==================================================");
    console.log("🚀 Starting Admin Reports & Analytics Verification");
    console.log("==================================================");
    let listener;
    let testOrderId = null;
    let testUserId = null;
    let testAdminId = null;
    const userEmail = "test-reports-user@gamecoins.com";
    const adminEmail = "test-reports-admin@gamecoins.com";
    try {
        await (0, db_1.default)();
        console.log("✅ Database connected successfully.");
        // Clean up stale users
        await user_model_1.default.deleteMany({ email: { $in: [userEmail, adminEmail] } }).catch(() => { });
        let testUser = await user_model_1.default.create({
            name: "Reports Test Buyer",
            email: userEmail,
            password: "mocked_hashed_password",
            role: "user",
            isActive: true,
        });
        testUserId = testUser._id.toString();
        let testAdmin = await user_model_1.default.create({
            name: "Reports Test Admin",
            email: adminEmail,
            password: "mocked_hashed_password",
            role: "admin",
            isActive: true,
        });
        testAdminId = testAdmin._id.toString();
        const jwtSecret = process.env.JWT_SECRET || "super_secret_gamecoins_key";
        const userToken = jsonwebtoken_1.default.sign({ userId: testUserId, email: testUser.email, role: testUser.role }, jwtSecret, { expiresIn: "1h" });
        const adminToken = jsonwebtoken_1.default.sign({ userId: testAdminId, email: testAdmin.email, role: testAdmin.role }, jwtSecret, { expiresIn: "1h" });
        // Clean up existing test data
        await order_model_1.default.deleteMany({ playerId: "verify-reports-player" }).catch(() => { });
        await package_model_1.default.deleteMany({ name: "Reports Test Package" }).catch(() => { });
        await game_model_1.default.deleteMany({ slug: "test-reports-game" }).catch(() => { });
        // Get or create a real game and package for the order
        const testGame = await game_model_1.default.create({
            name: "Reports Test Game",
            slug: "test-reports-game",
            shortDescription: "Test game for reports verification",
            fullDescription: "Full description for reports verification test game.",
            category: "Test",
            platform: "PC",
            publisher: "Test Publisher",
            logo: "https://placehold.co/64x64/png",
            banner: "https://placehold.co/800x300/png",
            isActive: true,
        });
        const testPackage = await package_model_1.default.create({
            name: "Reports Test Package",
            game: testGame._id,
            description: "Test package for reports verification",
            amount: 100,
            price: 15.00,
            currency: "USD",
            isActive: true,
        });
        // Create a paid order to make sure we have revenue data
        const testOrder = await order_model_1.default.create({
            user: testUser._id,
            game: testGame._id,
            package: testPackage._id,
            playerId: "verify-reports-player",
            playerName: "VerifyReportsPlayer",
            quantity: 2,
            unitPrice: testPackage.price,
            totalPrice: testPackage.price * 2,
            paymentMethod: "bkash",
            paymentStatus: "paid",
            orderStatus: "completed",
        });
        testOrderId = testOrder._id.toString();
        console.log(`✅ Test order and revenue created.`);
        listener = index_1.default.listen(0);
        const port = listener.address().port;
        const BASE = `http://127.0.0.1:${port}/api/dashboard/admin`;
        async function req(method, url, token, body) {
            const opts = {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                ...(body ? { body: JSON.stringify(body) } : {}),
            };
            const res = await fetch(url, opts);
            let data = null;
            try {
                data = await res.json();
            }
            catch { }
            return { status: res.status, data };
        }
        let passed = 0;
        let failed = 0;
        function check(label, condition, detail) {
            if (condition) {
                console.log(`  ✅ PASS: ${label}`);
                passed++;
            }
            else {
                console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
                failed++;
            }
        }
        console.log("\n📋 Test 1: Unauthorized request returns 401");
        const r1 = await req("GET", `${BASE}/reports`);
        check("GET /reports without token → 401", r1.status === 401, `got ${r1.status}`);
        console.log("\n📋 Test 2: Buyer request returns 403");
        const r2 = await req("GET", `${BASE}/reports`, userToken);
        check("GET /reports with buyer token → 403", r2.status === 403, `got ${r2.status}`);
        console.log("\n📋 Test 3: Admin request returns 200");
        const r3 = await req("GET", `${BASE}/reports`, adminToken);
        check("GET /reports with admin token → 200", r3.status === 200, `got ${r3.status}`);
        console.log("\n📋 Test 4: Response contains overview");
        const data = r3.data?.data;
        check("Overview stats exist", data?.overview !== undefined);
        check("Total revenue is at least test order price", data?.overview?.totalRevenue >= 30, `got ${data?.overview?.totalRevenue}`);
        check("Total completed orders is at least 1", data?.overview?.totalCompletedOrders >= 1, `got ${data?.overview?.totalCompletedOrders}`);
        console.log("\n📋 Test 5: Revenue data exists");
        check("Daily revenue is an array", Array.isArray(data?.revenue?.daily));
        check("Weekly revenue is an array", Array.isArray(data?.revenue?.weekly));
        check("Monthly revenue is an array", Array.isArray(data?.revenue?.monthly));
        check("Yearly revenue is an array", Array.isArray(data?.revenue?.yearly));
        console.log("\n📋 Test 6: Order statistics exist");
        check("OrderStatus stats exist", Array.isArray(data?.orderStatus));
        check("OrderStatus has completed status", data?.orderStatus?.some((item) => item.status === "completed" && item.count >= 1));
        console.log("\n📋 Test 7: Top games exists");
        check("Top selling games array exists", Array.isArray(data?.sales?.topSellingGames));
        check("Top selling games contains test game", data?.sales?.topSellingGames?.some((item) => item.name === "Reports Test Game" && item.revenue >= 30));
        console.log("\n📋 Test 8: Top packages exists");
        check("Top selling packages array exists", Array.isArray(data?.sales?.topSellingPackages));
        check("Top selling packages contains test package", data?.sales?.topSellingPackages?.some((item) => item.name === "Reports Test Package" && item.revenue >= 30));
        console.log("\n📋 Test 9: Period filter works");
        const r9 = await req("GET", `${BASE}/reports?period=7days`, adminToken);
        check("7days period filter → 200", r9.status === 200, `got ${r9.status}`);
        check("7days period has overview data", r9.data?.data?.overview !== undefined);
        console.log("\n==================================================");
        console.log(`📊 Results: ${passed} passed, ${failed} failed`);
        console.log("==================================================");
        if (failed > 0) {
            process.exit(1);
        }
    }
    catch (err) {
        console.error("❌ Fatal verification error:", err);
        process.exit(1);
    }
    finally {
        if (testOrderId) {
            await order_model_1.default.findByIdAndDelete(testOrderId).catch(() => { });
        }
        await package_model_1.default.deleteMany({ name: "Reports Test Package" }).catch(() => { });
        await game_model_1.default.deleteMany({ slug: "test-reports-game" }).catch(() => { });
        if (testUserId) {
            await user_model_1.default.findByIdAndDelete(testUserId).catch(() => { });
        }
        if (testAdminId) {
            await user_model_1.default.findByIdAndDelete(testAdminId).catch(() => { });
        }
        if (listener)
            listener.close();
        await mongoose_1.default.disconnect();
        console.log("🧹 Cleanup done.");
    }
}
runVerification();
//# sourceMappingURL=verify-admin-reports.js.map